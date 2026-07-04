import type { APIRoute } from "astro";
import { COOKIE } from "../middleware.ts";
import { getUser } from "../lib/users.ts";

export const prerender = false;

// Sätter aktiv användare (cookie) och skickar tillbaka dit man kom ifrån.
export const GET: APIRoute = ({ url, cookies, redirect, request }) => {
  const id = url.searchParams.get("u");
  if (id && getUser(id)) {
    cookies.set(COOKIE, id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
    });
  }
  const back = url.searchParams.get("to") || request.headers.get("referer") || "/";
  // Endast interna sökvägar tillåts som retur.
  const safe = back.startsWith("/") ? back : "/";
  return redirect(safe);
};
