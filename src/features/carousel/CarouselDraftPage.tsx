import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { useContent } from '@/state/ContentContext'

/** `5c` — Carousel: create a deck (real persistence, a real starter-slide
 * scaffold — cover/data/data/data/cta), then edit each slide. "Create
 * slides" is honest manual persistence, not real AI generation: no slide
 * *content* is invented, only the empty scaffold the user fills in via the
 * `5d` editor. */
export function CarouselDraftPage() {
  const navigate = useNavigate()
  const { carouselDecks, createCarouselDeck } = useContent()
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    if (!selectedDeckId && carouselDecks.length > 0) setSelectedDeckId(carouselDecks[0].id)
  }, [carouselDecks, selectedDeckId])

  const deck = carouselDecks.find((d) => d.id === selectedDeckId) ?? carouselDecks[0]

  function handleCreate() {
    if (!title.trim()) return
    const id = createCarouselDeck({ title: title.trim(), prompt: prompt.trim() })
    setSelectedDeckId(id)
    setCreating(false)
    setTitle('')
    setPrompt('')
  }

  if (!deck || creating) {
    return (
      <div className="flex flex-col gap-5 px-7 py-6">
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Create · Carousel
          </p>
          <h1 className="text-[26px] font-bold tracking-tight">New carousel</h1>
        </div>
        <Card className="flex max-w-[480px] flex-col gap-3 p-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Deck title…"
            className="rounded-lg border border-border px-3 py-2 text-[14px] outline-none focus:border-accent"
          />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the idea, or point it at a source…"
            className="h-20 resize-none rounded-lg border border-border px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1 justify-center py-2.5" onClick={handleCreate} disabled={!title.trim()}>
              <Icon name="layers" className="h-[15px] w-[15px]" />
              Create slides
            </Button>
            {deck && (
              <Button variant="secondary" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            )}
          </div>
        </Card>
        {!deck && (
          <p className="max-w-[480px] text-[12px] text-muted">
            This produces a real starting scaffold — a cover slide, three data slides, and a closing CTA — that you
            edit next. No AI generation happens here.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Create · Carousel
          </p>
          <h1 className="text-[26px] font-bold tracking-tight">{deck.title}</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
          <Icon name="plus" className="h-3.5 w-3.5" />
          New deck
        </Button>
      </div>
      {carouselDecks.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {carouselDecks.map((d) => (
            <button key={d.id} onClick={() => setSelectedDeckId(d.id)}>
              <Pill tone={d.id === deck.id ? 'accent' : 'neutral'}>{d.title}</Pill>
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Pill tone="accent" className="bg-accent text-cream">1 · Slides created</Pill>
        <Pill>2 · Edit slides</Pill>
        <Pill>3 · Export</Pill>
      </div>
      <div className="flex gap-5">
        <div className="flex max-w-[520px] flex-1 flex-col gap-3.5">
          <p className="text-[13px] text-body">
            Tap any slide to edit its headline and chart — nothing here was generated for you, this is the real
            scaffold you fill in.
          </p>
          <Card className="flex flex-col gap-2.5 p-4">
            <textarea
              readOnly
              value={deck.prompt || 'No prompt saved for this deck.'}
              className="h-16 resize-none border-none text-[14px] leading-relaxed text-ink outline-none"
            />
            {deck.sourceFileLabel && (
              <div className="flex items-center gap-2 text-muted">
                <Icon name="link" className="h-3.5 w-3.5" />
                <span className="text-[12px]">Pulling from: {deck.sourceFileLabel}</span>
              </div>
            )}
          </Card>
          <p className="text-[12px] text-muted">
            Prefer a familiar toolkit? <span className="font-semibold text-accent-dark">Connect Canva</span>{' '}
            to open the draft there instead — everything here still saves back to Output.
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Tap any slide to edit
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {deck.slides.map((slide) => (
              <button
                key={slide.id}
                onClick={() => navigate(`/create/carousel/${deck.id}?slide=${slide.id}`)}
                className="flex aspect-[4/5] flex-col justify-center gap-1.5 rounded-lg border border-sand bg-oat p-3 text-left"
              >
                <span className="text-[12px] text-warn-fg">{slide.label}</span>
                {slide.hasChart && (
                  <div className="flex h-[34px] items-center justify-center rounded-md border border-dashed border-border text-[9px] text-muted-2">
                    chart
                  </div>
                )}
                <p className="text-[12px] font-bold leading-tight">{slide.headline || 'Untitled slide'}</p>
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-2">
            <Button variant="soft" className="ml-auto">
              Save to Output
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
