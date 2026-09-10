import { interviewExchanges, onboardingPhases, voiceCard } from '@/data/fixtures/onboarding'
import { mockAsync } from '@/lib/mockAsync'
import type { OnboardingPhase, VoiceCard } from '@/data/types'

export async function fetchOnboardingPhases(): Promise<OnboardingPhase[]> {
  return mockAsync(onboardingPhases, 150)
}

export async function fetchVoiceCard(): Promise<VoiceCard> {
  return mockAsync(voiceCard, 150)
}

export async function fetchInterviewExchanges() {
  return mockAsync(interviewExchanges, 150)
}
