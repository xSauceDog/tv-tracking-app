import { z } from "zod";

// <user_id>/<uuid>.<ext>. The action also checks the folder matches the caller.
export const avatarSchema = z.object({
	path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/)
});
