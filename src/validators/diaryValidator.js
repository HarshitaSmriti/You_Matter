import { z } from "zod";

export const diarySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title too long"),

  content: z
    .string()
    .min(1, "Diary content required"),

  mood: z
    .enum(["happy", "sad", "angry", "anxious", "neutral"])
    .optional(), // optional because backend has default
});