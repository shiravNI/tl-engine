import type { Draft, Idea } from '@/data/types'

/**
 * Pure filter functions behind `BrainPage`'s two tabs — split out so the
 * "uncapped, every non-terminal stage" behavior (deliberately broader than
 * the compact dashboard board) is unit-testable without rendering the page.
 */

/** Every non-archived idea, uncapped — no "show N older" toggle here; that
 * stays exclusive to the compact dashboard board. */
export function selectActiveIdeas(ideas: Idea[]): Idea[] {
  return ideas.filter((i) => !i.archivedAt)
}

/** Every draft not yet in a terminal stage (`published`/`archived`) — i.e.
 * `draft`/`in_review`/`scheduled`, broader than the dashboard's Drafts
 * column, which only shows `stage === 'draft'`. */
export function selectActiveDrafts(drafts: Draft[]): Draft[] {
  return drafts.filter((d) => d.stage !== 'published' && d.stage !== 'archived')
}
