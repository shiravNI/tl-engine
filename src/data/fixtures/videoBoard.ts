import type { VideoItem } from '@/data/types'

export const videoItems: VideoItem[] = [
  {
    id: 'video_landing_page',
    title: 'Why we killed our best-performing landing page',
    format: 'video',
    stage: 'script',
    beatsSummary: 'Hook / Problem / Reveal / CTA — 4 beats drafted',
    inspoLabel: "Inspo: Lenny's \"the page that converts\"",
    people: [],
  },
  {
    id: 'video_ai_search_carousel',
    title: '5 charts that explain the AI-search shift',
    format: 'carousel',
    stage: 'script',
    beatsSummary: 'Slide outline started, needs data pulls',
    people: [],
  },
  {
    id: 'video_org_chart',
    title: 'The org chart lie — talking head',
    format: 'video',
    stage: 'shoot_scheduled',
    shootDate: 'Thu 11 Sep · 10:00',
    location: 'TLV studio, room 2',
    inspoLabel: '"Org design" — First Round Review',
    inspoLink: 'https://firstround.com/review',
    beats: {
      hook: '"Why does brand always report to performance? Nobody\'s ever given me a real answer."',
      body: "Walk through the retention-curve chart. Land on: brand isn't a cost center, it's the reason performance gets cheaper over time.",
      cta: '"What does your org chart say about what your company actually believes?"',
    },
    people: [
      { role: 'on camera', name: 'Shira', initials: 'SH' },
      { role: 'filming', name: 'Roi', initials: 'RM' },
      { role: 'Freelancer · editor', name: 'Maya K.', initials: 'MK', isContact: true },
    ],
  },
  {
    id: 'video_attribution',
    title: '3 things I got wrong about attribution',
    format: 'video',
    stage: 'editing',
    people: [{ role: 'editing', name: 'Roi', initials: 'RM' }],
    editingNote: 'Roi editing · rough cut due 8 Sep',
    editingProgress: 60,
  },
  {
    id: 'video_hiring',
    title: 'Hiring for taste, not tools',
    format: 'video',
    stage: 'ready',
    people: [],
    postingNote: 'Captions added · 58 sec',
  },
]
