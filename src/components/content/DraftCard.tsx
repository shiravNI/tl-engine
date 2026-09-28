import type { ReactNode } from 'react'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { Icon } from '@/components/icons/Icon'
import { CONTENT_STAGE_LABEL } from '@/lib/statusPipeline'
import { getRoastTier } from '@/lib/roast'
import type { Draft } from '@/data/types'

/** Extracted from `CreateDashboardPage`'s inline draft-card JSX — reused as-is
 * by the standalone `/brain` bucket view (Phase 1), which has no per-stage
 * action buttons of its own, and by the dashboard's Drafts column, which
 * still wants its own stage-specific actions. The stage `Pill` is always
 * shown here (the dashboard's own column previously left stage implicit
 * since it only ever showed `stage === 'draft'` cards); `actions` is an
 * opt-in slot so the dashboard keeps its "Edit" / "Run BS check" / "Mark
 * scheduled to post" buttons while `BrainPage` doesn't need any. */
export function DraftCard({ draft, actions }: { draft: Draft; actions?: ReactNode }) {
  const roastTier = getRoastTier(draft.slopScore)
  const roastTone = roastTier === 'clear' ? 'success' : roastTier === 'flagged' ? 'warn' : 'danger'
  const roastLabel = roastTier === 'clear' ? 'Clear' : roastTier === 'flagged' ? 'Flagged' : 'Roasted'
  return (
    <Card className="flex flex-col gap-2.5 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[13.5px] font-semibold leading-tight">{draft.title}</p>
        <Pill className="flex-none">{CONTENT_STAGE_LABEL[draft.stage]}</Pill>
      </div>
      <p className="text-[12px] text-muted">{draft.excerpt}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {draft.format === 'article' && <Pill tone="accent">Article</Pill>}
        <Pill tone={roastTone} className="max-w-full" title={draft.roastVerdict || undefined}>
          <Icon name={roastTier === 'clear' ? 'check' : roastTier === 'flagged' ? 'alert' : 'flag'} className="h-3 w-3 shrink-0" />
          <span className="min-w-0 truncate">Roast: {roastLabel}</span>
        </Pill>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
          Voice {draft.voiceMatch}%
        </span>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </Card>
  )
}
