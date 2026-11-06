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
		.select("id, username, display_name, avatar_url, bio, created_at")
		.eq("username", username)
		.maybeSingle();
	if (profileError) error(500, "Could not load this profile");
	if (!member) error(404, "Nobody goes by that username");

	const { data: stats, error: statsError } = await supabase
		.rpc("profile_stats", { p_user_id: member.id })
		.single();
	if (statsError) error(500, "Could not load this profile's stats");

	return { member, stats, isOwner: member.id === user!.id };
};
