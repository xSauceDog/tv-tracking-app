import { fail, redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { listSchema } from "#lib/schemas/lists.js";
import { fieldErrors } from "#lib/utils/forms.js";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const form = Object.fromEntries(await request.formData());
		const name = String(form.name ?? "");

		const parsed = listSchema.safeParse(form);
		if (!parsed.success) return fail(400, { name, errors: fieldErrors(parsed.error) });

		// user_id is filled in by the column default (auth.uid()), never by the client.
		const { data, error } = await supabase.from("lists").insert(parsed.data).select("id").single();
		if (error) return fail(500, { name, message: "Could not create the list." });

		redirect(303, resolve("/(app)/lists/[id=uuid]", { id: data.id }));
	}
};
