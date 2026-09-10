import type { Badge } from '@/data/types'

export const badges: Badge[] = [
  { id: 'badge_chain10', name: 'Chain of 10', description: '10 weeks straight. Earned 4 Aug.', earned: true, earnedAt: '2026-08-04', icon: 'flame' },
  { id: 'badge_full_bucket', name: 'Full bucket', description: '10 ideas banked at once.', earned: true, icon: 'inbox' },
  { id: 'badge_no_slop', name: 'No slop', description: '5 posts passed BS check first time.', earned: true, icon: 'shield' },
  { id: 'badge_chain15', name: 'Chain of 15', description: '14 / 15 weeks', earned: false, progressCurrent: 14, progressTarget: 15, icon: 'trophy' },
  { id: 'badge_100k', name: '100k reached', description: '64k / 100k impressions', earned: false, progressCurrent: 64000, progressTarget: 100000, icon: 'eye' },
  { id: 'badge_conversation', name: 'Conversation starter', description: '7 / 20 comment threads', earned: false, progressCurrent: 7, progressTarget: 20, icon: 'msg' },
  { id: 'badge_amplifier', name: 'Amplifier', description: '1 / 5 cohort posts boosted', earned: false, progressCurrent: 1, progressTarget: 5, icon: 'users' },
  { id: 'badge_hidden', name: 'Hidden badge', description: 'Unlocks at 20 weeks.', earned: false, hidden: true, icon: 'lock' },
]
