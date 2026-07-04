import type { APIRoute } from "astro";
import { setNote } from "../../lib/state.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const userId = locals.currentUserId;
    if (!userId) return new Response(JSON.stringify({ ok: false, error: "ingen användare" }), { status: 400 });
    const { slug, body } = await request.json();
    if (typeof slug !== "string" || typeof body !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "ogiltig indata" }), { status: 400 });
    }
    setNote(userId, slug, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }
};
