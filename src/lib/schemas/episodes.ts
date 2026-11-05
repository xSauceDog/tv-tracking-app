import { z } from "zod";

const flag = z.enum(["true", "false"]).transform((v) => v === "true");

export const toggleEpisodeSchema = z.object({ episode_id: z.uuid(), watched: flag });
export const toggleSeasonSchema = z.object({
	season: z.coerce.number().int().min(1).max(500),
	watched: flag
});
