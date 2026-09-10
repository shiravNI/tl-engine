import * as RadixTabs from '@radix-ui/react-tabs'
import { cx } from '@/lib/cx'

export const TabsRoot = RadixTabs.Root
export const TabsContent = RadixTabs.Content

export function TabsList({ className, ...props }: RadixTabs.TabsListProps) {
  return <RadixTabs.List className={cx('flex items-center gap-5', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cx(
        'border-b-2 border-transparent pb-3 text-[13px] font-medium text-muted transition-colors',
        'data-[state=active]:border-accent data-[state=active]:font-semibold data-[state=active]:text-ink',
        className,
      )}
      {...props}
    />
  )
}
