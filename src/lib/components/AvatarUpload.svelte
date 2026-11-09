<script lang="ts">
	import { deserialize } from "$app/forms";
	import { refreshAll } from "$app/navigation";
	import type { SupabaseClient } from "@supabase/supabase-js";
	import { Camera } from "@lucide/svelte";
	import Avatar from "#lib/components/Avatar.svelte";
	import { prepareAvatar } from "#lib/utils/avatar-image.js";
	import { avatarUrl } from "#lib/utils/images.js";
	import { toast } from "#lib/toast.svelte.js";
	import type { Database } from "#lib/database.types.js";

	let {
		supabase,
		userId,
		path,
		name
	}: {
		supabase: SupabaseClient<Database>;
		userId: string;
		path: string | null;
		name: string;
	} = $props();

	const MAX_INPUT_BYTES = 15 * 1024 * 1024;

	let fileEl = $state<HTMLInputElement>();
	let busy = $state(false);
	let error = $state("");

	async function callAction(action: "avatar" | "removeAvatar", body = new FormData()) {
		const res = await fetch(`?/${action}`, {
			method: "POST",
			body,
			headers: { "x-sveltekit-action": "true" }
		});
		if (deserialize(await res.text()).type !== "success") throw new Error("Request failed");
		await refreshAll();
	}

	async function onpick(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		e.currentTarget.value = ""; // allow re-picking the same file
		if (!file) return;

		error = "";
		busy = true;
		let uploaded: string | null = null;
		try {
			if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
			if (file.size > MAX_INPUT_BYTES) throw new Error("That image is too large (15 MB max).");

			const { blob, ext } = await prepareAvatar(file).catch(() => {
				throw new Error("Couldn't read that image. Try a JPG, PNG or WebP.");
			});

			const objectPath = `${userId}/${crypto.randomUUID()}.${ext}`;
			const { error: uploadError } = await supabase.storage
				.from("avatars")
				.upload(objectPath, blob, { contentType: blob.type, cacheControl: "31536000" });
			if (uploadError) throw new Error("Upload failed. Try again.");
			uploaded = objectPath;

			const body = new FormData();
			body.set("path", objectPath);
			await callAction("avatar", body).catch(() => {
				throw new Error("Could not save your picture. Try again.");
			});
			toast.show("Profile picture updated");
		} catch (e) {
			error = e instanceof Error ? e.message : "Something went wrong.";
			if (uploaded) await supabase.storage.from("avatars").remove([uploaded]); // don't orphan it
		} finally {
			busy = false;
		}
	}

	async function remove() {
		error = "";
		busy = true;
		try {
			await callAction("removeAvatar");
			toast.show("Profile picture removed");
		} catch {
			error = "Could not remove your picture. Try again.";
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex items-center gap-4">
	<Avatar src={avatarUrl(path)} {name} class="size-20 text-3xl" />

	<div class="min-w-0">
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class="btn btn-ghost h-9 px-3"
				disabled={busy}
				onclick={() => fileEl?.click()}
			>
				<Camera class="size-4" />
				{busy ? "Working…" : path ? "Change photo" : "Upload photo"}
			</button>
			{#if path}
				<button
					type="button"
					class="btn btn-ghost h-9 px-3 text-red-300"
					disabled={busy}
					onclick={remove}
				>
					Remove
				</button>
			{/if}
		</div>
		<p class="mt-2 text-xs text-zinc-500">JPG, PNG, WebP or GIF. Cropped to a circle.</p>
		{#if error}<p class="mt-1 text-sm text-red-400" role="alert">{error}</p>{/if}
	</div>

	<input
		bind:this={fileEl}
		type="file"
		accept="image/jpeg,image/png,image/webp,image/gif"
		class="sr-only"
		tabindex="-1"
		onchange={onpick}
	/>
</div>
