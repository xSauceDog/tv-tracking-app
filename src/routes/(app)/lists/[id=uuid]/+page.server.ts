import { error, fail, redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { fieldErrors } from "#lib/utils/forms.js";
import type { Actions, PageServerLoad } from "./$types";
import { addShowSchema } from "#lib/schemas/shows.js";
import { ensureShow } from "#lib/server/shows.js";
import { listSchema, removeItemSchema, reorderSchema } from "#lib/schemas/lists.js";
import { ensureEpisodes } from "#lib/server/episodes.js";

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
	const { data: list, error: dbError } = await supabase
		.from("lists")
		.select(
			"id, name, is_public, items:list_items(id, position, show:shows(id, tmdb_id, name, poster_path, first_air_date, status))"
		)
		.eq("id", params.id)
		.eq("user_id", user!.id)
		.order("position", { referencedTable: "list_items" })
		.maybeSingle();

	if (dbError) error(500, "Could not load this list");
	if (!list) error(404, "List not found");

	// Badges are decorative, so a failure here shouldn't block editing the list.
	const showIds = list.items.map((i) => i.show.id);
	const { data: rows, error: statusError } = showIds.length
		? await supabase.rpc("show_status", { p_show_ids: showIds })
		: { data: [], error: null };
	if (statusError) console.error("show_status failed", statusError);

	const progress = new Map(
		(rows ?? []).map((r) => [r.show_id, { aired: r.aired, watched: r.watched }] as const)
	);

	return {
		list: {
			...list,
			items: list.items.map((item) => ({ ...item, progress: progress.get(item.show.id) ?? null }))
		}
	};
};

export const actions: Actions = {
	add: async ({ request, params, locals: { supabase } }) => {
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

		// RLS rejects this if the list isn't the caller's; position is set by trigger.
		const { error: dbError } = await supabase
			.from("list_items")
			.insert({ list_id: params.id, show_id: showId });
		if (dbError?.code === "23505")
			return fail(409, { addError: "That show is already in this list." });
		if (dbError) return fail(500, { addError: "Could not add that show." });

		// Best-effort: cache episodes now so the new show gets a badge and a schedule entry
		// immediately. If TMDB hiccups, the cron job and the show page retry later.
		await ensureEpisodes(showId).catch((e) => console.error("episode sync failed", e));

		return { added: true };
	},

	remove: async ({ request, params, locals: { supabase } }) => {
		const parsed = removeItemSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { message: "Invalid item." });

		const { error: dbError } = await supabase
			.from("list_items")
			.delete()
			.eq("id", parsed.data.id)
			.eq("list_id", params.id);
		if (dbError) return fail(500, { message: "Could not remove that show." });

		return { removed: true };
	},

	reorder: async ({ request, params, locals: { supabase } }) => {
		const ids = (await request.formData()).getAll("id").map(String);
		const parsed = reorderSchema.safeParse(ids);
		if (!parsed.success) return fail(400, { message: "Invalid order." });

		const { error: dbError } = await supabase.rpc("reorder_list_items", {
			p_list_id: params.id,
			p_item_ids: parsed.data
		});
		if (dbError) {
			// 22023 = the submitted ids no longer match the list (e.g. edited in another tab).
			return fail(dbError.code === "22023" ? 409 : 500, {
				message: "Could not save the new order."
			});
		}
		return { reordered: true };
	},

	update: async ({ request, params, locals: { supabase } }) => {
		const parsed = listSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { settingsErrors: fieldErrors(parsed.error) });

		const { error: dbError } = await supabase.from("lists").update(parsed.data).eq("id", params.id);
		if (dbError) return fail(500, { settingsMessage: "Could not save your changes." });

		return { settingsSaved: true };
	},

	delete: async ({ params, locals: { supabase } }) => {
		const { error: dbError } = await supabase.from("lists").delete().eq("id", params.id);
		if (dbError) return fail(500, { message: "Could not delete the list." });

		redirect(303, resolve("/(app)/lists"));
	}
};
