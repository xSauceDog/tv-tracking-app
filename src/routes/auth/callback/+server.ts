import { redirect } from '@sveltejs/kit';
import { safeRedirectPath } from '#lib/utils/redirect.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = safeRedirectPath(url.searchParams.get('next'));

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) redirect(303, next);
	}
	redirect(303, '/login?error=callback');
};
