import { describe, expect, it } from 'vitest'
import { countDoneTasks } from '@/state/GamificationContext'
import type { Task } from '@/data/types'

function task(done: boolean): Task {
  return { id: Math.random().toString(), label: 'x', done }
}

describe('countDoneTasks', () => {
  it('is always derived from the array, never a separately stored count', () => {
    expect(countDoneTasks([])).toEqual({ done: 0, total: 0 })
    expect(countDoneTasks([task(true), task(false)])).toEqual({ done: 1, total: 2 })
    expect(countDoneTasks([task(true), task(true), task(true)])).toEqual({ done: 3, total: 3 })
  })

  it('updates correctly when a task list is mutated immutably', () => {
    const tasks = [task(false), task(false)]
    const toggled = tasks.map((t, i) => (i === 0 ? { ...t, done: true } : t))
    expect(countDoneTasks(toggled)).toEqual({ done: 1, total: 2 })
  })
})
