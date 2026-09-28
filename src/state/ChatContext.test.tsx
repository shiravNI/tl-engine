import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/state/AuthContext'
import { AppShellProvider } from '@/state/AppShellContext'
import { ContentProvider, useContent } from '@/state/ContentContext'
import { ChatProvider, useChat } from '@/state/ChatContext'
import { supabase } from '@/lib/supabaseClient'
import { defaultSeed, TEST_USER_ID, type MockSupabaseClient } from '@/test/supabaseTestUtils'

// `ContentProvider`/`ChatProvider` now hydrate against Supabase — mock the
// client with an in-memory fake, seeded per-test below.
vi.mock('@/lib/supabaseClient', async () => {
  const { createMockSupabaseClient, defaultSeed } = await import('@/test/supabaseTestUtils')
  return {
    supabase: createMockSupabaseClient(defaultSeed()),
    isSupabaseConfigured: true,
  }
})

const AGENT_DRAFT_OFFER_ID = 'draft_agent_offer'
const CONVERSATION_ID = 'conv_1'

/** A fresh account's chat starts genuinely empty (no seeded conversation,
 * no seeded messages — see chatService.ts/schema.sql's design notes), so
 * these tests build their own real conversation/message/draft rows rather
 * than relying on a pre-seeded fixture draft id (the old, now-fixed bug:
 * a fixture draft id could never resolve to a real row in a real account). */
function seedWithDraftOffer() {
  const seed = defaultSeed()
  seed.drafts = [
    ...seed.drafts,
    {
      id: AGENT_DRAFT_OFFER_ID,
      user_id: TEST_USER_ID,
      title: 'Why partner decks should open with churn',
      paragraphs: ['Every partner deck buries churn on slide 9. It should be slide 1.'],
      excerpt: 'Every partner deck buries churn on slide 9. It should be slide 1.',
      pillar: 'Performance',
      stage: 'in_review',
      format: 'post',
      origin: 'agent',
      slop_score: 0,
      roast_verdict: '',
      roast_flags: [],
      voice_match: 84,
      source_idea_id: null,
      source_type: null,
      source_label: null,
      image_url: null,
      image_file_name: null,
      checklist: { hookEarnsSeeMore: true, noLinksInBody: true, visualAttached: false, hashtagsAdded: false },
      scheduled_for: null,
      published_at: null,
      archived_at: null,
      created_at: '2026-09-02T08:55:00Z',
      updated_at: '2026-09-02T08:55:00Z',
    },
  ]
  seed.conversations = [
    {
      id: CONVERSATION_ID,
      user_id: TEST_USER_ID,
      assistant_name: 'Assistant',
      assistant_initials: 'AI',
      status: 'online',
      last_activity_summary: 'Drafted something for you to review',
    },
  ]
  seed.chat_messages = [
    {
      id: 'msg_offer',
      user_id: TEST_USER_ID,
      conversation_id: CONVERSATION_ID,
      author_type: 'assistant',
      author_name: 'Assistant',
      author_initials: 'AI',
      text: 'Drafted "Why partner decks should open with churn" for your review',
      kind: 'draft_offer',
      draft_id: AGENT_DRAFT_OFFER_ID,
      created_at: '2026-09-02T09:00:00Z',
    },
  ]
  return seed
}

// `vi.mock`'s factory only runs once per test file, so every test shares
// one client instance — reset its in-memory tables before each test (an
// approve/reject in one test otherwise leaks into the next).
beforeEach(() => {
  ;(supabase as unknown as MockSupabaseClient).__reset(seedWithDraftOffer())
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
  it('approving an agent-authored draft moves it out of in_review into the cast member’s own drafts', async () => {
    const { result } = renderHook(useBoth, { wrapper })
    await waitFor(() => expect(result.current.content.loading).toBe(false))
    await waitFor(() => expect(result.current.chat.messages.length).toBeGreaterThan(0))

    expect(result.current.content.getDraft(AGENT_DRAFT_OFFER_ID)?.stage).toBe('in_review')

    const messagesBefore = result.current.chat.messages.length
    act(() => {
      result.current.chat.respondToDraftOffer('msg_x', AGENT_DRAFT_OFFER_ID, 'approve')
    })

    await waitFor(() =>
      expect(result.current.content.getDraft(AGENT_DRAFT_OFFER_ID)?.stage).toBe('draft'),
    )
    // A system message documenting the decision is appended to the thread.
    await waitFor(() => expect(result.current.chat.messages.length).toBe(messagesBefore + 1))
    const lastMessage = result.current.chat.messages[result.current.chat.messages.length - 1]
    expect(lastMessage).toMatchObject({ kind: 'system_note', authorType: 'system' })
    expect(lastMessage?.text).toMatch(/approved/i)
  })

  it('rejecting an agent-authored draft archives it and appends a system note', async () => {
    const { result } = renderHook(useBoth, { wrapper })
    await waitFor(() => expect(result.current.content.loading).toBe(false))
    await waitFor(() => expect(result.current.chat.messages.length).toBeGreaterThan(0))

    const messagesBefore = result.current.chat.messages.length
    act(() => {
      result.current.chat.respondToDraftOffer('msg_y', AGENT_DRAFT_OFFER_ID, 'reject')
    })

    await waitFor(() =>
      expect(result.current.content.getDraft(AGENT_DRAFT_OFFER_ID)?.stage).toBe('archived'),
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
      result.current.chat.respondToDraftOffer('msg_z', AGENT_DRAFT_OFFER_ID, 'changes')
    })

    // Stage is unaffected — only approve/reject dispatch a pipeline change.
    expect(result.current.content.getDraft(AGENT_DRAFT_OFFER_ID)?.stage).toBe('in_review')
    await waitFor(() => expect(result.current.chat.messages.length).toBe(messagesBefore + 1))
    expect(result.current.chat.messages[result.current.chat.messages.length - 1]?.text).toMatch(/changes/i)
  })
})

describe('ChatContext — sendReply', () => {
  it('appends a user-authored text message to the thread and persists it', async () => {
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

describe('ChatContext — brand-new account', () => {
  it('lazily creates a conversation and starts with no messages (no seeded fixture data)', async () => {
    ;(supabase as unknown as MockSupabaseClient).__reset(defaultSeed())
    const { result } = renderHook(() => useChat(), { wrapper })

    await waitFor(() => expect(result.current.conversation).not.toBeNull())
    expect(result.current.conversation).toMatchObject({ assistantName: 'Assistant', assistantInitials: 'AI' })
    expect(result.current.messages).toHaveLength(0)
  })
})
