import type { APIRoute } from "astro";
import { setNote } from "../../lib/state.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { slug, body } = await request.json();
    if (typeof slug !== "string" || typeof body !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "ogiltig indata" }), { status: 400 });
    }
    setNote(slug, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }
};
