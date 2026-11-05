<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import { Check, Plus, Search } from "@lucide/svelte";
	import Poster from "#lib/components/Poster.svelte";
	import type { ShowSearchResult } from "#lib/types.js";
	import { toast } from "#lib/toast.svelte.js";

	let {
		existing = [],
		error,
		listName
	}: { existing?: number[]; error?: string; listName?: string } = $props();

	let inputEl = $state<HTMLInputElement>();

	let query = $state("");
	let results = $state<ShowSearchResult[]>([]);
	let status = $state<"idle" | "loading" | "error">("idle");
	let pendingId = $state<number | null>(null);

	const inList = $derived(new Set(existing));
	const searched = $derived(query.trim().length >= 2);

	// Debounced search; stale requests are aborted.
	$effect(() => {
		const q = query.trim();
		if (q.length < 2) {
			results = [];
			status = "idle";
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			status = "loading";
			try {
				const res = await fetch(
					`${resolve("/(app)/api/shows/search")}?q=${encodeURIComponent(q)}`,
					{
						signal: controller.signal
					}
				);
				if (!res.ok) throw new Error(String(res.status));
				results = (await res.json()).results;
				status = "idle";
			} catch {
				if (!controller.signal.aborted) status = "error";
			}
		}, 250);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});
</script>

<div class="field">
	<div class="relative">
		<Search
			class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500"
		/>
		<input
			bind:this={inputEl}
			type="search"
			bind:value={query}
			aria-label="Search for a show or anime"
			placeholder="Search for a show or anime…"
			autocomplete="off"
			maxlength="100"
			class="pl-10"
			onkeydown={(e) => e.key === "Escape" && (query = "")}
		/>
	</div>
</div>

{#if error}<p class="field-error" role="alert">{error}</p>{/if}

<p class="sr-only" role="status" aria-live="polite">
	{#if status === "loading"}Searching…{:else if searched && status === "idle"}{results.length} results{/if}
</p>

{#if searched}
	{#if status === "error"}
		<p class="mt-3 text-sm text-red-300" role="alert">Search is unavailable right now.</p>
	{:else if results.length}
		<ul
			class="mt-3 max-h-96 divide-y divide-white/5 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/80"
		>
			{#each results as r (r.tmdb_id)}
				<li class="flex items-center gap-3 p-2.5">
					<Poster path={r.poster_path} class="w-10 shrink-0" sizes="40px" />
					<div class="min-w-0 flex-1">
						<p class="line-clamp-2 text-sm leading-snug font-medium">{r.name}</p>
						{#if r.first_air_date}
							<p class="text-xs text-zinc-500">{r.first_air_date.slice(0, 4)}</p>
						{/if}
					</div>

					{#if inList.has(r.tmdb_id)}
						<span class="flex shrink-0 items-center gap-1 text-xs text-emerald-400">
							<Check class="size-4" /> In list
						</span>
					{:else}
						<form
							method="POST"
							action="?/add"
							use:enhance={() => {
								const { name } = r;
								pendingId = r.tmdb_id;
								return async ({ result, update }) => {
									await update({ reset: false });
									pendingId = null;
									if (result.type === "success") {
										toast.show(listName ? `Added “${name}” to ${listName}` : `Added “${name}”`);
										query = "";
										inputEl?.focus();
									}
								};
							}}
						>
							<input type="hidden" name="tmdb_id" value={r.tmdb_id} />
							<button class="btn btn-ghost h-9 px-3" disabled={pendingId === r.tmdb_id}>
								<Plus class="size-4" /> Add
							</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{:else if status === "idle"}
		<p class="mt-3 text-sm text-zinc-500">No matches for “{query.trim()}”.</p>
	{/if}
{/if}
