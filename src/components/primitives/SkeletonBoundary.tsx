import type { ReactNode } from 'react'

interface SkeletonBoundaryProps {
  isLoading: boolean
  fallback: ReactNode
  children: ReactNode
}

/**
 * Renders `fallback` while `isLoading`, then swaps to `children` — used
 * per-tile on the Insights & Data screen so each block appears the moment
 * its own query resolves, rather than gating the whole page behind one
 * screen-level spinner.
 */
export function SkeletonBoundary({ isLoading, fallback, children }: SkeletonBoundaryProps) {
  return <>{isLoading ? fallback : children}</>
}
