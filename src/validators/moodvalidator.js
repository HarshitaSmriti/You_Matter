// moodValidator.js
import { z } from "zod";

export const moodSchema = z.object({
    mood_score: z.number(),
    mood_label: z.string().min(1),
    note: z.string().optional()
});