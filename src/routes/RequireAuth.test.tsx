import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireAnonymous, RequireAuth, RequireOnboardingIncomplete } from '@/routes/RequireAuth'

// Fully mocked `useAuth` so each test controls status/onboarding state
// directly, without needing a real session or Supabase round-trip.
const mockUseAuth = vi.fn()
vi.mock('@/state/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// `RequireAuth` mounts AppShellProvider/ContentProvider/GamificationProvider/
// ChatProvider around its children, which hydrate via the services layer —
// mock the Supabase client so that hydration resolves offline.
vi.mock('@/lib/supabaseClient', async () => {
  const { createMockSupabaseClient, defaultSeed } = await import('@/test/supabaseTestUtils')
  return {
    supabase: createMockSupabaseClient(defaultSeed()),
    isSupabaseConfigured: true,
  }
})

const AUTHENTICATED_PROFILE = {
  userId: 'user_test_1',
  email: 'test.user@naturalint.com',
  name: 'Test User',
  initials: 'TU',
  role: 'cast' as const,
  title: 'Cast member',
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/login"
          element={
            <RequireAnonymous>
              <div>Login page</div>
            </RequireAnonymous>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireOnboardingIncomplete>
              <div>Onboarding page</div>
            </RequireOnboardingIncomplete>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <div>Protected home</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockUseAuth.mockReset()
})

describe('RequireAuth', () => {
  it('shows a loading fallback while auth status is resolving (no redirect, no protected content)', () => {
    mockUseAuth.mockReturnValue({ status: 'loading', onboardingCompletedAt: undefined, onboardingSkipped: undefined })
    renderAt('/')
    expect(screen.queryByText('Protected home')).not.toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })

  it('redirects an unauthenticated user to /login', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated', onboardingCompletedAt: undefined, onboardingSkipped: undefined })
    renderAt('/')
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects an authenticated user with incomplete, un-skipped onboarding to /onboarding', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      profile: AUTHENTICATED_PROFILE,
      onboardingCompletedAt: null,
      onboardingSkipped: false,
    })
    renderAt('/')
    expect(screen.getByText('Onboarding page')).toBeInTheDocument()
  })

  it('renders protected content once authenticated and onboarding is complete', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      profile: AUTHENTICATED_PROFILE,
      onboardingCompletedAt: '2026-01-01T00:00:00Z',
      onboardingSkipped: false,
    })
    renderAt('/')
    await waitFor(() => expect(screen.getByText('Protected home')).toBeInTheDocument())
  })

  it('lets a user who skipped onboarding into the protected area even though it is not completed', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      profile: AUTHENTICATED_PROFILE,
      onboardingCompletedAt: null,
      onboardingSkipped: true,
    })
    renderAt('/')
    await waitFor(() => expect(screen.getByText('Protected home')).toBeInTheDocument())
  })
})

describe('RequireAnonymous', () => {
  it('redirects an already-authenticated user away from /login', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      profile: AUTHENTICATED_PROFILE,
      onboardingCompletedAt: '2026-01-01T00:00:00Z',
      onboardingSkipped: false,
    })
    renderAt('/login')
    await waitFor(() => expect(screen.getByText('Protected home')).toBeInTheDocument())
  })

  it('renders the login page for an unauthenticated user', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated' })
    renderAt('/login')
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})

describe('RequireOnboardingIncomplete', () => {
  it('redirects an unauthenticated user to /login', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated' })
    renderAt('/onboarding')
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects a user who already completed onboarding to /', async () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      profile: AUTHENTICATED_PROFILE,
      onboardingCompletedAt: '2026-01-01T00:00:00Z',
      onboardingSkipped: false,
    })
    renderAt('/onboarding')
    await waitFor(() => expect(screen.getByText('Protected home')).toBeInTheDocument())
  })

  it('renders the onboarding page for a mid-onboarding (not yet completed) user', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      profile: AUTHENTICATED_PROFILE,
      onboardingCompletedAt: null,
      onboardingSkipped: false,
    })
    renderAt('/onboarding')
    expect(screen.getByText('Onboarding page')).toBeInTheDocument()
  })
})
