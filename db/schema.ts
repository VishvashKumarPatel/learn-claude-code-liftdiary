import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const setTypeEnum = pgEnum('set_type', [
  'normal',
  'warmup',
  'drop_set',
  'failure',
]);

// ── Tables ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    isCustom: boolean('is_custom').notNull().default(false),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('exercises_name_idx').on(table.name),
    index('exercises_created_by_user_idx').on(table.createdByUserId),
  ]
);

export const workouts = pgTable(
  'workouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name'),
    date: timestamp('date', { withTimezone: true }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('workouts_user_id_idx').on(table.userId),
    index('workouts_user_id_date_idx').on(table.userId, table.date),
  ]
);

export const workoutExercises = pgTable(
  'workout_exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workoutId: uuid('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    orderIndex: integer('order_index').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('workout_exercises_workout_id_idx').on(table.workoutId),
    index('workout_exercises_exercise_id_idx').on(table.exerciseId),
    uniqueIndex('workout_exercises_workout_order_uidx').on(table.workoutId, table.orderIndex),
  ]
);

export const sets = pgTable(
  'sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workoutExerciseId: uuid('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    type: setTypeEnum('type').notNull().default('normal'),
    weightKg: real('weight_kg'),
    durationSeconds: integer('duration_seconds'),
    distanceMeters: real('distance_meters'),
    isCompleted: boolean('is_completed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('sets_workout_exercise_id_idx').on(table.workoutExerciseId),
    uniqueIndex('sets_workout_exercise_set_number_uidx').on(
      table.workoutExerciseId,
      table.setNumber
    ),
  ]
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
  createdExercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [exercises.createdByUserId],
    references: [users.id],
  }),
  workoutExercises: many(workoutExercises),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

// ── TypeScript Types ──────────────────────────────────────────────────────────

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Exercise = InferSelectModel<typeof exercises>;
export type NewExercise = InferInsertModel<typeof exercises>;

export type Workout = InferSelectModel<typeof workouts>;
export type NewWorkout = InferInsertModel<typeof workouts>;

export type WorkoutExercise = InferSelectModel<typeof workoutExercises>;
export type NewWorkoutExercise = InferInsertModel<typeof workoutExercises>;

export type WorkoutSet = InferSelectModel<typeof sets>;
export type NewWorkoutSet = InferInsertModel<typeof sets>;

export type SetType = (typeof setTypeEnum.enumValues)[number];
