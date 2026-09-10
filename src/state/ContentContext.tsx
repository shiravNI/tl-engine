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
  fetchCarouselDecks,
  fetchDrafts,
  fetchIdeas,
  fetchPosts,
  fetchVideoItems,
} from '@/data/services/contentService'
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
  | { type: 'ADD_IDEA'; text: string; pillar: Pillar | null }
  | { type: 'ARCHIVE_IDEA'; id: string }
  | { type: 'RESTORE_IDEA'; id: string }
  | { type: 'CREATE_DRAFT'; seed: ComposerSeed; id: string }
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

function reducer(state: ContentState, action: ContentAction): ContentState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload

    case 'ADD_IDEA':
      return {
        ...state,
        ideas: [
          {
            id: makeId('idea'),
            text: action.text,
            pillar: action.pillar,
            source: 'manual',
            createdAt: new Date().toISOString(),
          },
          ...state.ideas,
        ],
      }

    case 'ARCHIVE_IDEA':
      return {
        ...state,
        ideas: state.ideas.map((i) =>
          i.id === action.id ? { ...i, archivedAt: new Date().toISOString() } : i,
        ),
      }

    case 'RESTORE_IDEA':
      return {
        ...state,
        ideas: state.ideas.map((i) => (i.id === action.id ? { ...i, archivedAt: undefined } : i)),
      }

    case 'CREATE_DRAFT': {
      const now = new Date().toISOString()
      const draft: Draft = {
        id: action.id,
        title: action.seed.title,
        paragraphs: action.seed.paragraphs,
        excerpt: action.seed.paragraphs[0] ?? '',
        pillar: action.seed.pillar,
        stage: 'draft',
        bsCheck: 'not_run',
        bsCheckNote: '',
        voiceMatch: 0,
        aiTexture: 0,
        sourceIdeaId: action.seed.sourceIdeaId,
        sourceType: action.seed.sourceType,
        sourceLabel: action.seed.sourceLabel,
        checklist: {
          hookEarnsSeeMore: false,
          noLinksInBody: false,
          visualAttached: false,
          hashtagsAdded: false,
        },
        createdAt: now,
        updatedAt: now,
      }
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
                bsCheckNote: 'Anchored to something specific only you could write — nobody else can write this version.',
                updatedAt: new Date().toISOString(),
              }
            : d,
        ),
      }

    case 'HUMANIZE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.map((d) =>
          d.id === action.id
            ? {
                ...d,
                aiTexture: Math.max(0, d.aiTexture - 2),
                voiceMatch: Math.min(99, d.voiceMatch + 4),
                updatedAt: new Date().toISOString(),
              }
            : d,
        ),
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

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ideas: [],
    drafts: [],
    posts: [],
    videoItems: [],
    carouselDecks: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchIdeas(), fetchDrafts(), fetchPosts(), fetchVideoItems(), fetchCarouselDecks()]).then(
      ([ideas, drafts, posts, videoItems, carouselDecks]) => {
        if (cancelled) return
        dispatch({ type: 'HYDRATE', payload: { ideas, drafts, posts, videoItems, carouselDecks } })
        setLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  const createDraft = useCallback(
    (seed: ComposerSeed) => {
      const id = makeId('draft')
      dispatch({ type: 'CREATE_DRAFT', seed, id })
      return id
    },
    [dispatch],
  )

  const value = useMemo<ContentContextValue>(
    () => ({
      ...state,
      loading,
      addIdea: (text, pillar = null) => dispatch({ type: 'ADD_IDEA', text, pillar }),
      archiveIdea: (id) => dispatch({ type: 'ARCHIVE_IDEA', id }),
      restoreIdea: (id) => dispatch({ type: 'RESTORE_IDEA', id }),
      createDraft,
      updateDraft: (id, patch) => dispatch({ type: 'UPDATE_DRAFT', id, patch }),
      runBsCheck: (id) => dispatch({ type: 'RUN_BS_CHECK', id }),
      humanizeDraft: (id) => dispatch({ type: 'HUMANIZE_DRAFT', id }),
      toggleChecklistItem: (id, key) => dispatch({ type: 'TOGGLE_CHECKLIST', id, key }),
      setDraftStage: (id, stage, scheduledFor) =>
        dispatch({ type: 'SET_DRAFT_STAGE', id, stage, scheduledFor }),
      restoreDraft: (id) => dispatch({ type: 'RESTORE_DRAFT', id }),
      deleteArchivedDraft: (id) => dispatch({ type: 'DELETE_ARCHIVED_DRAFT', id }),
      deleteArchivedIdea: (id) => dispatch({ type: 'DELETE_ARCHIVED_IDEA', id }),
      deleteArchivedPost: (id) => dispatch({ type: 'DELETE_ARCHIVED_POST', id }),
      setVideoStage: (id, stage) => dispatch({ type: 'SET_VIDEO_STAGE', id, stage }),
      addVideoItem: (item) => dispatch({ type: 'ADD_VIDEO_ITEM', item }),
      updateCarouselSlide: (deckId, slideId, patch) =>
        dispatch({ type: 'UPDATE_CAROUSEL_SLIDE', deckId, slideId, patch }),
      getDraft: (id) => state.drafts.find((d) => d.id === id),
      getIdea: (id) => state.ideas.find((i) => i.id === id),
    }),
    [state, loading, createDraft],
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
