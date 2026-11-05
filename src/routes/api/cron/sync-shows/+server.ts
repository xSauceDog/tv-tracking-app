import { error, json } from "@sveltejs/kit";
import { CRON_SECRET } from "$app/env/private";
import { syncStaleShows } from "#lib/server/episodes.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request }) => {
	if (!CRON_SECRET || request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
		error(401, "Unauthorized");
	}
	return json(await syncStaleShows());
};
