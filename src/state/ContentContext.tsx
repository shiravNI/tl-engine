import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import {
  deleteDraft,
  deleteIdea,
  fetchCarouselDecks,
  fetchDrafts,
  fetchIdeas,
  fetchPosts,
  fetchVideoItems,
  insertDraft,
  insertIdea,
  insertVideoItem,
  setIdeaArchivedAt,
  updateCarouselSlideRow,
  updateDraftRow,
  updateVideoItemStage,
} from '@/data/services/contentService'
import { fetchVoiceCard } from '@/data/services/onboardingService'
import { useAppShell } from '@/state/AppShellContext'
import { canTransitionContentStage, canTransitionVideoStage } from '@/lib/statusPipeline'
import { makeId } from '@/lib/id'
import type {
  CarouselDeck,
  CarouselSlide,
  ContentStage,
  Draft,
  Idea,
  Pillar,
  PostAnalytics,
  VideoItem,
  VideoStage,
} from '@/data/types'
import type { ComposerSeed } from '@/lib/composerSeed'

interface ContentState {
  ideas: Idea[]
  drafts: Draft[]
  posts: PostAnalytics[]
  videoItems: VideoItem[]
  carouselDecks: CarouselDeck[]
}

type ContentAction =
  | { type: 'HYDRATE'; payload: ContentState }
  | { type: 'ADD_IDEA'; id: string; text: string; pillar: Pillar | null; createdAt?: string }
  | { type: 'ARCHIVE_IDEA'; id: string; archivedAt?: string }
  | { type: 'RESTORE_IDEA'; id: string }
  | { type: 'CREATE_DRAFT'; seed: ComposerSeed; id: string; now?: string; voiceMatchSeed?: number }
  | { type: 'UPDATE_DRAFT'; id: string; patch: Partial<Draft> }
  | { type: 'RUN_BS_CHECK'; id: string }
  | { type: 'HUMANIZE_DRAFT'; id: string }
  | { type: 'TOGGLE_CHECKLIST'; id: string; key: keyof Draft['checklist'] }
  | { type: 'SET_DRAFT_STAGE'; id: string; stage: ContentStage; scheduledFor?: string }
  | { type: 'RESTORE_DRAFT'; id: string }
  | { type: 'DELETE_ARCHIVED_DRAFT'; id: string }
  | { type: 'DELETE_ARCHIVED_IDEA'; id: string }
  | { type: 'DELETE_ARCHIVED_POST'; id: string }
  | { type: 'SET_VIDEO_STAGE'; id: string; stage: VideoStage }
  | { type: 'ADD_VIDEO_ITEM'; item: VideoItem }
  | { type: 'UPDATE_CAROUSEL_SLIDE'; deckId: string; slideId: string; patch: Partial<CarouselSlide> }
  | { type: 'REGENERATE_CAROUSEL'; deckId: string }

/** The exact note `RUN_BS_CHECK` sets — a module-level constant so the
 * reducer's local dispatch and the fire-and-forget Supabase write always
 * agree on the persisted text. */
const BS_CHECK_PASSED_NOTE =
  'Anchored to something specific only you could write — nobody else can write this version.'

/** Pure so it can be shared between the reducer's `HUMANIZE_DRAFT` case and
 * the `humanizeDraft` wrapper (which needs the same next values to persist
 * them, without waiting on React's async state update). */
export function humanizeStats(
  aiTexture: number,
  voiceMatch: number,
): { aiTexture: number; voiceMatch: number } {
  return { aiTexture: Math.max(0, aiTexture - 2), voiceMatch: Math.min(99, voiceMatch + 4) }
}

/** Pure so `CREATE_DRAFT` and the `createDraft` wrapper's fire-and-forget
 * insert build the exact same object. `voiceMatchSeed` is the new
 * Voice-Card-derived starting point (defaults to 0 to match pre-migration
 * behavior when omitted, e.g. in the reducer's own unit tests). */
export function buildDraftFromSeed(
  id: string,
  seed: ComposerSeed,
  now: string,
  voiceMatchSeed = 0,
): Draft {
  return {
    id,
    title: seed.title,
    paragraphs: seed.paragraphs,
    excerpt: seed.paragraphs[0] ?? '',
    pillar: seed.pillar,
    stage: 'draft',
    bsCheck: 'not_run',
    bsCheckNote: '',
    voiceMatch: voiceMatchSeed,
    aiTexture: 0,
    sourceIdeaId: seed.sourceIdeaId,
    sourceType: seed.sourceType,
    sourceLabel: seed.sourceLabel,
    checklist: {
      hookEarnsSeeMore: false,
      noLinksInBody: false,
      visualAttached: false,
      hashtagsAdded: false,
    },
    createdAt: now,
    updatedAt: now,
  }
}

