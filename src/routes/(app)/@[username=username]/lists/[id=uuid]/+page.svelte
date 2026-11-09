<script lang="ts">
	import { resolve } from "$app/paths";
	import { ChevronLeft } from "@lucide/svelte";
	import Avatar from "#lib/components/Avatar.svelte";
	import Poster from "#lib/components/Poster.svelte";
	import { avatarUrl } from "#lib/utils/images.js";

	let { data } = $props();

	const owner = $derived(data.list.owner);
	const ownerName = $derived(owner.display_name ?? owner.username);
	const count = $derived(data.list.items.length);

	const podium = [
		"bg-amber-400/20 text-amber-300",
		"bg-zinc-300/15 text-zinc-200",
		"bg-orange-500/20 text-orange-300"
	];
</script>

<svelte:head><title>{data.list.name} by @{owner.username} · Rankr</title></svelte:head>

<div class="mx-auto max-w-2xl">
	<a
		href={resolve("/(app)/@[username=username]", { username: owner.username })}
		class="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-100"
	>
		<ChevronLeft class="size-4" /> @{owner.username}
	</a>

	<h1 class="mt-4 text-2xl font-semibold tracking-tight wrap-break-word sm:text-3xl">
		{data.list.name}
	</h1>
	<div class="mt-2 flex items-center gap-2 text-sm text-zinc-400">
		<Avatar src={avatarUrl(owner.avatar_path)} name={ownerName} class="size-6 text-xs" />
		<span class="truncate">{ownerName}</span>
		<span aria-hidden="true">·</span>
		<span class="shrink-0">{count} {count === 1 ? "show" : "shows"}</span>
	</div>

	{#if count === 0}
		<p
			class="mt-8 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500"
		>
			Nothing ranked yet.
		</p>
	{:else}
		<ol aria-label="Ranked shows" class="mt-6 space-y-2">
			{#each data.list.items as item, i (item.id)}
				<li
					class="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/80 p-2 sm:p-3"
				>
					<span
						class={[
							"grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
							podium[i] ?? "bg-white/5 text-zinc-400"
						]}
					>
						{i + 1}
					</span>
					<Poster
						path={item.show.poster_path}
						class="w-9 shrink-0 sm:w-11"
						sizes="(min-width: 640px) 44px, 36px"
					/>
					<div class="min-w-0 flex-1">
						<a
							href={resolve("/(app)/shows/[id=uuid]", { id: item.show.id })}
							class="line-clamp-2 text-sm leading-snug font-medium wrap-break-word hover:text-brand-300 sm:text-base"
						>
							{item.show.name}
						</a>
						{#if item.show.first_air_date}
							<p class="text-xs text-zinc-500">{item.show.first_air_date.slice(0, 4)}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</div>
