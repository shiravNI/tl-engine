import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '@/routes/RootLayout'
import { PrimitivesSanityPage } from '@/routes/PrimitivesSanityPage'
import { RouteFallback } from '@/routes/RouteFallback'
import { RouteErrorBoundary } from '@/routes/RouteErrorBoundary'
import { RequireAuth, RequireAnonymous, RequireOnboardingIncomplete } from '@/routes/RequireAuth'

const LoginPage = lazy(() => import('@/features/onboarding/LoginPage').then((m) => ({ default: m.LoginPage })))
const OnboardingMapPage = lazy(() =>
  import('@/features/onboarding/OnboardingMapPage').then((m) => ({ default: m.OnboardingMapPage })),
)
const InterviewPage = lazy(() =>
  import('@/features/onboarding/InterviewPage').then((m) => ({ default: m.InterviewPage })),
)
const HomePage = lazy(() => import('@/features/dashboard/HomePage').then((m) => ({ default: m.HomePage })))
const CreateDashboardPage = lazy(() =>
  import('@/features/dashboard/CreateDashboardPage').then((m) => ({ default: m.CreateDashboardPage })),
)
const ComposerPage = lazy(() => import('@/features/composer/ComposerPage').then((m) => ({ default: m.ComposerPage })))
const VideoBoardPage = lazy(() =>
  import('@/features/video-board/VideoBoardPage').then((m) => ({ default: m.VideoBoardPage })),
)
const CarouselDraftPage = lazy(() =>
  import('@/features/carousel/CarouselDraftPage').then((m) => ({ default: m.CarouselDraftPage })),
)
const CarouselEditorPage = lazy(() =>
  import('@/features/carousel/CarouselEditorPage').then((m) => ({ default: m.CarouselEditorPage })),
)
const NewsletterPage = lazy(() =>
  import('@/features/newsletter/NewsletterPage').then((m) => ({ default: m.NewsletterPage })),
)
const ResourcesPage = lazy(() =>
  import('@/features/newsletter/ResourcesPage').then((m) => ({ default: m.ResourcesPage })),
)
const InsightsPostsPage = lazy(() =>
  import('@/features/insights/InsightsPostsPage').then((m) => ({ default: m.InsightsPostsPage })),
)
const MilestonesPage = lazy(() =>
  import('@/features/milestones/MilestonesPage').then((m) => ({ default: m.MilestonesPage })),
)
const ArchivePage = lazy(() => import('@/features/archive/ArchivePage').then((m) => ({ default: m.ArchivePage })))
const BrainPage = lazy(() => import('@/features/brain/BrainPage').then((m) => ({ default: m.BrainPage })))

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RequireAnonymous>
        <Suspense fallback={<RouteFallback />}>
          <LoginPage />
        </Suspense>
      </RequireAnonymous>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/onboarding',
    element: (
      <RequireOnboardingIncomplete>
        <Suspense fallback={<RouteFallback />}>
          <OnboardingMapPage />
        </Suspense>
      </RequireOnboardingIncomplete>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/onboarding/interview',
    element: (
      <RequireOnboardingIncomplete>
        <Suspense fallback={<RouteFallback />}>
          <InterviewPage />
        </Suspense>
      </RequireOnboardingIncomplete>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <RootLayout />
      </RequireAuth>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'create',
        children: [
          { index: true, element: <CreateDashboardPage /> },
          { path: 'drafts/new', element: <ComposerPage /> },
          { path: 'drafts/:draftId', element: <ComposerPage /> },
          { path: 'video-board', element: <VideoBoardPage /> },
          { path: 'carousel', element: <CarouselDraftPage /> },
          { path: 'carousel/:deckId', element: <CarouselEditorPage /> },
        ],
      },
      {
        path: 'newsletter',
        children: [
          { index: true, element: <NewsletterPage /> },
          { path: 'resources', element: <ResourcesPage /> },
        ],
      },
      { path: 'insights', element: <Navigate to="/insights/posts" replace /> },
      { path: 'insights/posts', element: <InsightsPostsPage /> },
      { path: 'milestones', element: <MilestonesPage /> },
      { path: 'archive', element: <ArchivePage /> },
      { path: 'brain', element: <BrainPage /> },
      { path: 'dev/primitives', element: <PrimitivesSanityPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
