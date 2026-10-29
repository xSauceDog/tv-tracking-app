import { fail } from '@sveltejs/kit';
import { profileSchema } from '#lib/schemas/auth.js';
import { fieldErrors, type FieldErrors } from '#lib/utils/forms.js';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		const form = Object.fromEntries(await request.formData());
		const values = {
			username: String(form.username ?? ''),
			display_name: String(form.display_name ?? ''),
			bio: String(form.bio ?? '')
		};

		const parsed = profileSchema.safeParse(form);
		if (!parsed.success) {
			return fail(400, { values, errors: fieldErrors(parsed.error), message: undefined });
		}

		const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user!.id);

		if (error) {
			if (error.code === '23505') {
				return fail(400, {
					values,
					errors: { username: ['That username is taken.'] } as FieldErrors,
					message: undefined
				});
			}
			return fail(500, {
				values,
				errors: {} as FieldErrors,
				message: 'Could not save your changes.'
			});
		}
		return { success: true };
	}
};
