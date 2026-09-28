// A small, in-memory fake `@supabase/supabase-js` client for tests — only
// as much of the query-builder surface as `src/data/services/*.ts` and
// `AuthContext` actually call (`.select/.insert/.update/.upsert/.delete`,
// `.eq`, `.order`, `.single`, a hand-rolled `carousel_slides(*)` embed, and
// `auth.getSession`/`onAuthStateChange`/`signInWithOtp`/`signOut`). Not a
// faithful PostgREST reimplementation — just enough to exercise the real
// context/provider code paths offline in tests.
import type { SupabaseClient } from '@supabase/supabase-js'

export const TEST_USER_ID = 'user_test_1'
export const TEST_USER_EMAIL = 'test.user@naturalint.com'

type Row = Record<string, any>
type Tables = Record<string, Row[]>

function cloneTables(seed: Tables): Map<string, Row[]> {
  const map = new Map<string, Row[]>()
  for (const [table, rows] of Object.entries(seed)) {
    map.set(table, rows.map((r) => ({ ...r })))
  }
  return map
}

class MockQueryBuilder implements PromiseLike<{ data: any; error: any }> {
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private payload: any
  private filters: Array<[string, unknown]> = []
  private singleFlag = false
  private orderCol?: string
  private orderAsc = true
  private upsertConflict = 'id'
  private embedSlides = false

  constructor(
    private table: string,
    private db: Map<string, Row[]>,
  ) {}

  select(cols?: string) {
    this.op = 'select'
    if (cols && cols.includes('carousel_slides(')) this.embedSlides = true
    return this
  }
  insert(payload: Row | Row[]) {
    this.op = 'insert'
    this.payload = payload
    return this
  }
  update(payload: Row) {
    this.op = 'update'
    this.payload = payload
    return this
  }
  delete() {
    this.op = 'delete'
    return this
  }
  upsert(payload: Row | Row[], opts?: { onConflict?: string }) {
    this.op = 'upsert'
    this.payload = payload
    this.upsertConflict = opts?.onConflict ?? 'id'
    return this
  }
  eq(col: string, value: unknown) {
    this.filters.push([col, value])
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col
    this.orderAsc = opts?.ascending ?? true
    return this
  }
  single() {
    this.singleFlag = true
    return this
  }

  private rows(): Row[] {
    return this.db.get(this.table) ?? []
  }
  private setRows(rows: Row[]) {
    this.db.set(this.table, rows)
  }
  private matches(row: Row): boolean {
    return this.filters.every(([col, value]) => row[col] === value)
  }

  private execute(): { data: any; error: any } {
    switch (this.op) {
      case 'select': {
        let result = this.rows().filter((r) => this.matches(r))
        if (this.embedSlides) {
          const slides = this.db.get('carousel_slides') ?? []
          result = result.map((r) => ({ ...r, carousel_slides: slides.filter((s) => s.deck_id === r.id) }))
        }
        if (this.orderCol) {
          const col = this.orderCol
          result = [...result].sort((a, b) => {
            if (a[col] === b[col]) return 0
            return (a[col] > b[col] ? 1 : -1) * (this.orderAsc ? 1 : -1)
          })
        }
        if (this.singleFlag) {
          return result.length > 0
            ? { data: result[0], error: null }
            : { data: null, error: { message: 'no rows found' } }
        }
        return { data: result, error: null }
      }
      case 'insert': {
        const items = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((r) => ({ ...r }))
        this.setRows([...this.rows(), ...items])
        return { data: items, error: null }
      }
      case 'update': {
        this.setRows(this.rows().map((r) => (this.matches(r) ? { ...r, ...this.payload } : r)))
        return { data: null, error: null }
      }
      case 'delete': {
        this.setRows(this.rows().filter((r) => !this.matches(r)))
        return { data: null, error: null }
      }
      case 'upsert': {
        const conflictCols = this.upsertConflict.split(',')
        const items = Array.isArray(this.payload) ? this.payload : [this.payload]
        const rows = this.rows()
        items.forEach((item) => {
          const idx = rows.findIndex((r) => conflictCols.every((c) => r[c] === item[c]))
          if (idx >= 0) rows[idx] = { ...rows[idx], ...item }
          else rows.push({ ...item })
        })
        this.setRows(rows)
        return { data: items, error: null }
      }
      default:
        return { data: null, error: null }
    }
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }
}

