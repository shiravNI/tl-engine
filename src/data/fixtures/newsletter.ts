import type { NewsletterIssue } from '@/data/types'

export const NEWSLETTER_SEED_IDEA_ID = 'idea_1'

export const newsletterIssue: NewsletterIssue = {
  id: 'issue_tue',
  date: 'Tuesday, 2 September',
  headline: "Tuesday's issue — AI search & performance economics",
  stories: [
    {
      id: 'story_1',
      headline: "OpenAI's shopping layer just quietly ate a slice of comparison-site traffic",
      sourceLabel: 'The Information',
      matchesLabel: 'matches your "unbundling" pillar',
      refType: 'idea',
      refId: NEWSLETTER_SEED_IDEA_ID,
    },
    {
      id: 'story_2',
      headline: 'New data: brand lift compounds performance efficiency by 18% at scale',
      sourceLabel: 'WARC',
      matchesLabel: 'matches your "brand budgets" draft',
      refType: 'idea',
      refId: NEWSLETTER_SEED_IDEA_ID,
    },
  ],
  statOfDay: {
    value: '340%',
    caption: 'Referral traffic from AI assistants to comparison sites, YoY — your own Q1 number, still holding.',
  },
  prewrittenDraft: {
    hook: "Everyone's calling it an AI-search threat. It's a distribution opportunity wearing a costume.",
    note: 'Built from story 1 + your "unbundling" idea in Brain.',
    seedIdeaId: NEWSLETTER_SEED_IDEA_ID,
  },
  pastIssues: [
    { label: 'Monday', summary: '3 stories, 1 draft sent' },
    { label: 'Friday', summary: '4 stories, 2 drafts sent' },
  ],
}
