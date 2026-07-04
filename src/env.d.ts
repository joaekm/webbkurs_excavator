/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    users: { id: string; name: string }[];
    currentUserId: string | null;
    currentUserName: string | null;
  }
}
