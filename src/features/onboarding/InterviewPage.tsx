import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { interviewExchanges, interviewQuestionNumber, voiceCard } from '@/data/fixtures/onboarding'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/primitives/Button'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { Avatar } from '@/components/primitives/Avatar'
import { cx } from '@/lib/cx'

const PHASE_SEGMENTS = ['Identity', 'Goals', 'Voice', 'Opinions & POV', 'Persona', 'Format', 'Sources']

/** `4a` — Deep voice interview, phased with a tappable SAT-round and a
 * live Voice Card built alongside it. The Voice Card's data shape here is
 * exactly what the composer's Voice-match % score consumes later. */
export function InterviewPage() {
  const navigate = useNavigate()
  const [exchangeIndex, setExchangeIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(
    interviewExchanges[0]?.options.find((o) => o.primary)?.id ?? null,
  )

  const exchange = interviewExchanges[exchangeIndex]
  const isLast = exchangeIndex === interviewExchanges.length - 1

  function handleContinue() {
    if (isLast) {
      navigate('/')
      return
    }
    setExchangeIndex((i) => i + 1)
    setSelectedOption(null)
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-[58px] flex-none items-center gap-2.5 border-b border-border bg-surface px-5">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[9px] bg-espresso font-mono text-[11px] font-medium text-cream">
          TL
        </div>
        <span className="text-[13px] font-semibold">TL Engine</span>
        <Pill>First-time setup</Pill>
        <div className="flex-1" />
        <span className="text-[12px] text-muted">~40 min · autosaves as you go</span>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Finish later
        </Button>
      </header>

      <div className="flex-none border-b border-border bg-surface px-10 pt-5">
        <div className="mb-2 flex max-w-[980px] items-center gap-1.5">
          {PHASE_SEGMENTS.map((_, i) => (
            <div key={i} className="h-[5px] flex-1 overflow-hidden rounded-full bg-skeleton">
              <div
                className="h-full bg-accent"
                style={{ width: i < 3 ? '100%' : i === 3 ? '55%' : '0%' }}
              />
            </div>
          ))}
        </div>
        <div className="flex max-w-[980px] justify-between pb-3">
          {PHASE_SEGMENTS.map((label, i) => (
            <span
              key={label}
              className={cx('text-[12px]', i === 3 ? 'font-bold text-ink' : i < 3 ? 'font-semibold text-accent-dark' : 'text-muted')}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex max-w-[700px] flex-1 flex-col gap-5 overflow-auto px-10 py-7">
          <div>
            <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              Opinions &amp; POV · question {interviewQuestionNumber}
            </p>
            <h1 className="text-[25px] font-bold tracking-tight">No overthinking — first gut reaction.</h1>
            <p className="mt-1.5 text-[13px] text-body">Tap one. You can always add nuance right after.</p>
          </div>

          <div className="flex max-w-[600px] flex-col gap-3.5">
            <div className="flex items-start gap-2.5">
              <Avatar initials="TL" size={26} />
              <Card className="rounded-tl-[4px] px-3.5 py-2.5">
                <p className="text-[13px] text-body">{exchange.prompt}</p>
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pl-9">
              {exchange.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={cx(
                    'rounded-lg border px-3 py-3 text-left text-[12.5px] font-semibold leading-tight transition-colors',
                    selectedOption === opt.id
                      ? 'border-accent bg-accent text-cream'
                      : 'border-border bg-surface text-ink hover:bg-bg',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {exchange.followUpPrompt && (
              <div className="mt-1.5 flex items-start gap-2.5">
                <Avatar initials="TL" size={26} />
                <Card className="rounded-tl-[4px] px-3.5 py-2.5">
                  <p className="text-[13px] text-body">{exchange.followUpPrompt}</p>
                </Card>
              </div>
            )}
            {exchange.userReply && (
              <div className="max-w-[80%] self-end rounded-xl rounded-br-[4px] bg-accent px-3.5 py-2.5 text-cream">
                <p className="text-[13px]">{exchange.userReply}</p>
              </div>
            )}
            {exchange.callout && (
              <div className="flex items-start gap-2.5">
                <Avatar initials="TL" size={26} />
                <Card className="rounded-tl-[4px] border-accent-10 bg-accent-soft-bg px-3.5 py-2.5">
                  <p className="text-[13px] text-accent-dark">{exchange.callout}</p>
                </Card>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center gap-3 pt-2.5">
            <Button
              variant="secondary"
              disabled={exchangeIndex === 0}
              onClick={() => setExchangeIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </Button>
            <Button variant="primary" onClick={handleContinue}>
              Continue
              <Icon name="chev" className="h-[15px] w-[15px]" />
            </Button>
            <span className="text-[12px] text-muted">
              {interviewQuestionNumber} — we keep going until your POV is genuinely clear, not until a
              counter hits zero.
            </span>
          </div>
        </div>

        <div className="w-px bg-border-soft" />

        <div className="w-[400px] flex-none overflow-auto p-6">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <Icon name="core" className="h-[18px] w-[18px] text-accent-dark" />
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-accent-dark">
                Building live · Voice Card
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Avatar initials="SH" size={44} />
              <div>
                <div className="text-[14px] font-bold">{voiceCard.userName}</div>
                <p className="text-[12px] text-muted">{voiceCard.roleLabel}</p>
              </div>
            </div>
            <div className="h-px bg-border-soft" />
            <div>
              <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                POV fingerprint <span className="font-normal normal-case tracking-normal">(forming)</span>
              </p>
              <p className="text-[13px] leading-relaxed text-body">{voiceCard.povFingerprint}</p>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                Quotable opinions so far
              </p>
              <div className="flex flex-col gap-2">
                {voiceCard.opinions.map((op) => (
                  <Card
                    key={op.id}
                    className={cx('bg-cream px-2.5 py-2', op.placeholder && 'border-dashed opacity-50')}
                  >
                    <p className={cx('text-[13px] text-body', !op.placeholder && 'italic')}>{op.quote}</p>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                Card completeness
              </p>
              <ProgressBar value={voiceCard.completenessPct} />
              <p className="mt-1.5 text-[12px] text-muted">{voiceCard.completenessNote}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
