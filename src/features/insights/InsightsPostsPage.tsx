import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Switcher } from '@/components/primitives/Switcher'
import { Skeleton } from '@/components/primitives/Skeleton'
import { SkeletonBoundary } from '@/components/primitives/SkeletonBoundary'
import { DataTable } from '@/components/primitives/DataTable'
import { Disclosure } from '@/components/primitives/Disclosure'
import { KpiTile } from '@/features/insights/KpiTile'
import { useAppShell } from '@/state/AppShellContext'
import { useContent } from '@/state/ContentContext'
import type { UploadedPostRow } from '@/data/services/contentService'
import type { Pillar } from '@/data/types'
import {
  fetchAudienceBreakdown,
  fetchEngagementTile,
  fetchFollowersTile,
  fetchImpressionsChart,
  fetchImpressionsTile,
  fetchInsightHighlights,
  fetchLastUploadedAt,
  fetchPostPerformance,
  fetchPostsPublishedTile,
  fetchSuggestedMove,
} from '@/data/services/insightsService'

const KNOWN_PILLARS: Pillar[] = ['AI search', 'Org', 'Performance', 'Unbundling', 'Untagged']

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function toISODate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const s = String(value ?? '').trim()
  if (!s) return ''
  const parsed = new Date(s)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

/** Maps the loosely-shaped rows `xlsx` hands back (raw header casing/
 * spacing, Excel serial dates as JS `Date`s once `cellDates: true` is set)
 * to `UploadedPostRow` — tolerant of the header-naming variants a
 * real LinkedIn-export-shaped spreadsheet is likely to use. */
export function parseUploadedPostRows(raw: Record<string, unknown>[]): UploadedPostRow[] {
  return raw
    .map((r) => {
      const map: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(r)) map[normalizeKey(k)] = v

      const title = String(map.title ?? '').trim()
      const publishedAt = toISODate(map.publishedat ?? map.date ?? '')
      const pillarRaw = String(map.pillar ?? '').trim()
      const pillar = (KNOWN_PILLARS.includes(pillarRaw as Pillar) ? pillarRaw : 'Untagged') as Pillar
      const impressions = Number(map.impressions ?? 0) || 0
      const engagementRate = Number(map.engagementrate ?? 0) || 0
      const saves = Number(map.saves ?? 0) || 0

      return { title, publishedAt, pillar, impressions, engagementRate, saves }
    })
    .filter((r) => r.title && r.publishedAt)
}

/** `1e` — Insights & Data / Output analytics. Each tile is its own
 * `useQuery`, so it appears the instant its own fetch resolves — the
 * progressive-skeleton loading pattern from `1h`, built against this
 * screen's real layout rather than a separate mock page. */
