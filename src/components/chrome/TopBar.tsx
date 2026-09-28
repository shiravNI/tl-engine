import { Icon } from '@/components/icons/Icon'
import { Avatar } from '@/components/primitives/Avatar'
import { Pill } from '@/components/primitives/Pill'
import { ViewSwitcher } from '@/components/chrome/ViewSwitcher'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components/primitives/DropdownMenu'
import { useAppShell } from '@/state/AppShellContext'
import { useGamification } from '@/state/GamificationContext'

export function TopBar() {
  const { currentUser, searchQuery, setSearchQuery } = useAppShell()
  const { streak } = useGamification()

  return (
    <header className="flex h-[58px] flex-none items-center gap-4 border-b border-border bg-surface px-5">
      <div className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[9px] bg-espresso font-mono text-[11px] font-medium text-cream">
        TL
      </div>
      <span className="font-display text-[14px] font-bold text-ink">TL Engine</span>
      <ViewSwitcher />
      <div className="flex-1" />
      <label className="flex h-8 w-[190px] items-center gap-1.5 rounded-lg border border-border bg-cream px-2.5 text-muted transition-colors focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--tl-accent-10)]">
        <Icon name="search" className="h-[15px] w-[15px]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ideas, posts…"
          className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted"
        />
      </label>
      {streak && (
        <Pill tone="neutral" className="gap-1.5 py-1.5">
          <Icon name="flame" className="h-[13px] w-[13px] text-terracotta" />
          {streak.currentWeeks}
        </Pill>
      )}
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Notifications"
            className="text-muted transition-colors hover:text-ink"
          >
            <Icon name="bell" className="h-[18px] w-[18px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Notifications
          </div>
          <DropdownMenuItem>The Assistant replied in chat</DropdownMenuItem>
          <DropdownMenuItem>Your Thursday post is scheduled</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
      <Avatar initials={currentUser.initials} />
    </header>
  )
}
