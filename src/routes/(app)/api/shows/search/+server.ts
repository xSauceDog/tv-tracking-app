import { error, json } from "@sveltejs/kit";
import { showSearchSchema } from "#lib/schemas/shows.js";
import { searchShows } from "#lib/server/tmdb.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, fetch }) => {
	const parsed = showSearchSchema.safeParse({ q: url.searchParams.get("q") });
	if (!parsed.success) return json({ results: [] });

	try {
		return json({ results: await searchShows(parsed.data.q, fetch) });
	} catch (e) {
		console.error("TMDB search failed", e);
		error(502, "Search is unavailable right now");
	}
};
