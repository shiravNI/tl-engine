import { insightSnapshot } from '@/data/fixtures/insights'
import { publishedPosts } from '@/data/fixtures/posts'
import { mockAsync } from '@/lib/mockAsync'
import type { AudienceSegment, InsightHighlight, PostAnalytics } from '@/data/types'

// Each tile resolves independently with its own artificial latency — this
// is what the Insights & Data screen's progressive-skeleton loading state
// (1h) is built against, via the reusable SkeletonBoundary primitive.

export interface KpiTile {
  label: string
  value: string
  deltaLabel: string
  deltaDirection: 'up' | 'down'
  spark: number[]
}

export async function fetchImpressionsTile(): Promise<KpiTile> {
  return mockAsync(
    {
      label: 'Impressions',
      value: insightSnapshot.impressions.toLocaleString(),
      deltaLabel: `${insightSnapshot.impressionsDeltaPct}%`,
      deltaDirection: 'up',
      spark: insightSnapshot.impressionsSpark,
    },
    600,
  )
}

export async function fetchEngagementTile(): Promise<KpiTile> {
  return mockAsync(
    {
      label: 'Engagement rate',
      value: `${insightSnapshot.engagementRate}%`,
      deltaLabel: `${insightSnapshot.engagementDeltaPt}pt`,
      deltaDirection: 'up',
      spark: insightSnapshot.engagementSpark,
    },
    900,
  )
}

export async function fetchFollowersTile(): Promise<KpiTile> {
  return mockAsync(
    {
      label: 'New followers',
      value: insightSnapshot.newFollowers.toLocaleString(),
      deltaLabel: `${Math.abs(insightSnapshot.newFollowersDeltaPct)}%`,
      deltaDirection: 'down',
      spark: insightSnapshot.newFollowersSpark,
    },
    450,
  )
}

export interface PostsPublishedTile {
  published: number
  planned: number
}

export async function fetchPostsPublishedTile(): Promise<PostsPublishedTile> {
  return mockAsync(
    { published: insightSnapshot.postsPublished, planned: insightSnapshot.postsPlanned },
    1200,
  )
}

export async function fetchImpressionsChart() {
  return mockAsync(insightSnapshot.weeklyImpressions, 1400)
}

export async function fetchInsightHighlights(): Promise<InsightHighlight[]> {
  return mockAsync(insightSnapshot.highlights, 1700)
}

export async function fetchSuggestedMove(): Promise<string> {
  return mockAsync(insightSnapshot.suggestedMove, 1700)
}

export async function fetchPostPerformance(): Promise<PostAnalytics[]> {
  return mockAsync(publishedPosts(), 2000)
}

export async function fetchAudienceBreakdown(): Promise<AudienceSegment[]> {
  return mockAsync(insightSnapshot.audienceSegments, 2200)
}

export async function fetchLastUploadedAt(): Promise<string> {
  return mockAsync(insightSnapshot.lastUploadedAt, 300)
}
