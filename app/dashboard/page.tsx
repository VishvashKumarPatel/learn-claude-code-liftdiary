"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Dumbbell, Clock, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Placeholder workout data — will be replaced with real data fetching later
const MOCK_WORKOUTS = [
  {
    id: "1",
    name: "Upper Body Push",
    duration: 52,
    exerciseCount: 5,
    tags: ["Chest", "Shoulders", "Triceps"],
  },
  {
    id: "2",
    name: "Morning Cardio",
    duration: 30,
    exerciseCount: 1,
    tags: ["Cardio"],
  },
];

export default function DashboardPage() {
  const [date, setDate] = useState<Date>(new Date());

  const formattedDate = format(date, "do MMM yyyy");
  const isToday =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isToday ? "Today" : formattedDate}
          </p>
        </div>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Workout List */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Workouts logged
        </h2>

        {MOCK_WORKOUTS.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-2">
              <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No workouts logged for {formattedDate}
              </p>
            </CardContent>
          </Card>
        ) : (
          MOCK_WORKOUTS.map((workout) => (
            <Card
              key={workout.id}
              className="cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{workout.name}</CardTitle>
                    <CardDescription className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {workout.duration} min
                      </span>
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
                  {workout.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </main>
  );
}
