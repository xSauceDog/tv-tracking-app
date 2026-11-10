<script lang="ts">
	import { enhance } from "$app/forms";
	import Field from "#lib/components/Field.svelte";
	import RankedList from "#lib/components/RankedList.svelte";
	import ShowSearch from "#lib/components/ShowSearch.svelte";
	import ShareListButton from "#lib/components/ShareListButton.svelte";

	let { data, form } = $props();
	const count = $derived(data.list.items.length);
</script>

<svelte:head><title>{data.list.name} · Rankr</title></svelte:head>

<div class="flex items-start justify-between gap-3">
	<div class="min-w-0">
		<h1 class="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{data.list.name}</h1>
		<p class="mt-1 text-sm text-zinc-400">
			{count}
			{count === 1 ? "show" : "shows"} · {data.list.is_public ? "Public" : "Private"}
		</p>
	</div>
	{#if data.profile}
		<ShareListButton
			username={data.profile.username}
			listId={data.list.id}
			isPublic={data.list.is_public}
		/>
	{/if}
</div>

{#if form?.message}
	<p class="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300" role="alert">{form.message}</p>
{/if}

{#key data.list.id}
	<div class="mt-6">
		<ShowSearch
			existing={data.list.items.map((i) => i.show.tmdb_id)}
			error={form?.addError}
			listName={data.list.name}
		/>
	</div>

	<div class="mt-6">
		<RankedList items={data.list.items} />
	</div>
{/key}

<details class="card mt-10">
	<summary class="cursor-pointer text-sm font-medium text-zinc-300">List settings</summary>

	<form method="POST" action="?/update" class="mt-4 space-y-4" use:enhance>
		<Field
			label="List name"
			name="name"
			required
			maxlength={60}
			value={data.list.name}
			error={form?.settingsErrors?.name?.[0]}
		/>
		<label class="flex items-center gap-2 text-sm text-zinc-300">
			<input
				type="checkbox"
				name="is_public"
				checked={data.list.is_public}
				class="rounded border-white/20 bg-zinc-900 text-brand-500 focus:ring-brand-400/40"
			/>
			Make this list public
		</label>
		{#if form?.settingsMessage}
			<p class="text-sm text-red-400" role="alert">{form.settingsMessage}</p>
		{/if}
		{#if form?.settingsSaved}<p class="text-sm text-emerald-400" role="status">Saved.</p>{/if}
		<button class="btn btn-primary">Save changes</button>
	</form>

	<form
		method="POST"
		action="?/delete"
		class="mt-6 border-t border-white/10 pt-6"
		use:enhance={({ cancel }) => {
			if (!confirm("Delete this list and its ranking? This can't be undone.")) cancel();
		}}
	>
		<button class="btn btn-ghost text-red-300">Delete list</button>
	</form>
</details>
