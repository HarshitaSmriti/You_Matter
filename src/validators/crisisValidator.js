import { z } from "zod";

export const crisisSchema = z.object({
    message_that_triggered: z.string().min(1, "Message required"),
    alert_sent_to: z.string().email("Valid email required")
});