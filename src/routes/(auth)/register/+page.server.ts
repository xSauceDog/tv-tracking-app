import { fail, redirect } from '@sveltejs/kit';
import { registerSchema } from '$lib/schemas/auth';
import { fieldErrors, type FieldErrors } from '$lib/utils/forms';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const form = Object.fromEntries(await request.formData());
		const values = { email: String(form.email ?? ''), username: String(form.username ?? '') };

		const parsed = registerSchema.safeParse(form);
		if (!parsed.success) {
			return fail(400, { ...values, errors: fieldErrors(parsed.error) });
		}
		const { email, username, password } = parsed.data;

		// Friendly pre-check; the trigger + unique constraint remain the source of truth.
		const { data: taken } = await supabase
			.from('profiles')
			.select('id')
			.eq('username', username)
			.maybeSingle();
		if (taken) {
			return fail(400, {
				...values,
				errors: { username: ['That username is taken.'] } as FieldErrors
			});
		}

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { username }, emailRedirectTo: `${url.origin}/auth/callback` }
		});
		if (error) {
			return fail(400, { ...values, errors: {} as FieldErrors, message: error.message });
		}

		if (data.session) redirect(303, '/dashboard'); // email confirmation disabled
		return { ...values, checkEmail: true };
	}
};
