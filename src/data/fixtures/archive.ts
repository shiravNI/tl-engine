import { ideas } from '@/data/fixtures/ideas'
import { drafts } from '@/data/fixtures/drafts'
import { posts } from '@/data/fixtures/posts'
import type { ArchiveEntry } from '@/data/types'

function daysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

/** Derives the Archive screen's rows from the underlying idea/draft/post
 * fixtures — items are "moved" here by having an `archivedAt` set, seeded
 * as if the 30/60-day auto-archive already ran (no live timer needed). */
export function buildArchiveEntries(): ArchiveEntry[] {
  const entries: ArchiveEntry[] = []

  for (const idea of ideas) {
    if (!idea.archivedAt) continue
    const days = daysBetween(idea.createdAt, idea.archivedAt)
    entries.push({
      id: `archive_idea_${idea.id}`,
      refId: idea.id,
      type: 'idea',
      title: idea.text,
      lastTouched: formatShortDate(idea.createdAt),
      reason: `Sat untouched ${days} days`,
    })
  }

  for (const draft of drafts) {
    if (!draft.archivedAt) continue
    const days = daysBetween(draft.updatedAt, draft.archivedAt)
    entries.push({
      id: `archive_draft_${draft.id}`,
      refId: draft.id,
      type: 'draft',
      title: draft.title,
      lastTouched: formatShortDate(draft.updatedAt),
      reason: `Stalled at edit for ${days} days`,
    })
  }

  for (const post of posts) {
    if (!post.archivedAt) continue
    entries.push({
      id: `archive_post_${post.id}`,
      refId: post.id,
      type: 'post',
      title: post.title,
      lastTouched: formatShortDate(post.publishedAt),
      reason: 'Published, older than 60 days',
    })
  }

  return entries.sort((a, b) => (a.lastTouched < b.lastTouched ? 1 : -1))
}
