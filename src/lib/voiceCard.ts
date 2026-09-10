import { ONBOARDING_QUESTIONS, type OnboardingQuestion } from '@/data/onboardingCatalog'
import type { VoiceCardOpinion } from '@/data/types'

/** One saved interview answer, in the shape both the DB row and the
 * in-progress interview UI state share (camelCase either way — the
 * row<->camelCase mapping happens in onboardingService.ts, not here). */
export interface InterviewAnswerInput {
  questionId: string
  selectedOptionId: string | null
  freeTextAnswer: string | null
}

export interface DerivedVoiceCard {
  completenessPct: number
  completenessNote: string
  povFingerprint: string
  opinions: VoiceCardOpinion[]
}

const SNIPPET_MAX_LEN = 90

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}…` : text
}

/**
 * A simple, deterministic template — no ML — that turns saved interview
 * answers into the Voice Card's live-updating shape. Runs the same way on
 * the client and would run the same way anywhere else: same answers in,
 * same card out.
 */
export function deriveVoiceCard(
  answers: InterviewAnswerInput[],
  questions: OnboardingQuestion[] = ONBOARDING_QUESTIONS,
): DerivedVoiceCard {
  const totalQuestions = questions.length
  const answeredQuestionIds = new Set(
    answers
      .filter((a) => Boolean(a.selectedOptionId) || Boolean(a.freeTextAnswer?.trim()))
      .map((a) => a.questionId),
  )
  const completenessPct =
    totalQuestions === 0 ? 0 : Math.round((answeredQuestionIds.size / totalQuestions) * 100)

  const opinions: VoiceCardOpinion[] = answers
    .filter((a) => Boolean(a.freeTextAnswer?.trim()))
    .map((a) => ({
      id: `op_${a.questionId}`,
      quote: `"${truncate(a.freeTextAnswer!.trim(), SNIPPET_MAX_LEN)}"`,
    }))

  if (opinions.length === 0) {
    opinions.push({ id: 'op_placeholder', quote: 'Next opinion lands here…', placeholder: true })
  }

  const picks = answers
    .map((a) => {
      const question = questions.find((q) => q.id === a.questionId)
      const option = question?.options.find((o) => o.id === a.selectedOptionId)
      return option?.label
    })
    .filter((label): label is string => Boolean(label))

  const povFingerprint =
    picks.length === 0
      ? 'Still forming — answer a few more questions to build a POV fingerprint.'
      : `Leans toward: ${picks.join('. Also leans toward: ')}.`

  const completenessNote =
    completenessPct >= 100
      ? `${completenessPct}% — Opinions & POV round complete.`
      : `${completenessPct}% — Opinions & POV is where most of the substance comes from. Worth the time.`

  return { completenessPct, completenessNote, povFingerprint, opinions }
}
