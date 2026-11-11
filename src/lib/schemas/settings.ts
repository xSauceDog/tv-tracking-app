import { z } from "zod";
import { REGIONS } from "#lib/utils/regions.js";

export const regionSchema = z.enum(REGIONS);
export const regionFormSchema = z.object({ region: regionSchema });

export const previousEpisodesSchema = z.enum(["ask", "all", "single"]);
export type PreviousEpisodes = z.infer<typeof previousEpisodesSchema>;

export const settingsSchema = z.object({ previous_episodes: previousEpisodesSchema });
