import { z } from "zod";

export const listSchema = z.object({
	name: z.string().trim().min(1, "Give your list a name").max(60, "At most 60 characters"),
	// Checkboxes post "on" when checked and nothing when unchecked.
	is_public: z
		.string()
		.optional()
		.transform((v) => v === "on")
});

export const removeItemSchema = z.object({ id: z.uuid() });

export const reorderSchema = z.array(z.uuid()).min(1).max(1000);
