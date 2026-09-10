import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GamificationProvider, useGamification } from '@/state/GamificationContext'

/**
 * Exercises GamificationContext end-to-end through its exposed API. Note:
 * badges and streak are currently read-only fetched state — there is no
 * reducer/action anywhere in the app that mutates badge progress or streak
 * counts after hydration (posting, completing tasks, etc. never touch
 * them), so there is no transition logic to unit test there yet. This
 * covers what the context actually does: derive+update the task counter
 * through the real provider (not just the standalone `countDoneTasks`
 * helper), and confirms badges/streak hydrate with the expected shape.
 */
describe('GamificationContext (through the real provider)', () => {
  it('toggling a task updates the derived counter without a separately-stored count', async () => {
    const { result } = renderHook(() => useGamification(), {
      wrapper: ({ children }) => <GamificationProvider>{children}</GamificationProvider>,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tasks.length).toBeGreaterThan(0)

    const first = result.current.tasks[0]
    const before = result.current.taskCounter.done

    act(() => {
      result.current.toggleTask(first.id)
    })
    await waitFor(() =>
      expect(result.current.taskCounter.done).toBe(first.done ? before - 1 : before + 1),
    )
    // Toggling back returns the counter to where it started.
    act(() => {
      result.current.toggleTask(first.id)
    })
    await waitFor(() => expect(result.current.taskCounter.done).toBe(before))
  })

  it('adding a task appends an undone item and grows the counter total', async () => {
    const { result } = renderHook(() => useGamification(), {
      wrapper: ({ children }) => <GamificationProvider>{children}</GamificationProvider>,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    const totalBefore = result.current.taskCounter.total

    act(() => {
      result.current.addTask('A brand-new task')
    })

    await waitFor(() => expect(result.current.taskCounter.total).toBe(totalBefore + 1))
    const added = result.current.tasks[result.current.tasks.length - 1]
    expect(added).toMatchObject({ label: 'A brand-new task', done: false })
    // The new task doesn't count as done, so "done" stays put.
    expect(result.current.taskCounter.done).toBe(
      result.current.tasks.filter((t) => t.done).length,
    )
  })

  it('ignores adding a blank/whitespace-only task', async () => {
    const { result } = renderHook(() => useGamification(), {
      wrapper: ({ children }) => <GamificationProvider>{children}</GamificationProvider>,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    const totalBefore = result.current.taskCounter.total

    act(() => {
      result.current.addTask('   ')
    })
    // No state update is scheduled for a blank task, so the total is
    // still the fixture's after the same tick.
    expect(result.current.taskCounter.total).toBe(totalBefore)
  })

  it('hydrates badges and streak from fixtures as read-only state', async () => {
    const { result } = renderHook(() => useGamification(), {
      wrapper: ({ children }) => <GamificationProvider>{children}</GamificationProvider>,
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.badges.length).toBeGreaterThan(0)
    expect(result.current.badges.some((b) => b.earned)).toBe(true)
    expect(result.current.badges.some((b) => !b.earned)).toBe(true)
    expect(result.current.streak).toMatchObject({
      currentWeeks: expect.any(Number),
      personalBestWeeks: expect.any(Number),
    })
  })
})
