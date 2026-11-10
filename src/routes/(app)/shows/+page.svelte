<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import { slide } from "svelte/transition";
	import { MediaQuery, SvelteSet } from "svelte/reactivity";
	import { ChevronDown, X } from "@lucide/svelte";
	import Poster from "#lib/components/Poster.svelte";
	import ShowSearch from "#lib/components/ShowSearch.svelte";
	import { confirmDialog } from "#lib/confirm.svelte.js";

	let { data, form } = $props();

	const sections = $derived([
		{
			key: "watching",
			title: "Watching",
			items: data.watching,
			empty: "Nothing in progress yet."
		},
		{
			key: "not-started",
			title: "Haven't started",
			items: data.notStarted,
			empty: "Your watch list is empty."
		},
		{
			key: "completed",
			title: "Completed",
			items: data.completed,
			empty: "No finished shows yet."
		}
	]);

	// Keys of the sections the user has collapsed. Everything starts expanded.
	const collapsed = new SvelteSet<string>();

	function toggle(key: string) {
		if (collapsed.has(key)) collapsed.delete(key);
		else collapsed.add(key);
	}

	const reducedMotion = new MediaQuery("(prefers-reduced-motion: reduce)");
	const duration = $derived(reducedMotion.current ? 0 : 200);
</script>

<svelte:head><title>Shows · Rankr</title></svelte:head>

{#snippet row(s: (typeof data.watching)[number])}
	<li class="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/80 p-3">
		<Poster path={s.poster_path} class="w-11 shrink-0" sizes="44px" />
		<div class="min-w-0 flex-1">
			<a
				href={resolve("/(app)/shows/[id=uuid]", { id: s.id })}
				class="line-clamp-2 text-sm leading-snug font-medium hover:text-brand-300"
			>
				{s.name}
			</a>
			{#if s.aired > 0}
				<p class="mt-0.5 text-xs text-zinc-500 tabular-nums">{s.watched} / {s.aired} watched</p>
				<div class="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
					<div
						class="h-full rounded-full bg-brand-500"
						style:width="{Math.round((s.watched / s.aired) * 100)}%"
					></div>
				</div>
			{/if}
		</div>
		<form
			method="POST"
			action="?/remove"
			use:enhance={async ({ cancel }) => {
				const ok = await confirmDialog.ask({
					title: `Remove “${s.name}”?`,
					message: "It will also be removed from every list you've added it to.",
					confirmLabel: "Remove"
				});
				if (!ok) {
					cancel();
					return;
				}
				return async ({ update }) => update({ reset: false });
			}}
		>
			<input type="hidden" name="show_id" value={s.id} />
			<button class="icon-btn hover:text-red-300" aria-label="Remove {s.name} from your shows">
				<X class="size-4" />
			</button>
		</form>
	</li>
{/snippet}

<div class="mx-auto max-w-2xl">
	<h1 class="text-3xl font-semibold tracking-tight">Shows</h1>

	<div class="mt-6">
		<ShowSearch existing={data.tmdbIds} error={form?.addError} />
	</div>

	{#if form?.message}
		<p class="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300" role="alert">
			{form.message}
		</p>
	{/if}

	{#each sections as section (section.key)}
		{@const open = !collapsed.has(section.key)}
		{@const panelId = `shows-${section.key}`}
		<section class="mt-8">
			<h2 class="text-lg font-semibold">
				<button
					type="button"
					aria-expanded={open}
					aria-controls={panelId}
					onclick={() => toggle(section.key)}
					class="-mx-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
				>
					<ChevronDown
						class={["size-5 shrink-0 text-zinc-500 transition-transform", !open && "-rotate-90"]}
					/>
					{section.title}
					<span class="text-sm font-normal text-zinc-500 tabular-nums">
						{section.items.length}
					</span>
				</button>
			</h2>

			<div id={panelId}>
				{#if open}
					<div transition:slide={{ duration }} class="pt-3">
						{#if section.items.length}
							<ul class="space-y-2">
								{#each section.items as s (s.id)}
									{@render row(s)}
								{/each}
							</ul>
						{:else}
							<p
								class="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500"
							>
								{section.empty}
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</section>
	{/each}
</div>
