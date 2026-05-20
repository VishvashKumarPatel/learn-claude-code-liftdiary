import { z } from "zod";

export const createWorkoutSchema = z.object({
  name: z.string().max(100).optional(),
  date: z.string().date(),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
