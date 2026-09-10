import { Skeleton } from '@/components/primitives/Skeleton'

/**
 * Full-page loading fallback shown while a lazy-loaded route chunk is
 * fetched. Reuses the existing Skeleton primitive rather than a bare
 * spinner so it reads as "content is loading" consistent with the rest
 * of the app (e.g. the Insights & Data progressive-skeleton pattern).
 */
export function RouteFallback() {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col gap-4 p-8">
      <Skeleton height={28} width="40%" />
      <Skeleton height={16} width="70%" />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton height={120} rounded="md" />
        <Skeleton height={120} rounded="md" />
        <Skeleton height={120} rounded="md" />
      </div>
      <Skeleton height={200} rounded="md" />
    </div>
  )
}
