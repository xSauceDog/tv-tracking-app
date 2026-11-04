import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "#lib/database.types.js";
import { supabaseAdmin } from "./supabase-admin.js";
import { getShow } from "./tmdb.js";

/** Returns our show id for a TMDB id, caching it from TMDB on first use. null = TMDB has no such show. */
export async function ensureShow(
	supabase: SupabaseClient<Database>,
	tmdbId: number
): Promise<string | null> {
	const { data: existing } = await supabase
		.from("shows")
		.select("id")
		.eq("tmdb_id", tmdbId)
		.maybeSingle();
	if (existing) return existing.id;

	const show = await getShow(tmdbId);
	if (!show) return null;

	// Upsert so two people adding a brand-new show at once don't collide.
	const { data, error } = await supabaseAdmin
		.from("shows")
		.upsert(show, { onConflict: "tmdb_id" })
		.select("id")
		.single();
	if (error) throw error;
	return data.id;
}
