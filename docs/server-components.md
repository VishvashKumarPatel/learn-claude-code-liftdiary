# Server Component Coding Standards

## Rule: `params` and `searchParams` Must Be Awaited

**This project runs Next.js 15, where `params` and `searchParams` are Promises.** You must `await` them before accessing any property. Accessing them synchronously is a runtime error.

```ts
// app/dashboard/workout/[workoutId]/page.tsx

interface EditWorkoutPageProps {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function EditWorkoutPage({ params, searchParams }: EditWorkoutPageProps) {
  const { workoutId } = await params;       // ✓ awaited
  const { date } = await searchParams;      // ✓ awaited
}
```

**Incorrect:**
```ts
// ❌ synchronous destructure — runtime error in Next.js 15
export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  const { workoutId } = params; // throws: params is a Promise
}
```

### Type signatures

Always type `params` and `searchParams` as `Promise<...>` in the props interface:

```ts
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
```

Never type them as plain objects (`{ slug: string }`) — that matches the old Next.js 13/14 API and will produce incorrect TypeScript types for this project.

---

## Rule: Server Components Must Be `async`

Every Server Component that fetches data or reads `params`/`searchParams` must be declared `async`. This is required to use `await` at the top level of the component.

```ts
// ✓ correct
export default async function WorkoutPage({ params }: PageProps) {
  const { workoutId } = await params;
  // ...
}

// ❌ incorrect — cannot await inside a non-async function
export default function WorkoutPage({ params }: PageProps) {
  const { workoutId } = await params; // syntax error
}
```

---

## Rule: Resolve Auth Before Params

Always authenticate and resolve `clerkId → user.id` before using `params` to query the database. This prevents wasted database calls if the user is unauthenticated.

```ts
export default async function ProtectedPage({ params }: PageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const { workoutId } = await params; // ✓ auth resolved first

  const workout = await getWorkoutById(user.id, workoutId);
  if (!workout) notFound();
}
```

---

## Rule: Use `notFound()` for Missing Records

When a route param identifies a specific record (e.g. `[workoutId]`) and the record does not exist or does not belong to the authenticated user, call `notFound()` from `next/navigation`. Do **not** render a fallback UI inline or redirect to the dashboard.

```ts
import { notFound } from "next/navigation";

const workout = await getWorkoutById(user.id, workoutId);
if (!workout) notFound(); // ✓ renders the nearest not-found.tsx boundary
```

---

## Summary

| Concern | Correct approach |
|---|---|
| `params` / `searchParams` type | `Promise<{ ... }>` |
| Accessing `params` / `searchParams` | Always `await` before use |
| Server Component declaration | Always `async` |
| Auth vs params order | Resolve auth first, then `await params` |
| Missing record from URL param | `notFound()` from `next/navigation` |
