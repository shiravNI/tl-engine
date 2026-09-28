import { describe, expect, it } from 'vitest'
import { canTransitionContentStage, canTransitionVideoStage } from '@/lib/statusPipeline'

describe('canTransitionContentStage', () => {
  it('allows the direct draft -> scheduled -> published happy path', () => {
    expect(canTransitionContentStage('draft', 'scheduled')).toBe(true)
    expect(canTransitionContentStage('scheduled', 'published')).toBe(true)
  })

  it('allows an Assistant-offered draft to move into the cast member’s own drafts on approval', () => {
    expect(canTransitionContentStage('in_review', 'draft')).toBe(true)
  })

  it('allows archiving from draft, scheduled, published, or in_review', () => {
    expect(canTransitionContentStage('draft', 'archived')).toBe(true)
    expect(canTransitionContentStage('scheduled', 'archived')).toBe(true)
    expect(canTransitionContentStage('published', 'archived')).toBe(true)
    expect(canTransitionContentStage('in_review', 'archived')).toBe(true)
  })

  it('disallows skipping levels', () => {
    expect(canTransitionContentStage('idea', 'scheduled')).toBe(false)
    expect(canTransitionContentStage('draft', 'published')).toBe(false)
    expect(canTransitionContentStage('in_review', 'scheduled')).toBe(false)
    expect(canTransitionContentStage('idea', 'archived')).toBe(false)
  })

  it('disallows moving forward stages backward directly (other than via restore)', () => {
    expect(canTransitionContentStage('scheduled', 'draft')).toBe(false)
    expect(canTransitionContentStage('published', 'scheduled')).toBe(false)
  })

  it('only allows restoring an archived item to idea or draft', () => {
    expect(canTransitionContentStage('archived', 'draft')).toBe(true)
    expect(canTransitionContentStage('archived', 'idea')).toBe(true)
    expect(canTransitionContentStage('archived', 'published')).toBe(false)
    expect(canTransitionContentStage('archived', 'scheduled')).toBe(false)
  })

  it('is reflexive (same stage is always a no-op-valid transition)', () => {
    expect(canTransitionContentStage('draft', 'draft')).toBe(true)
  })
})

describe('canTransitionVideoStage', () => {
  it('allows adjacent forward and backward moves', () => {
    expect(canTransitionVideoStage('script', 'shoot_scheduled')).toBe(true)
    expect(canTransitionVideoStage('shoot_scheduled', 'filming')).toBe(true)
    expect(canTransitionVideoStage('editing', 'filming')).toBe(true)
    expect(canTransitionVideoStage('ready', 'editing')).toBe(true)
  })

  it('disallows skipping levels, e.g. editing straight to script', () => {
    expect(canTransitionVideoStage('editing', 'script')).toBe(false)
    expect(canTransitionVideoStage('script', 'filming')).toBe(false)
    expect(canTransitionVideoStage('filming', 'ready')).toBe(false)
  })
})
