import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { Checkbox } from '@/components/primitives/Checkbox'
import { Disclosure } from '@/components/primitives/Disclosure'
import { useContent } from '@/state/ContentContext'
import { useChat } from '@/state/ChatContext'
import { seedFromIdea, seedFromInsight, seedFromNewsletter } from '@/lib/composerSeed'
import { insightSnapshot } from '@/data/fixtures/insights'
import { newsletterIssue } from '@/data/fixtures/newsletter'
import { getRoastTier } from '@/lib/roast'
import { cx } from '@/lib/cx'

const CHAR_LIMIT = 3000

export function ComposerPage() {
  const { draftId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { getDraft, createDraft, updateDraft, runRoastCheck, toggleChecklistItem, setDraftStage, getIdea } =
    useContent()
  const { openBubble } = useChat()
  const seededRef = useRef(false)
  const [resolvedId, setResolvedId] = useState<string | undefined>(draftId)

  useEffect(() => {
    if (draftId) {
      setResolvedId(draftId)
      return
    }
    if (seededRef.current) return
    seededRef.current = true

    const fromIdea = searchParams.get('fromIdea')
    const fromInsight = searchParams.get('fromInsight')
    const fromNewsletter = searchParams.get('fromNewsletter')

    let seed
    if (fromIdea) {
      const idea = getIdea(fromIdea)
      if (idea) seed = seedFromIdea(idea)
    } else if (fromInsight) {
      seed = seedFromInsight(insightSnapshot.suggestedMove)
    } else if (fromNewsletter) {
      seed = seedFromNewsletter(newsletterIssue)
    }
    if (!seed) {
      seed = { title: 'Untitled draft', paragraphs: [''], sourceType: undefined, sourceLabel: undefined, sourceIdeaId: undefined, pillar: null }
    }
    const id = createDraft(seed)
    setResolvedId(id)
    navigate(`/create/drafts/${id}`, { replace: true })
  }, [draftId, searchParams, createDraft, getIdea, navigate])

  const draft = resolvedId ? getDraft(resolvedId) : undefined
  const sourceIdea = draft?.sourceIdeaId ? getIdea(draft.sourceIdeaId) : undefined

  const initialContent = useMemo(
    () => (draft ? draft.paragraphs.map((p) => `<p>${p}</p>`).join('') : '<p></p>'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft?.id],
  )

  const editor = useEditor(
    {
      extensions: [StarterKit, CharacterCount.configure({ limit: CHAR_LIMIT })],
      content: initialContent,
      onUpdate: ({ editor }) => {
        if (!resolvedId) return
        const paragraphs = editor.getText({ blockSeparator: '\n\n' }).split('\n\n')
        updateDraft(resolvedId, { paragraphs, title: paragraphs[0]?.slice(0, 120) || draft?.title })
      },
    },
    [draft?.id],
  )

  if (!draft || !editor) {
    return <div className="p-8 text-[13px] text-muted">Loading draft…</div>
  }

  const charCount = editor.storage.characterCount.characters()
  const roastTier = getRoastTier(draft.slopScore)
  const roastTone = roastTier === 'clear' ? 'success' : roastTier === 'flagged' ? 'warn' : 'danger'
  const roastTierLabel = roastTier === 'clear' ? 'Clear' : roastTier === 'flagged' ? 'Flagged' : 'Roasted'

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-3 border-b border-border bg-surface px-6 py-4">
        <span className="text-[12px] font-semibold text-accent-dark">Create</span>
        <Icon name="chev" className="h-3.5 w-3.5 text-faint" />
        <span className="text-[12px] text-muted">Editing draft</span>
        <div className="flex-1" />
        <Pill tone="success">
          <Icon name="check" className="h-3 w-3" /> Autosaved
        </Pill>
        <Button variant="secondary" onClick={openBubble}>
          <Icon name="msg" className="h-3.5 w-3.5" />
          Chat
        </Button>
        <Button variant="secondary">
          <Icon name="flag" className="h-3.5 w-3.5 text-warn-fg" />
          Ask for help
        </Button>
        <Button variant="primary" onClick={() => setDraftStage(draft.id, 'scheduled')} disabled={draft.stage !== 'draft'}>
          <Icon name="send" className="h-3.5 w-3.5" />
          {draft.stage === 'scheduled' ? 'Scheduled' : draft.stage === 'published' ? 'Published' : 'Mark scheduled to post'}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 gap-5 overflow-auto px-7 py-6">
        <div className="flex min-w-0 flex-[1.6] flex-col gap-3.5">
          <Card className="flex min-h-[360px] flex-1 flex-col">
            <div className="flex items-center gap-1.5 border-b border-border-soft px-4 py-2.5">
              <Button size="sm" variant="ghost" className="font-bold" onClick={() => editor.chain().focus().toggleBold().run()}>
                B
              </Button>
              <Button size="sm" variant="ghost" className="italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
                I
              </Button>
              <Button size="sm" variant="ghost" title="Link (not wired in this preview)">
                <Icon name="link" className="h-3.5 w-3.5" />
              </Button>
              <div className="mx-1 h-[18px] w-px bg-border-soft" />
              <span className="text-[12px] text-muted">
                Every line break here is a real paragraph — matches how it'll paste into LinkedIn.
              </span>
              <div className="flex-1" />
              <span className="text-[12px] text-muted">
                {charCount} / {CHAR_LIMIT}
              </span>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4">
              <EditorContent editor={editor} className="tl-editor text-[15px] leading-relaxed text-ink" />
            </div>
          </Card>

          <Card className="flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Image for this post</p>
              <span className="text-[12px] text-muted">1200×627 recommended</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex w-40 flex-none flex-col gap-1.5">
                <div className="relative flex aspect-[1200/627] items-center justify-center rounded-lg border border-dashed border-border bg-oat text-muted-2">
                  <Icon name="video" className="h-5 w-5" />
                  {draft.imageFileName && (
                    <button
                      type="button"
                      className="absolute right-1.5 top-1.5 rounded-md border border-border bg-cream px-[7px] py-[3px] text-[10px] font-semibold leading-none text-ink"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-muted">{draft.imageFileName ?? 'no image yet'}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <p className="text-[13px] text-body">
                  This is exactly what shows in-feed — check it's legible small before you post.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">
                    <Icon name="upload" className="h-3.5 w-3.5" />
                    Replace image
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/create/carousel')}>
                    <Icon name="layers" className="h-3.5 w-3.5" />
                    Use a carousel instead
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {sourceIdea && (
            <Card className="flex items-center gap-2.5 p-3.5">
              <Icon name="bulb" className="h-[15px] w-[15px] text-muted" />
              <p className="flex-1 text-[12px] text-muted">
                Started from Brain idea: <b className="text-body">"{sourceIdea.text}"</b>
              </p>
              <span className="text-[12px] font-semibold text-accent-dark">View source idea</span>
            </Card>
          )}
        </div>

        <div className="flex w-[340px] flex-none flex-col gap-3.5">
          <Card className="flex flex-col gap-3.5 p-4">
            <h3 className="text-[14px] font-semibold">Quality checks</h3>

            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={cx(
                    'text-[22px] font-bold leading-none',
                    roastTone === 'success'
                      ? 'text-success-fg'
                      : roastTone === 'warn'
                        ? 'text-warn-fg'
                        : 'text-danger-fg',
                  )}
                >
                  {draft.slopScore}
                </span>
                <span className="text-[12px] text-muted">/10 slop</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[12px] text-muted">Voice</span>
                <span className="text-[13px] font-bold text-accent-dark">{draft.voiceMatch}%</span>
              </div>
            </div>

            <p className="text-[13px] font-semibold text-body">
              {draft.roastVerdict || 'Not roasted yet — run the check to see how this really reads.'}
            </p>

            <Disclosure label="Show roast details">
              <div className="flex flex-col gap-3.5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-body">Roast</span>
                    <Pill tone={roastTone}>{roastTierLabel}</Pill>
                  </div>
                  {draft.roastFlags.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {draft.roastFlags.map((flag, i) => (
                        <div key={i} className="rounded-lg border border-border-soft bg-oat p-2.5">
                          <p className="text-[12px] italic text-body">"{flag.quote}"</p>
                          <p className="mt-1 text-[12px] text-muted">{flag.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-muted">
                      {draft.roastVerdict
                        ? 'Nothing quoted back at you — no corporate tics found.'
                        : 'Run the roast to see specific lines called out.'}
                    </p>
                  )}
                </div>

                <div className="h-px bg-border-soft" />

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-body">Voice match</span>
                    <span className="text-[12px] font-bold text-accent-dark">{draft.voiceMatch}%</span>
                  </div>
                  <ProgressBar value={draft.voiceMatch} />
                  <p className="mt-1.5 text-[12px] text-muted">
                    Sentence rhythm and directness both read as you. The parenthetical aside is a signature move.
                  </p>
                </div>
              </div>
            </Disclosure>

            <Button variant="secondary" className="justify-center" onClick={() => runRoastCheck(draft.id)}>
              <Icon name="flag" className="h-3.5 w-3.5" />
              Roast this draft
            </Button>
          </Card>

          <Card className="p-4">
            <Disclosure
              label={
                <span className="flex items-center gap-2">
                  <Icon name="core" className="h-[15px] w-[15px] text-accent-dark" />
                  <span className="text-[13px] font-semibold text-ink">Shira's storytelling tips</span>
                </span>
              }
            >
              <div className="flex flex-col gap-2.5 pl-[18px]">
                <p className="text-[13px] text-body">
                  Rant first. Write the raw, angry version before the polished one — that's where the good stuff is.
                </p>
                <p className="text-[13px] text-body">
                  Don't start with "I." Strong verbs, kill adjectives — show the moment, don't label the feeling.
                </p>
                <p className="text-[13px] italic text-body">
                  "The email landed at 11pm. I stared at it. Closed my laptop. Opened it again."
                </p>
                <span className="text-[12px] font-semibold text-accent-dark">See all storytelling tips</span>
              </div>
            </Disclosure>
          </Card>

          <Card className="flex flex-col gap-2 p-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Before you post</p>
            {(
              [
                ['hookEarnsSeeMore', 'Hook earns "See more"'],
                ['noLinksInBody', 'No links in body'],
                ['visualAttached', 'Visual attached'],
                ['hashtagsAdded', '3–5 hashtags added'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5">
                <Checkbox
                  checked={draft.checklist[key]}
                  onCheckedChange={() => toggleChecklistItem(draft.id, key)}
                />
                <span className="text-[13px] text-body">{label}</span>
              </label>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
