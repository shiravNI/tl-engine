import { useEffect, useReducer, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { Checkbox } from '@/components/primitives/Checkbox'
import { DataTable } from '@/components/primitives/DataTable'
import { Dialog } from '@/components/primitives/Dialog'
import { fetchArchiveEntries } from '@/data/services/archiveService'
import { useContent } from '@/state/ContentContext'
import { selectionReducer, summarizeSelection } from '@/features/archive/archiveSelection'
import { cx } from '@/lib/cx'
import type { ArchiveEntry, ArchiveItemType } from '@/data/types'

type Filter = 'all' | ArchiveItemType

/** `6c` — Archive: items move here automatically after a month. Plus
 * (net-new, no wireframe ref) row checkboxes -> a contextual bulk-action
 * toolbar -> "Restore N" / "Delete N permanently" behind a confirmation
 * dialog naming exact items. */
export function ArchivePage() {
  const { restoreIdea, restoreDraft, deleteArchivedIdea, deleteArchivedDraft, deleteArchivedPost } = useContent()
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, dispatchSelection] = useReducer(selectionReducer, [])
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    fetchArchiveEntries().then(setEntries)
  }, [])

  const filtered = entries.filter((e) => filter === 'all' || e.type === filter)
  const counts = {
    idea: entries.filter((e) => e.type === 'idea').length,
    draft: entries.filter((e) => e.type === 'draft').length,
    post: entries.filter((e) => e.type === 'post').length,
  }
  const summary = summarizeSelection(entries, selected)

  function restoreOne(entry: ArchiveEntry) {
    if (entry.type === 'idea') restoreIdea(entry.refId)
    if (entry.type === 'draft') restoreDraft(entry.refId)
    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    dispatchSelection({ type: 'TOGGLE', id: entry.id })
  }

  function restoreSelected() {
    for (const entry of entries.filter((e) => selected.includes(e.id))) {
      if (entry.type === 'idea') restoreIdea(entry.refId)
      if (entry.type === 'draft') restoreDraft(entry.refId)
    }
    setEntries((prev) => prev.filter((e) => !selected.includes(e.id) || e.type === 'post'))
    dispatchSelection({ type: 'CLEAR' })
  }

  function deleteSelected() {
    for (const entry of entries.filter((e) => selected.includes(e.id))) {
      if (entry.type === 'idea') deleteArchivedIdea(entry.refId)
      if (entry.type === 'draft') deleteArchivedDraft(entry.refId)
      if (entry.type === 'post') deleteArchivedPost(entry.refId)
    }
    setEntries((prev) => prev.filter((e) => !selected.includes(e.id)))
    dispatchSelection({ type: 'CLEAR' })
    setConfirmOpen(false)
  }

  return (
    <div className="flex flex-col gap-4.5 px-7 py-6">
      <div>
        <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Archive</p>
        <h1 className="text-[26px] font-bold tracking-tight">Untouched for 30+ days — kept, not deleted</h1>
        <p className="mt-1.5 text-[13px] text-body">
          Ideas that went stale and drafts that stalled move here automatically. Bring anything back with one
          click.
        </p>
      </div>

      <div className="flex gap-2">
        {(
          [
            ['all', 'All'],
            ['idea', `Ideas · ${counts.idea}`],
            ['draft', `Drafts · ${counts.draft}`],
            ['post', `Posts · ${counts.post}`],
          ] as const
        ).map(([value, label]) => (
          <button key={value} onClick={() => setFilter(value)} className="rounded-full transition-opacity hover:opacity-80">
            <Pill tone={filter === value ? 'accent' : 'neutral'}>{label}</Pill>
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <Card className="flex items-center gap-3 border-accent-10 bg-accent-soft-bg p-3">
          <span className="text-[13px] font-semibold text-accent-dark">{selected.length} selected</span>
          <div className="flex-1" />
          {summary.restorableCount > 0 && (
            <Button size="sm" variant="secondary" onClick={restoreSelected}>
              Restore {summary.restorableCount}
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>
            Delete {summary.deletableCount} permanently
          </Button>
        </Card>
      )}

      <Card className="p-0 pt-4">
        <DataTable
          rows={filtered}
          rowKey={(e) => e.id}
          leadingHeader={
            <Checkbox
              checked={filtered.length > 0 && filtered.every((e) => selected.includes(e.id))}
              onCheckedChange={() => dispatchSelection({ type: 'SELECT_ALL', ids: filtered.map((e) => e.id) })}
              aria-label="Select all"
            />
          }
          leading={(e) => (
            <Checkbox
              checked={selected.includes(e.id)}
              onCheckedChange={() => dispatchSelection({ type: 'TOGGLE', id: e.id })}
              aria-label={`Select ${e.title}`}
            />
          )}
          columns={[
            { key: 'title', header: 'Item', width: '40%', render: (e) => <span className="font-semibold text-ink">{e.title}</span> },
            {
              key: 'type',
              header: 'Type',
              render: (e) => (
                <Pill tone={e.type === 'draft' ? 'accent' : e.type === 'post' ? 'success' : 'neutral'}>
                  {e.type === 'idea' ? 'Idea' : e.type === 'draft' ? 'Draft' : 'Post'}
                </Pill>
              ),
            },
            { key: 'lastTouched', header: 'Last touched', render: (e) => e.lastTouched },
            { key: 'reason', header: "Why it's here", render: (e) => <span className="text-muted">{e.reason}</span> },
            {
              key: 'action',
              header: '',
              width: '100px',
              render: (e) =>
                e.type === 'post' ? (
                  <Button size="sm" variant="secondary">View data</Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => restoreOne(e)}>Restore</Button>
                ),
            },
          ]}
        />
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-[12px] text-muted">Showing {filtered.length} of {entries.length}</span>
          <span className={cx('text-[12px] font-semibold text-accent-dark', filtered.length === entries.length && 'invisible')}>
            Show all
          </span>
        </div>
      </Card>

      <p className="text-[12px] text-muted">
        Auto-archive timing: <b className="text-body">30 days</b> for ideas/drafts with no activity,{' '}
        <b className="text-body">60 days</b> for published posts. <span className="font-semibold text-accent-dark">Change this</span>
      </p>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${summary.deletableCount} item${summary.deletableCount === 1 ? '' : 's'} permanently?`}
        description={`This removes ${summary.deletableTitles.map((t) => `"${t}"`).join(', ')} for good — it can't be undone.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={deleteSelected}>Delete permanently</Button>
          </>
        }
      />
    </div>
  )
}
