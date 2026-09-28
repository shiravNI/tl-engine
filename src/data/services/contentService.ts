// Ideas, drafts, posts, video items and carousel decks against Supabase —
// row (snake_case) <-> camelCase mappers live here since supabase-js
// doesn't auto-convert. RLS (flat `auth.uid() = user_id` policies, see
// supabase/schema.sql) is the sole isolation mechanism; `userId` is still
// threaded through every write because an insert's `user_id` column has to
// be set for the `with check (auth.uid() = user_id)` clause to pass.
import { supabase } from '@/lib/supabaseClient'
import type {
  CarouselDeck,
  CarouselSlide,
  ChecklistState,
  ContentStage,
  Draft,
  DraftFormat,
  Idea,
  Pillar,
  PostAnalytics,
  RoastFlag,
  ScriptBeats,
  VideoFormat,
  VideoItem,
  VideoPerson,
  VideoStage,
} from '@/data/types'

// ---------------------------------------------------------------------------
// ideas
// ---------------------------------------------------------------------------

interface IdeaRow {
  id: string
  text: string
  pillar: string | null
  source: string
  created_at: string
  archived_at: string | null
}

export function rowToIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    text: row.text,
    pillar: row.pillar as Pillar | null,
    source: row.source as Idea['source'],
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
  }
}

export function ideaToInsertRow(userId: string, idea: Idea): Record<string, unknown> {
  return {
    id: idea.id,
    user_id: userId,
    text: idea.text,
    pillar: idea.pillar,
    source: idea.source,
    created_at: idea.createdAt,
    archived_at: idea.archivedAt ?? null,
  }
}

export async function fetchIdeas(userId: string): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as IdeaRow[]).map(rowToIdea)
}

export async function fetchIdeaById(id: string): Promise<Idea | undefined> {
  const { data, error } = await supabase.from('ideas').select('*').eq('id', id).single()
  if (error || !data) return undefined
  return rowToIdea(data as IdeaRow)
}

export async function insertIdea(userId: string, idea: Idea): Promise<void> {
  await supabase.from('ideas').insert(ideaToInsertRow(userId, idea))
}

export async function setIdeaArchivedAt(id: string, archivedAt: string | null): Promise<void> {
  await supabase.from('ideas').update({ archived_at: archivedAt }).eq('id', id)
}

export async function deleteIdea(id: string): Promise<void> {
  await supabase.from('ideas').delete().eq('id', id)
}

// ---------------------------------------------------------------------------
// drafts
// ---------------------------------------------------------------------------

