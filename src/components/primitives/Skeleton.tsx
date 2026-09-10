import { cx } from '@/lib/cx'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  className?: string
  rounded?: 'sm' | 'md' | 'full'
}

const roundedClasses = { sm: 'rounded', md: 'rounded-md', full: 'rounded-full' }

export function Skeleton({ width = '100%', height = 12, className, rounded = 'sm' }: SkeletonProps) {
  return (
    <div
      className={cx('animate-pulse bg-skeleton', roundedClasses[rounded], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
