"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkoutAction } from "./actions";

interface EditWorkoutFormProps {
  workoutId: string;
  defaultName: string;
  defaultDate: string;
}

export default function EditWorkoutForm({
  workoutId,
  defaultName,
  defaultDate,
}: EditWorkoutFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const nameRaw = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;

    try {
      const result = await updateWorkoutAction(workoutId, {
        name: nameRaw || undefined,
        date,
      });

      if (result?.unauthorized) {
        router.push("/sign-in");
        return;
      }

      if (result?.notFound) {
        setError("Workout not found.");
        setPending(false);
        return;
      }

      if (result?.error) {
        const messages = [
          ...result.error.formErrors,
          ...Object.values(result.error.fieldErrors).flat(),
        ];
        setError(messages.length > 0 ? messages.join(". ") : "Invalid input.");
        setPending(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/dashboard?date=${date}`), 1500);
    } catch (err) {
      console.error("Unexpected error updating workout:", err);
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Workout name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Push Day, Morning Run"
          defaultValue={defaultName}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">Optional — leave blank for "Untitled Workout"</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={defaultDate}
          required
        />
      </div>

      {success && (
        <p className="text-sm text-green-600">Workout updated!</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || success}>
          {success ? "Redirecting..." : pending ? "Saving..." : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard?date=${defaultDate}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
