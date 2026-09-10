import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/state/AuthContext'
import { AppShellProvider } from '@/state/AppShellContext'
import { ContentProvider, useContent } from '@/state/ContentContext'
import { ChatProvider, useChat } from '@/state/ChatContext'
import { DIRECTOR_DRAFT_OFFER_ID } from '@/data/fixtures/chatMessages'
import { supabase } from '@/lib/supabaseClient'
import { defaultSeed, type MockSupabaseClient } from '@/test/supabaseTestUtils'

// `ContentProvider` (which `ChatContext`'s respondToDraftOffer dispatches
// into) now hydrates against Supabase — mock the client with an in-memory
// fake seeded like the old fixtures, including the same
// `draft_director_offer` draft id this test asserts against, so the
// existing assertions keep passing unchanged.
vi.mock('@/lib/supabaseClient', async () => {
  const { createMockSupabaseClient, defaultSeed } = await import('@/test/supabaseTestUtils')
  return {
    supabase: createMockSupabaseClient(defaultSeed()),
    isSupabaseConfigured: true,
  }
})

// `vi.mock`'s factory only runs once per test file, so every test shares
// one client instance — reset its in-memory tables before each test (an
// approve/reject in one test otherwise leaks into the next).
beforeEach(() => {
  ;(supabase as unknown as MockSupabaseClient).__reset(defaultSeed())
})

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellProvider>
        <ContentProvider>
          <ChatProvider>{children}</ChatProvider>
        </ContentProvider>
      </AppShellProvider>
    </AuthProvider>
  )
}

/** Renders both contexts together so we can assert the cross-context
 * effect: an approve/reject in chat dispatches the same pipeline action
 * the composer/dashboard use, so it's instantly visible on the content
 * side too — chat is a view/trigger onto the one pipeline, never a
 * second copy of it. */
function useBoth() {
  return { chat: useChat(), content: useContent() }
}

describe('ChatContext — respondToDraftOffer', () => {
  it('approving a Director-authored draft moves it out of in_review into the cast member’s own drafts', async () => {
    const { result } = renderHook(useBoth, { wrapper })
    await waitFor(() => expect(result.current.content.loading).toBe(false))
    await waitFor(() => expect(result.current.chat.messages.length).toBeGreaterThan(0))

    expect(result.current.content.getDraft(DIRECTOR_DRAFT_OFFER_ID)?.stage).toBe('in_review')

    const messagesBefore = result.current.chat.messages.length
    act(() => {
      result.current.chat.respondToDraftOffer('msg_x', DIRECTOR_DRAFT_OFFER_ID, 'approve')
    })

    await waitFor(() =>
      expect(result.current.content.getDraft(DIRECTOR_DRAFT_OFFER_ID)?.stage).toBe('draft'),
    )
    // A system message documenting the decision is appended to the thread.
    await waitFor(() => expect(result.current.chat.messages.length).toBe(messagesBefore + 1))
    const lastMessage = result.current.chat.messages[result.current.chat.messages.length - 1]
    expect(lastMessage).toMatchObject({ kind: 'system_note', authorType: 'system' })
    expect(lastMessage?.text).toMatch(/approved/i)
  })

  it('rejecting a Director-authored draft archives it and appends a system note', async () => {
    const { result } = renderHook(useBoth, { wrapper })
    await waitFor(() => expect(result.current.content.loading).toBe(false))
    await waitFor(() => expect(result.current.chat.messages.length).toBeGreaterThan(0))

    const messagesBefore = result.current.chat.messages.length
    act(() => {
      result.current.chat.respondToDraftOffer('msg_y', DIRECTOR_DRAFT_OFFER_ID, 'reject')
    })

    await waitFor(() =>
      expect(result.current.content.getDraft(DIRECTOR_DRAFT_OFFER_ID)?.stage).toBe('archived'),
    )
    await waitFor(() => expect(result.current.chat.messages.length).toBe(messagesBefore + 1))
    const lastMessage = result.current.chat.messages[result.current.chat.messages.length - 1]
    expect(lastMessage).toMatchObject({ kind: 'system_note', authorType: 'system' })
    expect(lastMessage?.text).toMatch(/rejected/i)
  })

  it('"changes requested" appends a system note but does not change the draft stage', async () => {
    const { result } = renderHook(useBoth, { wrapper })
    await waitFor(() => expect(result.current.content.loading).toBe(false))
    await waitFor(() => expect(result.current.chat.messages.length).toBeGreaterThan(0))

    const messagesBefore = result.current.chat.messages.length
    act(() => {
      result.current.chat.respondToDraftOffer('msg_z', DIRECTOR_DRAFT_OFFER_ID, 'changes')
    })

    // Stage is unaffected — only approve/reject dispatch a pipeline change.
    expect(result.current.content.getDraft(DIRECTOR_DRAFT_OFFER_ID)?.stage).toBe('in_review')
    await waitFor(() => expect(result.current.chat.messages.length).toBe(messagesBefore + 1))
    expect(result.current.chat.messages[result.current.chat.messages.length - 1]?.text).toMatch(/changes/i)
  })
})

describe('ChatContext — sendReply', () => {
  it('appends a user-authored text message to the thread', async () => {
    const { result } = renderHook(() => useChat(), { wrapper })
    await waitFor(() => expect(result.current.messages.length).toBeGreaterThan(0))
    const before = result.current.messages.length

    act(() => {
      result.current.sendReply('A reply from the test')
    })

    await waitFor(() => expect(result.current.messages.length).toBe(before + 1))
    const last = result.current.messages[result.current.messages.length - 1]
    expect(last).toMatchObject({ kind: 'text', authorType: 'user', text: 'A reply from the test' })
  })

  it('ignores a blank reply', async () => {
    const { result } = renderHook(() => useChat(), { wrapper })
    await waitFor(() => expect(result.current.messages.length).toBeGreaterThan(0))
    const before = result.current.messages.length

    act(() => {
      result.current.sendReply('   ')
    })
    expect(result.current.messages.length).toBe(before)
  })
})
