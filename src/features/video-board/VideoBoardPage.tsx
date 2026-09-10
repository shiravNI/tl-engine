import { useState } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Avatar } from '@/components/primitives/Avatar'
import { Pill } from '@/components/primitives/Pill'
import { useContent } from '@/state/ContentContext'
import { VIDEO_STAGE_ORDER, VIDEO_STAGE_LABEL } from '@/lib/statusPipeline'
import { makeId } from '@/lib/id'
import { VideoBoardColumn } from '@/features/video-board/VideoBoardColumn'
import { VideoBoardCard } from '@/features/video-board/VideoBoardCard'
import type { VideoStage } from '@/data/types'

const COLUMN_META: Record<VideoStage, { dot: string; empty: string }> = {
  script: { dot: 'var(--tl-muted-2)', empty: 'Nothing scripted yet' },
  shoot_scheduled: { dot: 'var(--tl-accent)', empty: 'Nothing scheduled' },
  filming: { dot: 'var(--tl-warn-fg)', empty: 'Nothing in production' },
  editing: { dot: 'var(--tl-umber)', empty: 'Nothing in the cut' },
  ready: { dot: 'var(--tl-success-fg)', empty: 'Nothing ready yet' },
}

export function VideoBoardPage() {
  const { videoItems, setVideoStage, addVideoItem } = useContent()
  const [selectedId, setSelectedId] = useState<string | null>('video_org_chart')

  const selected = videoItems.find((v) => v.id === selectedId)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    setVideoStage(String(active.id), over.id as VideoStage)
  }

  function handleNewScript() {
    const id = makeId('video')
    addVideoItem({ id, title: 'Untitled script', format: 'video', stage: 'script', people: [] })
    setSelectedId(id)
  }

  return (
    <div className="flex h-full flex-col gap-4.5 px-7 py-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Create · Script &amp; shoot planner
          </p>
          <h1 className="text-[26px] font-bold tracking-tight">Video &amp; carousel pipeline</h1>
          <p className="mt-1.5 text-[13px] text-body">
            Everything that needs a camera, a crew, or an edit — not just a keyboard.
          </p>
        </div>
        <Button variant="primary" onClick={handleNewScript}>
          <Icon name="plus" className="h-[15px] w-[15px]" />
          New script
        </Button>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid flex-1 grid-cols-5 gap-3.5">
          {VIDEO_STAGE_ORDER.map((stage) => {
            const items = videoItems.filter((v) => v.stage === stage)
            return (
              <VideoBoardColumn
                key={stage}
                stage={stage}
                label={VIDEO_STAGE_LABEL[stage]}
                dotColor={COLUMN_META[stage].dot}
                count={items.length}
                emptyLabel={COLUMN_META[stage].empty}
              >
                {items.map((item) => (
                  <VideoBoardCard
                    key={item.id}
                    item={item}
                    selected={item.id === selectedId}
                    onSelect={() => setSelectedId(item.id)}
                    onMarkReady={
                      item.stage === 'ready'
                        ? () => {
                            /* Purely illustrative — no linked draft to schedule for a mock item. */
                          }
                        : undefined
                    }
                  />
                ))}
              </VideoBoardColumn>
            )
          })}
        </div>
      </DndContext>

      {selected?.beats && (
        <Card className="flex flex-col gap-3.5 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold">Script — "{selected.title}"</h3>
            <span className="text-[12px] text-muted">Auto-saves as you type</span>
          </div>
          <div className="grid grid-cols-[1.4fr_1fr] gap-5">
            <div className="flex flex-col gap-4">
              <div className="border-l-2 border-accent-10 pl-3.5">
                <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-accent-dark">
                  Hook · 0–3s
                </p>
                <p className="text-[15px] leading-relaxed">{selected.beats.hook}</p>
              </div>
              <div className="border-l-2 border-border-soft pl-3.5">
                <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Body</p>
                <p className="text-[15px] leading-relaxed text-body">{selected.beats.body}</p>
              </div>
              <div className="border-l-2 border-border-soft pl-3.5">
                <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">CTA</p>
                <p className="text-[15px] leading-relaxed text-body">{selected.beats.cta}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                  Who's needed
                </p>
                <div className="flex flex-col gap-1.5">
                  {selected.people.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <Avatar initials={p.initials} size={26} tone={p.isContact ? 'warn' : 'neutral'} />
                      <span className="text-[13px] text-body">
                        {p.name} · {p.role}
                      </span>
                      {p.isContact && <Pill tone="warn">Freelancer</Pill>}
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="secondary" className="mt-2">
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  Add a person or freelancer
                </Button>
              </div>
              {selected.shootDate && (
                <div>
                  <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                    Shoot date
                  </p>
                  <div className="flex items-center gap-1.5 text-body">
                    <Icon name="cal" className="h-3.5 w-3.5 text-muted" />
                    <span className="text-[13px]">{selected.shootDate}</span>
                  </div>
                </div>
              )}
              {selected.location && (
                <div>
                  <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                    Location
                  </p>
                  <div className="flex items-center gap-1.5 text-body">
                    <Icon name="pin" className="h-3.5 w-3.5 text-muted" />
                    <span className="text-[13px]">{selected.location}</span>
                  </div>
                </div>
              )}
              {selected.inspoLabel && (
                <div>
                  <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                    Inspo link
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Icon name="link" className="h-3.5 w-3.5 text-muted" />
                    <span className="text-[13px] font-semibold text-accent-dark">{selected.inspoLabel}</span>
                  </div>
                </div>
              )}
              <Button
                variant="secondary"
                className="justify-center"
                onClick={() => setVideoStage(selected.id, 'editing')}
              >
                Move to editing
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
