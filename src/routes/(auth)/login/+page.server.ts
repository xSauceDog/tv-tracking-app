import { fail, redirect } from '@sveltejs/kit';
import { loginSchema, oauthProviderSchema } from '#lib/schemas/auth.js';
import { fieldErrors, type FieldErrors } from '#lib/utils/forms.js';
import { safeRedirectPath } from '#lib/utils/redirect.js';
import type { Actions } from './$types';

export const actions: Actions = {
	login: async ({ request, url, locals: { supabase } }) => {
		const form = Object.fromEntries(await request.formData());
		const email = String(form.email ?? '');

		const parsed = loginSchema.safeParse(form);
		if (!parsed.success) {
			return fail(400, { email, errors: fieldErrors(parsed.error) });
		}

		const { error } = await supabase.auth.signInWithPassword(parsed.data);
		if (error) {
			// Deliberately generic: don't reveal whether the email exists.
			return fail(400, { email, errors: {} as FieldErrors, message: 'Invalid email or password.' });
		}

		redirect(303, safeRedirectPath(url.searchParams.get('next')));
	},

	oauth: async ({ request, url, locals: { supabase } }) => {
		const form = await request.formData();
		const provider = oauthProviderSchema.safeParse(form.get('provider'));
		if (!provider.success) {
			return fail(400, { email: '', errors: {} as FieldErrors, message: 'Unsupported provider.' });
		}

		const next = safeRedirectPath(String(form.get('next') ?? ''));
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: provider.data,
			options: { redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}` }
		});

		if (error || !data.url) {
			return fail(500, {
				email: '',
				errors: {} as FieldErrors,
				message: 'Could not start sign-in.'
			});
		}
		redirect(303, data.url);
	}
};
