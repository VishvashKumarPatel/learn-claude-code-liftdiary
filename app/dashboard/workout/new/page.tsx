import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { redirect } from "next/navigation";

import { getUserByClerkId } from "@/data/users";
import NewWorkoutForm from "./NewWorkoutForm";

interface NewWorkoutPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function NewWorkoutPage({ searchParams }: NewWorkoutPageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const dateIso = params.date ?? format(new Date(), "yyyy-MM-dd");

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Workout</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Log a workout session</p>
      </div>
      <NewWorkoutForm defaultDate={dateIso} />
    </main>
  );
}
