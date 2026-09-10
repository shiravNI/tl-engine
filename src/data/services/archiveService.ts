import { buildArchiveEntries } from '@/data/fixtures/archive'
import { mockAsync } from '@/lib/mockAsync'
import type { ArchiveEntry } from '@/data/types'

export async function fetchArchiveEntries(): Promise<ArchiveEntry[]> {
  return mockAsync(buildArchiveEntries(), 200)
}
