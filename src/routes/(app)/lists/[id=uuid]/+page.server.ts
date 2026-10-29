import { error, fail, redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { itemSchema, listSchema, removeItemSchema, reorderSchema } from "#lib/schemas/lists.js";
import { fieldErrors } from "#lib/utils/forms.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
	// One round trip: the list plus its items, already in rank order.
	// Scoped to the owner: this page is for editing; public viewing will be a separate route.
	const { data: list, error: dbError } = await supabase
		.from("lists")
		.select("id, name, is_public, items:list_items(id, title, position)")
		.eq("id", params.id)
		.eq("user_id", user!.id)
		.order("position", { referencedTable: "list_items" })
		.maybeSingle();

	if (dbError) error(500, "Could not load this list");
	if (!list) error(404, "List not found");
	return { list };
};

export const actions: Actions = {
	add: async ({ request, params, locals: { supabase } }) => {
		const form = Object.fromEntries(await request.formData());
		const addTitle = String(form.title ?? "");

		const parsed = itemSchema.safeParse(form);
		if (!parsed.success) {
			return fail(400, {
				addTitle,
				addError: fieldErrors(parsed.error).title?.[0] ?? "Invalid title"
			});
		}

		// RLS rejects this if the list isn't the caller's; position is set by trigger.
		const { error: dbError } = await supabase
			.from("list_items")
			.insert({ list_id: params.id, title: parsed.data.title });
		if (dbError) return fail(500, { addTitle, addError: "Could not add that show." });

		return { added: true };
	},

	remove: async ({ request, params, locals: { supabase } }) => {
		const parsed = removeItemSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { message: "Invalid item." });

		const { error: dbError } = await supabase
			.from("list_items")
			.delete()
			.eq("id", parsed.data.id)
			.eq("list_id", params.id);
		if (dbError) return fail(500, { message: "Could not remove that show." });

		return { removed: true };
	},

	reorder: async ({ request, params, locals: { supabase } }) => {
		const ids = (await request.formData()).getAll("id").map(String);
		const parsed = reorderSchema.safeParse(ids);
		if (!parsed.success) return fail(400, { message: "Invalid order." });

		const { error: dbError } = await supabase.rpc("reorder_list_items", {
			p_list_id: params.id,
			p_item_ids: parsed.data
		});
		if (dbError) {
			// 22023 = the submitted ids no longer match the list (e.g. edited in another tab).
			return fail(dbError.code === "22023" ? 409 : 500, {
				message: "Could not save the new order."
			});
		}
		return { reordered: true };
	},

	update: async ({ request, params, locals: { supabase } }) => {
		const parsed = listSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { settingsErrors: fieldErrors(parsed.error) });

		const { error: dbError } = await supabase.from("lists").update(parsed.data).eq("id", params.id);
		if (dbError) return fail(500, { settingsMessage: "Could not save your changes." });

		return { settingsSaved: true };
	},

	delete: async ({ params, locals: { supabase } }) => {
		const { error: dbError } = await supabase.from("lists").delete().eq("id", params.id);
		if (dbError) return fail(500, { message: "Could not delete the list." });

		redirect(303, resolve("/(app)/lists"));
	}
};
