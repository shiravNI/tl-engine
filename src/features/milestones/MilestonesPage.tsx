import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { useGamification } from '@/state/GamificationContext'
import { useContent } from '@/state/ContentContext'
import { cx } from '@/lib/cx'

/** `1f` — Milestones/streaks, single-user parts only (the cohort-streaks
 * card is explicitly excluded from Personal-mode scope). */
export function MilestonesPage() {
  const navigate = useNavigate()
  const { streak, badges } = useGamification()
  const { ideas, drafts, posts } = useContent()

  if (!streak) return <div className="p-8 text-[13px] text-muted">Loading…</div>

  const ideaCount = ideas.filter((i) => !i.archivedAt).length
  const draftsWaiting = drafts.filter((d) => d.stage === 'draft').length
  const publishedCount = posts.filter((p) => !p.archivedAt).length
  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <div className="flex flex-col gap-4.5 px-7 py-6">
      <div>
        <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Milestones</p>
        <h1 className="text-[26px] font-bold tracking-tight">
          {streak.currentWeeks} weeks without breaking the chain
        </h1>
        <p className="mt-1.5 text-[13px] text-body">
          Consistency is the only metric here that you fully control.
        </p>
      </div>

      <div className="flex gap-4.5">
        <Card className="flex flex-[1.4] flex-col gap-4.5 border-none bg-gradient-to-br from-umber to-espresso p-5.5 text-cream">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-white/15">
                <Icon name="flame" className="h-7 w-7 text-clay" strokeWidth={1.4} />
              </div>
              <div>
                <div className="text-[30px] font-bold leading-none">{streak.currentWeeks}</div>
                <p className="mt-1 text-[12px] text-cream/70">consecutive weeks posted</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[15px] font-bold">Personal best</div>
              <p className="mt-1 text-[12px] text-cream/70">Previous best: {streak.personalBestWeeks} weeks</p>
            </div>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-cream/65">
              Last {streak.weeks.length} weeks
            </p>
            <div className="flex gap-1.5">
              {streak.weeks.map((posted, i) => (
                <div
                  key={i}
                  className={cx(
                    'h-[34px] flex-1 rounded-md',
                    i === streak.weeks.length - 1
                      ? 'border-[1.5px] border-dashed border-cream/50'
                      : posted
                        ? 'bg-clay'
                        : 'bg-white/15',
                  )}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[12px] text-cream/70">
              <span>16 weeks ago</span>
              <span>This week — post to extend</span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-1 flex-col gap-3.5 p-5.5">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Where things stand</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: 'bulb' as const, label: 'Idea bucket', value: ideaCount, pct: (ideaCount / 10) * 100, note: 'Healthy range is 5–10.', color: 'var(--tl-accent)', bg: 'bg-accent-05', fg: 'text-accent-dark' },
              { icon: 'pen' as const, label: 'Drafts waiting', value: draftsWaiting, pct: (draftsWaiting / 5) * 100, note: 'Ship it or bin it.', color: 'var(--tl-warn-fg)', bg: 'bg-warn-bg', fg: 'text-warn-fg' },
              { icon: 'send' as const, label: 'Published, 90d', value: publishedCount, pct: (publishedCount / 12) * 100, note: '92% of your own commitment of 12.', color: 'var(--tl-success-fg)', bg: 'bg-success-bg', fg: 'text-success-fg' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className={cx('flex h-9 w-9 items-center justify-center rounded-[10px]', row.bg, row.fg)}>
                  <Icon name={row.icon} className="h-[18px] w-[18px]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-semibold text-body">{row.label}</span>
                    <span className="text-[15px] font-bold">{row.value}</span>
                  </div>
                  <ProgressBar value={row.pct} className="mt-1.5" barClassName="" />
                  <p className="mt-1 text-[12px] text-muted">{row.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5.5">
        <div className="mb-4.5 flex items-end justify-between">
          <div>
            <h3 className="text-[14px] font-semibold">Badges</h3>
            <p className="mt-0.5 text-[12px] text-muted">
              {earnedCount} of {badges.length} earned · earned badges show on your cohort card
            </p>
          </div>
          <span className="text-[12px] font-semibold text-accent-dark">How badges work</span>
        </div>
        <div className="grid grid-cols-4 gap-3.5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cx(
                'flex items-start gap-3 rounded-xl border p-4',
                badge.earned ? 'border-accent-10 bg-accent-soft-bg' : 'border-dashed border-border bg-cream',
                badge.hidden && 'opacity-70',
              )}
            >
              <div
                className={cx(
                  'flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full',
                  badge.earned ? 'bg-accent text-cream' : 'bg-chip text-muted-2',
                )}
              >
                <Icon name={badge.icon ?? (badge.hidden ? 'lock' : 'trophy')} className="h-[19px] w-[19px]" />
              </div>
              <div className="flex-1">
                <div className={cx('text-[13px] font-bold leading-tight', !badge.earned && 'text-muted-2')}>
                  {badge.name}
                </div>
                {!badge.earned && !badge.hidden && badge.progressTarget && (
                  <ProgressBar
                    value={((badge.progressCurrent ?? 0) / badge.progressTarget) * 100}
                    className="mt-1.5"
                    height={6}
                    barClassName="bg-muted-2"
                  />
                )}
                <p className="mt-1 text-[12px] text-muted">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex items-center gap-4.5 p-5">
        <div className="flex-1">
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Next milestone</p>
          <div className="text-[16px] font-bold leading-tight">
            One post to reach "Chain of {streak.nextMilestoneWeeks}"
          </div>
          <p className="mt-1 text-[12px] text-muted">
            Deadline{' '}
            {new Date(streak.nextMilestoneDeadline).toLocaleDateString('en-US', { weekday: 'long' })}. Your
            scheduled Thursday post covers it.
          </p>
          <ProgressBar value={93} className="mt-3" height={9} />
        </div>
        <Button variant="primary" onClick={() => navigate('/create')}>
          Open scheduled post
        </Button>
      </Card>
    </div>
  )
}
