// Thin async wrappers around local fixtures — the seam a future real API
// swaps into without touching any component or context.
import { ideas as ideasFixture } from '@/data/fixtures/ideas'
import { drafts as draftsFixture } from '@/data/fixtures/drafts'
import { posts as postsFixture } from '@/data/fixtures/posts'
import { videoItems as videoItemsFixture } from '@/data/fixtures/videoBoard'
import { carouselDecks as carouselDecksFixture } from '@/data/fixtures/carousel'
import { mockAsync } from '@/lib/mockAsync'
import type { CarouselDeck, Draft, Idea, PostAnalytics, VideoItem } from '@/data/types'

export async function fetchIdeas(): Promise<Idea[]> {
  return mockAsync(ideasFixture, 150)
}

export async function fetchDrafts(): Promise<Draft[]> {
  return mockAsync(draftsFixture, 150)
}

export async function fetchPosts(): Promise<PostAnalytics[]> {
  return mockAsync(postsFixture, 150)
}

export async function fetchVideoItems(): Promise<VideoItem[]> {
  return mockAsync(videoItemsFixture, 150)
}

export async function fetchCarouselDecks(): Promise<CarouselDeck[]> {
  return mockAsync(carouselDecksFixture, 150)
}

export async function fetchIdeaById(id: string): Promise<Idea | undefined> {
  return mockAsync(ideasFixture.find((i) => i.id === id), 120)
}

export async function fetchDraftById(id: string): Promise<Draft | undefined> {
  return mockAsync(draftsFixture.find((d) => d.id === id), 120)
}
