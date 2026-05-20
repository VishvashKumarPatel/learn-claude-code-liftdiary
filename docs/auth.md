# Auth Coding Standards

## Provider

**This app uses [Clerk](https://clerk.com/) exclusively for authentication.**

- Do **not** implement custom session handling, JWT validation, or password logic.
- Do **not** use NextAuth, Auth.js, Supabase Auth, or any other auth library.
- All auth primitives (`auth()`, `currentUser()`, middleware helpers) come from `@clerk/nextjs/server`.

---

## Middleware

Clerk middleware must be registered in `middleware.ts` at the repo root using `clerkMiddleware`. The default matcher covers all routes except static assets.

```ts
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

Do **not** remove or narrow this matcher — every page must be covered so Clerk can populate the session.

---

## Retrieving the Session

Use `auth()` from `@clerk/nextjs/server` in Server Components and Server Actions. Never call it from Client Components.

```ts
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const { userId: clerkId } = await auth();
if (!clerkId) redirect("/sign-in");
```

- Always destructure `userId` and rename it `clerkId` immediately to avoid confusion with the internal database `id`.
- Redirect unauthenticated users to `/sign-in` — do not render protected content for `null` sessions.

---

## The Two-ID Pattern

Clerk issues its own `userId` (a `clerkId`). The database has a separate internal `id` for each user row. **These are not interchangeable.**

| Identifier | Source | Use for |
|---|---|---|
| `clerkId` | Clerk session (`auth()`) | Lookup the internal user record |
| `user.id` | Database `users` table | All other database queries |

### Resolution pattern

Every protected Server Component must resolve `clerkId → user.id` before passing data to `/data` helpers:

```ts
// app/some-protected/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/data/users";

export default async function ProtectedPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  // Pass user.id — never clerkId — to data helpers
  const data = await getSomeDataForUser(user.id);
}
```

The `getUserByClerkId` helper lives in `data/users.ts` and is the only place that queries by `clerkId`. All other `/data` helpers accept `userId` (the internal `id`).

---

## Rules

- **Never** pass `clerkId` to `/data` helpers other than `getUserByClerkId`.
- **Never** accept a `userId` from URL params, query strings, or request bodies — always derive it from the authenticated session. See `docs/data-fetching.md` for the full data scoping rule.
- **Never** call `auth()` from a Client Component — it is a server-only function.
- **Never** store auth state in React state or context — read it fresh from `auth()` on every server render.
- Sign-in and sign-up UI must use Clerk's hosted components or the `<SignIn />` / `<SignUp />` React components from `@clerk/nextjs` — do not build custom auth forms.

---

## Summary

| Concern | Correct approach |
|---|---|
| Auth provider | Clerk (`@clerk/nextjs/server`) |
| Session in Server Components | `auth()` → destructure as `clerkId` |
| Resolving internal user ID | `getUserByClerkId(clerkId)` in `data/users.ts` |
| Passing to data helpers | Always `user.id`, never `clerkId` |
| Unauthenticated users | `redirect("/sign-in")` |
| Auth in Client Components | Never |
