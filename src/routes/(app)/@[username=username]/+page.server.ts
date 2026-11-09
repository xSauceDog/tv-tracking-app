import { error, redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
	const username = params.username.toLowerCase();
	if (username !== params.username) {
		redirect(308, resolve("/(app)/@[username=username]", { username }));
	}

	// Profiles are publicly readable via RLS.
	const { data: member, error: profileError } = await supabase
		.from("profiles")
		.select("id, username, display_name, avatar_path, bio, created_at")
		.eq("username", username)
		.maybeSingle();
	if (profileError) error(500, "Could not load this profile");
	if (!member) error(404, "Nobody goes by that username");

	// RLS returns public lists for everyone, plus private ones when you're the owner.
	const [{ data: stats, error: statsError }, { data: rawLists, error: listsError }] =
		await Promise.all([
			supabase.rpc("profile_stats", { p_user_id: member.id }).single(),
			supabase
				.from("lists")
				.select("id, name, is_public, items:list_items(count)")
				.eq("user_id", member.id)
				.order("created_at")
		]);
	if (statsError) error(500, "Could not load this profile's stats");
	if (listsError) error(500, "Could not load this profile's lists");

	const lists = rawLists.map(({ items, ...list }) => ({ ...list, count: items[0]?.count ?? 0 }));

	return { member, stats, lists, isOwner: member.id === user!.id };
};
