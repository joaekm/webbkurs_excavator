import type { APIRoute } from "astro";
import { setChecklistItem } from "../../lib/state.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const userId = locals.currentUserId;
    if (!userId) return new Response(JSON.stringify({ ok: false, error: "ingen användare" }), { status: 400 });
    const { slug, index, checked } = await request.json();
    if (typeof slug !== "string" || typeof index !== "number") {
      return new Response(JSON.stringify({ ok: false, error: "ogiltig indata" }), { status: 400 });
    }
    setChecklistItem(userId, slug, index, checked === true);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }
};
