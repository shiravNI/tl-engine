import { describe, expect, it } from 'vitest'
import { selectionReducer, summarizeSelection } from '@/features/archive/archiveSelection'
import type { ArchiveEntry } from '@/data/types'

const entries: ArchiveEntry[] = [
  { id: 'a1', refId: 'idea_1', type: 'idea', title: 'Idea one', lastTouched: '1 Jul', reason: 'stale' },
  { id: 'a2', refId: 'draft_1', type: 'draft', title: 'Draft one', lastTouched: '2 Jul', reason: 'stalled' },
  { id: 'a3', refId: 'post_1', type: 'post', title: 'Post one', lastTouched: '3 Jul', reason: 'old' },
]

describe('selectionReducer', () => {
  it('toggles a single id in and out', () => {
    let state = selectionReducer([], { type: 'TOGGLE', id: 'a1' })
    expect(state).toEqual(['a1'])
    state = selectionReducer(state, { type: 'TOGGLE', id: 'a1' })
    expect(state).toEqual([])
  })

  it('adds a second id alongside the first', () => {
    let state = selectionReducer([], { type: 'TOGGLE', id: 'a1' })
    state = selectionReducer(state, { type: 'TOGGLE', id: 'a2' })
    expect(state).toEqual(['a1', 'a2'])
  })

  it('SELECT_ALL selects every visible id when none selected', () => {
    const state = selectionReducer([], { type: 'SELECT_ALL', ids: ['a1', 'a2', 'a3'] })
    expect(state).toEqual(['a1', 'a2', 'a3'])
  })

  it('SELECT_ALL clears when everything visible is already selected', () => {
    const state = selectionReducer(['a1', 'a2', 'a3'], { type: 'SELECT_ALL', ids: ['a1', 'a2', 'a3'] })
    expect(state).toEqual([])
  })

  it('CLEAR empties the selection', () => {
    expect(selectionReducer(['a1', 'a2'], { type: 'CLEAR' })).toEqual([])
  })

  it('preserves a selection made under one filter when SELECT_ALL runs under a different filter', () => {
    // User selects a1 (an Idea) while the "Ideas" filter is active…
    let state = selectionReducer([], { type: 'TOGGLE', id: 'a1' })
    // …then switches to the "Drafts" filter and clicks "select all" there
    // (only a2 is visible now). The previous idea selection must survive.
    state = selectionReducer(state, { type: 'SELECT_ALL', ids: ['a2'] })
    expect(state).toEqual(['a1', 'a2'])
  })

  it('SELECT_ALL toggle-off only removes the currently-visible ids, not a selection from another filter', () => {
    // a1 was selected earlier (e.g. under "All"); a2 is separately
    // selected via "select all" under "Drafts".
    let state = selectionReducer(['a1'], { type: 'SELECT_ALL', ids: ['a2'] })
    expect(state).toEqual(['a1', 'a2'])
    // Clicking "select all" again under the same "Drafts" filter should
    // only deselect a2 (the visible set), leaving a1 untouched.
    state = selectionReducer(state, { type: 'SELECT_ALL', ids: ['a2'] })
    expect(state).toEqual(['a1'])
  })
})

describe('summarizeSelection', () => {
  it('counts only ideas/drafts as restorable, but everything selected as deletable', () => {
    const summary = summarizeSelection(entries, ['a1', 'a2', 'a3'])
    expect(summary.restorableCount).toBe(2)
    expect(summary.restorableTitles).toEqual(['Idea one', 'Draft one'])
    expect(summary.deletableCount).toBe(3)
    expect(summary.deletableTitles).toEqual(['Idea one', 'Draft one', 'Post one'])
  })

  it('excludes posts from restorable count when only a post is selected', () => {
    const summary = summarizeSelection(entries, ['a3'])
    expect(summary.restorableCount).toBe(0)
    expect(summary.deletableCount).toBe(1)
  })

  it('returns zero counts for an empty selection', () => {
    const summary = summarizeSelection(entries, [])
    expect(summary.restorableCount).toBe(0)
    expect(summary.deletableCount).toBe(0)
  })

  it('a mixed idea+draft+post selection can bulk-restore only the idea and draft, never the post', () => {
    const summary = summarizeSelection(entries, ['a1', 'a2', 'a3'])
    expect(summary.restorableTitles).not.toContain('Post one')
    expect(summary.restorableTitles).toEqual(['Idea one', 'Draft one'])
    // The post is still part of the deletable set — "Delete N permanently"
    // covers it even though "Restore N" doesn't offer it individually
    // (the Archive table only ever gives a Post row a "View data" action).
    expect(summary.deletableTitles).toContain('Post one')
  })
})
