import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/icons/Icon'
import { Pill } from '@/components/primitives/Pill'
import { Tooltip } from '@/components/primitives/Tooltip'
import { useContent } from '@/state/ContentContext'
import { cx } from '@/lib/cx'

export type SideNavVariant = 'full' | 'locked' | 'abbreviated'

interface SideNavProps {
  variant: SideNavVariant
}

function NavRow({
  icon,
  label,
  to,
  active,
  disabled,
  disabledReason,
  trailing,
}: {
  icon?: IconName
  label: string
  to?: string
  active?: boolean
  disabled?: boolean
  disabledReason?: string
  trailing?: ReactNode
}) {
  const content = (
    <span
      className={cx(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium leading-none transition-colors',
        active ? 'bg-accent-05 font-semibold text-accent-dark' : 'text-body',
        disabled ? 'cursor-not-allowed opacity-50' : !active && 'hover:bg-bg',
      )}
    >
      {icon && <Icon name={icon} className="h-[18px] w-[18px]" />}
      <span className="flex-1">{label}</span>
      {trailing}
    </span>
  )

  const row = disabled || !to ? <div>{content}</div> : <NavLink to={to}>{content}</NavLink>

  if (disabled && disabledReason) {
    return <Tooltip content={disabledReason}>{row}</Tooltip>
  }
  return row
}

function SubRow({ label, to, active }: { label: string; to?: string; active?: boolean }) {
  const content = (
    <span
      className={cx(
        'flex items-center rounded-lg py-1.5 pl-[34px] text-[12.5px] leading-none transition-colors',
        active ? 'font-semibold text-accent-dark' : 'text-muted hover:text-body',
      )}
    >
      {label}
    </span>
  )
  return to ? <NavLink to={to}>{content}</NavLink> : content
}

export function SideNav({ variant }: SideNavProps) {
  const location = useLocation()
  const { ideas } = useContent()
  const ideaCount = ideas.filter((i) => !i.archivedAt).length
  const path = location.pathname

  const onCreate = path.startsWith('/create')
  const onInsights = path.startsWith('/insights')

  if (variant === 'abbreviated') {
    return (
      <nav className="flex w-[212px] flex-none flex-col gap-0.5 border-r border-border bg-surface p-3">
        <p className="px-2.5 pb-2 pt-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
          My space
        </p>
        <NavRow icon="bulb" label="Brain" to="/create" />
        <Tooltip content="Core isn't part of this preview yet">
          <div>
            <NavRow icon="core" label="Core" disabled />
          </div>
        </Tooltip>
        <NavRow icon="send" label="Output" to="/insights/posts" />
        <NavRow icon="folder" label="Archive" to="/archive" active={path.startsWith('/archive')} />
      </nav>
    )
  }

  const locked = variant === 'locked'

  return (
    <nav className="flex w-[212px] flex-none flex-col gap-0.5 border-r border-border bg-surface p-3">
      <p className="px-2.5 pb-2 pt-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
        My space
      </p>
      <NavRow icon="pen" label="Create" to="/create" active={onCreate} />
      {onCreate && (
        <div className="mb-1 flex flex-col">
          <SubRow label="Ideas & drafts" to="/create" active={path === '/create'} />
          <SubRow
            label="Script & shoot planner"
            to="/create/video-board"
            active={path.startsWith('/create/video-board')}
          />
          <SubRow label="Carousel" to="/create/carousel" active={path.startsWith('/create/carousel')} />
        </div>
      )}
      <NavRow icon="inbox" label="Newsletter" to="/newsletter" active={path === '/newsletter'} disabled={locked} />
      <NavRow
        icon="chart"
        label="Insights & Data"
        to="/insights/posts"
        active={onInsights}
        disabled={locked}
        disabledReason="Unlocks after your first published post."
      />
      {onInsights && !locked && (
        <div className="mb-1 flex flex-col">
          <SubRow label="Overview" />
          <SubRow label="Posts" to="/insights/posts" active />
          <SubRow label="Audience" />
          <SubRow label="Benchmarks" />
        </div>
      )}
      <div className="my-2 h-px bg-border-soft" />
      <NavRow
        icon="bulb"
        label="Brain"
        to="/create"
        trailing={!locked && <Pill className="ml-auto">{ideaCount}</Pill>}
      />
      <Tooltip content="Core isn't part of this preview yet">
        <div>
          <NavRow icon="core" label="Core" disabled />
        </div>
      </Tooltip>
      <NavRow icon="send" label="Output" to="/insights/posts" disabled={locked} />
      {!locked && <NavRow icon="trophy" label="Milestones" to="/milestones" active={path === '/milestones'} />}
      {!locked && <NavRow icon="folder" label="Archive" to="/archive" active={path.startsWith('/archive')} />}
      <div className="flex-1" />
      {!locked && <NavRow icon="switch" label="Switch view" to="/" />}
    </nav>
  )
}
