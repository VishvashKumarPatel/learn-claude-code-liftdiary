import { db } from "@/db";
import { workouts } from "@/db/schema";
import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { addDays, startOfDay } from "date-fns";

export async function getWorkoutById(userId: string, workoutId: string) {
  return db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId),
      isNull(workouts.deletedAt)
    ),
  });
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  name: string | null,
  date: Date
) {
  const [workout] = await db
    .update(workouts)
    .set({ name, date, updatedAt: new Date() })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();
  return workout;
}

export async function createWorkout(userId: string, name: string | null, date: Date) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, name, date })
    .returning();
  return workout;
}

export type WorkoutSummary = {
  id: string;
  name: string | null;
  durationMinutes: number | null;
  exerciseCount: number;
  exerciseNames: string[];
};

export async function getWorkoutsForDate(
  userId: string,
  date: Date
): Promise<WorkoutSummary[]> {
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  const results = await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      isNull(workouts.deletedAt),
      gte(workouts.date, dayStart),
      lt(workouts.date, dayEnd)
    ),
    with: {
      workoutExercises: {
        orderBy: (we, { asc }) => [asc(we.orderIndex)],
        with: {
          exercise: true,
        },
      },
    },
  });

  return results.map((w) => {
    const durationMinutes =
      w.startedAt && w.completedAt
        ? Math.round((w.completedAt.getTime() - w.startedAt.getTime()) / 60000)
        : null;

    return {
      id: w.id,
      name: w.name,
      durationMinutes,
      exerciseCount: w.workoutExercises.length,
      exerciseNames: w.workoutExercises.map((we) => we.exercise.name),
    };
  });
}
