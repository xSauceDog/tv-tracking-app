import { z } from "zod";

export const previousEpisodesSchema = z.enum(["ask", "all", "single"]);
export type PreviousEpisodes = z.infer<typeof previousEpisodesSchema>;

export const settingsSchema = z.object({ previous_episodes: previousEpisodesSchema });
