import type { OnboardingPhase, VoiceCard } from '@/data/types'

export const onboardingPhases: OnboardingPhase[] = [
  { id: 'identity', index: 1, title: 'Who you are', description: "Role, expertise, what you're actually known for", estimate: '~5 min', status: 'done' },
  { id: 'goals', index: 2, title: "Why you're doing this", description: 'Real goal, dream outcome — not just "build my brand"', estimate: '~4 min', status: 'done' },
  { id: 'voice', index: 3, title: 'How you actually sound', description: 'Tone, what you never want to sound like, real writing samples', estimate: '~6 min', status: 'done' },
  { id: 'opinions', index: 4, title: 'Opinions & POV — the SAT round', description: "Tappable questions on AI, your industry, ambition. No fixed number — we go until it's clear.", estimate: '~15 min', status: 'active' },
  { id: 'persona', index: 5, title: 'Your persona fit', description: 'Practitioner, Contrarian, Storyteller, Educator, Connector, Visionary, Builder', estimate: '~3 min', status: 'upcoming' },
  { id: 'format', index: 6, title: 'Format preferences', description: 'Rapid-fire taps — length, emojis, structure, CTAs', estimate: '~3 min', status: 'upcoming' },
  { id: 'sources', index: 7, title: 'Sources & wrap-up', description: 'What you read, then review your finished Voice Card', estimate: '~4 min', status: 'upcoming' },
]

export interface InterviewOption {
  id: string
  label: string
  primary?: boolean
}

export interface InterviewExchange {
  id: string
  prompt: string
  options: InterviewOption[]
  followUpPrompt?: string
  userReply?: string
  callout?: string
}

export const interviewQuestionNumber = '6 of ~14'

export const interviewExchanges: InterviewExchange[] = [
  {
    id: 'q1',
    prompt: 'AI in performance marketing is going to —',
    options: [
      { id: 'a', label: 'Replace most entry-level work' },
      { id: 'b', label: 'Make good people great, bad people dangerous', primary: true },
      { id: 'c', label: 'Be a fad in this space' },
      { id: 'd', label: 'Change what "expertise" even means' },
    ],
    followUpPrompt: 'Say more? What have you seen that made you pick that one?',
    userReply:
      "Watched a junior analyst use it to skip straight to the insight a senior person would've taken a day to find. Also watched someone use it to publish nonsense with total confidence. Same tool.",
    callout: 'That\'s a post. "Same tool, opposite outcomes" — saving that line.',
  },
  {
    id: 'q2',
    prompt: 'The most overrated thing in performance marketing right now is —',
    options: [
      { id: 'a', label: 'Attribution modeling' },
      { id: 'b', label: 'Creator partnerships' },
      { id: 'c', label: '"Full-funnel" as a buzzword' },
      { id: 'd', label: 'Real-time optimization' },
    ],
  },
]

export const voiceCard: VoiceCard = {
  userName: 'Shira H.',
  roleLabel: 'Director, Brand · pillar research live',
  povFingerprint:
    "Sees AI as an amplifier of existing judgment, not a shortcut around it — same tool, opposite outcomes depending on who's holding it.",
  opinions: [
    { id: 'op1', quote: '"Same tool, opposite outcomes."' },
    { id: 'op2', quote: 'Next opinion lands here…', placeholder: true },
  ],
  completenessPct: 38,
  completenessNote: '38% — Opinions & POV is where most of the substance comes from. Worth the time.',
}
