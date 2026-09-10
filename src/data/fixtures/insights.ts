import type { InsightSnapshot } from '@/data/types'

export const insightSnapshot: InsightSnapshot = {
  impressions: 64180,
  impressionsDeltaPct: 18,
  impressionsSpark: [20, 17, 19, 12, 13, 6, 4],
  engagementRate: 4.1,
  engagementDeltaPt: 0.6,
  engagementSpark: [18, 20, 14, 16, 10, 11, 7],
  newFollowers: 412,
  newFollowersDeltaPct: -5,
  newFollowersSpark: [8, 7, 11, 10, 14, 13, 16],
  postsPublished: 11,
  postsPlanned: 12,
  weeklyImpressions: [
    { label: 'Jun 9', value: 38 },
    { label: '', value: 52 },
    { label: '', value: 30 },
    { label: '', value: 66 },
    { label: 'Jul 7', value: 44 },
    { label: '', value: 88, highlight: '18.4k · 26 Aug' },
    { label: '', value: 41 },
    { label: 'Aug 4', value: 58 },
    { label: '', value: 35 },
    { label: '', value: 71 },
    { label: 'Sep 1', value: 49 },
  ],
  highlights: [
    {
      id: 'h1',
      icon: 'up',
      text: 'Posts that open with a number you personally own do 2.3× your median impressions.',
    },
    {
      id: 'h2',
      icon: 'clock',
      text: 'Tuesday 09:00–10:00 beats Thursday for you by 31% on reach. Four data points, treat gently.',
    },
    {
      id: 'h3',
      icon: 'alert',
      text: 'Follower growth is flattening while impressions rise — reach is coming from reposts, not profile visits.',
    },
  ],
  suggestedMove: 'Turn the "second question" post into a 3-part series while it\'s still circulating.',
  audienceSegments: [
    { id: 'seg_director', label: 'Director', share: 31, deltaPt: 6, color: '#A85132', trend: [16, 19, 23, 26, 29, 31] },
    { id: 'seg_vp', label: 'VP / C-level', share: 24, deltaPt: 9, color: '#C77450', trend: [20, 18, 20, 22, 23, 24] },
    { id: 'seg_manager', label: 'Manager', share: 28, deltaPt: -8, color: '#D99B77', trend: [34, 33, 32, 30, 29, 28] },
    { id: 'seg_ic', label: 'IC / Other', share: 17, deltaPt: -7, color: '#E8CFB4', trend: [30, 30, 25, 22, 19, 17] },
  ],
  lastUploadedAt: '2026-08-31T10:00:00Z',
}
