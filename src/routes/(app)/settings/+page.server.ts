import { fail } from "@sveltejs/kit";
import { profileSchema } from "#lib/schemas/auth.js";
import { settingsSchema } from "#lib/schemas/settings.js";
import { getPreviousEpisodes, savePreviousEpisodes } from "#lib/server/settings.js";
import { fieldErrors, type FieldErrors } from "#lib/utils/forms.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { supabase } }) => ({
	previousEpisodes: await getPreviousEpisodes(supabase)
});

export const actions: Actions = {
	profile: async ({ request, locals: { supabase, user } }) => {
		const form = Object.fromEntries(await request.formData());
		const values = {
			username: String(form.username ?? ""),
			display_name: String(form.display_name ?? ""),
			bio: String(form.bio ?? "")
		};

		const parsed = profileSchema.safeParse(form);
		if (!parsed.success) {
			return fail(400, { values, errors: fieldErrors(parsed.error), message: undefined });
		}

		const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user!.id);

		if (error) {
			if (error.code === "23505") {
				return fail(400, {
					values,
					errors: { username: ["That username is taken."] } as FieldErrors,
					message: undefined
				});
			}
			return fail(500, {
				values,
				errors: {} as FieldErrors,
				message: "Could not save your changes."
			});
		}
		return { success: true };
	},

	preferences: async ({ request, locals: { supabase } }) => {
		const parsed = settingsSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { prefsMessage: "Pick one of the options." });

		const { error } = await savePreviousEpisodes(supabase, parsed.data.previous_episodes);
		if (error) return fail(500, { prefsMessage: "Could not save your preference." });

		return { prefsSaved: true };
	}
};
