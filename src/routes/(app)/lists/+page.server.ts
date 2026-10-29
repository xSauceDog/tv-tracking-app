import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	const { lists } = await parent();
	if (lists.length) redirect(303, resolve("/(app)/lists/[id=uuid]", { id: lists[0].id }));
};
