import { describe, expect, it } from 'vitest'
import { seedFromIdea, seedFromInsight, seedFromNewsletter, seedFromResource } from '@/lib/composerSeed'
import type { Idea, NewsletterIssue, Resource } from '@/data/types'

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

const resource: Resource = {
  id: 'resource_x',
  url: 'https://example.com/a-report',
  title: 'A great report worth citing',
  note: 'The churn stat on page 4 is the whole story.',
  pillar: 'Performance',
  tags: ['q2'],
  createdAt: '2026-01-01T00:00:00Z',
}

describe('seedFromResource', () => {
  it('pre-fills title/paragraphs from the resource and carries its pillar', () => {
    const seed = seedFromResource(resource)
    expect(seed.title).toBe(resource.title)
    expect(seed.paragraphs).toEqual([resource.title, resource.note, ''])
    expect(seed.sourceType).toBe('resource')
    expect(seed.sourceLabel).toBe(resource.title)
    expect(seed.pillar).toBe('Performance')
  })

  it('falls back to the url for sourceLabel when the resource has no title', () => {
    const seed = seedFromResource({ ...resource, title: '' })
    expect(seed.sourceLabel).toBe(resource.url)
  })

  it('omits the note paragraph when the resource has none', () => {
    const seed = seedFromResource({ ...resource, note: '' })
    expect(seed.paragraphs).toEqual([resource.title, ''])
  })
})

describe('ComposerSeed format', () => {
  it('every existing seedFromX helper omits format, defaulting to post at draft-creation time', () => {
    expect(seedFromIdea(idea).format).toBeUndefined()
    expect(seedFromInsight('x').format).toBeUndefined()
    expect(seedFromNewsletter(issue).format).toBeUndefined()
  })
})
