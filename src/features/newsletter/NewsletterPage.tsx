import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { useContent } from '@/state/ContentContext'
import { fetchNewsletterIssue } from '@/data/services/newsletterService'
import type { NewsletterIssue } from '@/data/types'

/** `5a` — Newsletter: daily auto briefing with pre-written post ideas. */
export function NewsletterPage() {
  const navigate = useNavigate()
  const { createDraft } = useContent()
  const [issue, setIssue] = useState<NewsletterIssue | null>(null)

  useEffect(() => {
    fetchNewsletterIssue().then(setIssue)
  }, [])

  if (!issue) return <div className="p-8 text-[13px] text-muted">Loading today's issue…</div>

  function turnIntoDraft(headline: string, matchesLabel: string) {
    const id = createDraft({
      title: headline,
      paragraphs: [headline, ''],
      sourceType: 'newsletter',
      sourceLabel: matchesLabel,
      pillar: null,
    })
    navigate(`/create/drafts/${id}`)
  }

  return (
    <div className="flex gap-5 px-7 py-6">
      <div className="flex min-w-0 flex-[1.6] flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              Daily briefing · delivered 7:00 AM
            </p>
            <h1 className="text-[26px] font-bold tracking-tight">{issue.headline}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <Icon name="clock" className="h-3.5 w-3.5" />
              Daily · 7 AM
            </Button>
            <Button variant="ghost">Edit sections</Button>
          </div>
        </div>

        <Card className="flex flex-col gap-2.5 p-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Top stories, last 48h</p>
          {issue.stories.map((story) => (
            <div key={story.id} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold leading-snug">{story.headline}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {story.sourceLabel} · {story.matchesLabel}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => turnIntoDraft(story.headline, story.matchesLabel)}>
                Turn into draft
              </Button>
            </div>
          ))}
        </Card>

        <Card className="flex flex-col gap-2.5 p-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Stat of the day</p>
          <p className="text-[22px] font-bold leading-none">{issue.statOfDay.value}</p>
          <p className="text-[13px] text-body">{issue.statOfDay.caption}</p>
        </Card>

        <Card className="flex flex-col gap-3 border-accent-10 bg-accent-soft-bg p-4">
          <div className="flex items-center gap-2">
            <Icon name="pen" className="h-4 w-4 text-accent-dark" />
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-accent-dark">
              Post this today — pre-written from this issue
            </p>
          </div>
          <Card className="p-3">
            <p className="text-[13px] font-semibold leading-snug">"{issue.prewrittenDraft.hook}"</p>
            <p className="mt-1.5 text-[12px] text-muted">{issue.prewrittenDraft.note}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary">
                Preview
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  navigate(
                    issue.prewrittenDraft.seedIdeaId
                      ? `/create/drafts/new?fromIdea=${issue.prewrittenDraft.seedIdeaId}`
                      : '/create/drafts/new?fromNewsletter=1',
                  )
                }
              >
                Send to Drafts
              </Button>
            </div>
          </Card>
        </Card>
      </div>

      <div className="flex w-[280px] flex-none flex-col gap-3.5">
        <Card className="flex flex-col gap-2.5 p-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">This issue's sources</p>
          <div className="flex items-center gap-2 text-body">
            <Icon name="folder" className="h-3.5 w-3.5 text-muted" />
            <span className="text-[13px]">Your Drive · Q2 report</span>
          </div>
          <div className="flex items-center gap-2 text-body">
            <Icon name="core" className="h-3.5 w-3.5 text-muted" />
            <span className="text-[13px]">Your Core pillars</span>
          </div>
          <span className="text-[12px] font-semibold text-accent-dark">Manage sources</span>
        </Card>
        <Card className="flex flex-col gap-2.5 p-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Past issues</p>
          {issue.pastIssues.map((past) => (
            <div key={past.label} className="flex justify-between text-[13px]">
              <span className="text-body">{past.label}</span>
              <span className="text-muted">{past.summary}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
