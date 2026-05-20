# Data Mutations

## Rule: All Database Writes via `/data` Helpers

**Every database mutation (insert, update, delete) must live in a helper function inside the `/data` directory.** Server Actions call these helpers; they do not construct queries inline.

```
/data
  workouts.ts      # queries and mutations related to workouts
  exercises.ts     # queries and mutations related to exercises
  sets.ts          # queries and mutations related to sets
  ...
```

### Helper conventions

- Each helper is an `async` function with typed parameters
- Helpers use **Drizzle ORM** exclusively — no raw SQL
- Helpers that write user-owned data must accept a `userId` parameter and scope all writes to it (see `data-fetching.md` for the security rule)
- Helpers return the mutated record(s) or a typed result — never `void`

**Correct:**
```ts
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";

export async function createWorkout(userId: string, name: string, date: Date) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, name, date })
    .returning();
  return workout;
}

export async function deleteWorkout(userId: string, workoutId: string) {
  const [deleted] = await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();
  return deleted;
}
```

**Incorrect:**
```ts
// ❌ mutation inline inside a Server Action
await db.insert(workouts).values({ userId, name });

// ❌ raw SQL
await db.execute(sql`INSERT INTO workouts ...`);

// ❌ mutation without userId scope — allows cross-user writes
await db.delete(workouts).where(eq(workouts.id, workoutId));
```

---

## Rule: All Mutations via Server Actions

**All data mutations must be triggered through Next.js Server Actions.** Do not use Route Handlers (`app/api/...`) for writes.

### File placement

Server Actions must live in a colocated `actions.ts` file next to the page or component that uses them:

```
app/
  workouts/
    page.tsx
    actions.ts        ← Server Actions for this route
    new/
      page.tsx
      actions.ts      ← Server Actions scoped to this sub-route
```

### Structure conventions

- Every `actions.ts` file must start with `"use server"` at the top
- Each action is a named `async` function export
- Actions call `/data` helpers — they do not call Drizzle directly
- Actions authenticate the session themselves and pass `userId` into `/data` helpers — never trust a `userId` from the caller

**Correct:**
```ts
// app/workouts/actions.ts
"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createWorkoutSchema } from "./schemas";
import { createWorkout } from "@/data/workouts";

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = createWorkoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const workout = await createWorkout(session.user.id, parsed.data.name, parsed.data.date);
  return { data: workout };
}
```

**Incorrect:**
```ts
// ❌ Server Action calling Drizzle directly
export async function createWorkoutAction(input: CreateWorkoutInput) {
  await db.insert(workouts).values({ ...input });
}

// ❌ Server Action in a Route Handler instead of actions.ts
// app/api/workouts/route.ts — do not use for mutations

// ❌ trusting userId from the caller
export async function deleteWorkoutAction(userId: string, workoutId: string) {
  await deleteWorkout(userId, workoutId); // userId came from the client
}
```

---

## Rule: Typed Parameters — No FormData

**Server Action parameters must be explicitly typed TypeScript objects. `FormData` is forbidden as a parameter type.**

Define an input type (or derive it from your Zod schema) and use it as the parameter type on every action.

**Correct:**
```ts
type CreateWorkoutInput = {
  name: string;
  date: string;
};

export async function createWorkoutAction(input: CreateWorkoutInput) { ... }
```

**Incorrect:**
```ts
// ❌ FormData parameter
export async function createWorkoutAction(formData: FormData) {
  const name = formData.get("name");
  ...
}
```

To wire a `<form>` up to a Server Action, convert the form values to a plain object in the Client Component before calling the action:

```ts
// components/CreateWorkoutForm.tsx (Client Component)
"use client";

import { createWorkoutAction } from "./actions";

export function CreateWorkoutForm() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    await createWorkoutAction({
      name: form.elements.namedItem("name")?.value,
      date: form.elements.namedItem("date")?.value,
    });
  }
  // ...
}
```

---

## Rule: Zod Validation in Every Server Action

**Every Server Action must validate its arguments with Zod before doing any work.** Treat all input as untrusted, even when typed.

### Schema placement

Define Zod schemas in a `schemas.ts` file colocated with the `actions.ts` that uses them. Derive the TypeScript input type from the schema with `z.infer`.

```
app/workouts/
  actions.ts
  schemas.ts        ← Zod schemas and inferred types
```

**Correct:**
```ts
// app/workouts/schemas.ts
import { z } from "zod";

export const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().datetime(),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
```

```ts
// app/workouts/actions.ts
"use server";

import { createWorkoutSchema, type CreateWorkoutInput } from "./schemas";

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  // safe to use parsed.data from here
}
```

**Incorrect:**
```ts
// ❌ no validation — trusting typed input at runtime
export async function createWorkoutAction(input: CreateWorkoutInput) {
  await createWorkout(session.user.id, input.name, input.date);
}

// ❌ schema defined inline in actions.ts — keeps schemas non-reusable
const schema = z.object({ name: z.string() });
```

### Return type convention

Actions should return a discriminated result object, not throw:

```ts
// success
return { data: workout };

// validation or business logic error
return { error: parsed.error.flatten() };

// unauthenticated — signal the client to redirect
return { unauthorized: true as const };
```

This lets Client Components inspect the result and display errors without try/catch.

---

## Rule: No `redirect()` Inside Server Actions

**Never call `redirect()` from `next/navigation` inside a Server Action.** All navigation — including redirecting unauthenticated users — must be handled client-side after the action resolves.

`redirect()` works by throwing a special internal error (`NEXT_REDIRECT`). When called from a Server Action, it bypasses the action's return value entirely, which means:
- The Client Component never receives a result to inspect.
- Any `try/catch` around the action call will catch the redirect as an unexpected error.
- The discriminated result pattern breaks down.

### Correct pattern

Return a signal from the action and let the caller navigate:

```ts
// app/workouts/actions.ts
"use server";

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { unauthorized: true as const }; // ✓ return, don't redirect

  // ...
  return { data: workout };
}
```

```ts
// Client Component
const result = await createWorkoutAction(input);

if (result.unauthorized) {
  router.push("/sign-in"); // ✓ client handles navigation
  return;
}
if (result.data) {
  router.push(`/dashboard`);
}
```

**Incorrect:**
```ts
// ❌ redirect() inside a Server Action
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in"); // throws NEXT_REDIRECT — never reaches caller
  // ...
}
```

---

## Summary

| Concern | Correct approach |
|---|---|
| Where to write mutations | `/data` helpers via Drizzle ORM |
| Raw SQL in mutations | Never |
| Where to expose mutations | Server Actions in colocated `actions.ts` |
| Route Handlers for writes | Never |
| Server Action parameter types | Explicit typed objects; never `FormData` |
| Runtime input validation | Always — Zod, before any db call |
| Zod schema location | Colocated `schemas.ts` next to `actions.ts` |
| userId source in actions | Always from the authenticated session; never from the caller |
| `redirect()` in Server Actions | Never — return a signal and redirect client-side |
