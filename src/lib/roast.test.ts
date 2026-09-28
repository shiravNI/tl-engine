import { describe, expect, it } from 'vitest'
import { getRoastTier, runRoastDetector } from '@/lib/roast'

describe('getRoastTier', () => {
  it('maps 0-2 to clear', () => {
    expect(getRoastTier(0)).toBe('clear')
    expect(getRoastTier(2)).toBe('clear')
  })
  it('maps 3-6 to flagged', () => {
    expect(getRoastTier(3)).toBe('flagged')
    expect(getRoastTier(6)).toBe('flagged')
  })
  it('maps 7-10 to roasted', () => {
    expect(getRoastTier(7)).toBe('roasted')
    expect(getRoastTier(10)).toBe('roasted')
  })
})

describe('runRoastDetector — pattern detection', () => {
  it('detects "let that sink in" and quotes the exact containing sentence', () => {
    const result = runRoastDetector(['Let that sink in. We shipped it anyway.'])
    expect(result.roastFlags).toContainEqual(
      expect.objectContaining({ quote: 'Let that sink in.' }),
    )
    expect(result.roastFlags.find((f) => f.quote === 'Let that sink in.')?.comment).toMatch(
      /depth charge/,
    )
  })

  it('detects the "it\'s not X, it\'s Y" construction', () => {
    const result = runRoastDetector(["It's not a pivot, it's a reinvention."])
    expect(result.roastFlags.some((f) => f.quote.includes("It's not a pivot"))).toBe(true)
  })

  it('detects "quietly" as a standalone corporate tic', () => {
    const result = runRoastDetector(['AI search is quietly eating the funnel.'])
    expect(result.roastFlags.some((f) => f.comment.includes('all-caps energy'))).toBe(true)
  })

  it('detects the "here\'s the thing" family of openers', () => {
    expect(runRoastDetector(["Here's the thing about churn."]).roastFlags).toHaveLength(1)
    expect(runRoastDetector(["Here's what gets me about churn."]).roastFlags).toHaveLength(1)
    expect(runRoastDetector(["Here's what nobody tells you about churn."]).roastFlags).toHaveLength(1)
  })

  it('detects "circle back"', () => {
    const result = runRoastDetector(["Let's circle back next week."])
    expect(result.roastFlags[0].quote).toContain('circle back')
  })

  it('detects "double-click on"', () => {
    const result = runRoastDetector(['Let’s double-click on that number.'])
    expect(result.roastFlags[0].comment).toMatch(/business school/)
  })

  it('detects "move the needle"', () => {
    const result = runRoastDetector(['This barely moves the needle.'])
    expect(result.roastFlags[0].comment).toMatch(/needle has moved on/)
  })

  it('detects "synergy"/"synergies"', () => {
    expect(runRoastDetector(['Pure synergy.']).roastFlags).toHaveLength(1)
    expect(runRoastDetector(['Chasing synergies again.']).roastFlags).toHaveLength(1)
  })

  it('detects "leverage"/"leveraging"', () => {
    expect(runRoastDetector(['We leverage the data.']).roastFlags).toHaveLength(1)
    expect(runRoastDetector(['Leveraging our network.']).roastFlags).toHaveLength(1)
  })

  it('detects "game-changer"/"game changing"', () => {
    expect(runRoastDetector(['A total game-changer.']).roastFlags).toHaveLength(1)
    expect(runRoastDetector(['This is game changing work.']).roastFlags).toHaveLength(1)
  })

  it('detects "at the end of the day"', () => {
    const result = runRoastDetector(['At the end of the day, ship it.'])
    expect(result.roastFlags[0].comment).toMatch(/one more clause/)
  })

  it('detects "low-hanging fruit"', () => {
    const result = runRoastDetector(['We picked the low-hanging fruit first.'])
    expect(result.roastFlags[0].comment).toMatch(/agricultural metaphor/)
  })

  it('detects "unlock(ing) potential"', () => {
    expect(runRoastDetector(['Unlock your potential today.']).roastFlags).toHaveLength(1)
    expect(runRoastDetector(['Unlocking true potential.']).roastFlags).toHaveLength(1)
  })

  it('detects "in today\'s fast-paced" world/industry', () => {
    const result = runRoastDetector(["In today's fast-paced industry, speed wins."])
    expect(result.roastFlags[0].comment).toMatch(/time moves forward/)
  })

  it('detects "thrilled/excited to announce" only as an opener', () => {
    const opener = runRoastDetector(['Thrilled to announce our Series A.', 'More details soon.'])
    expect(opener.roastFlags.some((f) => f.comment.includes('golf clap'))).toBe(true)

    const buried = runRoastDetector([
      'A long first paragraph that goes on for a while before anything else happens here today.',
      "Anyway I'm excited to announce the thing buried in paragraph two.",
    ])
    expect(buried.roastFlags.some((f) => f.comment.includes('golf clap'))).toBe(false)
  })

  it('detects "humbled and honored"', () => {
    const result = runRoastDetector(['Humbled and honored to share this.'])
    expect(result.roastFlags[0].comment).toMatch(/pick one/)
  })
})

