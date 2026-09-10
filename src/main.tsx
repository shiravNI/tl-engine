import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes/router'
import { AppShellProvider } from '@/state/AppShellContext'
import { ContentProvider } from '@/state/ContentContext'
import { GamificationProvider } from '@/state/GamificationContext'
import { ChatProvider } from '@/state/ChatContext'
import { TooltipProvider } from '@/components/primitives/Tooltip'
import '@/theme/tokens.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppShellProvider>
        <ContentProvider>
          <GamificationProvider>
            <ChatProvider>
              <TooltipProvider>
                <RouterProvider router={router} />
              </TooltipProvider>
            </ChatProvider>
          </GamificationProvider>
        </ContentProvider>
      </AppShellProvider>
    </QueryClientProvider>
  </StrictMode>,
)
