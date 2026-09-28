// A pool of "start from a prompt" idea-starters shown on the brand-new-user
// empty state (`CreateDashboardPage`). Larger than the 3 shown at once so
// the "Refresh" affordance actually surfaces new material instead of
// reshuffling the same 3 forever.

export interface PromptStarter {
  q: string
  hint: string
}

export const PROMPT_STARTERS: PromptStarter[] = [
  { q: 'What did you change your mind about this year?', hint: 'Reversals travel further than takes.' },
  { q: 'What number do you know that others don’t?', hint: 'Proprietary data clears the BS check instantly.' },
  { q: 'What does your team argue about?', hint: 'Live tension beats settled wisdom.' },
  { q: 'What mistake do you see people in your field make constantly?', hint: 'Naming the mistake is more useful than naming the fix.' },
  { q: 'What advice do you keep giving that you wish you didn’t have to?', hint: 'If you say it twice a week, it’s a post.' },
  { q: 'What’s a belief you had a year ago that you’d argue against now?', hint: 'The reversal is the hook — lead with what changed.' },
  { q: 'What’s the most overrated idea in your industry right now?', hint: 'Contrarian, specific, and defensible beats broad and safe.' },
  { q: 'What did a client or customer say recently that surprised you?', hint: 'A real quote is worth more than a general observation.' },
  { q: 'What’s something you do differently than everyone else on your team?', hint: 'The gap between you and the norm is the content.' },
  { q: 'What’s a question you get asked constantly that deserves a real answer?', hint: 'If people keep asking, they want more than a one-liner.' },
  { q: 'What’s a number from this quarter that would surprise your network?', hint: 'Specific beats impressive — precision reads as credible.' },
  { q: 'What’s a tool or process everyone assumes works, but doesn’t?', hint: 'Calling out the gap between assumption and reality is a strong hook.' },
]

const VISIBLE_COUNT = 3

/** Random sample of `count` distinct prompts, biased away from repeating
 * the previous set where the pool is large enough to allow it. */
export function pickPromptStarters(count: number = VISIBLE_COUNT, exclude: string[] = []): PromptStarter[] {
  const excludeSet = new Set(exclude)
  const preferred = PROMPT_STARTERS.filter((p) => !excludeSet.has(p.q))
  const pool = preferred.length >= count ? preferred : PROMPT_STARTERS
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
