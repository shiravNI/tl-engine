import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'
import { cx } from '@/lib/cx'

interface DisclosureProps {
  /** Trigger content. A plain string gets the default link-like styling;
   * pass custom markup (e.g. an icon + title) to fully control it. */
  label: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
  triggerClassName?: string
}

/**
 * Generic expand/collapse affordance for progressive disclosure — reference
 * material, long explanatory text, or secondary detail that shouldn't be
 * visible at a glance. Uncontrolled (local state only), so it never touches
 * app/domain state — purely presentational.
 */
export function Disclosure({ label, defaultOpen = false, children, className, triggerClassName }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cx(
          'flex w-full items-center gap-1.5 text-left text-[12px] font-semibold text-accent-dark',
          triggerClassName,
        )}
      >
        <Icon name="chev" className={cx('h-3 w-3 flex-none transition-transform', open && 'rotate-90')} />
        <span className="flex-1">{label}</span>
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  )
}
