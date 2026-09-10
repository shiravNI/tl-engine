import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError, useNavigate } from 'react-router-dom'
import { Button } from '@/components/primitives/Button'
import { Card } from '@/components/primitives/Card'

const RELOAD_GUARD_KEY = 'tl-engine:chunk-reload-guard'

/** True for the "stale lazy chunk" class of error — not a real app bug. */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    /failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message)
  )
}

/**
 * Route-level error boundary.
 *
 * Lazy-loaded route chunks can go stale mid-session (a dev-server file edit,
 * or a production redeploy that changes chunk hashes while a tab is still
 * open) and throw "Failed to fetch dynamically imported module" the next
 * time a route not currently mounted gets navigated to. That's not an app
 * bug, but left unhandled it surfaces to the user as a blank crash screen —
 * so this boundary auto-recovers from it with a single reload (guarded by
 * sessionStorage so a genuinely broken chunk can't reload-loop forever),
 * and falls back to a plain, on-brand "something went wrong" card with a
 * manual retry for every other error.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const chunkLoadError = isChunkLoadError(error)

  useEffect(() => {
    if (!chunkLoadError) return
    const alreadyTried = sessionStorage.getItem(RELOAD_GUARD_KEY)
    if (alreadyTried) return
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
    window.location.reload()
  }, [chunkLoadError])

  // Clear the guard once a route renders successfully again, so a future
  // genuine stale-chunk error still gets one auto-recovery attempt.
  useEffect(() => {
    return () => sessionStorage.removeItem(RELOAD_GUARD_KEY)
  }, [])

  if (chunkLoadError) {
    // Reload is already in flight — render nothing jarring in the meantime.
    return null
  }

  const status = isRouteErrorResponse(error) ? error.status : undefined
  const message = error instanceof Error ? error.message : 'Something went wrong loading this page.'

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
      <Card elevated className="max-w-md p-8 text-center">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
          {status ? `Error ${status}` : 'Something went wrong'}
        </p>
        <h2 className="mt-2 font-display text-xl text-ink">This page hit a snag.</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-body">{message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </Card>
    </div>
  )
}
