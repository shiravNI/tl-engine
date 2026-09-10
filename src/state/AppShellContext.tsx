import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/state/AuthContext'
import type { User, ViewMode } from '@/data/types'

interface AppShellContextValue {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  currentUser: User
  /** Whether the signed-in user belongs to any Mastermind cohort — drives
   * the `1n` empty state. Personal mode is the only mode this build ships,
   * so this is always false, but it's modeled as real state (not a
   * hardcoded constant in the component) so Mastermind's arrival later is
   * a data change, not a restructuring. */
  hasCohort: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const AppShellContext = createContext<AppShellContextValue | undefined>(undefined)

/**
 * `AppShellProvider` only ever mounts *inside* the auth-guarded route tree
 * (see `RequireAuth` in `src/routes/RequireAuth.tsx`), so `useAuth().profile`
 * is guaranteed non-null here — `AuthContext` only reaches `status:
 * 'authenticated'` once the profile has loaded. That keeps `currentUser`'s
 * public shape exactly as it was before (`User`, always non-null).
 */
export function AppShellProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('personal')
  const [searchQuery, setSearchQuery] = useState('')

  const currentUser = useMemo<User>(() => {
    if (!profile) {
      // Defensive fallback only — should be unreachable given RequireAuth,
      // but keeps currentUser's type honestly non-null rather than `!`-ing
      // past a null profile.
      return { id: '', name: '', initials: '', role: 'cast', title: '' }
    }
    return {
      id: profile.userId,
      name: profile.name,
      initials: profile.initials,
      role: profile.role,
      title: profile.title,
    }
  }, [profile])

  const value = useMemo<AppShellContextValue>(
    () => ({
      viewMode,
      setViewMode,
      currentUser,
      hasCohort: false,
      searchQuery,
      setSearchQuery,
    }),
    [viewMode, currentUser, searchQuery],
  )

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}

export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext)
  if (!ctx) throw new Error('useAppShell must be used within AppShellProvider')
  return ctx
}
