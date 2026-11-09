import { fail, redirect } from "@sveltejs/kit";
import { loginSchema } from "#lib/schemas/auth.js";
import { fieldErrors, type FieldErrors } from "#lib/utils/forms.js";
import { safeRedirectPath } from "#lib/utils/redirect.js";
import type { Actions } from "./$types";

export const actions: Actions = {
	// A single default action posts to the current URL, so ?next= survives.
	default: async ({ request, url, locals: { supabase } }) => {
		const form = Object.fromEntries(await request.formData());
		const email = String(form.email ?? "");

		const parsed = loginSchema.safeParse(form);
		if (!parsed.success) {
			return fail(400, { email, errors: fieldErrors(parsed.error) });
		}

		const { error } = await supabase.auth.signInWithPassword(parsed.data);
		if (error) {
			// Deliberately generic: don't reveal whether the email exists.
			return fail(400, { email, errors: {} as FieldErrors, message: "Invalid email or password." });
		}

		redirect(303, safeRedirectPath(url.searchParams.get("next")));
	}
};
