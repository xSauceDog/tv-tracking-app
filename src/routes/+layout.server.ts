import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { session, user }, cookies, depends }) => {
	depends("supabase:auth");
	return { session, user, cookies: cookies.getAll() };
};
