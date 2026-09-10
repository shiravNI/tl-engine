import { describe, expect, it } from 'vitest'
import { seedFromIdea, seedFromInsight, seedFromNewsletter } from '@/lib/composerSeed'
import type { Idea, NewsletterIssue } from '@/data/types'

const idea: Idea = {
  id: 'idea_x',
  text: 'A test idea worth writing about',
  pillar: 'AI search',
  source: 'manual',
  createdAt: '2026-01-01T00:00:00Z',
}

const issue: NewsletterIssue = {
  id: 'issue_x',
  date: 'Monday',
  headline: 'Test issue',
  stories: [],
  statOfDay: { value: '1%', caption: 'caption' },
  prewrittenDraft: { hook: 'A hook worth posting', note: 'note', seedIdeaId: 'idea_x' },
  pastIssues: [],
}

describe('seedFromIdea', () => {
  it('pre-fills title and paragraphs from the idea text, and keeps the idea link', () => {
    const seed = seedFromIdea(idea)
    expect(seed.title).toBe(idea.text)
    expect(seed.paragraphs[0]).toBe(idea.text)
    expect(seed.sourceType).toBe('idea')
    expect(seed.sourceIdeaId).toBe('idea_x')
    expect(seed.pillar).toBe('AI search')
  })
})

describe('seedFromInsight', () => {
  it('pre-fills from the suggested move and carries no idea link', () => {
    const seed = seedFromInsight('Turn this into a series')
    expect(seed.title).toBe('Turn this into a series')
    expect(seed.sourceType).toBe('insight')
    expect(seed.sourceIdeaId).toBeUndefined()
    expect(seed.pillar).toBeNull()
  })
})

describe('seedFromNewsletter', () => {
  it('pre-fills from the pre-written hook and carries the seed idea id through', () => {
    const seed = seedFromNewsletter(issue)
    expect(seed.title).toBe(issue.prewrittenDraft.hook)
    expect(seed.sourceType).toBe('newsletter')
    expect(seed.sourceIdeaId).toBe('idea_x')
    expect(seed.sourceLabel).toBe(issue.headline)
  })
})
