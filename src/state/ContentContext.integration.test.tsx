import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/state/AuthContext'
import { AppShellProvider } from '@/state/AppShellContext'
import { ContentProvider, useContent } from '@/state/ContentContext'
import type { ComposerSeed } from '@/lib/composerSeed'
import { supabase } from '@/lib/supabaseClient'
import { defaultSeed, type MockSupabaseClient } from '@/test/supabaseTestUtils'

// `ContentProvider` now hydrates against Supabase (via `contentService.ts`)
// and needs a signed-in user from `AuthContext`/`AppShellContext` above it —
// mock the Supabase client with an in-memory fake seeded like the old
// fixtures, so this test's assertions (written against that data) keep
// passing unchanged.
vi.mock('@/lib/supabaseClient', async () => {
  const { createMockSupabaseClient, defaultSeed } = await import('@/test/supabaseTestUtils')
  return {
    supabase: createMockSupabaseClient(defaultSeed()),
    isSupabaseConfigured: true,
  }
})

// `vi.mock`'s factory only runs once per test file, so every test shares
// one client instance — reset its in-memory tables before each test.
beforeEach(() => {
  ;(supabase as unknown as MockSupabaseClient).__reset(defaultSeed())
})

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellProvider>
        <ContentProvider>{children}</ContentProvider>
      </AppShellProvider>
    </AuthProvider>
  )
}

/**
 * Exercises ContentContext end-to-end through its exposed API (not just
 * the pure `contentReducer` function) — i.e. creating a draft from a seed
 * and driving it through a real status update, the way the composer and
 * dashboard actually call it.
 */
describe('ContentContext (through the real provider)', () => {
  it('creates a draft from a seed and updates its status through the context', async () => {
    const { result } = renderHook(() => useContent(), { wrapper })

    // Wait for the initial hydration (now against the mocked Supabase
    // client) to resolve.
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

    // Roast the draft — its own seeded paragraph is clean (no clichés, no
    // metric either), so it should score 0 / clear with no flags.
    act(() => {
      result.current.runRoastCheck(newId)
    })
    await waitFor(() => expect(result.current.getDraft(newId)?.roastVerdict).toBeTruthy())
    expect(result.current.getDraft(newId)?.slopScore).toBe(0)

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

  it('creates a resource, reads it back via getResource, then deletes it', async () => {
    const { result } = renderHook(() => useContent(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.resources).toHaveLength(0)

    let newId = ''
    act(() => {
      newId = result.current.createResource({
        url: 'https://example.com/report',
        title: 'A test resource',
        note: '',
        pillar: null,
        tags: [],
      })
    })

    await waitFor(() => expect(result.current.resources.length).toBe(1))
    expect(result.current.getResource(newId)).toMatchObject({ url: 'https://example.com/report', title: 'A test resource' })

    act(() => {
      result.current.deleteResource(newId)
    })
    await waitFor(() => expect(result.current.resources.length).toBe(0))
    expect(result.current.getResource(newId)).toBeUndefined()
  })
})
