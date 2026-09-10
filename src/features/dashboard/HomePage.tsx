import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { useAppShell } from '@/state/AppShellContext'
import { useContent } from '@/state/ContentContext'
import { useGamification } from '@/state/GamificationContext'
import { insightSnapshot } from '@/data/fixtures/insights'

/** `1n` — Homescreen, Personal-only access (no Mastermind cohort). This is
 * the app's only homescreen in this build, since Personal mode is the only
 * mode shipped and the mock user is never part of a cohort. */
export function HomePage() {
  const navigate = useNavigate()
  const { currentUser } = useAppShell()
  const { ideas, drafts } = useContent()
  const { streak } = useGamification()

  const ideaCount = ideas.filter((i) => !i.archivedAt).length
  const draftsWaiting = drafts.filter((d) => d.stage === 'draft').length
  const readyDraft = drafts.find((d) => d.stage === 'draft')

  return (
    <div className="flex flex-col gap-6 px-12 py-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Tuesday, 2 September
          </p>
          <h1 className="text-[30px] font-bold tracking-tight">Good morning, {currentUser.name.split(' ')[0]}</h1>
          <p className="mt-1.5 text-[13px] text-body">
            You have {draftsWaiting} draft{draftsWaiting === 1 ? '' : 's'} waiting and {ideaCount} idea
            {ideaCount === 1 ? '' : 's'} sitting in your Brain.
          </p>
        </div>
        {streak && (
          <Card className="flex items-center gap-2.5 px-3.5 py-2.5">
            <Icon name="flame" className="h-[22px] w-[22px] text-terracotta" />
            <div>
              <div className="text-[16px] font-bold leading-none">{streak.currentWeeks}-week streak</div>
              <p className="mt-1 text-[12px] text-muted">Longest in the cohort</p>
            </div>
          </Card>
        )}
      </div>

      <div className="flex gap-5">
        <Card className="flex flex-1 flex-col gap-5 border-t-[3px] border-t-accent p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-accent-05 text-accent-dark">
                <Icon name="user" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold">Personal View</h2>
                <p className="text-[12px] text-muted">Your Brain, Core and Output</p>
              </div>
            </div>
            <Icon name="chev" className="h-4 w-4 text-muted-2" />
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1 rounded-[10px] bg-bg p-3">
              <div className="text-[20px] font-bold leading-none">{ideaCount}</div>
              <p className="mt-1 text-[12px] text-muted">Ideas in bucket</p>
            </div>
            <div className="flex-1 rounded-[10px] bg-bg p-3">
              <div className="text-[20px] font-bold leading-none">{draftsWaiting}</div>
              <p className="mt-1 text-[12px] text-muted">Drafts waiting</p>
            </div>
            <div className="flex-1 rounded-[10px] bg-bg p-3">
              <div className="text-[20px] font-bold leading-none">+{insightSnapshot.impressionsDeltaPct}%</div>
              <p className="mt-1 text-[12px] text-muted">Impressions, 30d</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-[13px] text-body">
              <Icon name="pen" className="h-[15px] w-[15px] text-muted" />
              Create — ideas, drafts, scheduling
            </div>
            <div className="flex items-center gap-2.5 text-[13px] text-body">
              <Icon name="chart" className="h-[15px] w-[15px] text-muted" />
              Insights &amp; Data — your post performance
            </div>
            <div className="flex items-center gap-2.5 text-[13px] text-body">
              <Icon name="trophy" className="h-[15px] w-[15px] text-muted" />
              Streaks, badges and milestones
            </div>
          </div>
          <Button variant="primary" className="justify-center py-3" onClick={() => navigate('/create')}>
            Enter Personal View
          </Button>
        </Card>

        <Card className="flex flex-1 flex-col items-start justify-center gap-4 bg-cream p-6">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-chip text-muted-2">
            <Icon name="users" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-muted">No Mastermind cohort yet</h2>
            <p className="mt-1.5 max-w-[340px] text-[12px] text-muted">
              Mastermind is for Directors running a cohort of cast members. You're posting solo for now —
              ask a Director to add you if that changes.
            </p>
          </div>
          <Pill>Personal plan</Pill>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Pick up where you left off
          </p>
          <span className="text-[12px] font-semibold text-accent-dark">Clear all</span>
        </div>
        <div className="flex gap-3.5">
          {readyDraft && (
            <Card
              className="flex flex-1 cursor-pointer gap-2.5 p-3.5"
              onClick={() => navigate(`/create/drafts/${readyDraft.id}`)}
            >
              <Icon name="flame" className="mt-0.5 h-[18px] w-[18px] flex-none text-terracotta" />
              <div>
                <div className="text-[13px] font-semibold leading-tight">Post today to keep the streak</div>
                <p className="mt-1 text-[12px] text-muted">Draft "{readyDraft.title}" is ready.</p>
              </div>
            </Card>
          )}
          <Card className="flex flex-1 cursor-pointer gap-2.5 p-3.5" onClick={() => navigate('/insights/posts')}>
            <Icon name="spark" className="mt-0.5 h-[18px] w-[18px] flex-none text-accent-dark" />
            <div>
              <div className="text-[13px] font-semibold leading-tight">3 new insights on last week's post</div>
              <p className="mt-1 text-[12px] text-muted">Saves up 4× vs. your average.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
