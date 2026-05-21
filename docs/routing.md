# Routing Coding Standards

## Route Structure

All user-facing application routes live under `/dashboard`. There are no authenticated routes outside this prefix.

| Path | Description |
|---|---|
| `/` | Public landing page |
| `/sign-in` | Clerk-hosted sign-in (public) |
| `/sign-up` | Clerk-hosted sign-up (public) |
| `/dashboard` | Main dashboard (protected) |
| `/dashboard/workout/new` | Create a new workout (protected) |
| `/dashboard/workout/[workoutId]` | Edit an existing workout (protected) |

When adding new pages, place them under `app/dashboard/` and they are automatically protected by the middleware.

---

## Route Protection

Route protection is enforced at two layers: **middleware** and **page level**. Both are required.

### Layer 1 — Middleware (entry gate)

`middleware.ts` at the repo root uses `createRouteMatcher` to mark all `/dashboard` routes as protected. Unauthenticated requests are rejected before the page renders.

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

`auth.protect()` automatically redirects unauthenticated users to the Clerk sign-in page. Do **not** call `redirect("/sign-in")` manually in middleware.

Do **not** narrow the `matcher` config — every route must be covered so Clerk can populate the session even on public pages.

### Layer 2 — Page level (user resolution)

Middleware only verifies that a Clerk session exists. Every protected Server Component must also resolve `clerkId → user.id` before querying the database. See `docs/auth.md` for the full two-ID pattern.

```ts
// app/dashboard/some-page/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/data/users";

export default async function SomePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in"); // fallback — middleware should have caught this

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  // use user.id for all data queries
}
```

The `if (!clerkId) redirect("/sign-in")` guard in each page is a **defensive fallback**, not the primary gate. The middleware is the primary gate.

---

## Rules

- **Never** place authenticated pages outside `/dashboard`. If a route requires login, it belongs under `/dashboard`.
- **Never** rely solely on per-page `auth()` checks for access control — the middleware must enforce the `/dashboard(.*)` matcher.
- **Never** remove or narrow the `matcher` in `middleware.ts` — doing so silently disables Clerk session population on excluded routes.
- **Never** accept a `userId` from URL params to scope data — always derive it from the session. See `docs/data-fetching.md`.
- Public routes (`/`, `/sign-in`, `/sign-up`) require no changes — they are not matched by `isProtectedRoute` and remain accessible without a session.

---

## Summary

| Concern | Correct approach |
|---|---|
| Where authenticated pages live | Under `/dashboard/` |
| Middleware enforcement | `createRouteMatcher(['/dashboard(.*)'])` + `auth.protect()` |
| Redirect on unauthenticated | `auth.protect()` in middleware (automatic) |
| Per-page auth check | Still required to resolve `clerkId → user.id` |
| Adding a new protected page | Place under `app/dashboard/` — middleware protects it automatically |
