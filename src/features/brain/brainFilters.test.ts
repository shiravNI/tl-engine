import { describe, expect, it } from 'vitest'
import { selectActiveDrafts, selectActiveIdeas } from '@/features/brain/brainFilters'
import type { Draft, Idea } from '@/data/types'

function makeIdea(overrides: Partial<Idea> = {}): Idea {
  return {
    id: 'idea_1',
    text: 'An idea',
    pillar: null,
    source: 'manual',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: 'draft_1',
    title: 'A draft',
    paragraphs: ['hello'],
    excerpt: 'hello',
    pillar: null,
    stage: 'draft',
    format: 'post',
    origin: 'user',
    slopScore: 0,
    roastVerdict: '',
    roastFlags: [],
    voiceMatch: 0,
    checklist: {
      hookEarnsSeeMore: false,
      noLinksInBody: false,
      visualAttached: false,
      hashtagsAdded: false,
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('selectActiveIdeas', () => {
  it('keeps every idea without an archivedAt, uncapped', () => {
    const ideas = [
      makeIdea({ id: 'a' }),
      makeIdea({ id: 'b' }),
      makeIdea({ id: 'c' }),
      makeIdea({ id: 'd' }),
      makeIdea({ id: 'e' }),
    ]
    expect(selectActiveIdeas(ideas)).toHaveLength(5)
  })

  it('drops archived ideas', () => {
    const ideas = [makeIdea({ id: 'a' }), makeIdea({ id: 'b', archivedAt: '2026-02-01T00:00:00Z' })]
    const result = selectActiveIdeas(ideas)
    expect(result.map((i) => i.id)).toEqual(['a'])
  })
})

describe('selectActiveDrafts', () => {
  it('includes every non-terminal stage: draft, in_review, scheduled', () => {
    const drafts = [
      makeDraft({ id: 'd1', stage: 'draft' }),
      makeDraft({ id: 'd2', stage: 'in_review' }),
      makeDraft({ id: 'd3', stage: 'scheduled' }),
    ]
    expect(selectActiveDrafts(drafts).map((d) => d.id)).toEqual(['d1', 'd2', 'd3'])
  })

  it('excludes published and archived drafts', () => {
    const drafts = [
      makeDraft({ id: 'd1', stage: 'draft' }),
      makeDraft({ id: 'd2', stage: 'published' }),
      makeDraft({ id: 'd3', stage: 'archived' }),
    ]
    expect(selectActiveDrafts(drafts).map((d) => d.id)).toEqual(['d1'])
  })
})
