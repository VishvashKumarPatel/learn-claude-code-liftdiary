import { z } from "zod";

export const updateWorkoutSchema = z.object({
  name: z.string().max(100).optional(),
  date: z.string().date(),
});

export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
