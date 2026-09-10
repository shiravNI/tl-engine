import type { StreakState } from '@/data/types'

// 16 weeks, oldest first — first 2 weeks missed, then a run of 13 posted
// weeks, then the current (unposted-yet) week shown as a dashed target.
const weeks = [false, false, ...Array(13).fill(true), false]

export const streak: StreakState = {
  currentWeeks: 14,
  personalBestWeeks: 9,
  weeks,
  nextMilestoneWeeks: 15,
  nextMilestoneDeadline: '2026-09-13T23:59:00Z',
}
