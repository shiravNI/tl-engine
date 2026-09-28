// The "Roast" quality check — replaces the old canned BS-check + AI-texture
// cards with something that actually reads the draft's own text. Pure
// functions only (no Math.random, no Date.now) so re-running against
// unchanged text always gives the same score/verdict/flags — this is what
// makes it testable and, per the plan, honest: no fake number-nudging.
import type { RoastFlag } from '@/data/types'

export type RoastTier = 'clear' | 'flagged' | 'roasted'

interface RoastPattern {
  id: string
  /** Case-insensitive, no `g` flag required — applied per-paragraph via a
   * freshly-constructed global copy so `matchAll` always starts clean. */
  regex: RegExp
  /** How much a single hit adds to the base score before positive signals
   * are subtracted. Cheap corporate tics score low; the try-hard ones
   * (open-with-an-announcement, "humbled and honored") score higher. */
  weight: number
  /** The fixed, curated snark for this exact tic — never a generic note. */
  comment: string
}

const ROAST_PATTERNS: RoastPattern[] = [
  {
    id: 'let_that_sink_in',
    regex: /let that sink in/i,
    weight: 4,
    comment: '"Let that sink in" — it\'s one sentence, not a depth charge.',
  },
  {
    id: 'its_not_x_its_y',
    regex: /it'?s not [^,.!?]+,\s*it'?s [^.!?]+/i,
    weight: 3,
    comment: 'The "it\'s not X, it\'s Y" see-saw. We saw it coming three exits away.',
  },
  {
    id: 'quietly',
    regex: /\bquietly\b/i,
    weight: 2,
    comment: '"Quietly" is doing a lot of dramatic lifting for something you just typed in all-caps energy.',
  },
  {
    id: 'heres_the_thing',
    regex: /here'?s (?:what gets me|the thing|what nobody tells you)\b/i,
    weight: 2,
    comment: 'That opener has been recycled since roughly 2019 — here\'s the thing, everybody knows it now.',
  },
  {
    id: 'circle_back',
    regex: /circle back\b/i,
    weight: 2,
    comment: '"Circle back" — said no human in an actual conversation, ever.',
  },
  {
    id: 'double_click',
    regex: /double[- ]click(?:ing)? on\b/i,
    weight: 3,
    comment: '"Double-click on" is what happens when "let\'s actually discuss this" went to business school.',
  },
  {
    id: 'move_the_needle',
    regex: /move(?:s|d)? the needle\b/i,
    weight: 3,
    comment: 'The needle has moved on from this phrase. So should you.',
  },
  {
    id: 'synergy',
    regex: /synerg(?:y|ies)\b/i,
    weight: 3,
    comment: 'Synergy: the word two teams use when they secretly can\'t stand sharing a Slack channel.',
  },
  {
    id: 'leverage',
    regex: /\bleverag(?:e|es|ed|ing)\b/i,
    weight: 2,
    comment: '"Leverage" as a verb is the thought-leadership fist bump. Just say "use."',
  },
  {
    id: 'game_changer',
    regex: /game[- ]chang(?:er|ers|ing)\b/i,
    weight: 3,
    comment: '"Game-changing" — cool, which game, and did it actually change?',
  },
  {
    id: 'end_of_the_day',
    regex: /at the end of the day\b/i,
    weight: 2,
    comment: '"At the end of the day" is where sentences go to say nothing for one more clause.',
  },
  {
    id: 'low_hanging_fruit',
    regex: /low[- ]hanging fruit\b/i,
    weight: 2,
    comment: '"Low-hanging fruit" — nothing says strategic vision like an agricultural metaphor for laziness.',
  },
  {
    id: 'unlock_potential',
    regex: /unlock(?:ing|ed|s)? (?:your |true |real )?potential\b/i,
    weight: 3,
    comment: '"Unlock your potential" — this isn\'t a locked door, it\'s a caption generator.',
  },
  {
    id: 'fast_paced',
    regex: /in today'?s fast[- ]paced\b/i,
    weight: 4,
    comment: '"In today\'s fast-paced [world]" — congratulations on discovering that time moves forward.',
  },
  {
    id: 'humbled_and_honored',
    regex: /humbled and honored\b/i,
    weight: 4,
    comment: '"Humbled and honored" — pick one, or better, pick neither and just say what happened.',
  },
]

/** Only checked against the start of the draft's first paragraph — the
 * plan calls this out as "as an opener," not a general phrase watch. */
const OPENER_ANNOUNCE_PATTERN = /\b(thrilled|excited) to announce\b/i
const OPENER_ANNOUNCE_COMMENT =
  'Opening with "thrilled/excited to announce" is the group-chat golf clap of hooks.'
const OPENER_ANNOUNCE_WEIGHT = 3

const EM_DASH_THRESHOLD = 2
const EM_DASH_COMMENT =
  'More em dashes than a villain\'s monologue — pick one per paragraph and mean it.'
const EM_DASH_WEIGHT = 2

/** A concrete number/percentage/multiple — the plan's "positive signal"
 * that a draft is anchored to something real, not just vibes. */
