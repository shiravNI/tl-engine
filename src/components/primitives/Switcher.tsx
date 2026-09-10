import { cx } from '@/lib/cx'

export interface SwitcherOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface SwitcherProps<T extends string> {
  options: SwitcherOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Switcher<T extends string>({ options, value, onChange, className }: SwitcherProps<T>) {
  return (
    <div className={cx('flex gap-0.5 rounded-full bg-chip p-0.5', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cx(
            'flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10.5px] font-medium uppercase leading-none tracking-[0.06em] transition-colors',
            value === opt.value ? 'bg-cream text-ink shadow-sm' : 'text-muted hover:text-body',
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
