import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from '@/components/chrome/TopBar'
import { SideNav, type SideNavVariant } from '@/components/chrome/SideNav'
import { ChatWidget } from '@/features/chat/ChatWidget'
import { useContent } from '@/state/ContentContext'
import { useAppShell } from '@/state/AppShellContext'
import { RouteFallback } from '@/routes/RouteFallback'

export function RootLayout() {
  const location = useLocation()
  const { ideas, drafts, loading } = useContent()
  const { viewMode } = useAppShell()

  const isBrandNewUser =
    !loading &&
    ideas.filter((i) => !i.archivedAt).length === 0 &&
    drafts.filter((d) => d.stage !== 'archived').length === 0

  let variant: SideNavVariant = 'full'
  if (location.pathname.startsWith('/archive')) variant = 'abbreviated'
  else if (isBrandNewUser) variant = 'locked'

  return (
    <div className={viewMode === 'mastermind' ? 'mastermind' : undefined}>
      <div className="flex h-screen flex-col bg-bg">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <SideNav variant={variant} />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
        <ChatWidget />
      </div>
    </div>
  )
}
