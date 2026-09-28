import type { ContentStage, VideoStage } from '@/data/types'

/**
 * Transition rules for the idea -> draft -> in_review -> scheduled ->
 * published -> archived pipeline, and for the video/carousel production
 * board's stage enum. Reused by the dashboard board, video board, archive,
 * and chat so a status change is dispatched the same way everywhere.
 */

export const CONTENT_STAGE_ORDER: ContentStage[] = [
  'idea',
  'in_review',
  'draft',
  'scheduled',
  'published',
  'archived',
]

export const VIDEO_STAGE_ORDER: VideoStage[] = [
  'script',
  'shoot_scheduled',
  'filming',
  'editing',
  'ready',
]

/**
 * Content stage isn't a strict single line — "in_review" is a side gate an
 * Assistant-authored draft sits in before the cast member accepts it into
 * their own editable Drafts, not a mandatory step between every draft and
 * scheduling. Modeled as an explicit graph rather than +/-1 index math so
 * the real, intentional shortcuts (draft -> scheduled) are allowed while
 * genuine skips (idea -> scheduled, draft -> published) are still
 * rejected.
 */
const CONTENT_TRANSITIONS: Record<ContentStage, ContentStage[]> = {
  idea: ['draft'],
  in_review: ['draft', 'archived'],
  draft: ['in_review', 'scheduled', 'archived'],
  scheduled: ['published', 'archived'],
  published: ['archived'],
  archived: ['idea', 'draft'],
}

export function canTransitionContentStage(from: ContentStage, to: ContentStage): boolean {
  if (from === to) return true
  return CONTENT_TRANSITIONS[from].includes(to)
}

function indexOrThrow<T>(order: T[], stage: T): number {
  const i = order.indexOf(stage)
  if (i === -1) throw new Error(`Unknown stage: ${String(stage)}`)
  return i
}

/**
 * The video/carousel production board is real drag-and-drop across a
 * single linear stage enum — a team lead is expected to triage and
 * shuffle cards frequently, so both directions are valid as long as no
 * level is skipped (e.g. "editing" straight to "script" is rejected).
 */
export function canTransitionVideoStage(from: VideoStage, to: VideoStage): boolean {
  if (from === to) return true
  const fromIdx = indexOrThrow(VIDEO_STAGE_ORDER, from)
  const toIdx = indexOrThrow(VIDEO_STAGE_ORDER, to)
  return Math.abs(fromIdx - toIdx) === 1
}

export function nextContentStage(stage: ContentStage): ContentStage | null {
  const idx = CONTENT_STAGE_ORDER.indexOf(stage)
  if (idx === -1 || idx === CONTENT_STAGE_ORDER.length - 1) return null
  return CONTENT_STAGE_ORDER[idx + 1]
}

export const CONTENT_STAGE_LABEL: Record<ContentStage, string> = {
  idea: 'Idea',
  draft: 'Draft',
  in_review: 'In review',
  scheduled: 'Scheduled to post',
  published: 'Published',
  archived: 'Archived',
}

export const VIDEO_STAGE_LABEL: Record<VideoStage, string> = {
  script: 'Script',
  shoot_scheduled: 'Shoot scheduled',
  filming: 'Filming',
  editing: 'Editing',
  ready: 'Ready to post',
}