interface DraftRow {
  id: string
  title: string
  paragraphs: string[]
  excerpt: string
  pillar: string | null
  stage: string
  format: string
  slop_score: number
  roast_verdict: string
  roast_flags: RoastFlag[]
  voice_match: number
  source_idea_id: string | null
  source_type: string | null
  source_label: string | null
  image_url: string | null
  image_file_name: string | null
  checklist: ChecklistState
  scheduled_for: string | null
  published_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export function rowToDraft(row: DraftRow): Draft {
  return {
    id: row.id,
    title: row.title,
    paragraphs: row.paragraphs,
    excerpt: row.excerpt,
    pillar: row.pillar as Pillar | null,
    stage: row.stage as ContentStage,
    format: row.format as DraftFormat,
    slopScore: row.slop_score,
    roastVerdict: row.roast_verdict,
    roastFlags: row.roast_flags ?? [],
    voiceMatch: row.voice_match,
    sourceIdeaId: row.source_idea_id ?? undefined,
    sourceType: (row.source_type as Draft['sourceType']) ?? undefined,
    sourceLabel: row.source_label ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageFileName: row.image_file_name ?? undefined,
    checklist: row.checklist,
    scheduledFor: row.scheduled_for ?? undefined,
    publishedAt: row.published_at ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function draftToInsertRow(userId: string, draft: Draft): Record<string, unknown> {
  return {
    id: draft.id,
    user_id: userId,
    title: draft.title,
    paragraphs: draft.paragraphs,
    excerpt: draft.excerpt,
    pillar: draft.pillar,
    stage: draft.stage,
    format: draft.format,
    slop_score: draft.slopScore,
    roast_verdict: draft.roastVerdict,
    roast_flags: draft.roastFlags,
    voice_match: draft.voiceMatch,
    source_idea_id: draft.sourceIdeaId ?? null,
    source_type: draft.sourceType ?? null,
    source_label: draft.sourceLabel ?? null,
    image_url: draft.imageUrl ?? null,
    image_file_name: draft.imageFileName ?? null,
    checklist: draft.checklist,
    scheduled_for: draft.scheduledFor ?? null,
    published_at: draft.publishedAt ?? null,
    archived_at: draft.archivedAt ?? null,
    created_at: draft.createdAt,
    updated_at: draft.updatedAt,
  }
}

/** Maps only the (camelCase) keys present in `patch` to their snake_case
 * column names — used for the fire-and-forget partial updates dispatched
 * alongside `UPDATE_DRAFT`/`SET_DRAFT_STAGE`/etc. */
function draftPatchToRow(patch: Partial<Draft>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.paragraphs !== undefined) row.paragraphs = patch.paragraphs
  if (patch.excerpt !== undefined) row.excerpt = patch.excerpt
  if (patch.pillar !== undefined) row.pillar = patch.pillar
  if (patch.stage !== undefined) row.stage = patch.stage
  if (patch.format !== undefined) row.format = patch.format
  if (patch.slopScore !== undefined) row.slop_score = patch.slopScore
  if (patch.roastVerdict !== undefined) row.roast_verdict = patch.roastVerdict
  if (patch.roastFlags !== undefined) row.roast_flags = patch.roastFlags
  if (patch.voiceMatch !== undefined) row.voice_match = patch.voiceMatch
  if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl
  if (patch.imageFileName !== undefined) row.image_file_name = patch.imageFileName
  if (patch.checklist !== undefined) row.checklist = patch.checklist
  if (patch.scheduledFor !== undefined) row.scheduled_for = patch.scheduledFor
  if (patch.publishedAt !== undefined) row.published_at = patch.publishedAt
  if (patch.archivedAt !== undefined) row.archived_at = patch.archivedAt
  if (patch.updatedAt !== undefined) row.updated_at = patch.updatedAt
  return row
}

export async function fetchDrafts(userId: string): Promise<Draft[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as DraftRow[]).map(rowToDraft)
}

export async function fetchDraftById(id: string): Promise<Draft | undefined> {
  const { data, error } = await supabase.from('drafts').select('*').eq('id', id).single()
  if (error || !data) return undefined
  return rowToDraft(data as DraftRow)
}

export async function insertDraft(userId: string, draft: Draft): Promise<void> {
  await supabase.from('drafts').insert(draftToInsertRow(userId, draft))
}

export async function updateDraftRow(id: string, patch: Partial<Draft>): Promise<void> {
  const row = draftPatchToRow(patch)
  if (Object.keys(row).length === 0) return
  await supabase.from('drafts').update(row).eq('id', id)
}

export async function deleteDraft(id: string): Promise<void> {
  await supabase.from('drafts').delete().eq('id', id)
}

// ---------------------------------------------------------------------------
// posts — real per-user post-performance data. A row is inserted the
// moment a draft is published (see ContentContext's setDraftStage), and/or
// upserted from a real .xlsx export the user uploads themselves.
// ---------------------------------------------------------------------------

interface PostRow {
  id: string
  draft_id: string | null
  title: string
  pillar: string
  published_at: string
  impressions: number
  engagement_rate: number
  saves: number
  trend: number[]
  archived_at: string | null
  created_at: string
}

export function rowToPost(row: PostRow): PostAnalytics {
  return {
    id: row.id,
    draftId: row.draft_id ?? undefined,
    title: row.title,
    pillar: row.pillar as Pillar,
    publishedAt: row.published_at,
    impressions: row.impressions,
    engagementRate: row.engagement_rate,
    saves: row.saves,
    trend: row.trend ?? [],
    archivedAt: row.archived_at ?? undefined,
  }
}

export function postToInsertRow(userId: string, post: PostAnalytics): Record<string, unknown> {
  return {
    id: post.id,
    user_id: userId,
    draft_id: post.draftId ?? null,
    title: post.title,
    pillar: post.pillar,
    published_at: post.publishedAt,
    impressions: post.impressions,
    engagement_rate: post.engagementRate,
    saves: post.saves,
    trend: post.trend,
    archived_at: post.archivedAt ?? null,
  }
}

export async function fetchPosts(userId: string): Promise<PostAnalytics[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('published_at', { ascending: false })
  if (error || !data) return []
  return (data as PostRow[]).map(rowToPost)
}

export async function insertPost(userId: string, post: PostAnalytics): Promise<void> {
  await supabase.from('posts').insert(postToInsertRow(userId, post))
}

/** A row parsed from an uploaded `.xlsx` export — no `id`/`trend`/`draftId`
 * yet, since an uploaded row was never synthesized from a draft. */
export type UploadedPostRow = Pick<
  PostAnalytics,
  'title' | 'pillar' | 'publishedAt' | 'impressions' | 'engagementRate' | 'saves'
>

/** Matches uploaded rows against the user's existing posts by
 * `(title, publishedAt)` so re-uploading the same export updates the
 * existing row instead of duplicating it. No DB-level unique constraint
 * backs this pairing, so the match happens here in application code rather
 * than via a Postgres `upsert(... onConflict)`. */
export async function upsertUploadedPosts(userId: string, rows: UploadedPostRow[]): Promise<void> {
  const existing = await fetchPosts(userId)
  const keyOf = (title: string, publishedAt: string) => `${title}::${publishedAt}`
  const existingByKey = new Map(existing.map((p) => [keyOf(p.title, p.publishedAt), p]))

  for (const row of rows) {
    const match = existingByKey.get(keyOf(row.title, row.publishedAt))
    if (match) {
      await supabase
        .from('posts')
        .update({
          pillar: row.pillar,
          impressions: row.impressions,
          engagement_rate: row.engagementRate,
          saves: row.saves,
        })
        .eq('id', match.id)
    } else {
      await insertPost(userId, {
        id: crypto.randomUUID(),
        trend: [],
        ...row,
      })
    }
  }
}

// ---------------------------------------------------------------------------
// video_items
// ---------------------------------------------------------------------------

interface VideoItemRow {
  id: string
  title: string
  format: string
  stage: string
  beats: ScriptBeats | null
  beats_summary: string | null
  inspo_label: string | null
  inspo_link: string | null
  shoot_date: string | null
  location: string | null
  people: VideoPerson[]
  editing_note: string | null
  editing_progress: number | null
  posting_note: string | null
}

export function rowToVideoItem(row: VideoItemRow): VideoItem {
  return {
    id: row.id,
    title: row.title,
    format: row.format as VideoFormat,
    stage: row.stage as VideoStage,
    beats: row.beats ?? undefined,
    beatsSummary: row.beats_summary ?? undefined,
    inspoLabel: row.inspo_label ?? undefined,
    inspoLink: row.inspo_link ?? undefined,
    shootDate: row.shoot_date ?? undefined,
    location: row.location ?? undefined,
    people: row.people ?? [],
    editingNote: row.editing_note ?? undefined,
    editingProgress: row.editing_progress ?? undefined,
    postingNote: row.posting_note ?? undefined,
  }
}

export function videoItemToInsertRow(userId: string, item: VideoItem): Record<string, unknown> {
  return {
    id: item.id,
    user_id: userId,
    title: item.title,
    format: item.format,
    stage: item.stage,
    beats: item.beats ?? null,
    beats_summary: item.beatsSummary ?? null,
    inspo_label: item.inspoLabel ?? null,
    inspo_link: item.inspoLink ?? null,
    shoot_date: item.shootDate ?? null,
    location: item.location ?? null,
    people: item.people,
    editing_note: item.editingNote ?? null,
    editing_progress: item.editingProgress ?? null,
    posting_note: item.postingNote ?? null,
  }
}

export async function fetchVideoItems(userId: string): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .from('video_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as VideoItemRow[]).map(rowToVideoItem)
}

export async function insertVideoItem(userId: string, item: VideoItem): Promise<void> {
  await supabase.from('video_items').insert(videoItemToInsertRow(userId, item))
}

export async function updateVideoItemStage(id: string, stage: VideoStage): Promise<void> {
  await supabase.from('video_items').update({ stage, updated_at: new Date().toISOString() }).eq('id', id)
}

// ---------------------------------------------------------------------------
// carousel_decks + carousel_slides
// ---------------------------------------------------------------------------

interface CarouselSlideRow {
  id: string
  index: number
  kind: string
  label: string
  headline: string
  has_chart: boolean
}

interface CarouselDeckRow {
  id: string
  title: string
  prompt: string
  source_file_label: string | null
  stage: string
  carousel_slides: CarouselSlideRow[]
}

function rowToCarouselSlide(row: CarouselSlideRow): CarouselSlide {
  return {
    id: row.id,
    index: row.index,
    kind: row.kind as CarouselSlide['kind'],
    label: row.label,
    headline: row.headline,
    hasChart: row.has_chart,
  }
}

export function rowToCarouselDeck(row: CarouselDeckRow): CarouselDeck {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    sourceFileLabel: row.source_file_label ?? undefined,
    stage: row.stage as CarouselDeck['stage'],
    slides: (row.carousel_slides ?? [])
      .slice()
      .sort((a, b) => a.index - b.index)
      .map(rowToCarouselSlide),
  }
}

export async function fetchCarouselDecks(userId: string): Promise<CarouselDeck[]> {
  const { data, error } = await supabase
    .from('carousel_decks')
    .select('*, carousel_slides(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as unknown as CarouselDeckRow[]).map(rowToCarouselDeck)
}

export async function updateCarouselSlideRow(
  slideId: string,
  patch: Partial<CarouselSlide>,
): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.label !== undefined) row.label = patch.label
  if (patch.headline !== undefined) row.headline = patch.headline
  if (patch.hasChart !== undefined) row.has_chart = patch.hasChart
  if (Object.keys(row).length === 0) return
  await supabase.from('carousel_slides').update(row).eq('id', slideId)
}
