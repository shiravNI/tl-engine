// Tasks, badges and streak against Supabase. `badge_catalog` is shared
// read-only reference data (seeded once in supabase/schema.sql, not
// per-user) joined against each user's own `user_badges` progress rows —
// a brand-new account has zero `user_badges` rows, so every badge reads
// as not-yet-earned with no progress, matching "start genuinely empty."
import { supabase } from '@/lib/supabaseClient'
import type { Badge, StreakState, Task } from '@/data/types'

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------

interface TaskRow {
  id: string
  label: string
  done: boolean
  due_pill: string | null
}

export function rowToTask(row: TaskRow): Task {
  return { id: row.id, label: row.label, done: row.done, duePill: row.due_pill ?? undefined }
}

export function taskToInsertRow(userId: string, task: Task): Record<string, unknown> {
  return {
    id: task.id,
    user_id: userId,
    label: task.label,
    done: task.done,
    due_pill: task.duePill ?? null,
  }
}

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as TaskRow[]).map(rowToTask)
}

export async function insertTask(userId: string, task: Task): Promise<void> {
  await supabase.from('tasks').insert(taskToInsertRow(userId, task))
}

export async function updateTaskDone(id: string, done: boolean): Promise<void> {
  await supabase.from('tasks').update({ done }).eq('id', id)
}

// ---------------------------------------------------------------------------
// badges (badge_catalog + user_badges)
// ---------------------------------------------------------------------------

interface BadgeCatalogRow {
  id: string
  name: string
  description: string
  icon: string | null
  hidden: boolean
  sort_order: number
}

interface UserBadgeRow {
  badge_id: string
  earned: boolean
  earned_at: string | null
  progress_current: number | null
  progress_target: number | null
}

export function mergeBadgeRows(catalog: BadgeCatalogRow[], userBadges: UserBadgeRow[]): Badge[] {
  const progressByBadgeId = new Map(userBadges.map((row) => [row.badge_id, row]))
  return catalog
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => {
      const progress = progressByBadgeId.get(row.id)
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        earned: progress?.earned ?? false,
        earnedAt: progress?.earned_at ?? undefined,
        progressCurrent: progress?.progress_current ?? undefined,
        progressTarget: progress?.progress_target ?? undefined,
        hidden: row.hidden,
        icon: (row.icon as Badge['icon']) ?? undefined,
      }
    })
}

export async function fetchBadges(userId: string): Promise<Badge[]> {
  const [catalogResult, userBadgesResult] = await Promise.all([
    supabase.from('badge_catalog').select('*').order('sort_order', { ascending: true }),
    supabase.from('user_badges').select('*').eq('user_id', userId),
  ])
  if (catalogResult.error || !catalogResult.data) return []
  return mergeBadgeRows(
    catalogResult.data as BadgeCatalogRow[],
    (userBadgesResult.data ?? []) as UserBadgeRow[],
  )
}

// ---------------------------------------------------------------------------
// streaks
// ---------------------------------------------------------------------------

interface StreakRow {
  current_weeks: number
  personal_best_weeks: number
  weeks: boolean[]
  next_milestone_weeks: number
  next_milestone_deadline: string | null
}

export function rowToStreak(row: StreakRow): StreakState {
  return {
    currentWeeks: row.current_weeks,
    personalBestWeeks: row.personal_best_weeks,
    weeks: row.weeks,
    nextMilestoneWeeks: row.next_milestone_weeks,
    nextMilestoneDeadline: row.next_milestone_deadline ?? '',
  }
}

export async function fetchStreak(userId: string): Promise<StreakState | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error || !data) return null
  return rowToStreak(data as StreakRow)
}
