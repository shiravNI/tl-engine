import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchConversations, fetchMessages } from '@/data/services/chatService'
import { useContent } from '@/state/ContentContext'
import { useAppShell } from '@/state/AppShellContext'
import { makeId } from '@/lib/id'
import type { ChatMessage, Conversation } from '@/data/types'

export type ChatWidgetState = 'closed' | 'bubble' | 'full'

interface ChatContextValue {
  conversations: Conversation[]
  messages: ChatMessage[]
  activeConversationId: string
  setActiveConversationId: (id: string) => void
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

export function ChatProvider({ children }: { children: ReactNode }) {
  const { setDraftStage } = useContent()
  const { currentUser } = useAppShell()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeConversationId, setActiveConversationId] = useState('conv_dana')
  const [widgetState, setWidgetState] = useState<ChatWidgetState>('closed')
  const [hasUnread, setHasUnread] = useState(true)

  useEffect(() => {
    Promise.all([fetchConversations(), fetchMessages()]).then(([c, m]) => {
      setConversations(c)
      setMessages(m)
    })
  }, [])

  const sendReply = useCallback(
    (text: string) => {
      if (!text.trim()) return
      setMessages((prev) => [
        ...prev,
        {
          id: makeId('msg'),
          conversationId: activeConversationId,
          authorType: 'user',
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorInitials: currentUser.initials,
          text: text.trim(),
          timestamp: new Date().toISOString(),
          kind: 'text',
        },
      ])
    },
    [activeConversationId, currentUser],
  )

  const respondToDraftOffer = useCallback(
    (messageId: string, draftId: string, decision: 'approve' | 'reject' | 'changes') => {
      if (decision === 'approve') {
        // Same pipeline action the composer/dashboard use: a Director-offered
        // draft moves out of "in_review" into the cast member's own editable
        // Drafts, instantly reflected on the dashboard board.
        setDraftStage(draftId, 'draft')
      } else if (decision === 'reject') {
        setDraftStage(draftId, 'archived')
      }
      const note =
        decision === 'approve'
          ? 'You approved the draft — it now shows in your Drafts, ready to edit and schedule.'
          : decision === 'reject'
            ? 'You rejected the draft.'
            : 'You asked for changes on the draft.'
      setMessages((prev) => [
        ...prev,
        {
          id: makeId('msg'),
          conversationId: activeConversationId,
          authorType: 'system',
          authorName: 'System',
          authorInitials: '',
          text: note,
          timestamp: new Date().toISOString(),
          kind: 'system_note',
        },
      ])
    },
    [activeConversationId, setDraftStage],
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
      conversations,
      messages,
      activeConversationId,
      setActiveConversationId,
      widgetState,
      openBubble,
      expand,
      minimize,
      close,
      sendReply,
      respondToDraftOffer,
      hasUnread,
    }),
    [conversations, messages, activeConversationId, widgetState, hasUnread, sendReply, respondToDraftOffer],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
