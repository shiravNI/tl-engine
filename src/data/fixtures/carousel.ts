import type { CarouselDeck } from '@/data/types'

export const carouselDecks: CarouselDeck[] = [
  {
    id: 'carousel_ai_search',
    title: '5 charts that explain the AI-search shift',
    prompt:
      'Referral traffic from AI assistants is up 340% since January. Turn our Q1 data into a 5-slide breakdown for LinkedIn — cover, 3 data slides, one CTA.',
    sourceFileLabel: 'Q2-category-report.pdf',
    stage: 'editing',
    slides: [
      { id: 'slide_1', index: 1, kind: 'cover', label: '01 · Cover', headline: '5 charts that explain the AI-search shift' },
      { id: 'slide_2', index: 2, kind: 'data', label: '02 · Data', headline: 'Referral traffic from AI assistants is up 340% since January', hasChart: true },
      { id: 'slide_3', index: 3, kind: 'data', label: '03 · Data', headline: 'Converts near organic-search rate', hasChart: true },
      { id: 'slide_4', index: 4, kind: 'data', label: '04 · Data', headline: 'Senior audience share up 6 periods', hasChart: true },
      { id: 'slide_5', index: 5, kind: 'cta', label: '05 · CTA', headline: "What's your unbundling story?" },
    ],
  },
]
