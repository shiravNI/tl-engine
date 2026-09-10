import { useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { Avatar } from '@/components/primitives/Avatar'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { useChat } from '@/state/ChatContext'
import { useContent } from '@/state/ContentContext'
import { cx } from '@/lib/cx'

function MessageBubble({ message }: { message: ReturnType<typeof useChat>['messages'][number] }) {
  const { respondToDraftOffer } = useChat()
  const { getDraft } = useContent()

  if (message.kind === 'system_note') {
    return (
      <div className="self-center">
        <Pill tone="success">
          <Icon name="check" className="h-3 w-3" /> {message.text}
        </Pill>
      </div>
    )
  }

  if (message.kind === 'help_flag') {
    return (
      <div className="max-w-[80%] self-center rounded-lg border border-warn-border bg-warn-bg px-3.5 py-2.5">
        <div className="flex items-start gap-2">
          <Icon name="flag" className="mt-0.5 h-[15px] w-[15px] flex-none text-warn-fg" />
          <div>
            <p className="text-[13px] text-warn-fg">
              <b>You asked for help</b> on the topic below
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (message.kind === 'draft_offer') {
    const alreadyHandled = message.draftId ? getDraft(message.draftId)?.stage !== 'in_review' : false
    return (
      <div className="flex max-w-[80%] flex-col gap-2 self-start rounded-xl border border-accent-10 bg-surface p-3.5">
        <div className="flex items-center gap-1.5">
          <Icon name="pen" className="h-3.5 w-3.5 text-accent-dark" />
          <p className="text-[13px] font-semibold">
            {message.authorName} drafted "{message.draftTitle}" on your behalf
          </p>
        </div>
        <p className="text-[12px] text-muted">
          Written from your Voice Card · tone match {message.voiceMatch}% — she asked you to review before it
          goes anywhere.
        </p>
        {!alreadyHandled ? (
          <div className="flex gap-1.5">
            <Button size="sm" variant="primary" onClick={() => message.draftId && respondToDraftOffer(message.id, message.draftId, 'approve')}>
              Approve
            </Button>
            <Button size="sm" variant="secondary" onClick={() => message.draftId && respondToDraftOffer(message.id, message.draftId, 'changes')}>
              Request changes
            </Button>
            <Button size="sm" variant="danger" onClick={() => message.draftId && respondToDraftOffer(message.id, message.draftId, 'reject')}>
              Reject
            </Button>
          </div>
        ) : (
          <Pill tone="success">In your Drafts, ready to edit</Pill>
        )}
      </div>
    )
  }

  const isUser = message.authorType === 'user'
  return (
    <div className={cx('flex max-w-[75%] gap-2', isUser ? 'flex-row-reverse self-end' : 'self-start')}>
      {!isUser && <Avatar initials={message.authorInitials} size={26} tone="neutral" />}
      <div
        className={cx(
          'rounded-xl px-3.5 py-2.5',
          isUser ? 'rounded-br-[4px] bg-accent text-cream' : 'rounded-bl-[4px] border border-border-soft bg-surface',
        )}
      >
        <p className={cx('text-[13px]', !isUser && 'text-body')}>{message.text}</p>
      </div>
    </div>
  )
}

export function ChatWidget() {
  const { conversations, messages, activeConversationId, setActiveConversationId, widgetState, openBubble, expand, minimize, close, sendReply, hasUnread } = useChat()
  const [draft, setDraft] = useState('')

  const conversationMessages = messages.filter((m) => m.conversationId === activeConversationId)
  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  function handleSend() {
    if (!draft.trim()) return
    sendReply(draft)
    setDraft('')
  }

  if (widgetState === 'closed') {
    return (
      <button
        onClick={openBubble}
        aria-label="Open chat"
        className="fixed bottom-6 right-6 z-30 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent text-cream shadow-[0_6px_18px_rgba(168,81,50,0.35)]"
      >
        <Icon name="msg" className="h-[22px] w-[22px]" />
        {hasUnread && <span className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full border-2 border-cream bg-terracotta" />}
      </button>
    )
  }

  if (widgetState === 'bubble') {
    return (
      <>
        <div className="fixed bottom-24 right-6 z-30 flex w-[300px] flex-col overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
          <div className="flex items-center gap-2 bg-accent px-3.5 py-3 text-cream">
            <Avatar initials={activeConversation?.directorInitials ?? 'DL'} size={24} className="bg-white/20 text-cream" />
            <span className="flex-1 text-[12.5px] font-semibold">{activeConversation?.directorName} · Director</span>
            <button onClick={expand} title="Expand to full window" className="text-[14px]">
              ⤢
            </button>
            <button onClick={close} title="Close" className="text-[16px] opacity-85">
              –
            </button>
          </div>
          <div className="flex gap-1.5 border-b border-border-soft px-3 py-2">
            <span className="text-[12px] text-muted">Chat with any Director:</span>
            {conversations.map((c) => (
              <button key={c.id} onClick={() => setActiveConversationId(c.id)}>
                <Pill tone={c.id === activeConversationId ? 'accent' : 'neutral'}>{c.directorName.split(' ')[0]}</Pill>
              </button>
            ))}
          </div>
          <div className="flex max-h-[220px] flex-col gap-2.5 overflow-auto p-3.5">
            {conversationMessages.slice(-3).map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-border-soft p-2.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Reply…"
              className="h-[34px] flex-1 rounded-lg border border-border px-2.5 text-[12.5px] outline-none focus:border-accent"
            />
            <Button size="sm" variant="primary" onClick={handleSend}>
              <Icon name="send" className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </>
    )
  }

  // full
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
      <div className="flex h-[85vh] w-[900px] max-w-[95vw] flex-col overflow-hidden rounded-2xl bg-surface shadow-soft">
        <div className="flex items-center gap-2 border-b border-border-soft bg-cream px-4 py-3">
          <span className="text-[12px] text-muted">Available now:</span>
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setActiveConversationId(c.id)}>
              <Pill tone={c.id === activeConversationId ? 'accent' : 'neutral'} className="gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: c.status === 'online' ? 'var(--tl-success-fg)' : 'var(--tl-muted-2)' }}
                />
                {c.directorName} · Director
              </Pill>
            </button>
          ))}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={minimize}>
            – Minimize
          </Button>
        </div>
        <div className="flex items-center gap-3 border-b border-border bg-surface px-5.5 py-4">
          <Avatar initials={activeConversation?.directorInitials ?? 'DL'} size={32} tone="neutral" />
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">{activeConversation?.directorName}</div>
            <p className="text-[12px] text-muted">{activeConversation?.lastActivitySummary}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3.5 overflow-auto p-5.5">
          <div className="self-center">
            <Pill>Today</Pill>
          </div>
          {conversationMessages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
        <div className="flex items-center gap-2.5 border-t border-border bg-surface p-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Write a reply…"
            className="h-[42px] flex-1 rounded-lg border border-border px-3 text-[13px] outline-none focus:border-accent"
          />
          <Button variant="primary" onClick={handleSend}>
            <Icon name="send" className="h-3.5 w-3.5" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
