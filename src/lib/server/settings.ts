import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "#lib/database.types.js";
import { previousEpisodesSchema, type PreviousEpisodes } from "#lib/schemas/settings.js";

/** RLS only exposes your own row. No row yet (or any error) falls back to the default. */
export async function getPreviousEpisodes(
	supabase: SupabaseClient<Database>
): Promise<PreviousEpisodes> {
	const { data } = await supabase.from("user_settings").select("previous_episodes").maybeSingle();
	const parsed = previousEpisodesSchema.safeParse(data?.previous_episodes);
	return parsed.success ? parsed.data : "ask";
}

export const savePreviousEpisodes = (supabase: SupabaseClient<Database>, value: PreviousEpisodes) =>
	supabase.from("user_settings").upsert({ previous_episodes: value }, { onConflict: "user_id" });
