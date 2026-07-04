import type { APIRoute } from "astro";
import { toggleRead } from "../../lib/state.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { slug } = await request.json();
    if (typeof slug !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "ogiltig indata" }), { status: 400 });
    }
    const read = toggleRead(slug);
    return new Response(JSON.stringify({ ok: true, read }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }
};
