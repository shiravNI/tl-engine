import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import type { Idea } from '@/data/types'

/** Extracted from `CreateDashboardPage`'s formerly-private `IdeaCard` — the
 * dashboard's Brain column and the standalone `/brain` bucket view (Phase 1
 * of the plan) both render the exact same idea card, presentation-only. */
export function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Card className="flex flex-col gap-1.5 p-3.5">
      <p className="text-[13px] font-semibold leading-tight text-ink">{idea.text}</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {idea.pillar ? (
          <Pill tone="accent">Pillar: {idea.pillar}</Pill>
        ) : (
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Untagged</span>
        )}
        {idea.source === 'voice_note' && (
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Voice note</span>
        )}
        {idea.source === 'slack' && (
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Slack</span>
        )}
      </div>
    </Card>
  )
}
