import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/state/AuthContext'
import { AppShellProvider } from '@/state/AppShellContext'
import { ContentProvider } from '@/state/ContentContext'
import { GamificationProvider } from '@/state/GamificationContext'
import { ChatProvider } from '@/state/ChatContext'
import { RouteFallback } from '@/routes/RouteFallback'

/**
 * Wraps the `/` route tree. Wrapper components rather than router loaders,
 * per the plan — loaders can't reuse `AuthContext`'s reactive state
 * without re-implementing session tracking.
 *
 * Also where `AppShellProvider`/`ContentProvider`/`GamificationProvider`/
 * `ChatProvider` mount — they only ever render once a user is signed in
 * *and* has finished (or explicitly skipped) onboarding, so
 * `AppShellContext`'s `currentUser` can stay non-null with zero changes
 * needed in its 3 existing consumers.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, onboardingCompletedAt, onboardingSkipped } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <RouteFallback />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  // Still loading onboarding_state (a beat after profile resolves).
  if (onboardingCompletedAt === undefined) return <RouteFallback />
  if (onboardingCompletedAt === null && !onboardingSkipped) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <AppShellProvider>
      <ContentProvider>
        <GamificationProvider>
          <ChatProvider>{children}</ChatProvider>
        </GamificationProvider>
      </ContentProvider>
    </AppShellProvider>
  )
}

/** Guards `/login` — a signed-in user shouldn't see the login gate again. */
export function RequireAnonymous({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') return <RouteFallback />
  if (status === 'authenticated') return <Navigate to="/" replace />

  return <>{children}</>
}

/**
 * Guards `/onboarding` + `/onboarding/interview`. Checks
 * `onboarding_state.completed_at`, not just auth, so a user who already
 * finished onboarding can't silently re-run it and overwrite their Voice
 * Card. A user who only *skipped* it can still return (they haven't
 * completed it), which is what lets "finish later" mean something.
 */
export function RequireOnboardingIncomplete({ children }: { children: ReactNode }) {
  const { status, onboardingCompletedAt } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <RouteFallback />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (onboardingCompletedAt === undefined) return <RouteFallback />
  if (onboardingCompletedAt !== null) return <Navigate to="/" replace />

  return <>{children}</>
}
