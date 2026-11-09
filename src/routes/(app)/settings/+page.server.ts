import { fail } from "@sveltejs/kit";
import { profileSchema } from "#lib/schemas/auth.js";
import { settingsSchema } from "#lib/schemas/settings.js";
import { getPreviousEpisodes, savePreviousEpisodes } from "#lib/server/settings.js";
import { fieldErrors, type FieldErrors } from "#lib/utils/forms.js";
import type { Actions, PageServerLoad } from "./$types";
import { avatarSchema } from "#lib/schemas/avatar.js";

export const load: PageServerLoad = async ({ locals: { supabase } }) => ({
	previousEpisodes: await getPreviousEpisodes(supabase)
});

export const actions: Actions = {
	profile: async ({ request, locals: { supabase, user } }) => {
		const form = Object.fromEntries(await request.formData());
		const values = {
			display_name: String(form.display_name ?? ""),
			bio: String(form.bio ?? "")
		};

		const parsed = profileSchema.safeParse(form);
		if (!parsed.success) {
			return fail(400, { values, errors: fieldErrors(parsed.error), message: undefined });
		}

		const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user!.id);
		if (error) {
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
	},

	avatar: async ({ request, locals: { supabase, user } }) => {
		const parsed = avatarSchema.safeParse(Object.fromEntries(await request.formData()));
		// The DB constraint enforces this too; checking here gives a clean 400.
		if (!parsed.success || !parsed.data.path.startsWith(`${user!.id}/`)) {
			return fail(400, { avatarMessage: "Invalid image." });
		}

		const { data: before } = await supabase
			.from("profiles")
			.select("avatar_path")
			.eq("id", user!.id)
			.single();

		const { error } = await supabase
			.from("profiles")
			.update({ avatar_path: parsed.data.path })
			.eq("id", user!.id);
		if (error) return fail(500, { avatarMessage: "Could not save your picture." });

		// Best-effort cleanup of the previous file.
		if (before?.avatar_path && before.avatar_path !== parsed.data.path) {
			const { error: rmError } = await supabase.storage
				.from("avatars")
				.remove([before.avatar_path]);
			if (rmError) console.error("old avatar cleanup failed", rmError);
		}
		return { avatarSaved: true };
	},

	removeAvatar: async ({ locals: { supabase, user } }) => {
		const { data: before } = await supabase
			.from("profiles")
			.select("avatar_path")
			.eq("id", user!.id)
			.single();

		const { error } = await supabase
			.from("profiles")
			.update({ avatar_path: null })
			.eq("id", user!.id);
		if (error) return fail(500, { avatarMessage: "Could not remove your picture." });

		if (before?.avatar_path) {
			const { error: rmError } = await supabase.storage
				.from("avatars")
				.remove([before.avatar_path]);
			if (rmError) console.error("avatar cleanup failed", rmError);
		}
		return { avatarRemoved: true };
	}
};
