// Brain reference material against Supabase — own file, matching the
// resourceService.ts/newsletterService.ts precedent. RLS (flat
// `auth.uid() = user_id` policy, see supabase/schema.sql) is the sole row
// isolation mechanism; file isolation is enforced the same way by the
// `brain-uploads` storage bucket's per-user-folder policies.
import { supabase } from '@/lib/supabaseClient'
import type { BrainMaterial, BrainMaterialKind } from '@/data/types'

const BUCKET = 'brain-uploads'
const ALLOWED_EXTENSIONS = ['txt', 'md']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB — these are text files, not media

interface BrainMaterialRow {
  id: string
  kind: string
  title: string
  text_content: string | null
  file_path: string | null
  file_name: string | null
  source_url: string | null
  created_at: string
}

function rowToBrainMaterial(row: BrainMaterialRow): BrainMaterial {
  return {
    id: row.id,
    kind: row.kind as BrainMaterialKind,
    title: row.title,
    textContent: row.text_content,
    filePath: row.file_path,
    fileName: row.file_name,
    sourceUrl: row.source_url,
    createdAt: row.created_at,
  }
}

function materialToInsertRow(userId: string, material: BrainMaterial): Record<string, unknown> {
  return {
    id: material.id,
    user_id: userId,
    kind: material.kind,
    title: material.title,
    text_content: material.textContent,
    file_path: material.filePath,
    file_name: material.fileName,
    source_url: material.sourceUrl,
    created_at: material.createdAt,
  }
}

export async function fetchBrainMaterials(userId: string): Promise<BrainMaterial[]> {
  const { data, error } = await supabase
    .from('brain_materials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as BrainMaterialRow[]).map(rowToBrainMaterial)
}

export async function insertBrainMaterial(userId: string, material: BrainMaterial): Promise<void> {
  await supabase.from('brain_materials').insert(materialToInsertRow(userId, material))
}

export async function deleteBrainMaterial(id: string, filePath: string | null): Promise<void> {
  await supabase.from('brain_materials').delete().eq('id', id)
  if (filePath) await supabase.storage.from(BUCKET).remove([filePath])
}

/** Validates and uploads a file to the user's own folder in the private
 * `brain-uploads` bucket. The stored object key is always
 * `{userId}/{uuid}.{ext}` — the user's original filename is never used to
 * build a path (only kept as a display-only label alongside the row) — and
 * the extension is checked against a fixed allowlist before upload. Returns
 * the storage path to save on the row, or throws with a message safe to
 * show the user directly. */
export async function uploadBrainFile(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Only .txt and .md files are supported (got .${ext || 'unknown'}).`)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large — 2MB max for reference material.')
  }
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: 'text/plain' })
  if (error) throw new Error('Upload failed — try again.')
  return path
}
