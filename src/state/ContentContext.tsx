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
  buildCarouselDeckFromInput,
  deleteCarouselDeckRow,
  deleteDraft,
  deleteIdea,
  fetchCarouselDecks,
  fetchDrafts,
  fetchIdeas,
  fetchPosts,
  fetchVideoItems,
  insertCarouselDeckRow,
  insertDraft,
  insertIdea,
  insertPost,
  insertVideoItem,
  setIdeaArchivedAt,
  updateCarouselSlideRow,
  updateDraftRow,
  updateVideoItemStage,
  upsertUploadedPosts,
  type UploadedPostRow,
} from '@/data/services/contentService'
import { fetchVoiceCard } from '@/data/services/onboardingService'
import { deleteResource, fetchResources, insertResource } from '@/data/services/resourceService'
import { useAppShell } from '@/state/AppShellContext'
import { canTransitionContentStage, canTransitionVideoStage } from '@/lib/statusPipeline'
import { makeId } from '@/lib/id'
import { runRoastDetector } from '@/lib/roast'
import type {
  CarouselDeck,
  CarouselSlide,
  ContentStage,
  Draft,
  Idea,
  Pillar,
  PostAnalytics,
  Resource,
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
  resources: Resource[]
}

type ContentAction =
  | { type: 'HYDRATE'; payload: ContentState }
  | { type: 'ADD_IDEA'; id: string; text: string; pillar: Pillar | null; createdAt?: string }
  | { type: 'ARCHIVE_IDEA'; id: string; archivedAt?: string }
  | { type: 'RESTORE_IDEA'; id: string }
  | { type: 'CREATE_DRAFT'; seed: ComposerSeed; id: string; now?: string; voiceMatchSeed?: number }
  | { type: 'UPDATE_DRAFT'; id: string; patch: Partial<Draft> }
  | { type: 'RUN_ROAST'; id: string }
  | { type: 'TOGGLE_CHECKLIST'; id: string; key: keyof Draft['checklist'] }
  | { type: 'SET_DRAFT_STAGE'; id: string; stage: ContentStage; scheduledFor?: string; postId?: string }
  | { type: 'RESTORE_DRAFT'; id: string }
  | { type: 'DELETE_ARCHIVED_DRAFT'; id: string }
  | { type: 'DELETE_ARCHIVED_IDEA'; id: string }
  | { type: 'DELETE_ARCHIVED_POST'; id: string }
  | { type: 'SET_VIDEO_STAGE'; id: string; stage: VideoStage }
  | { type: 'ADD_VIDEO_ITEM'; item: VideoItem }
  | { type: 'UPDATE_CAROUSEL_SLIDE'; deckId: string; slideId: string; patch: Partial<CarouselSlide> }
  | { type: 'REGENERATE_CAROUSEL'; deckId: string }
  | { type: 'ADD_RESOURCE'; resource: Resource }
  | { type: 'DELETE_RESOURCE'; id: string }
  | { type: 'SET_POSTS'; posts: PostAnalytics[] }
  | { type: 'ADD_CAROUSEL_DECK'; deck: CarouselDeck }
  | { type: 'DELETE_CAROUSEL_DECK'; id: string }

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
    format: seed.format ?? 'post',
    origin: 'user',
    slopScore: 0,
    roastVerdict: '',
    roastFlags: [],
    voiceMatch: voiceMatchSeed,
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

/** Pure so the reducer's optimistic `SET_DRAFT_STAGE` case and the
 * `setDraftStage` wrapper's fire-and-forget `insertPost` build the exact
 * same row (same `id` too, passed in by the caller) — same shape
 * convention as `buildDraftFromSeed` above. */
