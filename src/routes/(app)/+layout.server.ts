import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { supabase, user } }) => {
	// The auth guard in hooks.server.ts guarantees `user` here.
	const { data: profile } = await supabase
		.from("profiles")
		.select("username, display_name, avatar_url, bio")
		.eq("id", user!.id)
		.single();

	return { profile };
};
