import { describe, expect, it } from 'vitest'
import { contentReducer, type ContentState } from '@/state/ContentContext'
import type { Draft } from '@/data/types'
import type { ComposerSeed } from '@/lib/composerSeed'

function emptyState(): ContentState {
  return { ideas: [], drafts: [], posts: [], videoItems: [], carouselDecks: [], resources: [] }
}

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: 'draft_1',
    title: 'Untitled',
    paragraphs: ['hello'],
    excerpt: 'hello',
    pillar: null,
    stage: 'draft',
    format: 'post',
    slopScore: 0,
    roastVerdict: '',
    roastFlags: [],
    voiceMatch: 50,
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

describe('contentReducer — CREATE_DRAFT', () => {
  it('creates a new draft from a composer seed, prepended to the drafts list', () => {
    const seed: ComposerSeed = {
      title: 'A seeded title',
      paragraphs: ['A seeded title', 'second paragraph'],
      sourceType: 'idea',
      sourceLabel: 'A seeded title',
      sourceIdeaId: 'idea_1',
      pillar: 'AI search',
    }
    const state = { ...emptyState(), drafts: [makeDraft({ id: 'existing' })] }
    const next = contentReducer(state, { type: 'CREATE_DRAFT', seed, id: 'draft_new' })

    expect(next.drafts).toHaveLength(2)
    expect(next.drafts[0]).toMatchObject({
      id: 'draft_new',
      title: 'A seeded title',
      paragraphs: ['A seeded title', 'second paragraph'],
      excerpt: 'A seeded title',
      pillar: 'AI search',
      stage: 'draft',
      slopScore: 0,
      roastVerdict: '',
      roastFlags: [],
      voiceMatch: 0,
      sourceIdeaId: 'idea_1',
      sourceType: 'idea',
    })
    // The pre-existing draft is untouched, not replaced.
    expect(next.drafts[1].id).toBe('existing')
  })

  it('starts every new draft with a fully-unchecked pre-post checklist', () => {
    const seed: ComposerSeed = { title: 't', paragraphs: ['t'], pillar: null }
    const next = contentReducer(emptyState(), { type: 'CREATE_DRAFT', seed, id: 'd1' })
    expect(next.drafts[0].checklist).toEqual({
      hookEarnsSeeMore: false,
      noLinksInBody: false,
      visualAttached: false,
      hashtagsAdded: false,
    })
  })

  it('defaults format to post when the seed omits it', () => {
    const seed: ComposerSeed = { title: 't', paragraphs: ['t'], pillar: null }
    const next = contentReducer(emptyState(), { type: 'CREATE_DRAFT', seed, id: 'd1' })
    expect(next.drafts[0].format).toBe('post')
  })

  it('carries an explicit article format from the seed through to the new draft', () => {
    const seed: ComposerSeed = { title: 't', paragraphs: ['t'], pillar: null, format: 'article' }
    const next = contentReducer(emptyState(), { type: 'CREATE_DRAFT', seed, id: 'd1' })
    expect(next.drafts[0].format).toBe('article')
  })
})

describe('contentReducer — draft status transitions (SET_DRAFT_STAGE)', () => {
  it('moves a clear-roast draft to scheduled and stamps scheduledFor', () => {
    const state = { ...emptyState(), drafts: [makeDraft({ stage: 'draft', slopScore: 0 })] }
    const next = contentReducer(state, { type: 'SET_DRAFT_STAGE', id: 'draft_1', stage: 'scheduled' })
    expect(next.drafts[0].stage).toBe('scheduled')
    expect(next.drafts[0].scheduledFor).toBeTruthy()
  })

  it('publishing a draft stamps publishedAt and creates a matching post record', () => {
    const state = { ...emptyState(), drafts: [makeDraft({ stage: 'scheduled', title: 'My post', pillar: 'Org' })] }
    const next = contentReducer(state, { type: 'SET_DRAFT_STAGE', id: 'draft_1', stage: 'published' })
    expect(next.drafts[0].stage).toBe('published')
    expect(next.drafts[0].publishedAt).toBeTruthy()
    expect(next.posts).toHaveLength(1)
    expect(next.posts[0]).toMatchObject({ draftId: 'draft_1', title: 'My post', pillar: 'Org', impressions: 0 })
  })

  it('archiving a draft stamps archivedAt', () => {
    const state = { ...emptyState(), drafts: [makeDraft({ stage: 'draft' })] }
    const next = contentReducer(state, { type: 'SET_DRAFT_STAGE', id: 'draft_1', stage: 'archived' })
    expect(next.drafts[0].stage).toBe('archived')
    expect(next.drafts[0].archivedAt).toBeTruthy()
  })

  it('refuses an invalid stage jump and leaves state untouched', () => {
    const state = { ...emptyState(), drafts: [makeDraft({ stage: 'draft' })] }
    const next = contentReducer(state, { type: 'SET_DRAFT_STAGE', id: 'draft_1', stage: 'published' })
    expect(next).toBe(state) // same reference: no-op
    expect(next.drafts[0].stage).toBe('draft')
  })

  it('is a no-op for an unknown draft id', () => {
    const state = { ...emptyState(), drafts: [makeDraft()] }
    const next = contentReducer(state, { type: 'SET_DRAFT_STAGE', id: 'missing', stage: 'scheduled' })
    expect(next).toBe(state)
  })
})

