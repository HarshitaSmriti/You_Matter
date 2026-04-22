import { z } from "zod";

export const diarySchema = z.object({
    content: z.string().min(1, "Diary content required")
});