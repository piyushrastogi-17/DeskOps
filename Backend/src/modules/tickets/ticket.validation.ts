
import { z } from "zod";
import { TicketPriority } from "@prisma/client";

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must contain at least 3 characters.")
    .max(150, "Title cannot exceed 150 characters."),

  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(5000, "Description cannot exceed 5000 characters."),

  priority: z.nativeEnum(TicketPriority).optional(),
}).strict();

export type CreateTicketInput = z.infer<
  typeof createTicketSchema
>;