export function InsightsPostsPage() {
  const navigate = useNavigate()
  const { currentUser } = useAppShell()
  const userId = currentUser.id
  const { importPosts } = useContent()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const impressions = useQuery({ queryKey: ['insights', 'impressions', userId], queryFn: () => fetchImpressionsTile(userId) })
  const engagement = useQuery({ queryKey: ['insights', 'engagement', userId], queryFn: () => fetchEngagementTile(userId) })
  const followers = useQuery({ queryKey: ['insights', 'followers', userId], queryFn: () => fetchFollowersTile(userId) })
  const postsPublished = useQuery({ queryKey: ['insights', 'posts-published', userId], queryFn: () => fetchPostsPublishedTile(userId) })
  const chart = useQuery({ queryKey: ['insights', 'chart', userId], queryFn: () => fetchImpressionsChart(userId) })
  const highlights = useQuery({ queryKey: ['insights', 'highlights', userId], queryFn: () => fetchInsightHighlights(userId) })
  const suggestedMove = useQuery({ queryKey: ['insights', 'suggested-move', userId], queryFn: () => fetchSuggestedMove(userId) })
  const postPerformance = useQuery({ queryKey: ['insights', 'post-performance', userId], queryFn: () => fetchPostPerformance(userId) })
  const audience = useQuery({ queryKey: ['insights', 'audience', userId], queryFn: () => fetchAudienceBreakdown(userId) })
  const lastUploaded = useQuery({ queryKey: ['insights', 'last-uploaded', userId], queryFn: () => fetchLastUploadedAt(userId) })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['insights'] })
  }

  async function handleFileSelected(file: File) {
    const buf = await file.arrayBuffer()
    const workbook = XLSX.read(buf, { type: 'array', cellDates: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) return
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    const rows = parseUploadedPostRows(raw)
    if (rows.length === 0) return
    await importPosts(rows)
    invalidateAll()
  }

  return (
    <div className="flex flex-col">
      <div className="flex-none border-b border-border bg-surface px-7 pt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              Insights &amp; Data · Output
            </p>
            <h1 className="text-[26px] font-bold tracking-tight">Your published content</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <Switcher
              value="90d"
              onChange={() => {}}
              options={[
                { value: '7d', label: '7d' },
                { value: '30d', label: '30d' },
                { value: '90d', label: '90d' },
                { value: 'all', label: 'All' },
              ]}
            />
            <Button variant="secondary">
              <Icon name="filter" className="h-[15px] w-[15px]" />
              Pillar: all
            </Button>
          </div>
        </div>
        <div className="mt-4.5 flex gap-5">
          <button className="border-b-2 border-transparent pb-3 text-[13px] font-medium text-muted" onClick={() => navigate('/create')}>
            Create
          </button>
          <div className="border-b-2 border-accent pb-3 text-[13px] font-semibold text-ink">Insights &amp; Data</div>
        </div>
      </div>

      <div className="flex flex-col gap-4.5 px-7 py-5.5">
        <div className="flex items-center gap-2 py-0.5">
          <Icon name={lastUploaded.data ? 'alert' : 'upload'} className="h-3.5 w-3.5 flex-none text-warn-fg" />
          <p className="flex-1 text-[12px] text-muted">
            {lastUploaded.data ? (
              <>
                Numbers below include posts published from this app and your last manual upload,{' '}
                {new Date(lastUploaded.data).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} — LinkedIn
                doesn't guarantee per-person API access.
              </>
            ) : (
              "No manual upload yet — numbers below reflect posts you've published from this app. LinkedIn doesn't guarantee per-person API access, so upload your own export for full history."
            )}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void handleFileSelected(file)
            }}
          />
          <button
            className="text-[12px] font-semibold text-accent-dark"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload .xlsx export
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3.5">
          <KpiTile isLoading={impressions.isLoading} data={impressions.data} />
          <KpiTile isLoading={engagement.isLoading} data={engagement.data} />
          <KpiTile isLoading={followers.isLoading} data={followers.data} />
          <Card className="flex flex-col gap-2.5 p-4">
            <SkeletonBoundary
              isLoading={postsPublished.isLoading}
              fallback={
                <>
                  <Skeleton width={70} height={9} />
                  <Skeleton width={52} height={24} />
                  <Skeleton height={9} />
                </>
              }
            >
              {postsPublished.data && (
                <>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Posts published</p>
                  <div className="flex items-end gap-2">
                    <span className="text-[26px] font-bold leading-none">{postsPublished.data.published}</span>
                    <span className="text-[12px] text-muted">of {postsPublished.data.planned} planned</span>
                  </div>
                  <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-skeleton">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(postsPublished.data.published / postsPublished.data.planned) * 100}%` }}
                    />
                  </div>
                </>
              )}
            </SkeletonBoundary>
          </Card>
        </div>

        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="text-[14px] font-semibold">Impressions per post</h3>
            <p className="mt-0.5 text-[12px] text-muted">Last 12 weeks · bars are posts, line is your rolling average</p>
          </div>
          <SkeletonBoundary
            isLoading={chart.isLoading}
            fallback={<Skeleton height={190} rounded="md" />}
          >
            {chart.data && (
              <div className="h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart.data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--tl-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="number" domain={[0, 100]} hide />
                    <RechartsTooltip
                      formatter={(v: number) => [`${v}`, 'Impressions (relative)']}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]} isAnimationActive={false}>
                      {chart.data.map((d, i) => (
                        <Cell key={i} fill={d.highlight ? 'var(--tl-accent)' : 'var(--tl-sand)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SkeletonBoundary>
        </Card>

        <div className="mt-1 flex items-center gap-2.5">
          <p className="flex-none font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Detail</p>
          <div className="h-px flex-1 bg-border-soft" />
        </div>

        <Card className="flex flex-col gap-3.5 p-5">
          <div className="flex items-center gap-2">
            <Icon name="spark" className="h-4 w-4 text-accent-dark" />
            <h3 className="text-[14px] font-semibold">What the data says</h3>
          </div>
          <SkeletonBoundary
            isLoading={highlights.isLoading}
            fallback={
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-2.5">
                    <Skeleton width={22} height={22} rounded="full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton height={9} />
                      <Skeleton height={9} width="72%" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            {highlights.data && highlights.data.length > 0 ? (
              <div className="flex flex-col gap-3">
                {highlights.data.map((h) => (
                  <div key={h.id} className="flex gap-2.5">
                    <div className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-accent-05 text-accent-dark">
                      <Icon name={h.icon === 'up' ? 'up' : h.icon === 'clock' ? 'clock' : 'alert'} className="h-3 w-3" />
                    </div>
                    <p className="text-[13px] text-body">{h.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted">
                Not enough data yet — a post-performance export doesn't include the kind of qualitative signal
                this section needs.
              </p>
            )}
          </SkeletonBoundary>
          <div className="h-px bg-border-soft" />
          <div>
            <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Suggested next move</p>
            <SkeletonBoundary isLoading={suggestedMove.isLoading} fallback={<Skeleton height={9} className="mb-2.5" />}>
              {suggestedMove.data ? (
                <>
                  <p className="mb-2.5 text-[13px] text-body">{suggestedMove.data}</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/create/drafts/new?fromInsight=1')}>
                    Draft it from this insight
                  </Button>
                </>
              ) : (
                <p className="text-[13px] text-muted">Not enough data yet to suggest a next move.</p>
              )}
            </SkeletonBoundary>
          </div>
        </Card>

        <Card className="p-0 pt-5">
          <div className="flex items-center justify-between px-5 pb-4">
            <div>
              <h3 className="text-[14px] font-semibold">Post performance</h3>
              <p className="mt-0.5 text-[12px] text-muted">
                {postPerformance.data?.length ?? '—'} published posts · sorted by impressions
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">Columns</Button>
              <Button size="sm" variant="secondary">Export CSV</Button>
            </div>
          </div>
          <SkeletonBoundary
            isLoading={postPerformance.isLoading}
            fallback={
              <div className="flex flex-col gap-3 px-5 pb-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={11} />
                ))}
              </div>
            }
          >
            {postPerformance.data && postPerformance.data.length === 0 && (
              <p className="px-5 pb-5 text-[12px] text-muted">
                No published posts yet — publish a draft or upload a .xlsx export to see real numbers here.
              </p>
            )}
            {postPerformance.data && postPerformance.data.length > 0 && (
              <DataTable
                rowKey={(p) => p.id}
                rows={postPerformance.data.slice(0, 5)}
                columns={[
                  {
                    key: 'title',
                    header: 'Post',
                    width: '44%',
                    render: (p) => <span className="font-semibold text-ink">{p.title}</span>,
                  },
                  {
                    key: 'pillar',
                    header: 'Pillar',
                    render: (p) => (p.pillar === 'Untagged' ? <span className="text-muted">Untagged</span> : <span className="rounded-full bg-accent-05 px-2 py-0.5 text-[11px] font-semibold text-accent-dark">{p.pillar}</span>),
                  },
                  { key: 'published', header: 'Published', render: (p) => new Date(p.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) },
                  { key: 'impressions', header: 'Impr.', align: 'right', render: (p) => <b className="text-ink">{p.impressions.toLocaleString()}</b> },
                  { key: 'engagement', header: 'Eng. rate', align: 'right', render: (p) => `${p.engagementRate}%` },
                  { key: 'saves', header: 'Saves', align: 'right', render: (p) => p.saves },
                ]}
              />
            )}
          </SkeletonBoundary>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[12px] text-muted">Showing 5 of {postPerformance.data?.length ?? 0}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">Prev</Button>
              <Button size="sm" variant="secondary">Next</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <Disclosure
            triggerClassName="items-start"
            label={
              <span className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-ink">Who you're reaching, and how that's changed</span>
                <span className="text-[12px] font-normal text-muted">Share of impressions · 90d vs. prior 90d</span>
              </span>
            }
          >
            <SkeletonBoundary
              isLoading={audience.isLoading}
              fallback={
                <div className="flex flex-col gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} height={10} />
                  ))}
                </div>
              }
            >
              {audience.data && audience.data.length > 0 ? (
                <div className="flex gap-8 pt-1">
                  <div className="flex flex-1 flex-col gap-3.5">
                    {audience.data.map((seg) => (
                      <div key={seg.id}>
                        <div className="mb-1.5 flex justify-between text-[13px]">
                          <span className="font-semibold text-body">{seg.label}</span>
                          <span className="text-muted">
                            <b className="text-ink">{seg.share}%</b> ·{' '}
                            <span className={seg.deltaPt >= 0 ? 'font-semibold text-success-fg' : 'font-semibold text-danger-fg'}>
                              {seg.deltaPt >= 0 ? '+' : ''}
                              {seg.deltaPt}pt
                            </span>
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-skeleton">
                          <div className="h-full rounded-full" style={{ width: `${seg.share}%`, background: seg.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-2.5">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Trend, last 6 periods</p>
                    <div className="flex h-[120px] items-end gap-2.5">
                      {audience.data[0]?.trend.map((_, periodIdx) => (
                        <div key={periodIdx} className="flex h-full flex-1 flex-col justify-end gap-0.5">
                          {audience.data?.map((seg) => (
                            <div
                              key={seg.id}
                              style={{ height: `${seg.trend[periodIdx]}%`, background: seg.color }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3.5">
                      {audience.data.map((seg) => (
                        <span key={seg.id} className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                          <span className="h-2 w-2 rounded-sm" style={{ background: seg.color }} />
                          {seg.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="pt-1 text-[12px] text-muted">
                  Not enough data yet — a personal post-performance export doesn't include per-viewer demographics.
                </p>
              )}
            </SkeletonBoundary>
          </Disclosure>
        </Card>
      </div>
    </div>
  )
}
