import { z } from "zod";

export const showSearchSchema = z.object({ q: z.string().trim().min(2).max(100) });
export const addShowSchema = z.object({ tmdb_id: z.coerce.number().int().positive() });
