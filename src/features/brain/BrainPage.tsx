import { useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { Dialog } from '@/components/primitives/Dialog'
import { DashedPlaceholder } from '@/components/primitives/DashedPlaceholder'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/primitives/Tabs'
import { useContent } from '@/state/ContentContext'
import type { BrainMaterial, BrainMaterialKind } from '@/data/types'

const KIND_LABEL: Record<BrainMaterialKind, string> = {
  own_post: 'Your own posts',
  admired_post: 'Posts you like',
  reference_doc: 'Reference docs',
}

const KIND_HINT: Record<BrainMaterialKind, string> = {
  own_post: "Already-published posts of yours — the more real writing, the better the voice mining.",
  admired_post: "Posts from other people you admire or wish you'd written.",
  reference_doc: 'Project briefs, notes, or anything else worth having as context.',
}

type AddMode = 'text' | 'file' | 'link'

function emptyForm(kind: BrainMaterialKind) {
  return { kind, mode: 'text' as AddMode, title: '', textContent: '', sourceUrl: '', file: null as File | null }
}

function MaterialCard({ material, onDelete }: { material: BrainMaterial; onDelete: () => void }) {
  return (
    <Card className="flex flex-col gap-2 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[13.5px] font-semibold leading-tight">{material.title}</p>
        <button onClick={onDelete} className="flex-none text-muted hover:text-danger" aria-label="Delete">
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      </div>
      {material.textContent && (
        <p className="line-clamp-3 text-[12px] text-muted">{material.textContent}</p>
      )}
      {material.fileName && (
        <Pill className="w-fit">
          <Icon name="folder" className="h-3 w-3" /> {material.fileName}
        </Pill>
      )}
      {material.sourceUrl && (
        <a
          href={material.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="truncate text-[12px] text-accent-dark underline decoration-accent-10 underline-offset-2"
        >
          {material.sourceUrl}
        </a>
      )}
    </Card>
  )
}

/** Reference material the cast member feeds in — not a bucket view of
 * ideas/drafts (those already live on the Create dashboard, linked from its
 * own "Ideas & drafts" sub-nav row). This is upload/paste-in context: their
 * own past posts, posts they admire, and project/reference docs — the raw
 * material the Voice Card and, later, the AI drafting agent draw on. */
export function BrainPage() {
  const { brainMaterials, createBrainMaterialFromText, createBrainMaterialFromFile, addBrainMaterialLink, deleteBrainMaterial } =
    useContent()
  const [activeKind, setActiveKind] = useState<BrainMaterialKind>('own_post')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm('own_post'))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const byKind = (kind: BrainMaterialKind) => brainMaterials.filter((m) => m.kind === kind)

  function openAddDialog(kind: BrainMaterialKind) {
    setForm(emptyForm(kind))
    setError(null)
    setDialogOpen(true)
  }

  async function submit() {
    const title = form.title.trim()
    if (!title) {
      setError('Give it a title.')
      return
    }
    setError(null)
    try {
      if (form.mode === 'text') {
        if (!form.textContent.trim()) {
          setError('Paste the text.')
          return
        }
        createBrainMaterialFromText({ kind: form.kind, title, textContent: form.textContent.trim() })
      } else if (form.mode === 'link') {
        if (!form.sourceUrl.trim()) {
          setError('Add a link.')
          return
        }
        addBrainMaterialLink({ kind: form.kind, title, sourceUrl: form.sourceUrl.trim() })
      } else {
        if (!form.file) {
          setError('Choose a file.')
          return
        }
        setSaving(true)
        await createBrainMaterialFromFile(form.file, { kind: form.kind, title })
      }
      setDialogOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4.5 px-7 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Brain</p>
          <h1 className="text-[26px] font-bold tracking-tight">What feeds your voice and your drafts</h1>
          <p className="mt-1.5 max-w-[520px] text-[13px] text-body">
            Upload posts you've already published, posts you admire, or project docs — this is the context the Voice
            Card and drafting agent actually draw on, not a to-do list.
          </p>
        </div>
        <Button variant="primary" onClick={() => openAddDialog(activeKind)}>
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Add material
        </Button>
      </div>

      <TabsRoot value={activeKind} onValueChange={(v) => setActiveKind(v as BrainMaterialKind)}>
        <TabsList className="border-b border-border-soft">
          {(Object.keys(KIND_LABEL) as BrainMaterialKind[]).map((kind) => (
            <TabsTrigger key={kind} value={kind} className="flex items-center gap-2">
              {KIND_LABEL[kind]}
              <Pill>{byKind(kind).length}</Pill>
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(KIND_LABEL) as BrainMaterialKind[]).map((kind) => (
          <TabsContent key={kind} value={kind} className="mt-4 flex flex-col gap-3">
            <p className="text-[12px] text-muted">{KIND_HINT[kind]}</p>
            <div className="grid grid-cols-3 gap-3">
              {byKind(kind).map((material) => (
                <MaterialCard key={material.id} material={material} onDelete={() => deleteBrainMaterial(material.id)} />
              ))}
              {byKind(kind).length === 0 && (
                <DashedPlaceholder className="col-span-3 p-6 text-center">
                  Nothing here yet — add {KIND_LABEL[kind].toLowerCase()}.
                </DashedPlaceholder>
              )}
            </div>
          </TabsContent>
        ))}
      </TabsRoot>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Add material"
        description="Paste text, upload a file, or link out — whichever's easiest."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void submit()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-body">Category</span>
            <select
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as BrainMaterialKind }))}
              className="rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
            >
              {(Object.keys(KIND_LABEL) as BrainMaterialKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABEL[kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-body">Title</span>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="A short label for this"
              className="rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          </label>

          <div className="flex gap-1 rounded-lg bg-chip p-1">
            {(['text', 'file', 'link'] as AddMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setForm((f) => ({ ...f, mode }))}
                className={
                  'flex-1 rounded-md px-2 py-1.5 text-[12px] font-semibold ' +
                  (form.mode === mode ? 'bg-surface shadow-soft' : 'text-muted')
                }
              >
                {mode === 'text' ? 'Paste text' : mode === 'file' ? 'Upload file' : 'Link'}
              </button>
            ))}
          </div>

          {form.mode === 'text' && (
            <textarea
              value={form.textContent}
              onChange={(e) => setForm((f) => ({ ...f, textContent: e.target.value }))}
              placeholder="Paste the post or notes here…"
              rows={6}
              className="rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          )}
          {form.mode === 'file' && (
            <input
              type="file"
              accept=".txt,.md"
              onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
              className="text-[13px]"
            />
          )}
          {form.mode === 'link' && (
            <input
              value={form.sourceUrl}
              onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
              placeholder="https://…"
              className="rounded-lg border border-border px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          )}

          {error && <p className="text-[12px] text-danger">{error}</p>}
        </div>
      </Dialog>
    </div>
  )
}
