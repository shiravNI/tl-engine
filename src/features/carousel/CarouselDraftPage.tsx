import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { useContent } from '@/state/ContentContext'

/** `5c` — Carousel: draft with AI, then edit. This build ships a single
 * seeded deck (the AI-search 5-slide breakdown) rather than a full
 * generation pipeline — tapping a slide hands off to the `5d` editor. */
export function CarouselDraftPage() {
  const navigate = useNavigate()
  const { carouselDecks } = useContent()
  const deck = carouselDecks[0]

  if (!deck) {
    return <div className="p-8 text-[13px] text-muted">No carousel drafted yet.</div>
  }

  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      <div>
        <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
          Create · Carousel
        </p>
        <h1 className="text-[26px] font-bold tracking-tight">{deck.title}</h1>
      </div>
      <div className="flex gap-2">
        <Pill tone="accent" className="bg-accent text-cream">1 · Draft with AI</Pill>
        <Pill>2 · Edit slides</Pill>
        <Pill>3 · Export</Pill>
      </div>
      <div className="flex gap-5">
        <div className="flex max-w-[520px] flex-1 flex-col gap-3.5">
          <p className="text-[13px] text-body">
            Describe the idea, or point it at a source — it drafts a slide-by-slide outline you edit next.
          </p>
          <Card className="flex flex-col gap-2.5 p-4">
            <textarea
              readOnly
              value={deck.prompt}
              className="h-16 resize-none border-none text-[14px] leading-relaxed text-ink outline-none"
            />
            {deck.sourceFileLabel && (
              <div className="flex items-center gap-2 text-muted">
                <Icon name="link" className="h-3.5 w-3.5" />
                <span className="text-[12px]">Pulling from: {deck.sourceFileLabel}</span>
              </div>
            )}
          </Card>
          <Button variant="primary" className="justify-center py-3">
            <Icon name="layers" className="h-[15px] w-[15px]" />
            Draft {deck.slides.length} slides with AI
          </Button>
          <p className="text-[12px] text-muted">
            Prefer a familiar toolkit? <span className="font-semibold text-accent-dark">Connect Canva</span>{' '}
            to open the draft there instead — everything here still saves back to Output.
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Just generated — tap any slide to edit
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
                <p className="text-[12px] font-bold leading-tight">{slide.headline}</p>
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-2">
            <Button variant="secondary">Regenerate all</Button>
            <Button variant="soft" className="ml-auto">
              Save to Output
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
