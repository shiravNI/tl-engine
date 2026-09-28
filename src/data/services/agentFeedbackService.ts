// The AI drafting agent's real learning signal: every rejection/edit of an
// agent-authored draft is captured here, and the next `generate-drafts`
// call reads recent reasons back into its own prompt.
import { supabase } from '@/lib/supabaseClient'

export async function insertAgentFeedback(
  userId: string,
  input: { draftId: string; action: 'rejected' | 'edited'; reason: string },
): Promise<void> {
  await supabase.from('agent_feedback').insert({
    user_id: userId,
    draft_id: input.draftId,
    action: input.action,
    reason: input.reason,
  })
}
