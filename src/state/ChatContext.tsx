import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchChatMessages, fetchConversation, insertChatMessage } from '@/data/services/chatService'
import { useContent } from '@/state/ContentContext'
import { useAppShell } from '@/state/AppShellContext'
import { makeId } from '@/lib/id'
import type { ChatMessage, Conversation } from '@/data/types'

export type ChatWidgetState = 'closed' | 'bubble' | 'full'

interface ChatContextValue {
  /** Exactly one conversation per user — the Assistant persona isn't a
   * second real account, so there's no multi-conversation switcher
   * anymore. `null` until the initial fetch (which lazily creates the row
   * if none exists yet) resolves. */
  conversation: Conversation | null
  messages: ChatMessage[]
  widgetState: ChatWidgetState
  openBubble: () => void
  expand: () => void
  minimize: () => void
  close: () => void
  sendReply: (text: string) => void
  /** Draft approve/reject dispatches the same pipeline action the
   * composer/dashboard use, plus appends a system message — chat is a
   * view/trigger onto the one pipeline, never a second copy of it. */
  respondToDraftOffer: (messageId: string, draftId: string, decision: 'approve' | 'reject' | 'changes') => void
  hasUnread: boolean
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

function reportWriteError(context: string, error: unknown) {
  console.error(`[ChatContext] ${context} failed to persist:`, error)
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { setDraftStage } = useContent()
  const { currentUser } = useAppShell()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [widgetState, setWidgetState] = useState<ChatWidgetState>('closed')
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    if (!currentUser.id) return
    let cancelled = false
    fetchConversation(currentUser.id).then((conv) => {
      if (cancelled) return
      setConversation(conv)
      fetchChatMessages(currentUser.id, conv.id).then((msgs) => {
        if (!cancelled) setMessages(msgs)
      })
    })
    return () => {
      cancelled = true
    }
  }, [currentUser.id])

  const sendReply = useCallback(
    (text: string) => {
      if (!text.trim() || !conversation) return
      const message: ChatMessage = {
        id: makeId('msg'),
        conversationId: conversation.id,
        authorType: 'user',
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorInitials: currentUser.initials,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        kind: 'text',
      }
      setMessages((prev) => [...prev, message])
      void insertChatMessage(currentUser.id, message).catch((e) => reportWriteError('sendReply', e))
    },
    [conversation, currentUser],
  )

  const respondToDraftOffer = useCallback(
    (_messageId: string, draftId: string, decision: 'approve' | 'reject' | 'changes') => {
      if (decision === 'approve') {
        // Same pipeline action the composer/dashboard use: an agent-offered
        // draft moves out of "in_review" into the cast member's own editable
        // Drafts, instantly reflected on the dashboard board.
        setDraftStage(draftId, 'draft')
      } else if (decision === 'reject') {
        setDraftStage(draftId, 'archived')
      }
      if (!conversation) return
      const note =
        decision === 'approve'
          ? 'You approved the draft — it now shows in your Drafts, ready to edit and schedule.'
          : decision === 'reject'
            ? 'You rejected the draft.'
            : 'You asked for changes on the draft.'
      const message: ChatMessage = {
        id: makeId('msg'),
        conversationId: conversation.id,
        authorType: 'system',
        authorName: 'System',
        authorInitials: '',
        text: note,
        timestamp: new Date().toISOString(),
        kind: 'system_note',
      }
      setMessages((prev) => [...prev, message])
      void insertChatMessage(currentUser.id, message).catch((e) => reportWriteError('respondToDraftOffer', e))
    },
    [conversation, currentUser, setDraftStage],
  )

  function openBubble() {
    setWidgetState('bubble')
    setHasUnread(false)
  }
  function expand() {
    setWidgetState('full')
    setHasUnread(false)
  }
  function minimize() {
    setWidgetState('bubble')
  }
  function close() {
    setWidgetState('closed')
  }

  const value = useMemo<ChatContextValue>(
    () => ({
      conversation,
      messages,
      widgetState,
      openBubble,
      expand,
      minimize,
      close,
      sendReply,
      respondToDraftOffer,
      hasUnread,
    }),
    [conversation, messages, widgetState, hasUnread, sendReply, respondToDraftOffer],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
