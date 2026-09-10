import { describe, expect, it } from 'vitest'
import { rowToTask, taskToInsertRow, mergeBadgeRows, rowToStreak } from '@/data/services/gamificationService'

const USER_ID = 'user_test_1'

describe('gamificationService — tasks row <-> camelCase mapper', () => {
  it('round-trips a task with a due pill through both mapper directions', () => {
    const row = { id: 'task_1', label: 'Post today', done: false, due_pill: 'Due today' }
    const task = rowToTask(row)
    expect(task).toEqual({ id: 'task_1', label: 'Post today', done: false, duePill: 'Due today' })
    expect(taskToInsertRow(USER_ID, task)).toEqual({ ...row, user_id: USER_ID })
  })

  it('maps a null due_pill to an undefined duePill and back to null', () => {
    const row = { id: 'task_2', label: 'No due date', done: true, due_pill: null }
    const task = rowToTask(row)
    expect(task.duePill).toBeUndefined()
    expect(taskToInsertRow(USER_ID, task)).toEqual({ ...row, user_id: USER_ID })
  })
})

describe('gamificationService — mergeBadgeRows', () => {
  const catalog = [
    { id: 'badge_a', name: 'A', description: 'Earn A', icon: 'flame', hidden: false, sort_order: 2 },
    { id: 'badge_b', name: 'B', description: 'Earn B', icon: 'inbox', hidden: false, sort_order: 1 },
    { id: 'badge_hidden', name: 'Hidden', description: 'Secret', icon: 'lock', hidden: true, sort_order: 3 },
  ]

  it('orders badges by sort_order regardless of catalog array order', () => {
    const badges = mergeBadgeRows(catalog, [])
    expect(badges.map((b) => b.id)).toEqual(['badge_b', 'badge_a', 'badge_hidden'])
  })

  it('merges in per-user progress for badges with a user_badges row, defaulting the rest to not-earned', () => {
    const userBadges = [
      { badge_id: 'badge_a', earned: true, earned_at: '2026-08-04', progress_current: null, progress_target: null },
    ]
    const badges = mergeBadgeRows(catalog, userBadges)
    const badgeA = badges.find((b) => b.id === 'badge_a')!
    const badgeB = badges.find((b) => b.id === 'badge_b')!
    expect(badgeA).toMatchObject({ earned: true, earnedAt: '2026-08-04' })
    // No user_badges row at all for badge_b — a brand-new account's
    // default, not-earned/no-progress state.
    expect(badgeB).toMatchObject({ earned: false, earnedAt: undefined, progressCurrent: undefined })
  })

  it('carries progressCurrent/progressTarget through for an in-progress, not-yet-earned badge', () => {
    const userBadges = [
      { badge_id: 'badge_b', earned: false, earned_at: null, progress_current: 14, progress_target: 15 },
    ]
    const badges = mergeBadgeRows(catalog, userBadges)
    expect(badges.find((b) => b.id === 'badge_b')).toMatchObject({
      earned: false,
      progressCurrent: 14,
      progressTarget: 15,
    })
  })
})

describe('gamificationService — streaks row -> camelCase mapper', () => {
  it('maps every column and defaults a null deadline to an empty string', () => {
    const row = {
      current_weeks: 14,
      personal_best_weeks: 9,
      weeks: [false, true, true],
      next_milestone_weeks: 15,
      next_milestone_deadline: null,
    }
    expect(rowToStreak(row)).toEqual({
      currentWeeks: 14,
      personalBestWeeks: 9,
      weeks: [false, true, true],
      nextMilestoneWeeks: 15,
      nextMilestoneDeadline: '',
    })
  })
})