export function buildPublishedPost(draft: Draft, publishedAt: string, id: string): PostAnalytics {
  return {
    id,
    draftId: draft.id,
    title: draft.title,
    pillar: draft.pillar ?? 'Untagged',
    publishedAt: publishedAt.slice(0, 10),
    impressions: 0,
    engagementRate: 0,
    saves: 0,
    trend: [0, 0, 0, 0, 0],
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

    case 'RUN_ROAST':
      return {
        ...state,
        drafts: state.drafts.map((d) => {
          if (d.id !== action.id) return d
          const result = runRoastDetector(d.paragraphs)
          return {
            ...d,
            slopScore: result.slopScore,
            roastVerdict: result.roastVerdict,
            roastFlags: result.roastFlags,
            updatedAt: new Date().toISOString(),
          }
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
        posts = [buildPublishedPost(draft, now, action.postId ?? makeId('post')), ...state.posts]
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

    case 'ADD_RESOURCE':
      return { ...state, resources: [action.resource, ...state.resources] }

    case 'DELETE_RESOURCE':
      return { ...state, resources: state.resources.filter((r) => r.id !== action.id) }

    case 'SET_POSTS':
      return { ...state, posts: action.posts }

    case 'ADD_CAROUSEL_DECK':
      return { ...state, carouselDecks: [action.deck, ...state.carouselDecks] }

    case 'DELETE_CAROUSEL_DECK':
      return { ...state, carouselDecks: state.carouselDecks.filter((d) => d.id !== action.id) }

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
  runRoastCheck: (id: string) => void
  toggleChecklistItem: (id: string, key: keyof Draft['checklist']) => void
  setDraftStage: (id: string, stage: ContentStage, scheduledFor?: string) => void
  restoreDraft: (id: string) => void
  deleteArchivedDraft: (id: string) => void
  deleteArchivedIdea: (id: string) => void
  deleteArchivedPost: (id: string) => void
  setVideoStage: (id: string, stage: VideoStage) => void
  addVideoItem: (item: VideoItem) => void
  updateCarouselSlide: (deckId: string, slideId: string, patch: Partial<CarouselSlide>) => void
  createCarouselDeck: (input: { title: string; prompt: string }) => string
  deleteCarouselDeck: (id: string) => void
  getDraft: (id: string) => Draft | undefined
  getIdea: (id: string) => Idea | undefined
  createResource: (input: Omit<Resource, 'id' | 'createdAt'>) => string
  deleteResource: (id: string) => void
  getResource: (id: string) => Resource | undefined
  /** Bulk-imports posts parsed from an uploaded `.xlsx` export — matches
   * existing rows by `(title, publishedAt)` so re-uploading updates
   * instead of duplicating. Genuinely async (not the usual
   * optimistic-dispatch-then-fire-and-forget pattern): the upload needs to
   * resolve against the user's real existing rows before the UI can show
   * an accurate merged result. */
  importPosts: (rows: UploadedPostRow[]) => Promise<void>
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
    resources: [],
  })
  const [loading, setLoading] = useState(true)
  const [voiceMatchSeed, setVoiceMatchSeed] = useState(0)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([
      fetchIdeas(userId),
      fetchDrafts(userId),
      fetchPosts(userId),
      fetchVideoItems(userId),
      fetchCarouselDecks(userId),
      fetchVoiceCard(userId),
      fetchResources(userId),
    ]).then(([ideas, drafts, posts, videoItems, carouselDecks, voiceCard, resources]) => {
      if (cancelled) return
      dispatch({ type: 'HYDRATE', payload: { ideas, drafts, posts, videoItems, carouselDecks, resources } })
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
      runRoastCheck: (id) => {
        const draft = state.drafts.find((d) => d.id === id)
        if (!draft) return
        const result = runRoastDetector(draft.paragraphs)
        dispatch({ type: 'RUN_ROAST', id })
        void updateDraftRow(id, {
          slopScore: result.slopScore,
          roastVerdict: result.roastVerdict,
          roastFlags: result.roastFlags,
        }).catch((e) => reportWriteError('runRoastCheck', e))
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
        const postId = stage === 'published' ? makeId('post') : undefined
        dispatch({ type: 'SET_DRAFT_STAGE', id, stage, scheduledFor, postId })
        const now = new Date().toISOString()
        const patch: Partial<Draft> = { stage }
        if (stage === 'scheduled') patch.scheduledFor = scheduledFor ?? now
        if (stage === 'published') patch.publishedAt = now
        if (stage === 'archived') patch.archivedAt = now
        void updateDraftRow(id, patch).catch((e) => reportWriteError('setDraftStage', e))
        // Publishing also creates a real `posts` row — same `id` as the
        // optimistic one the reducer just added to local state, so this
        // fire-and-forget write persists exactly what's already on screen.
        if (stage === 'published' && postId) {
          const post = buildPublishedPost(draft, now, postId)
          void insertPost(userId, post).catch((e) => reportWriteError('setDraftStage:insertPost', e))
        }
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
      createCarouselDeck: (input) => {
        const id = crypto.randomUUID()
        const deck = buildCarouselDeckFromInput(id, input)
        dispatch({ type: 'ADD_CAROUSEL_DECK', deck })
        void insertCarouselDeckRow(userId, deck).catch((e) => reportWriteError('createCarouselDeck', e))
        return id
      },
      deleteCarouselDeck: (id) => {
        dispatch({ type: 'DELETE_CAROUSEL_DECK', id })
        void deleteCarouselDeckRow(id).catch((e) => reportWriteError('deleteCarouselDeck', e))
      },
      getDraft: (id) => state.drafts.find((d) => d.id === id),
      getIdea: (id) => state.ideas.find((i) => i.id === id),
      createResource: (input) => {
        const id = crypto.randomUUID()
        const resource: Resource = { ...input, id, createdAt: new Date().toISOString() }
        dispatch({ type: 'ADD_RESOURCE', resource })
        void insertResource(userId, resource).catch((e) => reportWriteError('createResource', e))
        return id
      },
      deleteResource: (id) => {
        dispatch({ type: 'DELETE_RESOURCE', id })
        void deleteResource(id).catch((e) => reportWriteError('deleteResource', e))
      },
      getResource: (id) => state.resources.find((r) => r.id === id),
      importPosts: async (rows) => {
        await upsertUploadedPosts(userId, rows)
        const posts = await fetchPosts(userId)
        dispatch({ type: 'SET_POSTS', posts })
      },
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
