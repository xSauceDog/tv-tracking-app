import { error, redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const username = params.username.toLowerCase();
	if (username !== params.username) {
		redirect(
			308,
			resolve("/(app)/@[username=username]/lists/[id=uuid]", { username, id: params.id })
		);
	}

	const { data: list, error: dbError } = await supabase
		.from("lists")
		.select(
			"id, name, owner:profiles!inner(username, display_name, avatar_path), items:list_items(id, position, show:shows(id, name, poster_path, first_air_date))"
		)
		.eq("id", params.id)
		.eq("owner.username", username)
		.order("position", { referencedTable: "list_items" })
		.maybeSingle();

	if (dbError) error(500, "Could not load this list");
	if (!list) error(404, "List not found");
	return { list };
};
