import { error, fail } from "@sveltejs/kit";
import { addShowSchema, removeShowSchema } from "#lib/schemas/shows.js";
import { ensureShow } from "#lib/server/shows.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// RLS already limits this to the signed-in user's rows.
	const { data: rows, error: dbError } = await supabase
		.from("user_shows")
		.select("show:shows(id, tmdb_id, name, poster_path)")
		.order("added_at", { ascending: false });
	if (dbError) error(500, "Could not load your shows");

	const ids = rows.map((r) => r.show.id);
	const { data: status, error: statusError } = ids.length
		? await supabase.rpc("show_status", { p_show_ids: ids })
		: { data: [], error: null };
	if (statusError) error(500, "Could not load your progress");

	const progress = new Map((status ?? []).map((r) => [r.show_id, r] as const));

	const groups = { watching: [], notStarted: [], completed: [] } as Record<
		"watching" | "notStarted" | "completed",
		((typeof rows)[number]["show"] & { aired: number; watched: number })[]
	>;

	for (const { show } of rows) {
		const { aired = 0, watched = 0 } = progress.get(show.id) ?? {};
		const entry = { ...show, aired, watched };
		if (watched === 0) groups.notStarted.push(entry);
		else if (watched >= aired) groups.completed.push(entry);
		else groups.watching.push(entry);
	}

	return { ...groups, tmdbIds: rows.map((r) => r.show.tmdb_id) };
};

export const actions: Actions = {
	add: async ({ request, locals: { supabase } }) => {
		const parsed = addShowSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { addError: "Pick a show from the results." });

		let showId: string | null;
		try {
			showId = await ensureShow(supabase, parsed.data.tmdb_id);
		} catch (e) {
			console.error("ensureShow failed", e);
			return fail(502, { addError: "Couldn't reach the show database. Try again." });
		}
		if (!showId) return fail(404, { addError: "That show doesn't exist anymore." });

		const { error: dbError } = await supabase.from("user_shows").insert({ show_id: showId });
		if (dbError?.code === "23505")
			return fail(409, { addError: "That show is already in your library." });
		if (dbError) return fail(500, { addError: "Could not add that show." });

		return { added: true };
	},

	remove: async ({ request, locals: { supabase } }) => {
		const parsed = removeShowSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { message: "Invalid show." });

		const { error: dbError } = await supabase.rpc("remove_show_from_library", {
			p_show_id: parsed.data.show_id
		});
		if (dbError) return fail(500, { message: "Could not remove that show." });

		return { removed: true };
	}
};
