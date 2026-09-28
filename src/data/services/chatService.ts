// Chat against Supabase — real per-user `conversations` + `chat_messages`.
// A `conversations` row is created lazily on first fetch-with-none-found
// (never seeded at signup, never seeded with a demo message) — a brand-new
// account's chat starts genuinely empty. The "Assistant" persona isn't a
// second real account; there is exactly one conversation per user.
import { supabase } from '@/lib/supabaseClient'
import type { ChatMessage, Conversation } from '@/data/types'

interface ConversationRow {
  id: string
  assistant_name: string
  assistant_initials: string
  status: string
  last_activity_summary: string
}

export function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    assistantName: row.assistant_name,
    assistantInitials: row.assistant_initials,
    status: row.status as Conversation['status'],
    lastActivitySummary: row.last_activity_summary,
  }
}

interface ChatMessageRow {
  id: string
  conversation_id: string
  author_type: string
  author_name: string
  author_initials: string
  text: string
  kind: string
  draft_id: string | null
  created_at: string
}

export function rowToChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorType: row.author_type as ChatMessage['authorType'],
    authorName: row.author_name,
    authorInitials: row.author_initials,
    text: row.text,
    timestamp: row.created_at,
    kind: row.kind as ChatMessage['kind'],
    draftId: row.draft_id ?? undefined,
  }
}

export function chatMessageToInsertRow(userId: string, message: ChatMessage): Record<string, unknown> {
  return {
    id: message.id,
    user_id: userId,
    conversation_id: message.conversationId,
    author_type: message.authorType,
    author_name: message.authorName,
    author_initials: message.authorInitials,
    text: message.text,
    kind: message.kind,
    draft_id: message.draftId ?? null,
    created_at: message.timestamp,
  }
}

/** Fetches the user's one conversation, lazily creating it (with the
 * default Assistant identity, no seeded messages) the first time none is
 * found. */
export async function fetchConversation(userId: string): Promise<Conversation> {
  const { data, error } = await supabase.from('conversations').select('*').eq('user_id', userId)
  if (!error && data && data.length > 0) {
    return rowToConversation(data[0] as ConversationRow)
  }

  const row: ConversationRow & { user_id: string } = {
    id: crypto.randomUUID(),
    user_id: userId,
    assistant_name: 'Assistant',
    assistant_initials: 'AI',
    status: 'online',
    last_activity_summary: '',
  }
  await supabase.from('conversations').insert(row)
  return rowToConversation(row)
}

export async function fetchChatMessages(userId: string, conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as ChatMessageRow[]).map(rowToChatMessage)
}

export async function insertChatMessage(userId: string, message: ChatMessage): Promise<void> {
  await supabase.from('chat_messages').insert(chatMessageToInsertRow(userId, message))
}