const HAS_METRIC = /\d+(?:\.\d+)?%|\$\d[\d,]*(?:\.\d+)?|\b\d+x\b/i
const METRIC_REDUCTION = 2

/** A specific first-person anecdote marker — the other positive signal. */
const HAS_ANECDOTE =
  /\b(i remember|i watched|i built|i shipped|i learned|i realized|i argued|i saw|when i|last (?:week|month|year) i|years? ago,? i|i once|i still remember)\b/i
const ANECDOTE_REDUCTION = 1

const VERDICTS: Record<RoastTier, string[]> = {
  clear: [
    "Anchored and specific — this reads like only you could've written it.",
    'Clean. No corporate ghosts haunting this one.',
    'Genuinely yours. Post it.',
  ],
  flagged: [
    'Solid bones, but a few corporate tics snuck in.',
    "Close — trim the jargon and this actually lands.",
    "Half you, half LinkedIn's group chat. Fix the flagged lines.",
  ],
  roasted: [
    'This could\'ve been generated by a bot trained on other bots.',
    "Certified slop. Nobody's clicking \"see more\" on this.",
    'This is a thought-leadership Mad Lib. Start over from the actual story.',
  ],
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** Splits a paragraph into sentence-ish chunks so a match can be traced
 * back to the specific sentence it lives in, not the whole paragraph. */
function splitSentences(paragraph: string): string[] {
  const trimmed = paragraph.trim()
  if (!trimmed) return []
  const parts = trimmed.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)
  return parts ? parts.map((p) => p.trim()).filter(Boolean) : [trimmed]
}

function extractSentence(paragraph: string, matchIndex: number): string {
  const sentences = splitSentences(paragraph)
  let cursor = 0
  for (const sentence of sentences) {
    const found = paragraph.indexOf(sentence, cursor)
    const start = found === -1 ? cursor : found
    const end = start + sentence.length
    if (matchIndex >= start && matchIndex <= end) return sentence
    cursor = end
  }
  return paragraph.trim()
}

function globalCopy(regex: RegExp): RegExp {
  return new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`)
}

function countEmDashes(text: string): number {
  return (text.match(/—/g) ?? []).length
}

function pickVerdict(tier: RoastTier, score: number): string {
  const options = VERDICTS[tier]
  const tierMinScore = tier === 'clear' ? 0 : tier === 'flagged' ? 3 : 7
  const idx = ((score - tierMinScore) % options.length + options.length) % options.length
  return options[idx]
}

export function getRoastTier(slopScore: number): RoastTier {
  if (slopScore <= 2) return 'clear'
  if (slopScore <= 6) return 'flagged'
  return 'roasted'
}

export function runRoastDetector(paragraphs: string[]): {
  slopScore: number
  roastVerdict: string
  roastFlags: RoastFlag[]
} {
  const flags: RoastFlag[] = []
  let base = 0

  for (const pattern of ROAST_PATTERNS) {
    let hitCount = 0
    let flaggedForThisPattern = 0
    for (const paragraph of paragraphs) {
      for (const match of paragraph.matchAll(globalCopy(pattern.regex))) {
        hitCount += 1
        if (flaggedForThisPattern < 2 && match.index !== undefined) {
          flags.push({ quote: extractSentence(paragraph, match.index), comment: pattern.comment })
          flaggedForThisPattern += 1
        }
      }
    }
    if (hitCount > 0) {
      base += Math.min(pattern.weight + (hitCount - 1), pattern.weight + 2)
    }
  }

  // "Thrilled/excited to announce" only counts as a tic when it's the
  // opener, not buried mid-draft — check the first paragraph only.
  const firstParagraph = paragraphs[0] ?? ''
  const openerWindow = firstParagraph.slice(0, 60)
  const openerMatch = openerWindow.match(OPENER_ANNOUNCE_PATTERN)
  if (openerMatch && openerMatch.index !== undefined) {
    base += OPENER_ANNOUNCE_WEIGHT
    flags.push({
      quote: extractSentence(firstParagraph, openerMatch.index),
      comment: OPENER_ANNOUNCE_COMMENT,
    })
  }

  // Em-dash overuse is counted across the whole draft, not per-sentence —
  // quote the paragraph carrying the most of them.
  const totalEmDashes = paragraphs.reduce((sum, p) => sum + countEmDashes(p), 0)
  if (totalEmDashes > EM_DASH_THRESHOLD) {
    base += EM_DASH_WEIGHT
    const worstParagraph = [...paragraphs].sort((a, b) => countEmDashes(b) - countEmDashes(a))[0]
    if (worstParagraph) flags.push({ quote: worstParagraph.trim(), comment: EM_DASH_COMMENT })
  }

  const fullText = paragraphs.join(' ')
  let reduction = 0
  if (HAS_METRIC.test(fullText)) reduction += METRIC_REDUCTION
  if (HAS_ANECDOTE.test(fullText)) reduction += ANECDOTE_REDUCTION

  const slopScore = clamp(base - reduction, 0, 10)
  const tier = getRoastTier(slopScore)
  const roastVerdict = pickVerdict(tier, slopScore)

  return { slopScore, roastVerdict, roastFlags: flags.slice(0, 8) }
}
