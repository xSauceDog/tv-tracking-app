import { error, json } from "@sveltejs/kit";
import { getWhereToWatch } from "#lib/server/providers.js";
import { getRegion } from "#lib/server/settings.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals: { supabase } }) => {
	const region = await getRegion(supabase);

	let result;
	try {
		result = await getWhereToWatch(supabase, params.id, region);
	} catch (e) {
		console.error("watch providers failed", e);
		error(502, "Streaming info is unavailable right now");
	}
	if (!result) error(404, "Show not found");
	return json(result);
};
