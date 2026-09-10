import { describe, expect, it } from 'vitest'
import { deriveVoiceCard, type InterviewAnswerInput } from '@/lib/voiceCard'
import type { OnboardingQuestion } from '@/data/onboardingCatalog'

const QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'q1',
    phaseId: 'opinions',
    prompt: 'AI in performance marketing is going to —',
    options: [
      { id: 'a', label: 'Replace most entry-level work' },
      { id: 'b', label: 'Make good people great, bad people dangerous' },
    ],
  },
  {
    id: 'q2',
    phaseId: 'opinions',
    prompt: 'The most overrated thing in performance marketing right now is —',
    options: [
      { id: 'a', label: 'Attribution modeling' },
      { id: 'b', label: '"Full-funnel" as a buzzword' },
    ],
  },
]

describe('deriveVoiceCard', () => {
  it('reports 0% completeness and a placeholder opinion with no answers at all', () => {
    const card = deriveVoiceCard([], QUESTIONS)
    expect(card.completenessPct).toBe(0)
    expect(card.opinions).toEqual([{ id: 'op_placeholder', quote: 'Next opinion lands here…', placeholder: true }])
    expect(card.povFingerprint).toMatch(/still forming/i)
  })

  it('counts a question as answered by either a selected option or free text, not double-counted', () => {
    const answers: InterviewAnswerInput[] = [
      { questionId: 'q1', selectedOptionId: 'b', freeTextAnswer: null },
    ]
    const card = deriveVoiceCard(answers, QUESTIONS)
    expect(card.completenessPct).toBe(50) // 1 of 2 questions
  })

  it('reaches 100% completeness once every question has an answer', () => {
    const answers: InterviewAnswerInput[] = [
      { questionId: 'q1', selectedOptionId: 'b', freeTextAnswer: null },
      { questionId: 'q2', selectedOptionId: null, freeTextAnswer: 'Attribution modeling gets too much credit.' },
    ]
    const card = deriveVoiceCard(answers, QUESTIONS)
    expect(card.completenessPct).toBe(100)
    expect(card.completenessNote).toMatch(/complete/i)
  })

  it('ignores a whitespace-only free-text answer as not actually answered', () => {
    const answers: InterviewAnswerInput[] = [{ questionId: 'q1', selectedOptionId: null, freeTextAnswer: '   ' }]
    const card = deriveVoiceCard(answers, QUESTIONS)
    expect(card.completenessPct).toBe(0)
  })

  it('turns free-text answers into quoted, truncated opinions', () => {
    const longText = 'x'.repeat(200)
    const answers: InterviewAnswerInput[] = [
      { questionId: 'q1', selectedOptionId: 'b', freeTextAnswer: 'Same tool, opposite outcomes.' },
      { questionId: 'q2', selectedOptionId: null, freeTextAnswer: longText },
    ]
    const card = deriveVoiceCard(answers, QUESTIONS)
    expect(card.opinions).toHaveLength(2)
    expect(card.opinions[0]).toEqual({ id: 'op_q1', quote: '"Same tool, opposite outcomes."' })
    // Long free text is truncated with an ellipsis, not reproduced in full.
    expect(card.opinions[1].quote.length).toBeLessThan(longText.length)
    expect(card.opinions[1].quote.endsWith('…"')).toBe(true)
    expect(card.opinions.some((op) => op.placeholder)).toBe(false)
  })

  it('builds the POV fingerprint from selected option labels, in answer order', () => {
    const answers: InterviewAnswerInput[] = [
      { questionId: 'q1', selectedOptionId: 'b', freeTextAnswer: null },
      { questionId: 'q2', selectedOptionId: 'b', freeTextAnswer: null },
    ]
    const card = deriveVoiceCard(answers, QUESTIONS)
    expect(card.povFingerprint).toContain('Make good people great, bad people dangerous')
    expect(card.povFingerprint).toContain('"Full-funnel" as a buzzword')
  })

  it('is deterministic — the same answers always produce the same card', () => {
    const answers: InterviewAnswerInput[] = [
      { questionId: 'q1', selectedOptionId: 'a', freeTextAnswer: 'Some free text.' },
    ]
    const first = deriveVoiceCard(answers, QUESTIONS)
    const second = deriveVoiceCard(answers, QUESTIONS)
    expect(second).toEqual(first)
  })
})
