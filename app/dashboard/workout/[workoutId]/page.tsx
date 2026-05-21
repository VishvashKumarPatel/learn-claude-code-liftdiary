import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";

import { getUserByClerkId } from "@/data/users";
import { getWorkoutById } from "@/data/workouts";
import EditWorkoutForm from "./EditWorkoutForm";

interface EditWorkoutPageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const { workoutId } = await params;

  const workout = await getWorkoutById(user.id, workoutId);
  if (!workout) notFound();

  const defaultDate = format(workout.date, "yyyy-MM-dd");
  const defaultName = workout.name ?? "";

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Workout</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Update workout details</p>
      </div>
      <EditWorkoutForm
        workoutId={workoutId}
        defaultName={defaultName}
        defaultDate={defaultDate}
      />
    </main>
  );
}
