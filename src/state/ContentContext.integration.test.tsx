import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContentProvider, useContent } from '@/state/ContentContext'
import type { ComposerSeed } from '@/lib/composerSeed'

/**
 * Exercises ContentContext end-to-end through its exposed API (not just
 * the pure `contentReducer` function) — i.e. creating a draft from a seed
 * and driving it through a real status update, the way the composer and
 * dashboard actually call it.
 */
describe('ContentContext (through the real provider)', () => {
  it('creates a draft from a seed and updates its status through the context', async () => {
    const { result } = renderHook(() => useContent(), {
      wrapper: ({ children }) => <ContentProvider>{children}</ContentProvider>,
    })

    // Wait for the initial fixture hydration to resolve.
    await waitFor(() => expect(result.current.loading).toBe(false))
    const initialDraftCount = result.current.drafts.length

    const seed: ComposerSeed = {
      title: 'Drafted from a test',
      paragraphs: ['Drafted from a test'],
      sourceType: 'idea',
      sourceIdeaId: 'idea_source',
      pillar: 'AI search',
    }

    let newId = ''
    act(() => {
      newId = result.current.createDraft(seed)
    })

    await waitFor(() => expect(result.current.drafts.length).toBe(initialDraftCount + 1))
    expect(result.current.getDraft(newId)).toMatchObject({ title: 'Drafted from a test', stage: 'draft' })

    // A brand-new draft can't jump straight to scheduled without passing
    // the BS check first — run it, then verify the draft ends up on the
    // schedule with a real post created once it's actually published.
    act(() => {
      result.current.runBsCheck(newId)
    })
    await waitFor(() => expect(result.current.getDraft(newId)?.bsCheck).toBe('passed'))

    act(() => {
      result.current.setDraftStage(newId, 'scheduled')
    })
    await waitFor(() => expect(result.current.getDraft(newId)?.stage).toBe('scheduled'))
    expect(result.current.getDraft(newId)?.scheduledFor).toBeTruthy()

    const postsBefore = result.current.posts.length
    act(() => {
      result.current.setDraftStage(newId, 'published')
    })
    await waitFor(() => expect(result.current.getDraft(newId)?.stage).toBe('published'))
    expect(result.current.posts.length).toBe(postsBefore + 1)
    expect(result.current.posts[0]).toMatchObject({ draftId: newId, title: 'Drafted from a test' })
  })
})
