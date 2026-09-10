import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes/router'
import { AuthProvider } from '@/state/AuthContext'
import { TooltipProvider } from '@/components/primitives/Tooltip'
import '@/theme/tokens.css'

// AppShellProvider/ContentProvider/GamificationProvider/ChatProvider are
// mounted inside `RequireAuth` (src/routes/RequireAuth.tsx), not here —
// they depend on a signed-in user and only ever render once one exists.
// AuthProvider stays at the top since /login and /onboarding also need it.

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
