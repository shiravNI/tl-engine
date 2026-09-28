import { describe, expect, it } from 'vitest'
import { resourceToInsertRow, rowToResource } from '@/data/services/resourceService'

const USER_ID = 'user_test_1'

describe('resourceService — resources row <-> camelCase mapper', () => {
  it('round-trips a full row through rowToResource -> resourceToInsertRow unchanged', () => {
    const row = {
      id: 'resource_1',
      url: 'https://example.com/a-report',
      title: 'A great report',
      note: 'Worth a draft on the churn stat.',
      pillar: 'Performance',
      tags: ['q2', 'churn'],
      created_at: '2026-01-01T00:00:00Z',
    }
    const resource = rowToResource(row)
    expect(resource).toEqual({
      id: 'resource_1',
      url: 'https://example.com/a-report',
      title: 'A great report',
      note: 'Worth a draft on the churn stat.',
      pillar: 'Performance',
      tags: ['q2', 'churn'],
      createdAt: '2026-01-01T00:00:00Z',
    })
    expect(resourceToInsertRow(USER_ID, resource)).toEqual({ ...row, user_id: USER_ID })
  })

  it('defaults a null pillar and missing tags to null / an empty array', () => {
    const row = {
      id: 'resource_2',
      url: 'https://example.com',
      title: '',
      note: '',
      pillar: null,
      tags: null as unknown as string[],
      created_at: '2026-01-02T00:00:00Z',
    }
    const resource = rowToResource(row)
    expect(resource.pillar).toBeNull()
    expect(resource.tags).toEqual([])
  })
})
