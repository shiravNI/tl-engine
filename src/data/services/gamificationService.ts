import { tasks as tasksFixture } from '@/data/fixtures/tasks'
import { badges as badgesFixture } from '@/data/fixtures/badges'
import { streak as streakFixture } from '@/data/fixtures/streaks'
import { mockAsync } from '@/lib/mockAsync'
import type { Badge, StreakState, Task } from '@/data/types'

export async function fetchTasks(): Promise<Task[]> {
  return mockAsync(tasksFixture, 120)
}

export async function fetchBadges(): Promise<Badge[]> {
  return mockAsync(badgesFixture, 120)
}

export async function fetchStreak(): Promise<StreakState> {
  return mockAsync(streakFixture, 120)
}
