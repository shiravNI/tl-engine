import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { useContent } from '@/state/ContentContext'
import { cx } from '@/lib/cx'

interface RefineMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const REFINE_PRESETS: Record<string, string> = {
  'Make punchier': '340% more traffic from AI, since January.',
  'Shorten text': 'AI traffic is up 340%.',
}

export function CarouselEditorPage() {
  const { deckId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { carouselDecks, updateCarouselSlide } = useContent()
  const deck = carouselDecks.find((d) => d.id === deckId)
  const initialSlideId = searchParams.get('slide') ?? deck?.slides[0]?.id
  const [selectedSlideId, setSelectedSlideId] = useState(initialSlideId)
  const [refineInput, setRefineInput] = useState('')
  const [messages, setMessages] = useState<RefineMessage[]>([])

  const slide = useMemo(() => deck?.slides.find((s) => s.id === selectedSlideId), [deck, selectedSlideId])

  if (!deck || !slide) {
    return <div className="p-8 text-[13px] text-muted">Slide not found.</div>
  }

  function applyRefine(instruction: string) {
    const preset = REFINE_PRESETS[instruction]
    setMessages((prev) => [
      ...prev,
      { id: `${prev.length}_u`, role: 'user', text: instruction },
      {
        id: `${prev.length}_a`,
        role: 'assistant',
        text: preset
          ? `Tightened it to "${preset}" Applied to the slide — undo if it's not it.`
          : 'Applied that to the slide.',
      },
    ])
    if (preset) updateCarouselSlide(deck!.id, slide!.id, { headline: preset })
    setRefineInput('')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-3 border-b border-border bg-surface px-6 py-3">
        <button className="text-[12px] font-semibold text-accent-dark" onClick={() => navigate('/create/carousel')}>
          ← Back to deck
        </button>
        <div className="flex-1" />
        <Pill tone="success">
          <Icon name="check" className="h-3 w-3" /> Autosaved
        </Pill>
        <Button variant="primary">Save to Output</Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-24 flex-none flex-col gap-2 overflow-auto border-r border-border bg-surface p-2.5">
          {deck.slides.map((s) => (
            <button key={s.id} onClick={() => setSelectedSlideId(s.id)} className="flex flex-col items-center gap-1">
              <span className={cx('text-[12px]', s.id === slide.id ? 'font-semibold text-accent-dark' : 'text-muted')}>
                {s.index}
              </span>
              <div
                className={cx(
                  'aspect-[4/5] w-full rounded-md border bg-oat',
                  s.id === slide.id ? 'border-2 border-accent' : 'border-[1.5px] border-border',
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-center bg-sand/40 p-8">
          <div className="relative flex w-[340px] flex-col gap-3.5 rounded-2xl bg-oat p-7 shadow-soft">
            <span className="text-[12px] text-warn-fg">{slide.label}</span>
            {slide.hasChart && (
              <div className="flex h-[120px] items-center justify-center rounded-lg border border-clay text-[11px] text-muted-2">
                chart — click to swap
              </div>
            )}
            <p className="text-[20px] font-bold leading-tight">{slide.headline}</p>
            <div className="pointer-events-none absolute -inset-[3px] rounded-[18px] border-2 border-dashed border-accent" />
          </div>
        </div>

        <div className="flex w-[340px] flex-none flex-col border-l border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border-soft px-4.5 py-4">
            <Icon name="spark" className="h-4 w-4 text-accent-dark" />
            <h3 className="text-[14px] font-semibold">Refine with AI</h3>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-auto px-4.5 py-4">
            <div className="flex flex-wrap gap-1.5">
              {['Make punchier', 'Shorten text', 'Swap the chart', 'More contrast', 'Match brand tone'].map((p) => (
                <button key={p} onClick={() => applyRefine(p)}>
                  <Pill>{p}</Pill>
                </button>
              ))}
            </div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={cx(
                  'max-w-[88%] rounded-xl px-3 py-2.5 text-[13px]',
                  m.role === 'user' ? 'self-end bg-accent text-cream' : 'self-start bg-bg text-body',
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-border-soft px-4.5 py-3.5">
            <input
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && refineInput.trim() && applyRefine(refineInput.trim())}
              placeholder="Tell it what to change…"
              className="h-10 flex-1 rounded-lg border border-border px-3 text-[13px] outline-none focus:border-accent"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => refineInput.trim() && applyRefine(refineInput.trim())}
            >
              <Icon name="send" className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
