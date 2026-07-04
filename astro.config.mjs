import { defineConfig } from "astro/config";
import node from "@astrojs/node";

// Personlig webbkurs — SSR (per request) för att injecta lokal progression.
// Körs lokalt, ingen auth. Se CLAUDE.md / Kravspec.
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  server: { port: 4321, host: false },
  // Lokal enanvändarapp utan auth/cookies — inget CSRF att skydda mot, och
  // Astros checkOrigin blockerar annars vanliga form-POST (quiz-inlämning).
  security: { checkOrigin: false },
  // Astro-egen markdown används inte; vi parsar content/ själva mot innehållskontraktet.
  markdown: { syntaxHighlight: false },
});
