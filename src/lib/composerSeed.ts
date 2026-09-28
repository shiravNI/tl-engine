import type { DraftFormat, Idea, NewsletterIssue, Pillar, Resource } from '@/data/types'

/**
 * "Draft it from this insight" / "started from Brain idea" / newsletter
 * "Send to Drafts" all funnel through this one mechanism: navigate to
 * `/create/drafts/new?from<Type>=<id>`, the composer route reads the param
 * on mount, fetches the source via `services/`, and calls the matching
 * seed function below to pre-fill the new in-memory Draft — one pathway,
 * not three bespoke ones.
 */

export type ComposerSourceType = 'idea' | 'insight' | 'newsletter' | 'resource'

export interface ComposerSeed {
  title: string
  paragraphs: string[]
  sourceType?: ComposerSourceType
  sourceLabel?: string
  sourceIdeaId?: string
  pillar: Pillar | null
  /** Defaults to `'post'` in `buildDraftFromSeed` — every existing
   * `seedFromX` below omits it. */
  format?: DraftFormat
}

export function seedFromIdea(idea: Idea): ComposerSeed {
  return {
    title: idea.text,
    paragraphs: [idea.text, ''],
    sourceType: 'idea',
    sourceLabel: idea.text,
    sourceIdeaId: idea.id,
    pillar: idea.pillar,
  }
}

export function seedFromInsight(suggestedMove: string): ComposerSeed {
  return {
    title: suggestedMove,
    paragraphs: [suggestedMove, ''],
    sourceType: 'insight',
    sourceLabel: 'Insights & Data — suggested next move',
    pillar: null,
  }
}

export function seedFromNewsletter(issue: NewsletterIssue): ComposerSeed {
  return {
    title: issue.prewrittenDraft.hook,
    paragraphs: [issue.prewrittenDraft.hook, ''],
    sourceType: 'newsletter',
    sourceLabel: issue.headline,
    sourceIdeaId: issue.prewrittenDraft.seedIdeaId,
    pillar: null,
  }
}

export function seedFromResource(resource: Resource): ComposerSeed {
  return {
    title: resource.title,
    paragraphs: [resource.title, ...(resource.note ? [resource.note] : []), ''],
    sourceType: 'resource',
    sourceLabel: resource.title || resource.url,
    pillar: resource.pillar,
  }
}
