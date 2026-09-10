import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchBadges, fetchStreak, fetchTasks } from '@/data/services/gamificationService'
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

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [streak, setStreak] = useState<StreakState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchTasks(), fetchBadges(), fetchStreak()]).then(([t, b, s]) => {
      if (cancelled) return
      setTasks(t)
      setBadges(b)
      setStreak(s)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function addTask(label: string) {
    if (!label.trim()) return
    setTasks((prev) => [...prev, { id: makeId('task'), label: label.trim(), done: false }])
  }

  const taskCounter = useMemo(() => countDoneTasks(tasks), [tasks])

  const value = useMemo<GamificationContextValue>(
    () => ({ tasks, toggleTask, addTask, taskCounter, badges, streak, loading }),
    [tasks, taskCounter, badges, streak, loading],
  )

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>
}

export function useGamification(): GamificationContextValue {
  const ctx = useContext(GamificationContext)
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider')
  return ctx
}