describe('runRoastDetector — em-dash counting', () => {
  it('does not flag two or fewer em dashes', () => {
    const result = runRoastDetector(['One point — then another — done.'])
    expect(result.roastFlags.some((f) => f.comment.includes('villain'))).toBe(false)
  })

  it('flags more than two em dashes and quotes the worst paragraph', () => {
    const result = runRoastDetector([
      'Short one.',
      'This — has — three — em dashes — in it.',
    ])
    const flag = result.roastFlags.find((f) => f.comment.includes('villain'))
    expect(flag).toBeDefined()
    expect(flag?.quote).toContain('This — has — three — em dashes — in it.')
  })
})

describe('runRoastDetector — score computation', () => {
  it('is deterministic — re-running against unchanged text gives the same result', () => {
    const paragraphs = ['Let that sink in — we are quietly leveraging synergies to move the needle.']
    const first = runRoastDetector(paragraphs)
    const second = runRoastDetector(paragraphs)
    expect(second).toEqual(first)
  })

  it('scores a clean, anchored draft (numbers present, no flagged phrases) low', () => {
    const result = runRoastDetector([
      'We ran the numbers across three verticals this spring.',
      'Referral traffic from AI assistants is up 340% since January.',
      'I remember pulling the export at midnight and not believing it.',
    ])
    expect(result.slopScore).toBeLessThanOrEqual(2)
    expect(getRoastTier(result.slopScore)).toBe('clear')
    expect(result.roastFlags).toHaveLength(0)
  })

  it('caps the score at 10 for a maximally cliché-laden draft', () => {
    const result = runRoastDetector([
      "Let that sink in — it's not a pivot, it's a rebirth.",
      'We are quietly leveraging synergies to move the needle and double-click on the low-hanging fruit.',
      "At the end of the day, this is a total game-changer that will unlock your true potential — in today's fast-paced industry — humbled and honored to circle back — here's the thing — here's what gets me.",
    ])
    expect(result.slopScore).toBe(10)
    expect(getRoastTier(result.slopScore)).toBe('roasted')
  })

  it('reduces the score when a concrete metric is present', () => {
    const withMetric = runRoastDetector(['We are quietly leveraging synergies. Up 25% this quarter.'])
    const withoutMetric = runRoastDetector(['We are quietly leveraging synergies. Big quarter overall.'])
    expect(withMetric.slopScore).toBeLessThan(withoutMetric.slopScore)
  })

  it('reduces the score when a first-person anecdote marker is present', () => {
    const withAnecdote = runRoastDetector(['We are quietly leveraging synergies. I remember the exact moment.'])
    const withoutAnecdote = runRoastDetector(['We are quietly leveraging synergies. It was a moment.'])
    expect(withAnecdote.slopScore).toBeLessThan(withoutAnecdote.slopScore)
  })
})

describe('runRoastDetector — verdict lines', () => {
  it('picks a verdict line matching the tier', () => {
    const clear = runRoastDetector(['Referral traffic is up 340% since January.'])
    expect(Object.values(clear).length).toBeGreaterThan(0)
    expect(typeof clear.roastVerdict).toBe('string')
    expect(clear.roastVerdict.length).toBeGreaterThan(0)

    const roasted = runRoastDetector([
      "Let that sink in — it's not a pivot, it's a rebirth.",
      'We are quietly leveraging synergies to move the needle and double-click on the low-hanging fruit.',
      "At the end of the day, this is a total game-changer that will unlock your true potential — in today's fast-paced industry — humbled and honored to circle back — here's the thing — here's what gets me.",
    ])
    expect(roasted.roastVerdict.length).toBeGreaterThan(0)
    expect(getRoastTier(roasted.slopScore)).toBe('roasted')
  })

  it('gives no flags for a draft with no paragraphs', () => {
    const result = runRoastDetector([''])
    expect(result.roastFlags).toEqual([])
    expect(result.slopScore).toBe(0)
    expect(getRoastTier(result.slopScore)).toBe('clear')
  })
})
