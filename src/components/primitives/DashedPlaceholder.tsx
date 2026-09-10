import type { HTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

export function DashedPlaceholder({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-cream text-[11px] font-medium text-muted-2',
        className,
      )}
      {...props}
    />
  )
}
