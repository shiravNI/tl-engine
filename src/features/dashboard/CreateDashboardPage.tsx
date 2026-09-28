import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { Checkbox } from '@/components/primitives/Checkbox'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { DashedPlaceholder } from '@/components/primitives/DashedPlaceholder'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components/primitives/DropdownMenu'
import { IdeaCard } from '@/components/content/IdeaCard'
import { DraftCard } from '@/components/content/DraftCard'
import { useContent } from '@/state/ContentContext'
import { useGamification, countDoneTasks } from '@/state/GamificationContext'
import { cx } from '@/lib/cx'
import { pickPromptStarters } from '@/data/promptStarters'
import { getRoastTier } from '@/lib/roast'
import type { Idea } from '@/data/types'

const VISIBLE_IDEAS = 4

export function CreateDashboardPage() {
  const navigate = useNavigate()
  const { ideas, drafts, posts, addIdea, setDraftStage, runRoastCheck, generateAgentDraft, loading } = useContent()
  const { tasks, toggleTask, addTask, badges } = useGamification()
  const [showAllIdeas, setShowAllIdeas] = useState(false)
  const [addingIdea, setAddingIdea] = useState(false)
  const [ideaDraftText, setIdeaDraftText] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [taskDraftText, setTaskDraftText] = useState('')
  const [promptStarters, setPromptStarters] = useState(() => pickPromptStarters())
  const [draftingArticle, setDraftingArticle] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  async function draftArticleForMe() {
    setDraftingArticle(true)
    setDraftError(null)
    try {
      const draft = await generateAgentDraft({ format: 'article' })
      navigate(`/create/drafts/${draft.id}`)
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Drafting failed.')
    } finally {
      setDraftingArticle(false)
    }
  }

  const activeIdeas = ideas.filter((i) => !i.archivedAt)
  const draftStage = drafts.filter((d) => d.stage === 'draft')
  const scheduledDrafts = drafts.filter((d) => d.stage === 'scheduled')
  const recentPublished = posts.filter((p) => !p.archivedAt).slice(0, 1)

  const isBrandNewUser = !loading && activeIdeas.length === 0 && drafts.filter((d) => d.stage !== 'archived').length === 0
  const { done, total } = countDoneTasks(tasks)

  function submitIdea() {
    if (ideaDraftText.trim()) addIdea(ideaDraftText)
    setIdeaDraftText('')
    setAddingIdea(false)
  }

  function submitTask() {
    if (taskDraftText.trim()) addTask(taskDraftText)
    setTaskDraftText('')
    setAddingTask(false)
  }

  if (isBrandNewUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-05 text-accent-dark">
          <Icon name="bulb" className="h-[30px] w-[30px]" strokeWidth={1.4} />
        </div>
        <div className="max-w-[460px] text-center">
          <h1 className="text-[24px] font-bold">Your Brain is empty.</h1>
          <p className="mt-2 text-[13px] text-body">
            Dump three half-formed thoughts. Nothing gets published from here without you.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="primary" onClick={() => setAddingIdea(true)}>
            <Icon name="plus" className="h-[15px] w-[15px]" />
            Brain dump
          </Button>
          <Button variant="secondary">
            <Icon name="send" className="h-[15px] w-[15px]" />
            Import a post I already wrote
          </Button>
        </div>
        {addingIdea && (
          <div className="flex w-full max-w-[460px] gap-2">
            <input
              autoFocus
              value={ideaDraftText}
              onChange={(e) => setIdeaDraftText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitIdea()}
              placeholder="10 words is enough…"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
            <Button variant="soft" onClick={submitIdea}>
              Save
            </Button>
          </div>
        )}
        <div className="w-full max-w-[720px]">
          <div className="mb-3 flex items-center justify-center gap-2">
            <p className="text-center font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              Or start from a prompt
            </p>
            <button
              type="button"
              onClick={() =>
                setPromptStarters((current) =>
                  pickPromptStarters(current.length, current.map((p) => p.q)),
                )
              }
              className="flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-accent-dark hover:underline"
            >
              <Icon name="refresh" className="h-[11px] w-[11px]" />
              Refresh
            </button>
          </div>
          <div className="flex gap-3">
            {promptStarters.map((p) => (
              <DashedPlaceholder
                key={p.q}
                className="flex-1 cursor-pointer flex-col items-start gap-1.5 p-3.5 text-left"
                onClick={() => addIdea(p.q)}
              >
                <p className="text-[13px] font-semibold text-ink">{p.q}</p>
                <p className="text-[12px] text-muted">{p.hint}</p>
              </DashedPlaceholder>
            ))}
          </div>
        </div>
        <p className="text-[12px] text-muted">Insights &amp; Data unlocks after your first published post.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex-none border-b border-border bg-surface px-7 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight">Create</h1>
            <p className="mt-1 text-[13px] text-body">Move one thing to the right today. That's the whole job.</p>
          </div>
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={() => setAddingIdea(true)}>
              <Icon name="bulb" className="h-[15px] w-[15px]" />
              Brain dump
            </Button>
            <DropdownMenuRoot>
              <DropdownMenuTrigger asChild>
                <Button variant="primary">
                  <Icon name="plus" className="h-[15px] w-[15px]" />
                  New draft
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => navigate('/create/drafts/new')}>Post</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/create/drafts/new?format=article')}>
                  Article — start from scratch
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void draftArticleForMe()} disabled={draftingArticle}>
                  {draftingArticle ? 'Drafting…' : 'Article — draft it for me'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuRoot>
          </div>
        </div>
        {draftError && (
          <div className="mt-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger">
            {draftError}
          </div>
        )}
        <div className="mt-5 flex gap-5">
          <div className="border-b-2 border-accent pb-3 text-[13px] font-semibold text-ink">Create</div>
          <button
            className="border-b-2 border-transparent pb-3 text-[13px] font-medium text-muted"
            onClick={() => navigate('/insights/posts')}
          >
            Insights &amp; Data
          </button>
        </div>
      </div>

      <div className="px-7 pt-4.5">
        <Card className="p-4.5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold">Today's tasks</h3>
            <span className="text-[12px] text-muted">
              {done} of {total} done
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <label key={task.id} className="flex items-center gap-2.5">
                <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id)} />
                <span
                  className={cx(
                    'flex-1 text-[13px]',
                    task.done ? 'text-faint line-through' : 'font-semibold text-ink',
                  )}
                >
                  {task.label}
                </span>
                {task.duePill && !task.done && <Pill tone="accent">{task.duePill}</Pill>}
              </label>
            ))}
          </div>
          {addingTask ? (
            <div className="mt-2.5 flex gap-2">
              <input
                autoFocus
                value={taskDraftText}
                onChange={(e) => setTaskDraftText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitTask()}
                placeholder="New task…"
                className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] outline-none focus:border-accent"
              />
              <Button size="sm" variant="soft" onClick={submitTask}>
                Add
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="mt-2.5 px-1 py-1.5" onClick={() => setAddingTask(true)}>
              + Add a task
            </Button>
          )}
        </Card>
      </div>

      <div className="flex flex-1 flex-col gap-4.5 px-7 pb-6 pt-4.5">
      <div className="flex flex-1 gap-4.5">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon name="bulb" className="h-[15px] w-[15px] text-muted" />
            <h3 className="text-[14px] font-semibold">Brain</h3>
            <Pill>{activeIdeas.length}</Pill>
          </div>
          {(showAllIdeas ? activeIdeas : activeIdeas.slice(0, VISIBLE_IDEAS)).map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
          {addingIdea ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={ideaDraftText}
                onChange={(e) => setIdeaDraftText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitIdea()}
                placeholder="10 words is enough…"
                className="flex-1 rounded-lg border border-border px-2.5 py-2 text-[12.5px] outline-none focus:border-accent"
              />
              <Button size="sm" variant="soft" onClick={submitIdea}>
                Save
              </Button>
            </div>
          ) : (
            <DashedPlaceholder
              className="cursor-pointer gap-2 p-3"
              onClick={() => setAddingIdea(true)}
            >
              <Icon name="plus" className="h-[15px] w-[15px]" />
              Add an idea — 10 words is enough
            </DashedPlaceholder>
          )}
          {activeIdeas.length > VISIBLE_IDEAS && (
            <button
              className="text-center text-[12px] font-semibold text-accent-dark"
              onClick={() => setShowAllIdeas((v) => !v)}
            >
              {showAllIdeas ? 'Show fewer ideas' : `Show ${activeIdeas.length - VISIBLE_IDEAS} older ideas`}
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon name="pen" className="h-[15px] w-[15px] text-muted" />
            <h3 className="text-[14px] font-semibold">Drafts</h3>
            <Pill>{draftStage.length}</Pill>
          </div>
          {draftStage.map((draft) => {
            const roastTier = getRoastTier(draft.slopScore)
            return (
              <DraftCard
                key={draft.id}
                draft={draft}
                actions={
                  <>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/create/drafts/${draft.id}`)}>
                      Edit
                    </Button>
                    {roastTier === 'clear' ? (
                      <Button size="sm" variant="primary" onClick={() => setDraftStage(draft.id, 'scheduled')}>
                        Mark scheduled to post
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => runRoastCheck(draft.id)}>
                        Roast this draft
                      </Button>
                    )}
                  </>
                }
              />
            )
          })}
          {draftStage.length === 0 && (
            <DashedPlaceholder className="p-4 text-center">No drafts waiting</DashedPlaceholder>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon name="send" className="h-[15px] w-[15px] text-muted" />
            <h3 className="text-[14px] font-semibold">Scheduled &amp; published</h3>
          </div>
          {scheduledDrafts.map((draft) => (
            <Card key={draft.id} className="flex flex-col gap-2 p-3.5">
              <div className="flex items-center gap-1.5">
                <Icon name="clock" className="h-3.5 w-3.5 text-accent-dark" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-accent-dark">
                  Scheduled to post
                  {draft.scheduledFor ? ` · ${new Date(draft.scheduledFor).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}
                </span>
              </div>
              <p className="text-[13px] font-semibold leading-tight">{draft.title}</p>
              <p className="text-[12px] text-muted">
                Reminder set — LinkedIn doesn't support auto-posting, so you'll post it yourself.
              </p>
            </Card>
          ))}
          {recentPublished.map((post) => (
            <Card key={post.id} className="flex flex-col gap-2 p-3.5">
              <div className="flex items-center gap-1.5">
                <Icon name="check" className="h-3.5 w-3.5 text-success-fg" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-success-fg">
                  Published {new Date(post.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <p className="text-[13px] font-semibold leading-tight">{post.title}</p>
              <div className="flex gap-3.5 text-[12px] text-muted">
                <span>
                  <b className="text-ink">{post.impressions.toLocaleString()}</b> impressions
                </span>
                <span>
                  <b className="text-ink">{post.engagementRate}%</b> eng.
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="flex items-center gap-5 border-accent-10 bg-gradient-to-r from-accent-soft-bg to-surface px-5 py-3.5">
        <div className="flex flex-none items-center gap-2">
          <Icon name="trophy" className="h-[18px] w-[18px] text-accent-dark" />
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-accent-dark">
              Next milestone
            </p>
            <div className="text-[14px] font-bold leading-tight">Consistency badge · 15 weeks</div>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ProgressBar value={93} />
          <p className="text-[12px] text-muted">One more post this week earns it.</p>
        </div>
        <div className="flex flex-none gap-1.5">
          {badges
            .filter((b) => b.earned)
            .slice(0, 2)
            .map((b) => (
              <div
                key={b.id}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-accent-10 bg-cream text-accent-dark"
                title={b.name}
              >
                <Icon name={b.icon ?? 'trophy'} className="h-[15px] w-[15px]" />
              </div>
            ))}
          {badges
            .filter((b) => !b.earned && !b.hidden)
            .slice(0, 1)
            .map((b) => (
              <div
                key={b.id}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-dashed border-border bg-chip text-muted-2"
                title={b.name}
              >
                <Icon name="lock" className="h-[15px] w-[15px]" />
              </div>
            ))}
        </div>
      </Card>
    </div>
    </div>
  )
}
