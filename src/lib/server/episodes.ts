import type { TablesInsert } from "#lib/database.types.js";
import { FINISHED_STATUSES, isFinished } from "#lib/utils/progress.js";
import { supabaseAdmin } from "./supabase-admin.js";
import { getSeasonEpisodes, getShowDetail } from "./tmdb.js";

const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

/** Finished shows sync once; shows still airing re-sync when the cache is over 12 hours old. */
export function needsSync(show: { status: string | null; episodes_synced_at: string | null }) {
	if (!show.episodes_synced_at) return true;
	if (isFinished(show.status)) return false;
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

/** Used right after a show is added to a list, so its badge and schedule work immediately. */
export async function ensureEpisodes(showId: string) {
	const { data: show, error } = await supabaseAdmin
		.from("shows")
		.select("id, tmdb_id, status, episodes_synced_at")
		.eq("id", showId)
		.single();
	if (error) throw error;
	if (needsSync(show)) await syncEpisodes(show);
}

/** Cron job: refresh shows that are on at least one list and whose cache is missing or stale. */
export async function syncStaleShows(limit = 10, budgetMs = 25_000) {
	const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
	const finished = FINISHED_STATUSES.join(",");

	const { data, error } = await supabaseAdmin
		.from("shows")
		.select("id, tmdb_id, list_items!inner(id)")
		.or(
			`episodes_synced_at.is.null,and(episodes_synced_at.lt.${cutoff},or(status.is.null,status.not.in.(${finished})))`
		)
		.order("episodes_synced_at", { ascending: true, nullsFirst: true })
		.limit(limit)
		.limit(1, { referencedTable: "list_items" });
	if (error) throw error;

	const deadline = Date.now() + budgetMs;
	let synced = 0;
	let failed = 0;
	for (const show of data) {
		if (Date.now() > deadline) break;
		try {
			await syncEpisodes(show);
			synced++;
		} catch (e) {
			failed++;
			console.error("cron episode sync failed", show.tmdb_id, e);
		}
	}
	return { synced, failed };
}
