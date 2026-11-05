import { error, fail } from "@sveltejs/kit";
import { toggleEpisodeSchema, toggleSeasonSchema } from "#lib/schemas/episodes.js";
import { needsSync, syncEpisodes } from "#lib/server/episodes.js";
import type { Actions, PageServerLoad } from "./$types";
import { getPreviousEpisodes, savePreviousEpisodes } from "#lib/server/settings.js";

export const load: PageServerLoad = async ({ params, url, locals: { supabase } }) => {
	const { data: show, error: showError } = await supabase
		.from("shows")
		.select("id, tmdb_id, name, overview, poster_path, first_air_date, status, episodes_synced_at")
		.eq("id", params.id)
		.maybeSingle();
	if (showError) error(500, "Could not load this show");
	if (!show) error(404, "Show not found");

	// Episodes are cached lazily. If TMDB is down we fall back to whatever we already have.
	let syncFailed = false;
	if (needsSync(show)) {
		try {
			await syncEpisodes(show);
		} catch (e) {
			console.error("episode sync failed", e);
			syncFailed = true;
		}
	}

	const [{ data: seasons, error: progressError }, previousEpisodes] = await Promise.all([
		supabase.rpc("season_progress", { p_show_id: show.id }),
		getPreviousEpisodes(supabase)
	]);
	if (progressError) error(500, "Could not load your progress");

	// ?season=N, else the first season you haven't finished, else the first season.
	const requested = Number(url.searchParams.get("season"));
	const selected =
		seasons.find((s) => s.season_number === requested)?.season_number ??
		seasons.find((s) => s.watched < s.aired)?.season_number ??
		seasons[0]?.season_number ??
		null;

	const today = new Date().toISOString().slice(0, 10);
	let episodes: {
		id: string;
		episode_number: number;
		name: string;
		air_date: string | null;
		runtime: number | null;
		watched: boolean;
		aired: boolean;
	}[] = [];

	if (selected !== null) {
		// RLS only lets you see your own watched rows, so the embed is "did *I* watch it".
		const { data, error: episodesError } = await supabase
			.from("episodes")
			.select("id, episode_number, name, air_date, runtime, watched:watched_episodes(episode_id)")
			.eq("show_id", show.id)
			.eq("season_number", selected)
			.order("episode_number");
		if (episodesError) error(500, "Could not load episodes");

		episodes = data.map(({ watched, ...ep }) => ({
			...ep,
			watched: watched.length > 0,
			aired: ep.air_date !== null && ep.air_date <= today
		}));
	}

	return { show, seasons, selected, episodes, syncFailed, previousEpisodes };
};

export const actions: Actions = {
	toggle: async ({ request, locals: { supabase } }) => {
		const parsed = toggleEpisodeSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { message: "Invalid episode." });
		const { episode_id, watched, include_previous, remember } = parsed.data;

		// user_id comes from the column default (auth.uid()), never from the client.
		const { error: dbError } = watched
			? await supabase.rpc("mark_episode_watched", {
					p_episode_id: episode_id,
					p_include_previous: include_previous
				})
			: await supabase.from("watched_episodes").delete().eq("episode_id", episode_id);
		if (dbError) return fail(500, { message: "Could not update that episode." });

		// "Don't ask again": remember whichever button they picked. Best-effort.
		if (watched && remember) {
			const { error: prefError } = await savePreviousEpisodes(
				supabase,
				include_previous ? "all" : "single"
			);
			if (prefError) console.error("saving preference failed", prefError);
		}

		return { toggled: true };
	},

	season: async ({ request, params, locals: { supabase } }) => {
		const parsed = toggleSeasonSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { message: "Invalid season." });

		const { error: dbError } = await supabase.rpc("set_season_watched", {
			p_show_id: params.id,
			p_season: parsed.data.season,
			p_watched: parsed.data.watched
		});
		if (dbError) return fail(500, { message: "Could not update that season." });

		return { seasonToggled: true };
	}
};
