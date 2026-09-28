// Calls the `generate-drafts` Supabase Edge Function — the real AI
// drafting pass (see supabase/functions/generate-drafts). The function
// itself enforces the caller's own JWT/RLS; this client just shapes the
// request and surfaces the function's own error messages (missing key,
// thin Voice Card, nothing to draft from) directly, since they're already
// written to be shown to the user as-is.
import { supabase } from '@/lib/supabaseClient'
import { rowToDraft } from '@/data/services/contentService'
import type { Draft, DraftFormat } from '@/data/types'

export interface GenerateDraftInput {
  format?: DraftFormat
  seedIdeaId?: string
  seedResourceId?: string
}

export async function generateAgentDraft(input: GenerateDraftInput = {}): Promise<Draft> {
  const { data, error } = await supabase.functions.invoke('generate-drafts', { body: input })
  if (error) {
    // Supabase's client wraps a non-2xx response in a generic error whose
    // own message isn't useful — the function's own JSON body is what has
    // the real, user-facing reason, but functions.invoke only exposes it
    // via the error's `context` response on some versions, so fall back
    // to a clear generic message rather than showing a stack-shaped string.
    const details = (error as { context?: { error?: string } }).context?.error
    throw new Error(details || 'Drafting failed — try again in a moment.')
  }
  if (data?.error) throw new Error(data.error)
  return rowToDraft(data.draft)
}
