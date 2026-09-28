// Composes `NewsletterIssue` live from the user's own real ideas/resources/
// posts — deliberately not a second stored-content system (no
// `newsletter_issues` table; see supabase/schema.sql's design notes).
// "Top stories" and the "pre-written draft" seed now always reference a
// real idea/resource id that actually exists for this user, fixing the
// old hardcoded fixture `idea_1` bug (which never existed in a real
// account and silently produced a blank "Untitled draft").
import { fetchDrafts, fetchIdeas, fetchPosts } from '@/data/services/contentService'
import { fetchResources } from '@/data/services/resourceService'
import type { Idea, NewsletterIssue, NewsletterStory, Resource } from '@/data/types'

const TOP_STORY_COUNT = 2

interface UnconvertedItem {
  refType: 'idea' | 'resource'
  refId: string
  headline: string
  pillar: string | null
  createdAt: string
}

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

async function fetchUnconvertedItems(userId: string): Promise<UnconvertedItem[]> {
  const [ideas, resources, drafts] = await Promise.all([
    fetchIdeas(userId),
    fetchResources(userId),
    fetchDrafts(userId),
  ])
  const draftedIdeaIds = new Set(drafts.map((d) => d.sourceIdeaId).filter(Boolean))

  const ideaItems: UnconvertedItem[] = ideas
    .filter((i: Idea) => !i.archivedAt && !draftedIdeaIds.has(i.id))
    .map((i) => ({ refType: 'idea' as const, refId: i.id, headline: i.text, pillar: i.pillar, createdAt: i.createdAt }))

  // Resources have no per-draft back-reference in the schema (unlike
  // ideas' `source_idea_id`), so "not yet turned into a draft" can only be
  // tracked reliably for ideas — every resource is eligible here.
  const resourceItems: UnconvertedItem[] = resources.map((r: Resource) => ({
    refType: 'resource' as const,
    refId: r.id,
    headline: r.title || r.url,
    pillar: r.pillar,
    createdAt: r.createdAt,
  }))

  return [...ideaItems, ...resourceItems].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function fetchNewsletterIssue(userId: string): Promise<NewsletterIssue> {
  const [unconverted, posts] = await Promise.all([fetchUnconvertedItems(userId), fetchPosts(userId)])

  const topItems = unconverted.slice(0, TOP_STORY_COUNT)
  const stories: NewsletterStory[] = topItems.map((item) => ({
    id: `story_${item.refType}_${item.refId}`,
    headline: item.headline,
    sourceLabel: item.refType === 'idea' ? 'Brain idea' : 'Resource',
    matchesLabel: item.pillar ? `matches your "${item.pillar}" pillar` : `from your ${item.refType === 'idea' ? 'Brain' : 'Resources'}`,
    refType: item.refType,
    refId: item.refId,
  }))

  const statOfDay = (() => {
    if (posts.length === 0) {
      return { value: '—', caption: 'No published posts yet — publish something to see a real stat here.' }
    }
    const best = posts.reduce((a, b) => (b.impressions > a.impressions ? b : a))
    const avg = average(posts.map((p) => p.impressions))
    const pctAboveAvg = avg > 0 ? Math.round(((best.impressions - avg) / avg) * 100) : 0
    return pctAboveAvg > 0
      ? {
          value: `+${pctAboveAvg}%`,
          caption: `Your best post, "${best.title}", beat your own average impressions by ${pctAboveAvg}%.`,
        }
      : {
          value: best.impressions.toLocaleString(),
          caption: `Your best post so far: "${best.title}" — ${best.impressions.toLocaleString()} impressions.`,
        }
  })()

  const seedItem = unconverted[0]
  const prewrittenDraft = seedItem
    ? {
        hook: seedItem.headline,
        note: `Built from your own ${seedItem.refType === 'idea' ? 'Brain idea' : 'saved Resource'}.`,
        seedIdeaId: seedItem.refType === 'idea' ? seedItem.refId : undefined,
        seedResourceId: seedItem.refType === 'resource' ? seedItem.refId : undefined,
      }
    : {
        hook: 'Nothing to pre-write yet',
        note: 'Add an idea in Brain or save a Resource, and a pre-written draft will show up here.',
      }

  const today = new Date()

  return {
    id: `issue_${today.toISOString().slice(0, 10)}`,
    date: today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
    headline:
      stories.length > 0
        ? `Today's issue — from your own Brain & Resources`
        : "Today's issue — add an idea or a resource to get started",
    stories,
    statOfDay,
    prewrittenDraft,
    // No stored newsletter history — this is a computed digest over the
    // user's own live data, not a second stored-content system.
    pastIssues: [],
  }
}
