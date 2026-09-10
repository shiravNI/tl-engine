import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import { Pill } from '@/components/primitives/Pill'
import { DashedPlaceholder } from '@/components/primitives/DashedPlaceholder'
import { cx } from '@/lib/cx'
import type { VideoStage } from '@/data/types'

interface VideoBoardColumnProps {
  stage: VideoStage
  label: string
  dotColor: string
  count: number
  emptyLabel: string
  children: ReactNode
}

export function VideoBoardColumn({ stage, label, dotColor, count, emptyLabel, children }: VideoBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} />
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
        <Pill>{count}</Pill>
      </div>
      <div
        ref={setNodeRef}
        className={cx('flex min-h-[120px] flex-1 flex-col gap-2.5 rounded-xl p-1 transition-colors', isOver && 'bg-accent-05')}
      >
        {count === 0 ? (
          <DashedPlaceholder className="flex-1 flex-col gap-1.5 p-4">{emptyLabel}</DashedPlaceholder>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
