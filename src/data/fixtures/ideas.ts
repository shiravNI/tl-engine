import type { Idea } from '@/data/types'

export const ideas: Idea[] = [
  {
    id: 'idea_1',
    text: "Comparison sites aren't dying, they're being unbundled",
    pillar: 'AI search',
    source: 'voice_note',
    createdAt: '2026-09-01T08:10:00Z',
  },
  {
    id: 'idea_2',
    text: 'The org chart lie: why brand sits under performance',
    pillar: 'Org',
    source: 'slack',
    createdAt: '2026-08-30T14:00:00Z',
  },
  {
    id: 'idea_3',
    text: 'What a $40 CPC taught me about patience',
    pillar: null,
    source: 'manual',
    createdAt: '2026-08-29T09:45:00Z',
  },
  {
    id: 'idea_4',
    text: 'Nobody asks marketplaces the second question',
    pillar: 'AI search',
    source: 'manual',
    createdAt: '2026-08-27T11:20:00Z',
  },
  {
    id: 'idea_5',
    text: "Why 'full-funnel' stopped meaning anything",
    pillar: 'Performance',
    source: 'manual',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'idea_6',
    text: 'The three interviews that changed how I hire',
    pillar: 'Org',
    source: 'voice_note',
    createdAt: '2026-08-18T16:30:00Z',
  },
  // Older, stale ideas — pre-baked as if the 30-day auto-archive already ran.
  {
    id: 'idea_7',
    text: 'A framework nobody asked for but everyone needs',
    pillar: null,
    source: 'manual',
    createdAt: '2026-07-25T09:00:00Z',
    archivedAt: '2026-07-28T09:00:00Z',
  },
  {
    id: 'idea_8',
    text: 'What conference swag says about a company',
    pillar: null,
    source: 'manual',
    createdAt: '2026-07-01T09:00:00Z',
    archivedAt: '2026-07-31T09:00:00Z',
  },
  {
    id: 'idea_9',
    text: 'The dashboard nobody opens twice',
    pillar: 'Performance',
    source: 'slack',
    createdAt: '2026-06-20T09:00:00Z',
    archivedAt: '2026-07-20T09:00:00Z',
  },
  {
    id: 'idea_10',
    text: 'Why I stopped reading competitor decks',
    pillar: 'Org',
    source: 'manual',
    createdAt: '2026-06-10T09:00:00Z',
    archivedAt: '2026-07-10T09:00:00Z',
  },
  {
    id: 'idea_11',
    text: 'Cold outreach that reads like a real person wrote it',
    pillar: 'Performance',
    source: 'voice_note',
    createdAt: '2026-06-01T09:00:00Z',
    archivedAt: '2026-07-01T09:00:00Z',
  },
  {
    id: 'idea_12',
    text: 'The metric we quietly stopped reporting',
    pillar: null,
    source: 'manual',
    createdAt: '2026-05-20T09:00:00Z',
    archivedAt: '2026-06-19T09:00:00Z',
  },
]

export function activeIdeas(): Idea[] {
  return ideas.filter((i) => !i.archivedAt)
}
