import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Avatar } from '@/components/primitives/Avatar'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { Button } from '@/components/primitives/Button'
import type { VideoItem } from '@/data/types'

interface VideoBoardCardProps {
  item: VideoItem
  onSelect: () => void
  selected: boolean
  onMarkReady?: () => void
}

export function VideoBoardCard({ item, onSelect, selected, onMarkReady }: VideoBoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={`flex cursor-grab flex-col gap-2 p-3.5 active:cursor-grabbing ${
        selected ? 'ring-2 ring-accent' : ''
      } ${item.stage === 'shoot_scheduled' ? 'border-accent-10' : ''} ${
        item.stage === 'editing' ? 'border-warn-border bg-warn-bg' : ''
      } ${item.stage === 'ready' ? 'border-success-border bg-success-bg' : ''}`}
    >
      <div className="flex items-center gap-1.5 text-muted">
        <Icon name="video" className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em]">
          {item.format === 'video' ? 'Video' : 'Carousel'}
        </span>
      </div>
      <p className="text-[13px] font-semibold leading-tight">{item.title}</p>
      {item.beatsSummary && <p className="text-[12px] text-muted">{item.beatsSummary}</p>}
      {item.inspoLabel && (
        <div className="flex items-center gap-1.5 text-muted">
          <Icon name="link" className="h-3.5 w-3.5" />
          <span className="text-[12px]">{item.inspoLabel}</span>
        </div>
      )}
      {item.shootDate && (
        <div className="flex items-center gap-1.5 text-body">
          <Icon name="cal" className="h-3.5 w-3.5" />
          <span className="text-[12px]">{item.shootDate}</span>
        </div>
      )}
      {item.location && (
        <div className="flex items-center gap-1.5 text-body">
          <Icon name="pin" className="h-3.5 w-3.5" />
          <span className="text-[12px]">{item.location}</span>
        </div>
      )}
      {item.people.length > 0 && (
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1.5">
            {item.people.slice(0, 3).map((p) => (
              <Avatar key={p.name} initials={p.initials} size={20} tone={p.isContact ? 'warn' : 'neutral'} />
            ))}
          </div>
          <span className="ml-1 text-[12px] text-muted">
            {item.people[item.people.length - 1].name} {item.people[item.people.length - 1].role}
          </span>
        </div>
      )}
      {item.editingNote && (
        <>
          <p className="text-[12px] text-body">{item.editingNote}</p>
          <ProgressBar value={item.editingProgress ?? 0} height={6} barClassName="bg-warn-fg" />
        </>
      )}
      {item.postingNote && <p className="text-[12px] text-muted">{item.postingNote}</p>}
      {item.stage === 'ready' && onMarkReady && (
        <Button
          size="sm"
          variant="primary"
          className="mt-1"
          onClick={(e) => {
            e.stopPropagation()
            onMarkReady()
          }}
        >
          Mark scheduled to post
        </Button>
      )}
    </Card>
  )
}
