import type { APIRoute } from "astro";
import { toggleRead } from "../../lib/state.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const userId = locals.currentUserId;
    if (!userId) return new Response(JSON.stringify({ ok: false, error: "ingen användare" }), { status: 400 });
    const { slug } = await request.json();
    if (typeof slug !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "ogiltig indata" }), { status: 400 });
    }
    const read = toggleRead(userId, slug);
    return new Response(JSON.stringify({ ok: true, read }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }
};
