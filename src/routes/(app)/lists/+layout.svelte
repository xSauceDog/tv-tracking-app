<script lang="ts">
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { Plus } from "@lucide/svelte";

	let { data, children } = $props();
	const currentId = $derived(page.params.id ?? "");
</script>

<div class="mx-auto max-w-2xl">
	<div class="mb-6 flex items-center gap-2">
		{#if data.lists.length}
			<label class="sr-only" for="list-switcher">Choose a list</label>
			<select
				id="list-switcher"
				class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 text-base font-medium text-zinc-100 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 focus:outline-none"
				value={currentId}
				onchange={(e) => goto(resolve("/(app)/lists/[id=uuid]", { id: e.currentTarget.value }))}
			>
				{#if !currentId}<option value="" disabled>Select a list…</option>{/if}
				{#each data.lists as list (list.id)}
					<option value={list.id}>{list.name}</option>
				{/each}
			</select>
		{/if}
		<a href={resolve("/(app)/lists/new")} class="btn btn-ghost shrink-0 px-3 sm:px-4">
			<Plus class="size-4" />
			<span class="max-sm:sr-only">New list</span>
		</a>
	</div>

	{@render children()}
</div>
