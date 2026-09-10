import type { ChatMessage, Conversation } from '@/data/types'

export const conversations: Conversation[] = [
  {
    id: 'conv_dana',
    directorId: 'user_dana',
    directorName: 'Dana L.',
    directorInitials: 'DL',
    status: 'online',
    lastActivitySummary: 'Your Director · usually replies same day',
  },
  {
    id: 'conv_shira',
    directorId: 'user_shira',
    directorName: 'Shira H.',
    directorInitials: 'SH',
    status: 'offline',
    lastActivitySummary: 'Director',
  },
]

export const DIRECTOR_DRAFT_OFFER_ID = 'draft_director_offer'

// Scripted, pre-written conversation with the Director — mock fixture data
// only, per the locked decision. No persona-swap, no way to author new
// Director content from this build.
export const chatMessages: ChatMessage[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_dana',
    authorType: 'director',
    authorId: 'user_dana',
    authorName: 'Dana L.',
    authorInitials: 'DL',
    text: 'Dana drafted "Why partner decks should open with churn" on your behalf',
    timestamp: '2026-09-02T09:00:00Z',
    kind: 'draft_offer',
    draftId: DIRECTOR_DRAFT_OFFER_ID,
    draftTitle: 'Why partner decks should open with churn',
    voiceMatch: 84,
  },
  {
    id: 'msg_2',
    conversationId: 'conv_dana',
    authorType: 'director',
    authorId: 'user_dana',
    authorName: 'Dana L.',
    authorInitials: 'DL',
    text: 'Saw your draft is stuck — what’s blocking it? Happy to jump on a call.',
    timestamp: '2026-09-02T09:02:00Z',
    kind: 'text',
  },
  {
    id: 'msg_3',
    conversationId: 'conv_dana',
    authorType: 'system',
    authorName: 'System',
    authorInitials: '',
    text: 'You asked for help on "Three things I got wrong about brand budgets"',
    timestamp: '2026-09-02T09:14:00Z',
    kind: 'help_flag',
  },
  {
    id: 'msg_4',
    conversationId: 'conv_dana',
    authorType: 'user',
    authorId: 'user_shira',
    authorName: 'Shira H.',
    authorInitials: 'SH',
    text: "I don't have a real example to back the middle section — it's all theory right now. Can you point me to a number I can use?",
    timestamp: '2026-09-02T09:14:30Z',
    kind: 'text',
  },
  {
    id: 'msg_5',
    conversationId: 'conv_dana',
    authorType: 'director',
    authorId: 'user_dana',
    authorName: 'Dana L.',
    authorInitials: 'DL',
    text: "Use the retention curve from the Q1 brand-lift study — I'll drop the deck in your Core. That's exactly the number this post needs.",
    timestamp: '2026-09-02T09:21:00Z',
    kind: 'text',
  },
  {
    id: 'msg_6',
    conversationId: 'conv_dana',
    authorType: 'system',
    authorName: 'System',
    authorInitials: '',
    text: 'Marked resolved by Dana L.',
    timestamp: '2026-09-02T09:22:00Z',
    kind: 'system_note',
  },
]
