import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { session, user }, cookies, depends }) => {
	depends("supabase:auth");
	// Forward only what the client needs. Serialising the whole session reads the
	// unverified `session.user`, which is what triggers Supabase's warning.
	return { user, expiresAt: session?.expires_at ?? null, cookies: cookies.getAll() };
};
