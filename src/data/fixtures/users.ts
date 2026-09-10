import type { User } from '@/data/types'

export const CURRENT_USER_ID = 'user_shira'

export const users: User[] = [
  { id: 'user_shira', name: 'Shira H.', initials: 'SH', role: 'cast', title: 'Director, Brand' },
  { id: 'user_dana', name: 'Dana L.', initials: 'DL', role: 'director', title: 'Director' },
  { id: 'user_roi', name: 'Roi M.', initials: 'RM', role: 'cast', title: 'Performance Lead' },
  { id: 'user_tal', name: 'Tal K.', initials: 'TK', role: 'cast', title: 'New cast member' },
]

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}
