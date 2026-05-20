"use server";

import { auth } from "@clerk/nextjs/server";

import { getUserByClerkId } from "@/data/users";
import { createWorkout } from "@/data/workouts";
import { createWorkoutSchema, type CreateWorkoutInput } from "./schemas";

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { unauthorized: true as const };

  const user = await getUserByClerkId(clerkId);
  if (!user) return { unauthorized: true as const };

  const parsed = createWorkoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const workout = await createWorkout(
    user.id,
    parsed.data.name ?? null,
    new Date(`${parsed.data.date}T00:00:00`)
  );

  return { data: workout };
}
