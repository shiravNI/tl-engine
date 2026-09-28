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
    // On a non-2xx response, supabase-js's error carries the raw Response
    // on `.context` (not already-parsed) — read its real JSON body for the
    // function's own user-facing reason instead of a generic network error.
    const context = (error as { context?: Response }).context
    const details = context ? await context.json().catch(() => null) : null
    throw new Error(details?.error || 'Drafting failed — try again in a moment.')
  }
  if (data?.error) throw new Error(data.error)
  return rowToDraft(data.draft)
}
