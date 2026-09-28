import { describe, expect, it } from 'vitest'
import {
  ideaToInsertRow,
  rowToIdea,
  rowToDraft,
  draftToInsertRow,
  rowToVideoItem,
  videoItemToInsertRow,
  rowToCarouselDeck,
} from '@/data/services/contentService'

const USER_ID = 'user_test_1'

describe('contentService — ideas row <-> camelCase mapper', () => {
  it('round-trips a full row through rowToIdea -> ideaToInsertRow unchanged', () => {
    const row = {
      id: 'idea_1',
      text: 'A test idea',
      pillar: 'AI search',
      source: 'manual',
      created_at: '2026-01-01T00:00:00Z',
      archived_at: null,
    }
    const idea = rowToIdea(row)
    expect(idea).toEqual({
      id: 'idea_1',
      text: 'A test idea',
      pillar: 'AI search',
      source: 'manual',
      createdAt: '2026-01-01T00:00:00Z',
      archivedAt: undefined,
    })
    expect(ideaToInsertRow(USER_ID, idea)).toEqual({ ...row, user_id: USER_ID })
  })

  it('round-trips an archived idea, preserving archived_at both ways', () => {
    const row = {
      id: 'idea_2',
      text: 'An archived idea',
      pillar: null,
      source: 'slack',
      created_at: '2026-01-01T00:00:00Z',
      archived_at: '2026-02-01T00:00:00Z',
    }
    const idea = rowToIdea(row)
    expect(idea.archivedAt).toBe('2026-02-01T00:00:00Z')
    expect(ideaToInsertRow(USER_ID, idea)).toEqual({ ...row, user_id: USER_ID })
  })
})

describe('contentService — drafts row <-> camelCase mapper', () => {
  const draftRow = {
    id: 'draft_1',
    title: 'A test draft',
    paragraphs: ['first paragraph', 'second paragraph'],
    excerpt: 'first paragraph',
    pillar: 'Org' as const,
    stage: 'draft',
    format: 'post',
    slop_score: 3,
    roast_verdict: 'Solid bones, but a few corporate tics snuck in.',
    roast_flags: [{ quote: 'first paragraph', comment: 'A specific roast.' }],
    voice_match: 72,
    source_idea_id: 'idea_1',
    source_type: 'idea',
    source_label: 'A test idea',
    image_url: null,
    image_file_name: null,
    checklist: { hookEarnsSeeMore: true, noLinksInBody: true, visualAttached: false, hashtagsAdded: false },
    scheduled_for: null,
    published_at: null,
    archived_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  }

  it('rowToDraft maps every snake_case column to its camelCase field', () => {
    const draft = rowToDraft(draftRow)
    expect(draft).toMatchObject({
      id: 'draft_1',
      title: 'A test draft',
      paragraphs: ['first paragraph', 'second paragraph'],
      format: 'post',
      slopScore: 3,
      roastVerdict: 'Solid bones, but a few corporate tics snuck in.',
      roastFlags: [{ quote: 'first paragraph', comment: 'A specific roast.' }],
      voiceMatch: 72,
      sourceIdeaId: 'idea_1',
      sourceType: 'idea',
      sourceLabel: 'A test idea',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    })
  })

  it('round-trips draftToInsertRow(userId, rowToDraft(row)) back to the original row plus user_id', () => {
    const draft = rowToDraft(draftRow)
    expect(draftToInsertRow(USER_ID, draft)).toEqual({ ...draftRow, user_id: USER_ID })
  })

  it('maps the article format through both directions', () => {
    const articleRow = { ...draftRow, id: 'draft_2', format: 'article' }
    const draft = rowToDraft(articleRow)
    expect(draft.format).toBe('article')
    expect(draftToInsertRow(USER_ID, draft)).toEqual({ ...articleRow, user_id: USER_ID })
  })
})

describe('contentService — video_items row <-> camelCase mapper', () => {
  it('round-trips a video item with beats/people through both mapper directions', () => {
    const row = {
      id: 'video_1',
      title: 'A test video',
      format: 'video',
      stage: 'script',
      beats: { hook: 'Hook', body: 'Body', cta: 'CTA' },
      beats_summary: null,
      inspo_label: null,
      inspo_link: null,
      shoot_date: null,
      location: null,
      people: [{ role: 'on camera', name: 'Test', initials: 'TU' }],
      editing_note: null,
      editing_progress: null,
      posting_note: null,
    }
    const item = rowToVideoItem(row)
    expect(item).toMatchObject({
      id: 'video_1',
      title: 'A test video',
      format: 'video',
      stage: 'script',
      beats: { hook: 'Hook', body: 'Body', cta: 'CTA' },
      people: [{ role: 'on camera', name: 'Test', initials: 'TU' }],
    })
    expect(videoItemToInsertRow(USER_ID, item)).toEqual({ ...row, user_id: USER_ID })
  })
})

describe('contentService — carousel_decks + carousel_slides mapper', () => {
  it('rowToCarouselDeck sorts embedded slides by index and maps has_chart -> hasChart', () => {
    const row = {
      id: 'deck_1',
      title: 'A test deck',
      prompt: 'Make a deck',
      source_file_label: null,
      stage: 'drafting',
      carousel_slides: [
        { id: 'slide_2', index: 2, kind: 'data', label: '02 · Data', headline: 'Second', has_chart: true },
        { id: 'slide_1', index: 1, kind: 'cover', label: '01 · Cover', headline: 'First', has_chart: false },
      ],
    }
    const deck = rowToCarouselDeck(row)
    expect(deck.slides.map((s) => s.id)).toEqual(['slide_1', 'slide_2'])
    expect(deck.slides[1]).toMatchObject({ headline: 'Second', hasChart: true })
  })
})
