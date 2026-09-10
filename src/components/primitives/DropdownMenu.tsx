import * as RadixDropdown from '@radix-ui/react-dropdown-menu'
import { cx } from '@/lib/cx'

export const DropdownMenuRoot = RadixDropdown.Root
export const DropdownMenuTrigger = RadixDropdown.Trigger

export function DropdownMenuContent({ className, ...props }: RadixDropdown.DropdownMenuContentProps) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        sideOffset={6}
        align="end"
        className={cx(
          'z-50 min-w-[180px] rounded-2xl border border-border bg-surface p-1.5 shadow-soft',
          className,
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  )
}

export function DropdownMenuItem({ className, ...props }: RadixDropdown.DropdownMenuItemProps) {
  return (
    <RadixDropdown.Item
      className={cx(
        'cursor-pointer rounded-xl px-3 py-2 text-[12.5px] font-medium text-body outline-none data-[highlighted]:bg-oat',
        className,
      )}
      {...props}
    />
  )
}
