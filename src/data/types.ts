// Shared domain types for TL Engine (Personal mode).
// Fixtures reference each other by id, never nested — mirrors how a real
// API/DB would shape this data, so the `services/` swap-in later doesn't
// require reshaping consumers.

export type ViewMode = 'personal' | 'mastermind'

export type UserRole = 'director' | 'cast'

export interface User {
  id: string
  name: string
  initials: string
  role: UserRole
  title: string
}

/** Freelancers / external collaborators referenced by the video board's
 * "who's needed" list. Not TL Engine users — no login, no Voice Card. */
export interface Contact {
  id: string
  name: string
  initials: string
  specialty: string
}

export type Pillar = 'AI search' | 'Org' | 'Performance' | 'Unbundling' | 'Untagged'

/** The one pipeline every piece of written content moves through. */
export type ContentStage =
  | 'idea'
  | 'draft'
  | 'in_review'
  | 'scheduled'
  | 'published'
  | 'archived'

export type IdeaSource = 'voice_note' | 'slack' | 'manual' | 'newsletter' | 'insight' | 'prompt'

export interface Idea {
  id: string
  text: string
  pillar: Pillar | null
  source: IdeaSource
  createdAt: string
  archivedAt?: string
}

export interface RoastFlag {
  /** Exact phrase/sentence pulled from the draft's own paragraphs. */
  quote: string
  /** The specific roast of that phrase — never a generic note. */
  comment: string
}

export interface ChecklistState {
  hookEarnsSeeMore: boolean
  noLinksInBody: boolean
  visualAttached: boolean
  hashtagsAdded: boolean
}

/** `'post'` is the default, short-form LinkedIn-shaped draft (char-capped,
 * title auto-derived from the first line). `'article'` is long-form — same
 * pipeline (stage, BS-check, voice-match, humanize), only the composer's
 * layout and a display badge differ. Deliberately a field on `Draft`, not a
 * parallel type — see Carousel's `VideoItem`/`CarouselDeck` split for the
 * data-model duplication this avoids. */
export type DraftFormat = 'post' | 'article'