function reducer(state: ContentState, action: ContentAction): ContentState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload

    case 'ADD_IDEA':
      return {
        ...state,
        ideas: [
          {
            id: action.id,
            text: action.text,
            pillar: action.pillar,
            source: 'manual',
            createdAt: action.createdAt ?? new Date().toISOString(),
          },
          ...state.ideas,
        ],
      }

    case 'ARCHIVE_IDEA':
      return {
        ...state,
        ideas: state.ideas.map((i) =>
          i.id === action.id ? { ...i, archivedAt: action.archivedAt ?? new Date().toISOString() } : i,
        ),
      }

    case 'RESTORE_IDEA':
      return {
        ...state,
        ideas: state.ideas.map((i) => (i.id === action.id ? { ...i, archivedAt: undefined } : i)),
      }

    case 'CREATE_DRAFT': {
      const now = action.now ?? new Date().toISOString()
      const draft = buildDraftFromSeed(action.id, action.seed, now, action.voiceMatchSeed)
      return { ...state, drafts: [draft, ...state.drafts] }
    }

    case 'UPDATE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.map((d) =>
          d.id === action.id
            ? { ...d, ...action.patch, updatedAt: new Date().toISOString() }
            : d,
        ),
      }

    case 'RUN_BS_CHECK':
      return {
        ...state,
        drafts: state.drafts.map((d) =>
          d.id === action.id
            ? {
                ...d,
                bsCheck: 'passed',
                bsCheckNote: BS_CHECK_PASSED_NOTE,
                updatedAt: new Date().toISOString(),
              }
            : d,
        ),
      }

    case 'HUMANIZE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.map((d) => {
          if (d.id !== action.id) return d
          const next = humanizeStats(d.aiTexture, d.voiceMatch)
          return { ...d, ...next, updatedAt: new Date().toISOString() }
        }),
      }

    case 'TOGGLE_CHECKLIST':
      return {
        ...state,
        drafts: state.drafts.map((d) =>
          d.id === action.id
            ? { ...d, checklist: { ...d.checklist, [action.key]: !d.checklist[action.key] } }
            : d,
        ),
      }

    case 'SET_DRAFT_STAGE': {
      const draft = state.drafts.find((d) => d.id === action.id)
      if (!draft) return state
      if (!canTransitionContentStage(draft.stage, action.stage)) return state

      const now = new Date().toISOString()
      const updatedDraft: Draft = { ...draft, stage: action.stage, updatedAt: now }
      if (action.stage === 'scheduled') updatedDraft.scheduledFor = action.scheduledFor ?? now
      if (action.stage === 'published') updatedDraft.publishedAt = now
      if (action.stage === 'archived') updatedDraft.archivedAt = now

      let posts = state.posts

      if (action.stage === 'published') {
        posts = [
          {
            id: makeId('post'),
            draftId: draft.id,
            title: draft.title,
            pillar: draft.pillar ?? 'Untagged',
            publishedAt: now.slice(0, 10),
            impressions: 0,
            engagementRate: 0,
            saves: 0,
            trend: [0, 0, 0, 0, 0],
          },
          ...state.posts,
        ]
      }

      return {
        ...state,
        drafts: state.drafts.map((d) => (d.id === action.id ? updatedDraft : d)),
        posts,
      }
    }

    case 'RESTORE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.map((d) =>
          d.id === action.id ? { ...d, stage: 'draft', archivedAt: undefined } : d,
        ),
      }

    case 'DELETE_ARCHIVED_DRAFT':
      return { ...state, drafts: state.drafts.filter((d) => d.id !== action.id) }

    case 'DELETE_ARCHIVED_IDEA':
      return { ...state, ideas: state.ideas.filter((i) => i.id !== action.id) }

    case 'DELETE_ARCHIVED_POST':
      return { ...state, posts: state.posts.filter((p) => p.id !== action.id) }

    case 'SET_VIDEO_STAGE': {
      const item = state.videoItems.find((v) => v.id === action.id)
      if (!item) return state
      if (!canTransitionVideoStage(item.stage, action.stage)) return state
      return {
        ...state,
        videoItems: state.videoItems.map((v) =>
          v.id === action.id ? { ...v, stage: action.stage } : v,
        ),
      }
    }

    case 'ADD_VIDEO_ITEM':
      return { ...state, videoItems: [action.item, ...state.videoItems] }

    case 'UPDATE_CAROUSEL_SLIDE':
      return {
        ...state,
        carouselDecks: state.carouselDecks.map((deck) =>
          deck.id === action.deckId
            ? {
                ...deck,
                slides: deck.slides.map((s) =>
                  s.id === action.slideId ? { ...s, ...action.patch } : s,
                ),
              }
            : deck,
        ),
      }

    case 'REGENERATE_CAROUSEL':
      return state

    default:
      return state
  }
}

