import { defineMiddleware } from "astro:middleware";
import { getUsers, resolveUser } from "./lib/users.ts";

// Ingen inloggning. Middleware avgör bara "vem är jag" utifrån cookien
// course_user och exponerar det + användarlistan till sidor och API-rutter.
export const COOKIE = "course_user";

export const onRequest = defineMiddleware((context, next) => {
  const cookieId = context.cookies.get(COOKIE)?.value;
  const current = resolveUser(cookieId);
  context.locals.users = getUsers();
  context.locals.currentUserId = current?.id ?? null;
  context.locals.currentUserName = current?.name ?? null;
  return next();
});
