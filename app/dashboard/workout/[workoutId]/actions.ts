"use server";

import { auth } from "@clerk/nextjs/server";

import { getUserByClerkId } from "@/data/users";
import { updateWorkout } from "@/data/workouts";
import { updateWorkoutSchema, type UpdateWorkoutInput } from "./schemas";

export async function updateWorkoutAction(workoutId: string, input: UpdateWorkoutInput) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { unauthorized: true as const };

  const user = await getUserByClerkId(clerkId);
  if (!user) return { unauthorized: true as const };

  const parsed = updateWorkoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const workout = await updateWorkout(
    user.id,
    workoutId,
    parsed.data.name ?? null,
    new Date(`${parsed.data.date}T00:00:00`)
  );

  if (!workout) return { notFound: true as const };

  return { data: workout };
}
