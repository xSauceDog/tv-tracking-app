import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "#lib/database.types.js";
import type { WatchOptions, WhereToWatch } from "#lib/utils/providers.js";
import { supabaseAdmin } from "./supabase-admin.js";
import { getWatchProviders } from "./tmdb.js";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/** null = no such show. Throws only if TMDB is down and nothing is cached. */
export async function getWhereToWatch(
	supabase: SupabaseClient<Database>,
	showId: string,
	region: string
): Promise<WhereToWatch | null> {
	// One round trip: the show plus its cached providers for this country.
	const { data: show, error } = await supabase
		.from("shows")
		.select("id, tmdb_id, cached:show_providers(link, options, synced_at)")
		.eq("id", showId)
		.eq("cached.region", region)
		.maybeSingle();
	if (error) throw error;
	if (!show) return null;

	const cached = show.cached[0];
	const fromCache = (): WhereToWatch | null =>
		cached ? { region, link: cached.link, options: cached.options as WatchOptions } : null;

	if (cached && Date.now() - Date.parse(cached.synced_at) < STALE_AFTER_MS) return fromCache();

	try {
		const fresh = await getWatchProviders(show.tmdb_id, region);
		const { error: upsertError } = await supabaseAdmin.from("show_providers").upsert(
			{
				show_id: show.id,
				region,
				link: fresh.link,
				options: fresh.options,
				synced_at: new Date().toISOString()
			},
			{ onConflict: "show_id,region" }
		);
		if (upsertError) console.error("caching providers failed", upsertError); // best-effort
		return { region, ...fresh };
	} catch (e) {
		const stale = fromCache();
		if (stale) return stale; // serve the old copy rather than fail
		throw e;
	}
}
