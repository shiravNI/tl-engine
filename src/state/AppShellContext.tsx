import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { CURRENT_USER_ID, getUserById } from '@/data/fixtures/users'
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

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('personal')
  const [searchQuery, setSearchQuery] = useState('')
  const currentUser = useMemo(() => getUserById(CURRENT_USER_ID)!, [])

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
