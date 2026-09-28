// Supabase Edge Function: generate-drafts
//
// Real AI drafting pass (Researcher + Copywriter + Gatekeeper, in one
// server-side call). Runs entirely against the CALLER's own data via a
// Supabase client scoped to their JWT (never the service role) — RLS is
// the only isolation mechanism, same as every other table in this app, so
// this function can only ever read/write the signed-in user's own rows.
// Auth itself is enforced by `verify_jwt: true` at deploy time plus the
// explicit `auth.getUser()` check below, not by CORS — the CORS headers
// below only unblock the browser's own preflight, they don't widen access.
//
// House rules baked into the prompt (own wording, informed by but not
// copied from any third-party framework): voice-first, no em/en dashes, no
// engagement-bait CTAs ("comment below", "tag someone"), anchor to
// something specific from the user's own real content, one clear angle,
// human always reviews before anything is scheduled or published.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-5";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}

const EM_EN_DASH = /[—–]/;
const AI_TELL_PATTERNS = [
  /\blet that sink in\b/i,
  /\bit'?s not (?:just )?[\w\s]+, it'?s\b/i,
  /\bcircle back\b/i,
  /\bdouble-click on\b/i,
  /\bmove the needle\b/i,
  /\bsynerg(y|ies)\b/i,
  /\bleverag(e|ing)\b/i,
  /\bgame[- ]chang(er|ing)\b/i,
  /\bat the end of the day\b/i,
  /\blow-hanging fruit\b/i,
  /\bunlock(ing)? (true )?potential\b/i,
  /\bin today'?s fast-paced\b/i,
  /\bhumbled and honored\b/i,
  /\bdelve\b/i,
  /\btapestry\b/i,
];
const ENGAGEMENT_BAIT = /\b(agree or disagree|comment below|tag someone|save this post)\b/i;

interface GateResult {
  clean: boolean;
  issues: string[];
}

function gatekeep(paragraphs: string[]): GateResult {
  const issues: string[] = [];
  const text = paragraphs.join("\n");
  if (EM_EN_DASH.test(text)) issues.push("Contains an em dash or en dash — use a period, comma, or colon instead.");
  for (const pattern of AI_TELL_PATTERNS) {
    if (pattern.test(text)) issues.push(`Contains a generic AI-tell phrase matching ${pattern}.`);
  }
  if (ENGAGEMENT_BAIT.test(text)) issues.push("Contains engagement-bait phrasing (e.g. \"comment below\").");
  return { clean: issues.length === 0, issues };
}

interface GenerateRequest {
  format?: "post" | "article";
  seedIdeaId?: string;
  seedResourceId?: string;
}

interface DraftDraft {
  title: string;
  paragraphs: string[];
}

async function callClaude(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const block = data.content?.find((c: { type: string }) => c.type === "text");
  if (!block?.text) throw new Error("Anthropic response had no text content");
  return block.text as string;
}

