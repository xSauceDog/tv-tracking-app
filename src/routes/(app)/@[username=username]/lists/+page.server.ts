import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
	redirect(
		307,
		resolve("/(app)/@[username=username]", { username: params.username.toLowerCase() })
	);
};
