// Real per-user Insights & Data queries, derived entirely from the user's
// own `posts` (real per-published-post rows — see contentService.ts) and
// `drafts` (for the "planned" count). Two sections are a deliberate,
// locked scope line rather than an oversight: audience-segment demographic
// breakdown and the auto-generated "highlights"/"suggested move" text both
// need data a personal post-performance export doesn't contain (LinkedIn
// doesn't expose per-post-viewer demographics, and there's no real
// qualitative-analysis engine here) — both honestly return empty rather
// than inventing plausible-looking numbers/copy.
import { supabase } from '@/lib/supabaseClient'
import type { AudienceSegment, InsightHighlight, PostAnalytics } from '@/data/types'
import { fetchPosts } from '@/data/services/contentService'

export interface KpiTile {
  label: string
  value: string
  deltaLabel: string
  deltaDirection: 'up' | 'down'
  spark: number[]
}

/** Splits posts (already sorted newest-first) into a "recent" and "prior"
 * half of roughly equal size, so every tile's delta compares like-for-like
 * real periods instead of a fixed, possibly-empty calendar window. */
function splitRecentVsPrior(sortedDesc: PostAnalytics[]): { recent: PostAnalytics[]; prior: PostAnalytics[] } {
  const half = Math.ceil(sortedDesc.length / 2)
  return { recent: sortedDesc.slice(0, half), prior: sortedDesc.slice(half) }
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0)
}

function average(nums: number[]): number {
  return nums.length ? sum(nums) / nums.length : 0
}

function pctDelta(recent: number, prior: number): number {
  if (prior === 0) return recent > 0 ? 100 : 0
  return Math.round(((recent - prior) / prior) * 100)
}

/** Oldest-first, capped to the last N — matches the sparkline's left-to-
 * right reading direction. */
function sparkline(sortedDesc: PostAnalytics[], pick: (p: PostAnalytics) => number, n = 7): number[] {
  return sortedDesc
    .slice(0, n)
    .map(pick)
    .reverse()
}

export async function fetchImpressionsTile(userId: string): Promise<KpiTile> {
  const posts = await fetchPosts(userId) // already ordered newest-first
  const { recent, prior } = splitRecentVsPrior(posts)
  const recentSum = sum(recent.map((p) => p.impressions))
  const priorSum = sum(prior.map((p) => p.impressions))
  const delta = pctDelta(recentSum, priorSum)
  return {
    label: 'Impressions',
    value: sum(posts.map((p) => p.impressions)).toLocaleString(),
    deltaLabel: `${Math.abs(delta)}%`,
    deltaDirection: delta >= 0 ? 'up' : 'down',
    spark: sparkline(posts, (p) => p.impressions),
  }
}

export async function fetchEngagementTile(userId: string): Promise<KpiTile> {
  const posts = await fetchPosts(userId)
  const { recent, prior } = splitRecentVsPrior(posts)
  const recentAvg = average(recent.map((p) => p.engagementRate))
  const priorAvg = average(prior.map((p) => p.engagementRate))
  const deltaPt = Math.round((recentAvg - priorAvg) * 10) / 10
  return {
    label: 'Engagement rate',
    value: `${Math.round(average(posts.map((p) => p.engagementRate)) * 10) / 10}%`,
    deltaLabel: `${Math.abs(deltaPt)}pt`,
    deltaDirection: deltaPt >= 0 ? 'up' : 'down',
    spark: sparkline(posts, (p) => p.engagementRate),
  }
}

/** No real follower-count history exists anywhere in the schema — a
 * personal post-performance export doesn't carry it either. Same "honest
 * zero, not a fabricated number" rule as the audience/highlights sections,
 * just expressed as a flat zero tile rather than a hidden section since
 * this one still reads sensibly at zero. */
export async function fetchFollowersTile(_userId: string): Promise<KpiTile> {
  return {
    label: 'New followers',
    value: '0',
    deltaLabel: '0%',
    deltaDirection: 'up',
    spark: [0, 0, 0, 0, 0, 0, 0],
  }
}

export interface PostsPublishedTile {
  published: number
  planned: number
}

export async function fetchPostsPublishedTile(userId: string): Promise<PostsPublishedTile> {
  const [posts, { data: draftRows }] = await Promise.all([
    fetchPosts(userId),
    supabase.from('drafts').select('stage').eq('user_id', userId),
  ])
  const scheduledCount = (draftRows ?? []).filter((d: { stage: string }) => d.stage === 'scheduled').length
  const published = posts.length
  const planned = published + scheduledCount
  return { published, planned: planned || published }
}

export interface WeeklyImpressionPoint {
  label: string
  value: number
  highlight?: string
}

function isoWeekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

export async function fetchImpressionsChart(userId: string): Promise<WeeklyImpressionPoint[]> {
  const posts = await fetchPosts(userId)
  const byWeek = new Map<string, { sum: number; best: PostAnalytics | null }>()
  for (const post of posts) {
    const week = isoWeekStart(post.publishedAt)
    const entry = byWeek.get(week) ?? { sum: 0, best: null }
    entry.sum += post.impressions
    if (!entry.best || post.impressions > entry.best.impressions) entry.best = post
    byWeek.set(week, entry)
  }
  const weeks = [...byWeek.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).slice(-12)
  const maxSum = Math.max(1, ...weeks.map(([, v]) => v.sum))
  return weeks.map(([week, entry], i) => ({
    label: i === 0 || i === weeks.length - 1 ? new Date(week).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '',
    value: Math.round((entry.sum / maxSum) * 100),
    highlight:
      entry.best && entry.sum === maxSum
        ? `${entry.best.impressions.toLocaleString()} · ${new Date(entry.best.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
        : undefined,
  }))
}

/** Deliberately empty — see the file header. Not computed from real posts
 * because there's no real qualitative-analysis engine backing it (that
 * would just be plausible-looking invented copy dressed up as a real
 * insight). */
export async function fetchInsightHighlights(_userId: string): Promise<InsightHighlight[]> {
  return []
}

/** Deliberately empty — see `fetchInsightHighlights`. */
export async function fetchSuggestedMove(_userId: string): Promise<string> {
  return ''
}

export async function fetchPostPerformance(userId: string): Promise<PostAnalytics[]> {
  const posts = await fetchPosts(userId)
  return [...posts].sort((a, b) => b.impressions - a.impressions)
}

/** Deliberately empty — a personal post-performance export doesn't include
 * per-viewer demographics (seniority/industry/company-size). See the file
 * header; this is a locked scope line, not an oversight. */
export async function fetchAudienceBreakdown(_userId: string): Promise<AudienceSegment[]> {
  return []
}

export async function fetchLastUploadedAt(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('posts')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data || data.length === 0) return ''
  return (data[0] as { created_at: string }).created_at
}
