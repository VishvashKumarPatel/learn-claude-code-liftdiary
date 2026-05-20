"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronRight, Clock, Dumbbell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkoutSummary } from "@/data/workouts";

interface DashboardClientProps {
  workouts: WorkoutSummary[];
  selectedDateIso: string;
}

export default function DashboardClient({
  workouts,
  selectedDateIso,
}: DashboardClientProps) {
  const router = useRouter();
  const date = new Date(`${selectedDateIso}T00:00:00`);

  const formattedDate = format(date, "do MMM yyyy");
  const isToday =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  function handleDateSelect(selected: Date | undefined) {
    if (!selected) return;
    router.replace(`/dashboard?date=${format(selected, "yyyy-MM-dd")}`);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5" suppressHydrationWarning>
          {isToday ? "Today" : formattedDate}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[auto_1fr] gap-8 items-start">

        {/* Left: Calendar */}
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
        />

        {/* Right: Workouts */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Workouts logged
          </h2>

          {workouts.length === 0 ? (
            <Card className="min-h-52">
              <CardContent className="h-full flex flex-col items-center justify-center gap-2 text-center">
                <Dumbbell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No workouts logged for {formattedDate}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="min-h-52 space-y-3">
            {workouts.map((workout) => (
              <Card
                key={workout.id}
                className="cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {workout.name ?? "Untitled Workout"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 text-xs">
                        {workout.durationMinutes !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {workout.durationMinutes} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3 w-3" />
                          {workout.exerciseCount}{" "}
                          {workout.exerciseCount === 1 ? "exercise" : "exercises"}
                        </span>
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {workout.exerciseNames.map((name) => (
                      <Badge key={name} variant="secondary" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
