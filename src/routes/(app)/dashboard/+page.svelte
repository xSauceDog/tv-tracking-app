<script lang="ts">
	import { resolve } from "$app/paths";
	import { CalendarClock } from "@lucide/svelte";
	import Poster from "#lib/components/Poster.svelte";
	import { airingLabel } from "#lib/utils/progress.js";

	let { data } = $props();
	const name = $derived(data.profile?.display_name ?? data.profile?.username ?? "there");
</script>

<svelte:head><title>Dashboard · Rankr</title></svelte:head>

<h1 class="text-3xl font-semibold tracking-tight">Hey, {name} 👋</h1>
<p class="mt-1 text-zinc-400">@{data.profile?.username}</p>

<section class="mt-8 max-w-2xl" aria-labelledby="airing-heading">
	<h2 id="airing-heading" class="flex items-center gap-2 text-lg font-semibold">
		<CalendarClock class="size-5 text-brand-400" /> Airing soon
	</h2>

	{#if data.airing.length}
		<ul class="mt-3 space-y-2">
			{#each data.airing as item (item.show.id)}
				<li>
					<a
						href={resolve("/(app)/shows/[id=uuid]", { id: item.show.id })}
						class="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/80 p-3 transition hover:border-white/25"
					>
						<Poster path={item.show.poster_path} class="w-10 shrink-0" sizes="40px" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{item.show.name}</p>
							<p class="truncate text-xs text-zinc-500">
								{#if item.episode}
									S{item.episode.season} E{item.episode.number}{item.episode.name
										? ` · ${item.episode.name}`
										: ""}
								{:else}
									Next episode date not announced
								{/if}
							</p>
						</div>
						<span
							class={[
								"shrink-0 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ring-1 ring-inset",
								item.daysUntil === null
									? "bg-white/5 text-zinc-400 ring-white/10"
									: item.daysUntil <= 1
										? "bg-brand-500/20 text-brand-300 ring-brand-400/40"
										: "bg-white/5 text-zinc-200 ring-white/10"
							]}
						>
							{airingLabel(item.daysUntil)}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="card mt-3 text-center text-sm text-zinc-400">
			Nothing on the schedule yet. Add shows to a list and upcoming episodes will show up here.
		</div>
	{/if}
</section>

<div class="card mt-8 text-center">
	<p class="text-zinc-300">Ready to rank?</p>
	<a href={resolve("/(app)/lists")} class="btn btn-primary mt-4">Go to my lists</a>
</div>
