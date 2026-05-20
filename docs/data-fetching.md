# Data Fetching

## Rule: Server Components Only

**All data fetching must happen exclusively in React Server Components.**

- Do **not** fetch data in Client Components (`"use client"`)
- Do **not** use Route Handlers (`app/api/...`) to serve data to the frontend
- Do **not** use `useEffect` + `fetch`, SWR, React Query, or any client-side data fetching library
- Do **not** call Drizzle or any database client from Client Components

Data flows in one direction: database → `/data` helper → Server Component → (optional) Client Component for interactivity only.

### Why

Next.js App Router Server Components run entirely on the server. They have direct, secure access to the database without exposing credentials to the client, eliminate client/server waterfalls, and are never included in the JavaScript bundle shipped to the browser.

---

## Rule: All Database Queries via `/data` Helpers

Every database query must live in a helper function inside the `/data` directory. Server Components call these helpers; they do not construct queries inline.

```
/data
  workouts.ts      # queries related to workouts
  exercises.ts     # queries related to exercises
  sets.ts          # queries related to sets
  ...
```

### Helper conventions

- Each helper is an `async` function that returns typed data
- Helpers use **Drizzle ORM** exclusively — no raw SQL (`db.execute(sql\`...\`)` is forbidden)
- Helpers accept a `userId` parameter and always filter by it (see security rule below)
- Helpers are not exported from Server Actions or Route Handlers — only consumed by Server Components

**Correct:**
```ts
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getWorkoutsForUser(userId: string) {
  return db.select().from(workouts).where(eq(workouts.userId, userId));
}
```

**Incorrect:**
```ts
// ❌ raw SQL
const rows = await db.execute(sql`SELECT * FROM workouts WHERE user_id = ${userId}`);

// ❌ query inline inside a component
const data = await db.select().from(workouts);
```

---

## Rule: Users May Only Access Their Own Data

**Every query must be scoped to the authenticated user's ID.** A logged-in user must never be able to read or modify another user's records.

### Enforcement pattern

1. Retrieve the authenticated session at the top of every Server Component (or in a shared layout) using your auth library.
2. Pass `userId` explicitly into every `/data` helper — never derive it inside the helper from a cookie or global.
3. Every helper that touches user-owned data **must** include a `where(eq(table.userId, userId))` clause (or equivalent join condition).
4. Never accept a `userId` from URL params, query strings, or request bodies without validating it matches the session user.

```ts
// app/workouts/page.tsx  (Server Component)
import { auth } from "@/auth";
import { getWorkoutsForUser } from "@/data/workouts";
import { redirect } from "next/navigation";

export default async function WorkoutsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workouts = await getWorkoutsForUser(session.user.id);
  // ...
}
```

```ts
// data/workouts.ts
export async function getWorkoutsForUser(userId: string) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId)); // userId always scoped here
}
```

---

## Summary

| Concern | Correct approach |
|---|---|
| Where to fetch data | Server Components only |
| How to query the database | Drizzle ORM via `/data` helpers |
| Raw SQL | Never |
| Route Handlers for data | Never |
| Client-side fetching | Never |
| Data scoping | Always filter by authenticated `userId` |
