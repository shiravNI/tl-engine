import type { Task } from '@/data/types'

export const tasks: Task[] = [
  { id: 'task_1', label: 'Brain dump this morning’s idea', done: true },
  {
    id: 'task_2',
    label: 'Reply to Shira’s note on "Three things I got wrong"',
    done: true,
  },
  { id: 'task_3', label: 'Post today to keep the 14-week streak', done: false, duePill: 'Due today' },
  {
    id: 'task_4',
    label: 'Run BS check on "Three things I got wrong about brand budgets"',
    done: false,
  },
]
