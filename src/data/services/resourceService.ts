// Resources against Supabase — its own file, not folded into
// contentService.ts, matching the existing precedent of
// newsletterService.ts/onboardingService.ts as separate concerns. RLS
// (flat `auth.uid() = user_id` policy, see supabase/schema.sql) is the
// sole isolation mechanism; `userId` is still threaded through inserts
// because the row's `user_id` column has to be set for the
// `with check (auth.uid() = user_id)` clause to pass.
import { supabase } from '@/lib/supabaseClient'
import type { Pillar, Resource } from '@/data/types'

interface ResourceRow {
  id: string
  url: string
  title: string
  note: string
  pillar: string | null
  tags: string[]
  created_at: string
}

export function rowToResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    note: row.note,
    pillar: row.pillar as Pillar | null,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  }
}

export function resourceToInsertRow(userId: string, resource: Resource): Record<string, unknown> {
  return {
    id: resource.id,
    user_id: userId,
    url: resource.url,
    title: resource.title,
    note: resource.note,
    pillar: resource.pillar,
    tags: resource.tags,
    created_at: resource.createdAt,
  }
}

export async function fetchResources(userId: string): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as ResourceRow[]).map(rowToResource)
}

export async function insertResource(userId: string, resource: Resource): Promise<void> {
  await supabase.from('resources').insert(resourceToInsertRow(userId, resource))
}

export async function deleteResource(id: string): Promise<void> {
  await supabase.from('resources').delete().eq('id', id)
}