export interface Draft {
  id: string
  title: string
  /** Plain-paragraph body kept in sync with the Tiptap editor's JSON doc. */
  paragraphs: string[]
  excerpt: string
  pillar: Pillar | null
  stage: ContentStage
  format: DraftFormat
  /** 0-10, LOWER is better — the merged "Roast" quality check's score. */
  slopScore: number
  /** One punchy overall line, picked by score tier. */
  roastVerdict: string
  /** Specific quoted+roasted lines found in this draft; [] if none found. */
  roastFlags: RoastFlag[]
  voiceMatch: number
  sourceIdeaId?: string
  sourceType?: 'idea' | 'insight' | 'newsletter' | 'resource'
  sourceLabel?: string
  imageUrl?: string
  imageFileName?: string
  checklist: ChecklistState
  scheduledFor?: string
  publishedAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PostAnalytics {
  id: string
  draftId?: string
  title: string
  pillar: Pillar
  publishedAt: string
  impressions: number
  engagementRate: number
  saves: number
  trend: number[]
  archivedAt?: string
}

export interface Task {
  id: string
  label: string
  done: boolean
  duePill?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  earned: boolean
  earnedAt?: string
  progressCurrent?: number
  progressTarget?: number
  hidden?: boolean
  /** Semantic icon name (maps to the Icon wrapper's registry) shown on the
   * badge tile — distinct per badge to match the wireframe's badge grid. */
  icon?: 'flame' | 'inbox' | 'shield' | 'trophy' | 'eye' | 'msg' | 'users' | 'lock'
}

export interface StreakState {
  currentWeeks: number
  personalBestWeeks: number
  /** Last 16 weeks, oldest first; true = posted that week. */
  weeks: boolean[]
  nextMilestoneWeeks: number
  nextMilestoneDeadline: string
}

export type ChatAuthorType = 'user' | 'director' | 'system'

export interface ChatMessage {
  id: string
  conversationId: string
  authorType: ChatAuthorType
  authorId?: string
  authorName: string
  authorInitials: string
  text: string
  timestamp: string
  kind: 'text' | 'draft_offer' | 'help_flag' | 'system_note'
  draftId?: string
  voiceMatch?: number
  draftTitle?: string
}

export interface Conversation {
  id: string
  directorId: string
  directorName: string
  directorInitials: string
  status: 'online' | 'offline'
  lastActivitySummary: string
}

export interface InsightHighlight {
  id: string
  icon: 'up' | 'clock' | 'alert'
  text: string
}

export interface AudienceSegment {
  id: string
  label: string
  share: number
  deltaPt: number
  color: string
  trend: number[]
}

export interface InsightSnapshot {
  impressions: number
  impressionsDeltaPct: number
  impressionsSpark: number[]
  engagementRate: number
  engagementDeltaPt: number
  engagementSpark: number[]
  newFollowers: number
  newFollowersDeltaPct: number
  newFollowersSpark: number[]
  postsPublished: number
  postsPlanned: number
  weeklyImpressions: { label: string; value: number; highlight?: string }[]
  highlights: InsightHighlight[]
  suggestedMove: string
  audienceSegments: AudienceSegment[]
  lastUploadedAt: string
}

export type VideoFormat = 'video' | 'carousel'
export type VideoStage = 'script' | 'shoot_scheduled' | 'filming' | 'editing' | 'ready'

export interface ScriptBeats {
  hook: string
  body: string
  cta: string
}

export interface VideoPerson {
  role: string
  name: string
  initials: string
  isContact?: boolean
}

export interface VideoItem {
  id: string
  title: string
  format: VideoFormat
  stage: VideoStage
  beats?: ScriptBeats
  beatsSummary?: string
  inspoLabel?: string
  inspoLink?: string
  shootDate?: string
  location?: string
  people: VideoPerson[]
  editingNote?: string
  editingProgress?: number
  postingNote?: string
}

export interface CarouselSlide {
  id: string
  index: number
  kind: 'cover' | 'data' | 'cta'
  label: string
  headline: string
  hasChart?: boolean
}

export interface CarouselDeck {
  id: string
  title: string
  prompt: string
  sourceFileLabel?: string
  slides: CarouselSlide[]
  stage: 'drafting' | 'editing' | 'exported'
}

export interface NewsletterStory {
  id: string
  headline: string
  sourceLabel: string
  matchesLabel: string
}

export interface NewsletterIssue {
  id: string
  date: string
  headline: string
  stories: NewsletterStory[]
  statOfDay: { value: string; caption: string }
  prewrittenDraft: { hook: string; note: string; seedIdeaId?: string }
  pastIssues: { label: string; summary: string }[]
}

export interface VoiceCardOpinion {
  id: string
  quote: string
  placeholder?: boolean
}

/**
 * The Voice Card's data shape, designed in Phase A since the composer's
 * Voice-match % score consumes it later.
 */
export interface VoiceCard {
  userName: string
  roleLabel: string
  povFingerprint: string
  opinions: VoiceCardOpinion[]
  completenessPct: number
  completenessNote: string
}

export interface OnboardingPhase {
  id: string
  index: number
  title: string
  description: string
  estimate: string
  status: 'done' | 'active' | 'upcoming'
}

/** A dump of interesting links people find, usable later in a draft — lives
 * under Newsletter. Hard-delete only for v1 (no soft-archive lifecycle). */
export interface Resource {
  id: string
  url: string
  title: string
  note: string
  pillar: Pillar | null
  tags: string[]
  createdAt: string
}

export type ArchiveItemType = 'idea' | 'draft' | 'post'

export interface ArchiveEntry {
  id: string
  refId: string
  type: ArchiveItemType
  title: string
  lastTouched: string
  reason: string
}