function parseDraft(raw: string): DraftDraft {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title && Array.isArray(parsed.paragraphs)) {
        return { title: String(parsed.title), paragraphs: parsed.paragraphs.map(String) };
      }
    } catch {
      // fall through to plain-text handling below
    }
  }
  const paragraphs = raw.trim().split(/\n{2,}/).filter(Boolean);
  return { title: paragraphs[0]?.slice(0, 120) ?? "Untitled draft", paragraphs };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return json({ error: "ANTHROPIC_API_KEY is not configured on this project yet." }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "Invalid session" }, 401);
    }

    const body: GenerateRequest = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const format = body.format === "article" ? "article" : "post";

    const [{ data: voiceCard }, { data: opinions }, { data: ideas }, { data: resources }, { data: feedback }] =
      await Promise.all([
        supabase.from("voice_cards").select("*").maybeSingle(),
        supabase.from("voice_card_opinions").select("quote").eq("placeholder", false).limit(5),
        body.seedIdeaId
          ? supabase.from("ideas").select("*").eq("id", body.seedIdeaId).limit(1)
          : supabase.from("ideas").select("*").is("archived_at", null).order("created_at", { ascending: false }).limit(5),
        body.seedResourceId
          ? supabase.from("resources").select("*").eq("id", body.seedResourceId).limit(1)
          : supabase.from("resources").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("agent_feedback").select("action, reason").order("created_at", { ascending: false }).limit(5),
      ]);

    if (!voiceCard || (voiceCard.completeness_pct ?? 0) < 10) {
      return json({ error: "Voice Card is too thin to draft from yet — finish more of the interview first." }, 422);
    }

    const orientation = voiceCard.content_orientation === "audience_sales" ? "Social Seller" : "Thought Leader";
    const anchor = body.seedIdeaId
      ? ideas?.[0]?.text
      : body.seedResourceId
        ? `${resources?.[0]?.title ?? ""} — ${resources?.[0]?.note ?? ""}`
        : (ideas?.[0]?.text ?? resources?.[0]?.title);

    if (!anchor) {
      return json({ error: "No ideas or resources to draft from yet — save one in Brain first." }, 422);
    }

    const feedbackNotes = (feedback ?? [])
      .map((f: { action: string; reason: string }) => `- Previously ${f.action}: "${f.reason}"`)
      .join("\n");

    const system = `You write a single LinkedIn ${format === "article" ? "article (long-form, 400-700 words, with a clear title)" : "post (150-300 words)"} in this specific person's voice. Hard rules, no exceptions: never use an em dash (—) or en dash (–) — use a period, comma, or colon instead; never use engagement-bait closers like "agree or disagree?", "comment below", or "tag someone"; be specific, not vague — anchor the piece to the real detail given below, don't generalize it away; this is for reputation and trust, not lead-gen, so no salesy CTA. Respond with ONLY a JSON object: {"title": string, "paragraphs": string[]}.`;

    const user = `Writer profile: a ${orientation} whose POV fingerprint is: ${voiceCard.pov_fingerprint || "still forming"}.
Their real opinions, in their own words:
${(opinions ?? []).map((o: { quote: string }) => `- ${o.quote}`).join("\n") || "(none yet)"}

Write from this specific real anchor — don't drift into generic advice:
"${anchor}"
${feedbackNotes ? `\nThings this person has rejected or edited before, learn from these:\n${feedbackNotes}` : ""}`;

    let raw = await callClaude(system, user);
    let draft = parseDraft(raw);
    let gate = gatekeep(draft.paragraphs);

    if (!gate.clean) {
      const revisionNote = `Your previous draft had issues: ${gate.issues.join(" ")} Revise it, fixing exactly those issues, keeping the same angle. Respond with ONLY the same JSON shape.`;
      raw = await callClaude(system, `${user}\n\nYour draft:\n${JSON.stringify(draft)}\n\n${revisionNote}`);
      draft = parseDraft(raw);
      gate = gatekeep(draft.paragraphs);
    }

    const slopScore = Math.min(10, gate.issues.length * 3);
    const roastVerdict = gate.clean
      ? "Clean — no AI tells caught, but give it your own read before it ships."
      : "Still flagged after one revision — worth a manual pass before this goes out.";

    const { data: inserted, error: insertError } = await supabase
      .from("drafts")
      .insert({
        title: draft.title,
        paragraphs: draft.paragraphs,
        excerpt: draft.paragraphs[0]?.slice(0, 140) ?? "",
        stage: "in_review",
        format,
        origin: "agent",
        voice_match: voiceCard.completeness_pct ?? 0,
        slop_score: slopScore,
        roast_verdict: roastVerdict,
        roast_flags: gate.issues.map((issue) => ({ quote: "", comment: issue })),
        source_idea_id: body.seedIdeaId ?? null,
        source_type: body.seedIdeaId ? "idea" : body.seedResourceId ? "resource" : null,
        source_label: anchor.slice(0, 140),
        checklist: { hookEarnsSeeMore: false, noLinksInBody: true, visualAttached: false, hashtagsAdded: false },
      })
      .select()
      .single();

    if (insertError) {
      return json({ error: `Failed to save draft: ${insertError.message}` }, 500);
    }

    return json({ draft: inserted }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
