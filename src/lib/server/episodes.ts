import type { TablesInsert } from "#lib/database.types.js";
import { supabaseAdmin } from "./supabase-admin.js";
import { getSeasonEpisodes, getShowDetail } from "./tmdb.js";

const STALE_AFTER_MS = 12 * 60 * 60 * 1000;
const FINISHED = new Set(["Ended", "Canceled"]);

/** Finished shows sync once; shows still airing re-sync when the cache is over 12 hours old. */
export function needsSync(show: { status: string | null; episodes_synced_at: string | null }) {
	if (!show.episodes_synced_at) return true;
	if (show.status && FINISHED.has(show.status)) return false;
	return Date.now() - Date.parse(show.episodes_synced_at) > STALE_AFTER_MS;
}

export async function syncEpisodes(show: { id: string; tmdb_id: number }) {
	const detail = await getShowDetail(show.tmdb_id);
	if (!detail) throw new Error(`TMDB has no show ${show.tmdb_id}`);

	// Season 0 is "Specials"; skipped for now.
	const seasons = detail.seasons.filter((s) => s.season_number > 0 && s.episode_count > 0);

	const rows: TablesInsert<"episodes">[] = [];
	for (let i = 0; i < seasons.length; i += 8) {
		const batch = await Promise.all(
			seasons.slice(i, i + 8).map((s) => getSeasonEpisodes(show.tmdb_id, s.season_number))
		);
		for (const season of batch) {
			for (const ep of season?.episodes ?? []) rows.push({ ...ep, show_id: show.id });
		}
	}

	for (let i = 0; i < rows.length; i += 500) {
		const { error } = await supabaseAdmin
			.from("episodes")
			.upsert(rows.slice(i, i + 500), { onConflict: "show_id,season_number,episode_number" });
		if (error) throw error;
	}

	const { error } = await supabaseAdmin
		.from("shows")
		.update({ status: detail.status, episodes_synced_at: new Date().toISOString() })
		.eq("id", show.id);
	if (error) throw error;
}
