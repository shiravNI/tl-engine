import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Pill } from '@/components/primitives/Pill'
import { DataTable } from '@/components/primitives/DataTable'
import { Dialog } from '@/components/primitives/Dialog'
import { useContent } from '@/state/ContentContext'
import type { Pillar, Resource } from '@/data/types'

const PILLARS: Pillar[] = ['AI search', 'Org', 'Performance', 'Unbundling', 'Untagged']

function emptyForm() {
  return { url: '', title: '', note: '', pillar: '' as Pillar | '', tags: '' }
}

/** Full, uncapped browse of every saved `Resource` — the higher-friction
 * counterpart to the Newsletter page's low-friction inline quick-add.
 * Co-located with `NewsletterPage.tsx` since Resources lives under
 * Newsletter in the nav, not as its own top-level section. */
export function ResourcesPage() {
  const navigate = useNavigate()
  const { resources, createResource, deleteResource } = useContent()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())

  function submit() {
    const url = form.url.trim()
    if (!url) return
    createResource({
      url,
      title: form.title.trim() || url,
      note: form.note.trim(),
      pillar: form.pillar || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
    setForm(emptyForm())
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-4.5 px-7 py-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Newsletter · Resources
          </p>
          <h1 className="text-[26px] font-bold tracking-tight">Every link you've saved</h1>
          <p className="mt-1.5 text-[13px] text-body">
            A dump of interesting links — draft from any of them, whenever you're ready.
          </p>
        </div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Add resource
        </Button>
      </div>

      <Card className="p-0 pt-4">
        <DataTable<Resource>
          rows={resources}
          rowKey={(r) => r.id}
          columns={[
            {
              key: 'title',
              header: 'Title',
              width: '30%',
              render: (r) => <span className="font-semibold text-ink">{r.title || r.url}</span>,
            },
            {
              key: 'url',
              header: 'URL',
              render: (r) => (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-accent-dark underline decoration-accent-10 underline-offset-2"
                >
                  {r.url}
                </a>
              ),
            },
            {
              key: 'pillar',
              header: 'Pillar',
              render: (r) => (r.pillar ? <Pill tone="accent">{r.pillar}</Pill> : <span className="text-muted">—</span>),
            },
            {
              key: 'tags',
              header: 'Tags',
              render: (r) =>
                r.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {r.tags.map((tag) => (
                      <Pill key={tag}>{tag}</Pill>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted">—</span>
                ),
            },
            {
              key: 'createdAt',
              header: 'Saved',
              render: (r) => new Date(r.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            },
            {
              key: 'actions',
              header: '',
              width: '200px',
              render: (r) => (
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/create/drafts/new?fromResource=${r.id}`)}>
                    Draft from this
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteResource(r.id)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
        />
        {resources.length === 0 && (
          <p className="px-4 pb-5 pt-2 text-[13px] text-muted">
            Nothing saved yet — add a link above, or from the Newsletter page's quick-add.
          </p>
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setForm(emptyForm())
        }}
        title="Add a resource"
        description="Save a link now, draft from it whenever you're ready."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={!form.url.trim()}>
              Save resource
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-body">URL</span>
            <input
              autoFocus
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://…"
              className="rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-body">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Defaults to the URL if left blank"
              className="rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-body">Note</span>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Why this is worth coming back to…"
              rows={2}
              className="resize-none rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          </label>
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[12px] font-semibold text-body">Pillar</span>
              <select
                value={form.pillar}
                onChange={(e) => setForm((f) => ({ ...f, pillar: e.target.value as Pillar | '' }))}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-accent"
              >
                <option value="">Untagged</option>
                {PILLARS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[12px] font-semibold text-body">Tags</span>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="comma, separated"
                className="rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
              />
            </label>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
