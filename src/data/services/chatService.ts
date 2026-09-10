import { chatMessages as messagesFixture, conversations as conversationsFixture } from '@/data/fixtures/chatMessages'
import { mockAsync } from '@/lib/mockAsync'
import type { ChatMessage, Conversation } from '@/data/types'

export async function fetchConversations(): Promise<Conversation[]> {
  return mockAsync(conversationsFixture, 120)
}

export async function fetchMessages(): Promise<ChatMessage[]> {
  return mockAsync(messagesFixture, 200)
}
