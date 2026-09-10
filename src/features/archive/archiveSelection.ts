import type { ArchiveEntry } from '@/data/types'

/**
 * Net-new (no wireframe reference): the Archive screen's multi-select /
 * bulk-delete reducer. Kept as a pure, standalone module so it's directly
 * unit-testable without mounting the component.
 */

export type SelectionAction =
  | { type: 'TOGGLE'; id: string }
  | { type: 'SELECT_ALL'; ids: string[] }
  | { type: 'CLEAR' }

export function selectionReducer(state: string[], action: SelectionAction): string[] {
  switch (action.type) {
    case 'TOGGLE':
      return state.includes(action.id) ? state.filter((id) => id !== action.id) : [...state, action.id]
    case 'SELECT_ALL': {
      // Toggle scoped to the *currently visible* ids only, so switching
      // the type filter and selecting-all there doesn't silently drop a
      // selection made under a different filter — it unions with it, and
      // "select all" toggles off only what it toggled on.
      const allVisibleSelected = action.ids.length > 0 && action.ids.every((id) => state.includes(id))
      if (allVisibleSelected) return state.filter((id) => !action.ids.includes(id))
      return Array.from(new Set([...state, ...action.ids]))
    }
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export interface BulkActionSummary {
  restorableCount: number
  restorableTitles: string[]
  deletableCount: number
  deletableTitles: string[]
}

/** Only ideas and drafts can be restored — published posts only ever
 * offer "View data" in this screen, per the wireframe. */
export function summarizeSelection(entries: ArchiveEntry[], selectedIds: string[]): BulkActionSummary {
  const selected = entries.filter((e) => selectedIds.includes(e.id))
  const restorable = selected.filter((e) => e.type === 'idea' || e.type === 'draft')
  return {
    restorableCount: restorable.length,
    restorableTitles: restorable.map((e) => e.title),
    deletableCount: selected.length,
    deletableTitles: selected.map((e) => e.title),
  }
}
