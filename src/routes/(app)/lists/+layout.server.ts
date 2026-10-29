import { error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { supabase, user } }) => {
	// Public lists of other users are readable too, so filter to the owner explicitly.
	const { data: lists, error: dbError } = await supabase
		.from("lists")
		.select("id, name")
		.eq("user_id", user!.id)
		.order("created_at");

	if (dbError) error(500, "Could not load your lists");
	return { lists };
};
