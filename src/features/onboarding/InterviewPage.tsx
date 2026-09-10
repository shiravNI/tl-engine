import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ONBOARDING_PHASES, ONBOARDING_QUESTIONS, questionNumberLabel } from '@/data/onboardingCatalog'
import {
  fetchInterviewAnswers,
  upsertInterviewAnswer,
  upsertOnboardingState,
  upsertVoiceCard,
} from '@/data/services/onboardingService'
import { deriveVoiceCard, type InterviewAnswerInput } from '@/lib/voiceCard'
import { useAuth } from '@/state/AuthContext'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/primitives/Button'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { Avatar } from '@/components/primitives/Avatar'
import { cx } from '@/lib/cx'

/** `4a` — Deep voice interview, phased with a tappable SAT-round and a
 * live Voice Card built alongside it. Both the phase progress bar and the
 * questions themselves come from the one shared `onboardingCatalog` (the
 * fix for the pre-migration two-hardcoded-arrays bug). Every answer —
 * selected option and free text — is saved to `interview_answers`, and the
 * Voice Card is a live, deterministic derivation from those saved answers
 * (see `src/lib/voiceCard.ts`), upserted on every "Continue". */
export function InterviewPage() {
  const navigate = useNavigate()
  const { profile, refreshOnboardingState } = useAuth()
  const userId = profile?.userId

  const [loaded, setLoaded] = useState(false)
  const [answers, setAnswers] = useState<Map<string, InterviewAnswerInput>>(new Map())
  const [exchangeIndex, setExchangeIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [freeText, setFreeText] = useState('')
  const [saving, setSaving] = useState(false)

  const question = ONBOARDING_QUESTIONS[exchangeIndex]
  const isLast = exchangeIndex === ONBOARDING_QUESTIONS.length - 1

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchInterviewAnswers(userId).then((existing) => {
      if (cancelled) return
      const map = new Map(existing.map((a) => [a.questionId, a] as const))
      const firstUnanswered = ONBOARDING_QUESTIONS.findIndex((q) => {
        const a = map.get(q.id)
        return !a || (!a.selectedOptionId && !a.freeTextAnswer?.trim())
      })
      setAnswers(map)
      setExchangeIndex(firstUnanswered === -1 ? ONBOARDING_QUESTIONS.length - 1 : firstUnanswered)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!loaded) return
    const existing = answers.get(question.id)
    setSelectedOption(existing?.selectedOptionId ?? question.options.find((o) => o.primary)?.id ?? null)
    setFreeText(existing?.freeTextAnswer ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeIndex, loaded])

  // Live preview: the currently-in-progress answer merged over whatever's
  // already saved, so the Voice Card panel updates as you tap/type — not
  // only after "Continue" persists it.
  const livePreviewAnswers = useMemo<InterviewAnswerInput[]>(() => {
    const merged = new Map(answers)
    merged.set(question.id, {
      questionId: question.id,
      selectedOptionId: selectedOption,
      freeTextAnswer: freeText,
    })
    return Array.from(merged.values())
  }, [answers, question.id, selectedOption, freeText])

  const derivedCard = useMemo(() => deriveVoiceCard(livePreviewAnswers), [livePreviewAnswers])

  async function persistCurrentAnswer(): Promise<Map<string, InterviewAnswerInput>> {
    if (!userId) return answers
    const answer: InterviewAnswerInput = {
      questionId: question.id,
      selectedOptionId: selectedOption,
      freeTextAnswer: freeText.trim() ? freeText.trim() : null,
    }
    await upsertInterviewAnswer(userId, answer)
    const nextAnswers = new Map(answers)
    nextAnswers.set(question.id, answer)
    setAnswers(nextAnswers)

    const card = deriveVoiceCard(Array.from(nextAnswers.values()))
    await upsertVoiceCard(userId, {
      roleLabel: profile?.title ?? '',
      povFingerprint: card.povFingerprint,
      completenessPct: card.completenessPct,
      completenessNote: card.completenessNote,
      opinions: card.opinions,
    })
    return nextAnswers
  }

  async function handleContinue() {
    if (!userId || saving) return
    setSaving(true)
    try {
      await persistCurrentAnswer()
      if (isLast) {
        await upsertOnboardingState(userId, { completedAt: new Date().toISOString() })
        await refreshOnboardingState()
        navigate('/')
        return
      }
      setExchangeIndex((i) => i + 1)
    } finally {
      setSaving(false)
    }
  }

  async function handleFinishLater() {
    if (userId) {
      await persistCurrentAnswer()
      await upsertOnboardingState(userId, { skipped: true })
      await refreshOnboardingState()
    }
    navigate('/')
  }

  if (!loaded) {
    return <div className="p-8 text-[13px] text-muted">Loading your interview…</div>
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
        <Button variant="ghost" onClick={() => void handleFinishLater()}>
          Finish later
        </Button>
      </header>

      <div className="flex-none border-b border-border bg-surface px-10 pt-5">
        <div className="mb-2 flex max-w-[980px] items-center gap-1.5">
          {ONBOARDING_PHASES.map((phase, i) => (
            <div key={phase.id} className="h-[5px] flex-1 overflow-hidden rounded-full bg-skeleton">
              <div
                className="h-full bg-accent"
                style={{ width: i < 3 ? '100%' : i === 3 ? '55%' : '0%' }}
              />
            </div>
          ))}
        </div>
        <div className="flex max-w-[980px] justify-between pb-3">
          {ONBOARDING_PHASES.map((phase, i) => (
            <span
              key={phase.id}
              className={cx('text-[12px]', i === 3 ? 'font-bold text-ink' : i < 3 ? 'font-semibold text-accent-dark' : 'text-muted')}
            >
              {phase.title.length > 18 ? phase.id : phase.title}
            </span>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex max-w-[700px] flex-1 flex-col gap-5 overflow-auto px-10 py-7">
          <div>
            <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              Opinions &amp; POV · question {questionNumberLabel(exchangeIndex)}
            </p>
            <h1 className="text-[25px] font-bold tracking-tight">No overthinking — first gut reaction.</h1>
            <p className="mt-1.5 text-[13px] text-body">Tap one. You can always add nuance right after.</p>
          </div>

          <div className="flex max-w-[600px] flex-col gap-3.5">
            <div className="flex items-start gap-2.5">
              <Avatar initials="TL" size={26} />
              <Card className="rounded-tl-[4px] px-3.5 py-2.5">
                <p className="text-[13px] text-body">{question.prompt}</p>
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pl-9">
              {question.options.map((opt) => (
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

            {question.followUpPrompt && (
              <div className="mt-1.5 flex items-start gap-2.5">
                <Avatar initials="TL" size={26} />
                <Card className="rounded-tl-[4px] px-3.5 py-2.5">
                  <p className="text-[13px] text-body">{question.followUpPrompt}</p>
                </Card>
              </div>
            )}

            <div className="pl-9">
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Say more, in your own words…"
                rows={3}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_4px_var(--tl-accent-10)]"
              />
            </div>
          </div>

          <div className="mt-auto flex items-center gap-3 pt-2.5">
            <Button
              variant="secondary"
              disabled={exchangeIndex === 0 || saving}
              onClick={() => setExchangeIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </Button>
            <Button variant="primary" onClick={() => void handleContinue()} disabled={saving}>
              {saving ? 'Saving…' : isLast ? 'Finish' : 'Continue'}
              <Icon name="chev" className="h-[15px] w-[15px]" />
            </Button>
            <span className="text-[12px] text-muted">
              {questionNumberLabel(exchangeIndex)} — we keep going until your POV is genuinely clear, not
              until a counter hits zero.
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
              <Avatar initials={profile?.initials ?? ''} size={44} />
              <div>
                <div className="text-[14px] font-bold">{profile?.name ?? ''}</div>
                <p className="text-[12px] text-muted">{profile?.title || 'Building your Voice Card'}</p>
              </div>
            </div>
            <div className="h-px bg-border-soft" />
            <div>
              <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                POV fingerprint <span className="font-normal normal-case tracking-normal">(forming)</span>
              </p>
              <p className="text-[13px] leading-relaxed text-body">{derivedCard.povFingerprint}</p>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                Quotable opinions so far
              </p>
              <div className="flex flex-col gap-2">
                {derivedCard.opinions.map((op) => (
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
              <ProgressBar value={derivedCard.completenessPct} />
              <p className="mt-1.5 text-[12px] text-muted">{derivedCard.completenessNote}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