export interface MockSupabaseClient extends SupabaseClient {
  /** Test-only escape hatch: replaces the in-memory tables with a fresh
   * copy of `seed`. `vi.mock('@/lib/supabaseClient', factory)` only runs
   * its factory once per test *file*, so every test in a file shares one
   * client instance — call this in `beforeEach` to stop mutations from
   * one test (e.g. archiving a draft) leaking into the next. */
  __reset: (seed?: Tables) => void
}

export function createMockSupabaseClient(seed: Tables = {}): MockSupabaseClient {
  let db = cloneTables(seed)
  const session = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: TEST_USER_ID, email: TEST_USER_EMAIL },
  }

  const client = {
    from: (table: string) => new MockQueryBuilder(table, db),
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      onAuthStateChange: (_cb: unknown) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOtp: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
    },
    __reset: (nextSeed: Tables = {}) => {
      db = cloneTables(nextSeed)
    },
  }

  return client as unknown as MockSupabaseClient
}

// ---------------------------------------------------------------------------
// Default seed — shaped like the pre-migration fixtures, so existing test
// assertions (written against that fixture data) keep passing unchanged.
// ---------------------------------------------------------------------------

export const DIRECTOR_DRAFT_OFFER_ID = 'draft_director_offer'

function defaultChecklist() {
  return { hookEarnsSeeMore: false, noLinksInBody: false, visualAttached: false, hashtagsAdded: false }
}

