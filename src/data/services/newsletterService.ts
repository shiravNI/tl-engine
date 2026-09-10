import { newsletterIssue } from '@/data/fixtures/newsletter'
import { mockAsync } from '@/lib/mockAsync'
import type { NewsletterIssue } from '@/data/types'

export async function fetchNewsletterIssue(): Promise<NewsletterIssue> {
  return mockAsync(newsletterIssue, 200)
}
