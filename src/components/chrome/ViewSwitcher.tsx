import { Icon } from '@/components/icons/Icon'
import { Tooltip } from '@/components/primitives/Tooltip'
import { useAppShell } from '@/state/AppShellContext'
import { cx } from '@/lib/cx'

export function ViewSwitcher() {
  const { viewMode, setViewMode } = useAppShell()

  return (
    <div className="flex gap-0.5 rounded-full bg-chip p-0.5">
      <button
        type="button"
        onClick={() => setViewMode('personal')}
        className={cx(
          'flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10.5px] font-medium uppercase leading-none tracking-[0.06em] transition-colors',
          viewMode === 'personal' ? 'bg-cream text-ink shadow-sm' : 'text-muted',
        )}
      >
        <Icon name="user" className="h-3.5 w-3.5" />
        Personal
      </button>
      <Tooltip content="Coming soon — Director-only">
        <button
          type="button"
          disabled
          className="flex cursor-not-allowed items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10.5px] font-medium uppercase leading-none tracking-[0.06em] text-muted-2 opacity-60"
        >
          <Icon name="users" className="h-3.5 w-3.5" />
          Mastermind
        </button>
      </Tooltip>
    </div>
  )
}