describe('contentReducer — other draft actions', () => {
  it('RUN_ROAST scores the draft from its own paragraphs and populates verdict + flags', () => {
    const state = {
      ...emptyState(),
      drafts: [
        makeDraft({
          paragraphs: ['Let that sink in — we are quietly leveraging synergies to move the needle.'],
        }),
      ],
    }
    const next = contentReducer(state, { type: 'RUN_ROAST', id: 'draft_1' })
    expect(next.drafts[0].slopScore).toBeGreaterThan(0)
    expect(next.drafts[0].roastVerdict).toBeTruthy()
    expect(next.drafts[0].roastFlags.length).toBeGreaterThan(0)
  })

  it('RUN_ROAST scores a clean, anchored draft as clear with no flags', () => {
    const state = {
      ...emptyState(),
      drafts: [
        makeDraft({
          paragraphs: ['Referral traffic from AI assistants is up 340% since January.'],
        }),
      ],
    }
    const next = contentReducer(state, { type: 'RUN_ROAST', id: 'draft_1' })
    expect(next.drafts[0].slopScore).toBe(0)
    expect(next.drafts[0].roastFlags).toEqual([])
  })

  it('TOGGLE_CHECKLIST flips exactly one key without touching the others', () => {
    const state = { ...emptyState(), drafts: [makeDraft()] }
    const next = contentReducer(state, { type: 'TOGGLE_CHECKLIST', id: 'draft_1', key: 'visualAttached' })
    expect(next.drafts[0].checklist.visualAttached).toBe(true)
    expect(next.drafts[0].checklist.hookEarnsSeeMore).toBe(false)
  })

  it('RESTORE_DRAFT sends an archived draft back to the draft stage and clears archivedAt', () => {
    const state = {
      ...emptyState(),
      drafts: [makeDraft({ stage: 'archived', archivedAt: '2026-01-05T00:00:00Z' })],
    }
    const next = contentReducer(state, { type: 'RESTORE_DRAFT', id: 'draft_1' })
    expect(next.drafts[0].stage).toBe('draft')
    expect(next.drafts[0].archivedAt).toBeUndefined()
  })
})

describe('contentReducer — ideas', () => {
  it('ARCHIVE_IDEA then RESTORE_IDEA round-trips archivedAt', () => {
    const state = {
      ...emptyState(),
      ideas: [{ id: 'idea_1', text: 'x', pillar: null, source: 'manual' as const, createdAt: '2026-01-01T00:00:00Z' }],
    }
    const archived = contentReducer(state, { type: 'ARCHIVE_IDEA', id: 'idea_1' })
    expect(archived.ideas[0].archivedAt).toBeTruthy()

    const restored = contentReducer(archived, { type: 'RESTORE_IDEA', id: 'idea_1' })
    expect(restored.ideas[0].archivedAt).toBeUndefined()
  })

  it('DELETE_ARCHIVED_IDEA removes it permanently', () => {
    const state = {
      ...emptyState(),
      ideas: [{ id: 'idea_1', text: 'x', pillar: null, source: 'manual' as const, createdAt: '2026-01-01T00:00:00Z' }],
    }
    const next = contentReducer(state, { type: 'DELETE_ARCHIVED_IDEA', id: 'idea_1' })
    expect(next.ideas).toHaveLength(0)
  })
})

describe('contentReducer — resources', () => {
  it('ADD_RESOURCE prepends the new resource', () => {
    const state = emptyState()
    const resource = {
      id: 'resource_1',
      url: 'https://example.com',
      title: 'A link',
      note: '',
      pillar: null,
      tags: [],
      createdAt: '2026-01-01T00:00:00Z',
    }
    const next = contentReducer(state, { type: 'ADD_RESOURCE', resource })
    expect(next.resources).toEqual([resource])
  })

  it('DELETE_RESOURCE removes it permanently', () => {
    const resource = {
      id: 'resource_1',
      url: 'https://example.com',
      title: 'A link',
      note: '',
      pillar: null,
      tags: [],
      createdAt: '2026-01-01T00:00:00Z',
    }
    const state = { ...emptyState(), resources: [resource] }
    const next = contentReducer(state, { type: 'DELETE_RESOURCE', id: 'resource_1' })
    expect(next.resources).toHaveLength(0)
  })
})

describe('contentReducer — video stage transitions', () => {
  it('disallows skipping from script straight to filming, matching statusPipeline rules', () => {
    const state = {
      ...emptyState(),
      videoItems: [{ id: 'v1', title: 'x', format: 'video' as const, stage: 'script' as const, people: [] }],
    }
    const next = contentReducer(state, { type: 'SET_VIDEO_STAGE', id: 'v1', stage: 'filming' })
    expect(next).toBe(state)
    expect(next.videoItems[0].stage).toBe('script')
  })

  it('allows the adjacent script -> shoot_scheduled move', () => {
    const state = {
      ...emptyState(),
      videoItems: [{ id: 'v1', title: 'x', format: 'video' as const, stage: 'script' as const, people: [] }],
    }
    const next = contentReducer(state, { type: 'SET_VIDEO_STAGE', id: 'v1', stage: 'shoot_scheduled' })
    expect(next.videoItems[0].stage).toBe('shoot_scheduled')
  })
})
