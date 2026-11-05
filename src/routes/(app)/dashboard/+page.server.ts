import { error } from "@sveltejs/kit";
import { buildAiringSoon } from "#lib/utils/progress.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	// Public lists of other users are readable too, so scope to the owner explicitly.
	const { data: items, error: itemsError } = await supabase
		.from("list_items")
		.select("show:shows(id, name, poster_path, status), lists!inner(user_id)")
		.eq("lists.user_id", user!.id);
	if (itemsError) error(500, "Could not load your shows");

	// A show can be on several lists; de-duplicate.
	const shows = new Map(items.map(({ show }) => [show.id, show] as const));
	if (shows.size === 0) return { airing: [] };

	const { data: rows, error: statusError } = await supabase.rpc("show_status", {
		p_show_ids: [...shows.keys()]
	});
	if (statusError) error(500, "Could not load the schedule");

	return { airing: buildAiringSoon(shows, rows) };
};
