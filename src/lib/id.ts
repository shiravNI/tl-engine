/**
 * Dependency-free unique id generator for client-created records. Returns a
 * real UUID (v4, via the global `crypto.randomUUID()`) so every id
 * generated here doubles as a valid Postgres `uuid` primary key once
 * persisted — required so a later mutation (archive, stage change, toggle
 * done, …) addressed by this same id actually reaches the row Supabase
 * created for it. `prefix` is unused now (kept so call sites don't need to
 * change) — ids used to be human-readable-prefixed, but that format isn't
 * a valid `uuid` column value.
 */
export function makeId(_prefix: string): string {
  return crypto.randomUUID()
}
