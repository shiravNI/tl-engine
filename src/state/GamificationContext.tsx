import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchBadges, fetchStreak, fetchTasks, insertTask, updateTaskDone } from '@/data/services/gamificationService'
import { useAppShell } from '@/state/AppShellContext'
import { makeId } from '@/lib/id'
import type { Badge, StreakState, Task } from '@/data/types'

/** Pure, exported separately from the reducer so it's directly testable —
 * the counter is always derived from the task list, never stored
 * alongside it (the main bug class this avoids). */
export function countDoneTasks(taskList: Task[]): { done: number; total: number } {
  return { done: taskList.filter((t) => t.done).length, total: taskList.length }
}

interface GamificationContextValue {
  tasks: Task[]
  toggleTask: (id: string) => void
  addTask: (label: string) => void
  taskCounter: { done: number; total: number }
  badges: Badge[]
  streak: StreakState | null
  loading: boolean
}

const GamificationContext = createContext<GamificationContextValue | undefined>(undefined)

function reportWriteError(context: string, error: unknown) {
  console.error(`[GamificationContext] ${context} failed to persist:`, error)
}

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAppShell()
  const userId = currentUser.id
  const [tasks, setTasks] = useState<Task[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [streak, setStreak] = useState<StreakState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([fetchTasks(userId), fetchBadges(userId), fetchStreak(userId)]).then(([t, b, s]) => {
      if (cancelled) return
      setTasks(t)
      setBadges(b)
      setStreak(s)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const toggleTask = useCallback((id: string) => {
    let nextDone = false
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        nextDone = !t.done
        return { ...t, done: nextDone }
      }),
    )
    void updateTaskDone(id, nextDone).catch((e) => reportWriteError('toggleTask', e))
  }, [])

  const addTask = useCallback(
    (label: string) => {
      if (!label.trim()) return
      const task: Task = { id: makeId('task'), label: label.trim(), done: false }
      setTasks((prev) => [...prev, task])
      void insertTask(userId, task).catch((e) => reportWriteError('addTask', e))
    },
    [userId],
  )

  const taskCounter = useMemo(() => countDoneTasks(tasks), [tasks])

  const value = useMemo<GamificationContextValue>(
    () => ({ tasks, toggleTask, addTask, taskCounter, badges, streak, loading }),
    [tasks, toggleTask, addTask, taskCounter, badges, streak, loading],
  )

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>
}

export function useGamification(): GamificationContextValue {
  const ctx = useContext(GamificationContext)
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider')
  return ctx
}