interface ContentContextValue extends ContentState {
  loading: boolean
  addIdea: (text: string, pillar?: Pillar | null) => void
  archiveIdea: (id: string) => void
  restoreIdea: (id: string) => void
  createDraft: (seed: ComposerSeed) => string
  updateDraft: (id: string, patch: Partial<Draft>) => void
  runBsCheck: (id: string) => void
  humanizeDraft: (id: string) => void
  toggleChecklistItem: (id: string, key: keyof Draft['checklist']) => void
  setDraftStage: (id: string, stage: ContentStage, scheduledFor?: string) => void
  restoreDraft: (id: string) => void
  deleteArchivedDraft: (id: string) => void
  deleteArchivedIdea: (id: string) => void
  deleteArchivedPost: (id: string) => void
  setVideoStage: (id: string, stage: VideoStage) => void
  addVideoItem: (item: VideoItem) => void
  updateCarouselSlide: (deckId: string, slideId: string, patch: Partial<CarouselSlide>) => void
  getDraft: (id: string) => Draft | undefined
  getIdea: (id: string) => Idea | undefined
}

const ContentContext = createContext<ContentContextValue | undefined>(undefined)

// A note on error handling: every write below is intentionally
// fire-and-forget against Supabase — local state already updated
// optimistically, matching the pre-migration mock-async behavior. A
// failed write is swallowed (logged, not surfaced) rather than rolled
// back or retried; there's no toast/notification primitive in this
// codebase yet to surface it to the user. `createDraft` is the one
// exception the plan calls out explicitly (a flagged edge case), but
// nothing here blocks navigation or undoes the optimistic UI update.
function reportWriteError(context: string, error: unknown) {
  console.error(`[ContentContext] ${context} failed to persist:`, error)
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAppShell()
  const userId = currentUser.id
  const [state, dispatch] = useReducer(reducer, {
    ideas: [],
    drafts: [],
    posts: [],
    videoItems: [],
    carouselDecks: [],
  })
  const [loading, setLoading] = useState(true)
  const [voiceMatchSeed, setVoiceMatchSeed] = useState(0)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([
      fetchIdeas(userId),
      fetchDrafts(userId),
      fetchPosts(),
      fetchVideoItems(userId),
      fetchCarouselDecks(userId),
      fetchVoiceCard(userId),
    ]).then(([ideas, drafts, posts, videoItems, carouselDecks, voiceCard]) => {
      if (cancelled) return
      dispatch({ type: 'HYDRATE', payload: { ideas, drafts, posts, videoItems, carouselDecks } })
      setVoiceMatchSeed(voiceCard?.completenessPct ?? 0)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const createDraft = useCallback(
    (seed: ComposerSeed) => {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      dispatch({ type: 'CREATE_DRAFT', seed, id, now, voiceMatchSeed })
      const draft = buildDraftFromSeed(id, seed, now, voiceMatchSeed)
      void insertDraft(userId, draft).catch((e) => reportWriteError('createDraft', e))
      return id
    },
    [dispatch, userId, voiceMatchSeed],
  )

  const value = useMemo<ContentContextValue>(
    () => ({
      ...state,
      loading,
      addIdea: (text, pillar = null) => {
        const id = makeId('idea')
        const createdAt = new Date().toISOString()
        dispatch({ type: 'ADD_IDEA', id, text, pillar, createdAt })
        void insertIdea(userId, { id, text, pillar, source: 'manual', createdAt }).catch((e) =>
          reportWriteError('addIdea', e),
        )
      },
      archiveIdea: (id) => {
        const archivedAt = new Date().toISOString()
        dispatch({ type: 'ARCHIVE_IDEA', id, archivedAt })
        void setIdeaArchivedAt(id, archivedAt).catch((e) => reportWriteError('archiveIdea', e))
      },
      restoreIdea: (id) => {
        dispatch({ type: 'RESTORE_IDEA', id })
        void setIdeaArchivedAt(id, null).catch((e) => reportWriteError('restoreIdea', e))
      },
      createDraft,
      updateDraft: (id, patch) => {
        dispatch({ type: 'UPDATE_DRAFT', id, patch })
        void updateDraftRow(id, { ...patch, updatedAt: new Date().toISOString() }).catch((e) =>
          reportWriteError('updateDraft', e),
        )
      },
      runBsCheck: (id) => {
        dispatch({ type: 'RUN_BS_CHECK', id })
        void updateDraftRow(id, { bsCheck: 'passed', bsCheckNote: BS_CHECK_PASSED_NOTE }).catch((e) =>
          reportWriteError('runBsCheck', e),
        )
      },
      humanizeDraft: (id) => {
        const draft = state.drafts.find((d) => d.id === id)
        dispatch({ type: 'HUMANIZE_DRAFT', id })
        if (draft) {
          const next = humanizeStats(draft.aiTexture, draft.voiceMatch)
          void updateDraftRow(id, next).catch((e) => reportWriteError('humanizeDraft', e))
        }
      },
      toggleChecklistItem: (id, key) => {
        const draft = state.drafts.find((d) => d.id === id)
        dispatch({ type: 'TOGGLE_CHECKLIST', id, key })
        if (draft) {
          const nextChecklist = { ...draft.checklist, [key]: !draft.checklist[key] }
          void updateDraftRow(id, { checklist: nextChecklist }).catch((e) =>
            reportWriteError('toggleChecklistItem', e),
          )
        }
      },
      setDraftStage: (id, stage, scheduledFor) => {
        const draft = state.drafts.find((d) => d.id === id)
        if (!draft || !canTransitionContentStage(draft.stage, stage)) return
        dispatch({ type: 'SET_DRAFT_STAGE', id, stage, scheduledFor })
        const now = new Date().toISOString()
        const patch: Partial<Draft> = { stage }
        if (stage === 'scheduled') patch.scheduledFor = scheduledFor ?? now
        if (stage === 'published') patch.publishedAt = now
        if (stage === 'archived') patch.archivedAt = now
        void updateDraftRow(id, patch).catch((e) => reportWriteError('setDraftStage', e))
        // Publishing also creates a local `PostAnalytics` row (see the
        // reducer) — `posts` is explicitly deferred to phase 2, so that
        // row is optimistic-only for now and isn't written to Supabase.
      },
      restoreDraft: (id) => {
        dispatch({ type: 'RESTORE_DRAFT', id })
        void updateDraftRow(id, { stage: 'draft', archivedAt: undefined }).catch((e) =>
          reportWriteError('restoreDraft', e),
        )
      },
      deleteArchivedDraft: (id) => {
        dispatch({ type: 'DELETE_ARCHIVED_DRAFT', id })
        void deleteDraft(id).catch((e) => reportWriteError('deleteArchivedDraft', e))
      },
      deleteArchivedIdea: (id) => {
        dispatch({ type: 'DELETE_ARCHIVED_IDEA', id })
        void deleteIdea(id).catch((e) => reportWriteError('deleteArchivedIdea', e))
      },
      // `posts` is deferred — local-only removal, nothing to persist yet.
      deleteArchivedPost: (id) => dispatch({ type: 'DELETE_ARCHIVED_POST', id }),
      setVideoStage: (id, stage) => {
        const item = state.videoItems.find((v) => v.id === id)
        if (!item || !canTransitionVideoStage(item.stage, stage)) return
        dispatch({ type: 'SET_VIDEO_STAGE', id, stage })
        void updateVideoItemStage(id, stage).catch((e) => reportWriteError('setVideoStage', e))
      },
      addVideoItem: (item) => {
        dispatch({ type: 'ADD_VIDEO_ITEM', item })
        void insertVideoItem(userId, item).catch((e) => reportWriteError('addVideoItem', e))
      },
      updateCarouselSlide: (deckId, slideId, patch) => {
        dispatch({ type: 'UPDATE_CAROUSEL_SLIDE', deckId, slideId, patch })
        void updateCarouselSlideRow(slideId, patch).catch((e) =>
          reportWriteError('updateCarouselSlide', e),
        )
      },
      getDraft: (id) => state.drafts.find((d) => d.id === id),
      getIdea: (id) => state.ideas.find((i) => i.id === id),
    }),
    [state, loading, createDraft, userId],
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}

export { reducer as contentReducer }
export type { ContentState, ContentAction }