export function defaultSeed(): Tables {
  return {
    profiles: [
      {
        user_id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        name: 'Test User',
        initials: 'TU',
        role: 'cast',
        title: 'Cast member',
      },
    ],
    onboarding_state: [
      { user_id: TEST_USER_ID, current_phase_index: 4, completed_at: '2026-01-01T00:00:00Z', skipped: false },
    ],
    ideas: [
      {
        id: 'idea_1',
        user_id: TEST_USER_ID,
        text: "Comparison sites aren't dying, they're being unbundled",
        pillar: 'AI search',
        source: 'voice_note',
        created_at: '2026-09-01T08:10:00Z',
        archived_at: null,
      },
      {
        id: 'idea_2',
        user_id: TEST_USER_ID,
        text: 'The org chart lie: why brand sits under performance',
        pillar: 'Org',
        source: 'slack',
        created_at: '2026-08-30T14:00:00Z',
        archived_at: null,
      },
      {
        id: 'idea_7',
        user_id: TEST_USER_ID,
        text: 'A framework nobody asked for but everyone needs',
        pillar: null,
        source: 'manual',
        created_at: '2026-07-25T09:00:00Z',
        archived_at: '2026-07-28T09:00:00Z',
      },
    ],
    drafts: [
      {
        id: 'draft_ai_search_panic',
        user_id: TEST_USER_ID,
        title: 'The AI search panic is a distribution story',
        paragraphs: ['Every deck this quarter opens with the same chart.'],
        excerpt: 'Every deck this quarter opens with the same chart.',
        pillar: 'AI search',
        stage: 'draft',
        slop_score: 0,
        roast_verdict: "Anchored and specific — this reads like only you could've written it.",
        roast_flags: [],
        voice_match: 91,
        source_idea_id: null,
        source_type: 'idea',
        source_label: "Comparison sites aren't dying, they're being unbundled",
        image_url: null,
        image_file_name: 'chart.png',
        checklist: { hookEarnsSeeMore: true, noLinksInBody: true, visualAttached: false, hashtagsAdded: false },
        scheduled_for: null,
        published_at: null,
        archived_at: null,
        created_at: '2026-09-01T09:00:00Z',
        updated_at: '2026-09-02T07:48:00Z',
      },
      {
        id: DIRECTOR_DRAFT_OFFER_ID,
        user_id: TEST_USER_ID,
        title: 'Why partner decks should open with churn',
        paragraphs: ['Every partner deck buries churn on slide 9. It should be slide 1.'],
        excerpt: 'Every partner deck buries churn on slide 9. It should be slide 1.',
        pillar: 'Performance',
        stage: 'in_review',
        slop_score: 0,
        roast_verdict: '',
        roast_flags: [],
        voice_match: 84,
        source_idea_id: null,
        source_type: null,
        source_label: null,
        image_url: null,
        image_file_name: null,
        checklist: defaultChecklist(),
        scheduled_for: null,
        published_at: null,
        archived_at: null,
        created_at: '2026-09-02T08:55:00Z',
        updated_at: '2026-09-02T08:55:00Z',
      },
    ],
    tasks: [
      { id: 'task_1', user_id: TEST_USER_ID, label: 'Brain dump this morning’s idea', done: true, due_pill: null, created_at: '2026-09-01T08:00:00Z' },
      { id: 'task_2', user_id: TEST_USER_ID, label: 'Reply to Shira’s note', done: true, due_pill: null, created_at: '2026-09-01T09:00:00Z' },
      { id: 'task_3', user_id: TEST_USER_ID, label: 'Post today to keep the streak', done: false, due_pill: 'Due today', created_at: '2026-09-02T08:00:00Z' },
      { id: 'task_4', user_id: TEST_USER_ID, label: 'Run BS check', done: false, due_pill: null, created_at: '2026-09-02T09:00:00Z' },
    ],
    badge_catalog: [
      { id: 'badge_chain10', name: 'Chain of 10', description: '10 weeks straight.', icon: 'flame', hidden: false, sort_order: 1 },
      { id: 'badge_full_bucket', name: 'Full bucket', description: '10 ideas banked at once.', icon: 'inbox', hidden: false, sort_order: 2 },
      { id: 'badge_no_slop', name: 'No slop', description: '5 posts passed BS check first time.', icon: 'shield', hidden: false, sort_order: 3 },
      { id: 'badge_chain15', name: 'Chain of 15', description: 'Post consistently for 15 weeks.', icon: 'trophy', hidden: false, sort_order: 4 },
      { id: 'badge_100k', name: '100k reached', description: 'Reach 100,000 impressions.', icon: 'eye', hidden: false, sort_order: 5 },
      { id: 'badge_conversation', name: 'Conversation starter', description: 'Start 20 comment threads.', icon: 'msg', hidden: false, sort_order: 6 },
      { id: 'badge_amplifier', name: 'Amplifier', description: 'Boost 5 cohort posts.', icon: 'users', hidden: false, sort_order: 7 },
      { id: 'badge_hidden', name: 'Hidden badge', description: 'Unlocks at 20 weeks.', icon: 'lock', hidden: true, sort_order: 8 },
    ],
    user_badges: [
      { id: 'ub_1', user_id: TEST_USER_ID, badge_id: 'badge_chain10', earned: true, earned_at: '2026-08-04', progress_current: null, progress_target: null },
      { id: 'ub_2', user_id: TEST_USER_ID, badge_id: 'badge_full_bucket', earned: true, earned_at: null, progress_current: null, progress_target: null },
      { id: 'ub_3', user_id: TEST_USER_ID, badge_id: 'badge_no_slop', earned: true, earned_at: null, progress_current: null, progress_target: null },
      { id: 'ub_4', user_id: TEST_USER_ID, badge_id: 'badge_chain15', earned: false, earned_at: null, progress_current: 14, progress_target: 15 },
      { id: 'ub_5', user_id: TEST_USER_ID, badge_id: 'badge_100k', earned: false, earned_at: null, progress_current: 64000, progress_target: 100000 },
    ],
    streaks: [
      {
        user_id: TEST_USER_ID,
        current_weeks: 14,
        personal_best_weeks: 9,
        weeks: [false, false, ...Array(13).fill(true), false],
        next_milestone_weeks: 15,
        next_milestone_deadline: '2026-09-13T23:59:00Z',
      },
    ],
    video_items: [],
    carousel_decks: [],
    carousel_slides: [],
    voice_cards: [],
    voice_card_opinions: [],
    interview_answers: [],
    contacts: [],
  }
}
