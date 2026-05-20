import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { redirect } from "next/navigation";

import { getUserByClerkId } from "@/data/users";
import { getWorkoutsForDate } from "@/data/workouts";
import DashboardClient from "./DashboardClient";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const selectedDateIso = params.date ?? format(new Date(), "yyyy-MM-dd");
  const selectedDate = new Date(`${selectedDateIso}T00:00:00`);

  const workouts = await getWorkoutsForDate(user.id, selectedDate);
  const isToday = selectedDateIso === format(new Date(), "yyyy-MM-dd");

  return (
    <DashboardClient workouts={workouts} selectedDateIso={selectedDateIso} isToday={isToday} />
  );
}
