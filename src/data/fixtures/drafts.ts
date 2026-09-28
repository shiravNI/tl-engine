import type { Draft } from '@/data/types'

export const drafts: Draft[] = [
  {
    id: 'draft_ai_search_panic',
    title: 'The AI search panic is a distribution story',
    paragraphs: [
      'Every deck this quarter opens with the same chart. Here’s what it actually means.',
      "AI search didn't take a single click from comparison sites. It added a layer on top of one.",
      'We ran the numbers across three verticals this spring. Referral traffic from AI assistants is up 340% since January — and it converts at nearly the same rate as organic search.',
      "(The traffic nobody's counting because it doesn't show up as \"search\" in the old dashboards.)",
    ],
    excerpt: 'Every deck this quarter opens with the same chart. Here’s what it actually…',
    pillar: 'AI search',
    stage: 'draft',
    format: 'post',
    origin: 'user',
    slopScore: 0,
    roastVerdict: "Anchored and specific — this reads like only you could've written it.",
    roastFlags: [],
    voiceMatch: 91,
    sourceIdeaId: 'idea_1',
    sourceType: 'idea',
    sourceLabel: "Comparison sites aren't dying, they're being unbundled",
    imageUrl: undefined,
    imageFileName: 'chart.png',
    checklist: {
      hookEarnsSeeMore: true,
      noLinksInBody: true,
      visualAttached: false,
      hashtagsAdded: false,
    },
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-02T07:48:00Z',
  },
  {
    id: 'draft_brand_budgets',
    title: 'Three things I got wrong about brand budgets',
    paragraphs: [
      'I argued against this for two years. Then I saw the retention curve.',
      "Here's the thing: this could be a total game-changer once we circle back with real budget data.",
    ],
    excerpt: 'I argued against this for two years. Then I saw the retention curve…',
    pillar: null,
    stage: 'draft',
    format: 'post',
    origin: 'user',
    // Real, populated roastFlags — matches this draft's own second
    // paragraph, so the UI has something to show without needing a live
    // run first (per the plan's fixture requirement).
    slopScore: 6,
    roastVerdict: 'Solid bones, but a few corporate tics snuck in.',
    roastFlags: [
      {
        quote:
          "Here's the thing: this could be a total game-changer once we circle back with real budget data.",
        comment:
          "That opener has been recycled since roughly 2019 — here's the thing, everybody knows it now.",
      },
      {
        quote:
          "Here's the thing: this could be a total game-changer once we circle back with real budget data.",
        comment: '"Circle back" — said no human in an actual conversation, ever.',
      },
      {
        quote:
          "Here's the thing: this could be a total game-changer once we circle back with real budget data.",
        comment: '"Game-changing" — cool, which game, and did it actually change?',
      },
    ],
    voiceMatch: 68,
    checklist: {
      hookEarnsSeeMore: true,
      noLinksInBody: true,
      visualAttached: false,
      hashtagsAdded: false,
    },
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-09-01T15:20:00Z',
  },
  {
    id: 'draft_landing_page',
    title: 'Why we killed our best-performing landing page',
    paragraphs: [
      'Why we killed our best-performing landing page — and what replaced it.',
    ],
    excerpt: 'Why we killed our best-performing landing page — and what replaced it.',
    pillar: 'Performance',
    stage: 'scheduled',
    format: 'post',
    origin: 'user',
    slopScore: 0,
    roastVerdict: "Anchored and specific — this reads like only you could've written it.",
    roastFlags: [],
    voiceMatch: 88,
    checklist: {
      hookEarnsSeeMore: true,
      noLinksInBody: true,
      visualAttached: true,
      hashtagsAdded: true,
    },
    scheduledFor: '2026-09-04T09:15:00Z',
    createdAt: '2026-08-20T09:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 'draft_vanity_metrics',
    title: 'Why I stopped tracking vanity metrics',
    paragraphs: ['Why I stopped tracking vanity metrics as the only scoreboard.'],
    excerpt: 'Why I stopped tracking vanity metrics as the only scoreboard.',
    pillar: 'Performance',
    stage: 'archived',
    format: 'post',
    origin: 'user',
    // Never roasted.
    slopScore: 0,
    roastVerdict: '',
    roastFlags: [],
    voiceMatch: 54,
    checklist: {
      hookEarnsSeeMore: false,
      noLinksInBody: true,
      visualAttached: false,
      hashtagsAdded: false,
    },
    archivedAt: '2026-08-31T00:00:00Z',
    createdAt: '2026-07-15T10:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'draft_pricing_page',
    title: 'The pricing page redesign nobody noticed',
    paragraphs: ['The pricing page redesign nobody noticed — and why that was the point.'],
    excerpt: 'The pricing page redesign nobody noticed — and why that was the point.',
    pillar: 'Performance',
    stage: 'archived',
    format: 'post',
    origin: 'user',
    slopScore: 0,
    roastVerdict: '',
    roastFlags: [],
    voiceMatch: 45,
    checklist: {
      hookEarnsSeeMore: false,
      noLinksInBody: true,
      visualAttached: false,
      hashtagsAdded: false,
    },
    archivedAt: '2026-07-05T00:00:00Z',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'draft_director_offer',
    title: 'Why partner decks should open with churn',
    paragraphs: [
      'Every partner deck buries churn on slide 9. It should be slide 1.',
      "If you can't say the number out loud first, the rest of the deck is decoration.",
    ],
    excerpt: 'Every partner deck buries churn on slide 9. It should be slide 1.',
    pillar: 'Performance',
    stage: 'in_review',
    format: 'post',
    origin: 'user',
    slopScore: 0,
    roastVerdict: '',
    roastFlags: [],
    voiceMatch: 84,
    checklist: {
      hookEarnsSeeMore: true,
      noLinksInBody: true,
      visualAttached: false,
      hashtagsAdded: false,
    },
    createdAt: '2026-09-02T08:55:00Z',
    updatedAt: '2026-09-02T08:55:00Z',
  },
]

export function activeDrafts(): Draft[] {
  return drafts.filter((d) => d.stage !== 'archived')
}
