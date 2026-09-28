import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/primitives/Button'
import { Dialog } from '@/components/primitives/Dialog'
import { DashedPlaceholder } from '@/components/primitives/DashedPlaceholder'
import { DraftCard } from '@/components/content/DraftCard'
import { useContent } from '@/state/ContentContext'
import type { Draft } from '@/data/types'

/** Real agent-authored drafts awaiting review — a dedicated tab, not an
 * alias into Insights & Data. Approve opens the draft in the composer to
 * finish/schedule like any other draft; Reject asks why and feeds that
 * reason back into the next generation call (the actual learning loop). */
export function OutputPage() {
  const navigate = useNavigate()
  const { drafts, setDraftStage, generateAgentDraft, recordAgentFeedback } = useContent()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<Draft | null>(null)
  const [reason, setReason] = useState('')

  const pending = drafts.filter((d) => d.origin === 'agent' && d.stage === 'in_review')

  async function draftForMe() {
    setGenerating(true)
    setError(null)
    try {
      await generateAgentDraft({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Drafting failed.')
    } finally {
      setGenerating(false)
    }
  }

  function approve(draft: Draft) {
    setDraftStage(draft.id, 'draft')
  }

  function confirmReject() {
    if (!rejecting) return
    recordAgentFeedback({ draftId: rejecting.id, action: 'rejected', reason: reason.trim() || 'No reason given' })
    setDraftStage(rejecting.id, 'archived')
    setRejecting(null)
    setReason('')
  }

  return (
    <div className="flex flex-col gap-4.5 px-7 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Output</p>
          <h1 className="text-[26px] font-bold tracking-tight">Drafts your agent wrote</h1>
          <p className="mt-1.5 max-w-[520px] text-[13px] text-body">
            Real posts drafted from your Voice Card and your own saved ideas/resources — nothing here posts itself,
            you approve, edit, or reject each one.
          </p>
        </div>
        <Button variant="primary" onClick={() => void draftForMe()} disabled={generating}>
          <Icon name="pen" className="h-[15px] w-[15px]" />
          {generating ? 'Drafting…' : 'Draft posts for me'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {pending.map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            actions={
              <>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/create/drafts/${draft.id}`)}>
                  Edit
                </Button>
                <Button size="sm" variant="primary" onClick={() => approve(draft)}>
                  Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => setRejecting(draft)}>
                  Reject
                </Button>
              </>
            }
          />
        ))}
        {pending.length === 0 && (
          <DashedPlaceholder className="col-span-3 p-6 text-center">
            Nothing waiting on you — click "Draft posts for me" to generate a few from your own Brain material.
          </DashedPlaceholder>
        )}
      </div>

      <Dialog
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Why isn't this one right?"
        description="This teaches future drafts — be as specific as you can."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReject}>
              Reject draft
            </Button>
          </>
        }
      >
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. too generic, wrong angle, doesn't sound like me…"
          rows={4}
          className="w-full rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
      </Dialog>
    </div>
  )
}
