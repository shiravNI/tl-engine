// The ONE shared phase/question catalog for onboarding — titles, prompts,
// options. Both `OnboardingMapPage` (the phase overview) and
// `InterviewPage` (the live interview) read this single source, which is
// what fixes the pre-migration bug where each page hardcoded its own
// independent 7-phase list that could silently drift out of sync.
//
// Only the "Opinions & POV" phase has real interactive questions in this
// build (matching what existed before migration) — the other six phases
// are described here for the map/progress UI, but aren't yet backed by
// their own question sets. Adding a phase's real questions later is a
// data change to `ONBOARDING_QUESTIONS` below, not a restructuring of
// either page.

export interface OnboardingPhaseDef {
  id: string
  index: number
  title: string
  description: string
  estimate: string
}

export const ONBOARDING_PHASES: OnboardingPhaseDef[] = [
  { id: 'identity', index: 1, title: 'Who you are', description: "Role, expertise, what you're actually known for", estimate: '~5 min' },
  { id: 'goals', index: 2, title: "Why you're doing this", description: 'Real goal, dream outcome — not just "build my brand"', estimate: '~4 min' },
  { id: 'voice', index: 3, title: 'How you actually sound', description: 'Tone, what you never want to sound like, real writing samples', estimate: '~6 min' },
  { id: 'opinions', index: 4, title: 'Opinions & POV — the SAT round', description: "Tappable questions on AI, your industry, ambition. No fixed number — we go until it's clear.", estimate: '~15 min' },
  { id: 'persona', index: 5, title: 'Your persona fit', description: 'Practitioner, Contrarian, Storyteller, Educator, Connector, Visionary, Builder', estimate: '~3 min' },
  { id: 'format', index: 6, title: 'Format preferences', description: 'Rapid-fire taps — length, emojis, structure, CTAs', estimate: '~3 min' },
  { id: 'sources', index: 7, title: 'Sources & wrap-up', description: 'What you read, then review your finished Voice Card', estimate: '~4 min' },
]

/** The phase every real, tappable question in this build belongs to. */
export const INTERACTIVE_PHASE_ID = 'opinions'

export interface OnboardingQuestionOption {
  id: string
  label: string
  primary?: boolean
}

export interface OnboardingQuestion {
  id: string
  phaseId: string
  prompt: string
  options: OnboardingQuestionOption[]
  followUpPrompt?: string
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'q1',
    phaseId: INTERACTIVE_PHASE_ID,
    prompt: 'AI in performance marketing is going to —',
    options: [
      { id: 'a', label: 'Replace most entry-level work' },
      { id: 'b', label: 'Make good people great, bad people dangerous', primary: true },
      { id: 'c', label: 'Be a fad in this space' },
      { id: 'd', label: 'Change what "expertise" even means' },
    ],
    followUpPrompt: 'Say more? What have you seen that made you pick that one?',
  },
  {
    id: 'q2',
    phaseId: INTERACTIVE_PHASE_ID,
    prompt: 'The most overrated thing in performance marketing right now is —',
    options: [
      { id: 'a', label: 'Attribution modeling' },
      { id: 'b', label: 'Creator partnerships' },
      { id: 'c', label: '"Full-funnel" as a buzzword' },
      { id: 'd', label: 'Real-time optimization' },
    ],
    followUpPrompt: 'Say more? What made you pick that one?',
  },
]

export function questionNumberLabel(index: number): string {
  return `${index + 1} of ~${ONBOARDING_QUESTIONS.length}`
}
