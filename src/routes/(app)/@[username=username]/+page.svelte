<script lang="ts">
	import { resolve } from "$app/paths";
	import { CalendarDays, CircleCheck, Clock, Eye, Library, Settings } from "@lucide/svelte";
	import Avatar from "#lib/components/Avatar.svelte";
	import { formatMonthYear } from "#lib/utils/dates.js";
	import { formatNumber, watchTime } from "#lib/utils/stats.js";
	import { avatarUrl } from "#lib/utils/images.js";

	let { data } = $props();

	const name = $derived(data.member.display_name ?? data.member.username);
	const time = $derived(watchTime(data.stats.minutes_watched));
	const stats = $derived([
		{
			icon: Eye,
			label: "Episodes watched",
			value: formatNumber(data.stats.episodes_watched),
			hint: null
		},
		{ icon: Clock, label: "Hours watched", value: time.value, hint: time.hint },
		{
			icon: Library,
			label: "Shows tracked",
			value: formatNumber(data.stats.shows_tracked),
			hint: null
		},
		{
			icon: CircleCheck,
			label: "Shows completed",
			value: formatNumber(data.stats.shows_completed),
			hint: null
		}
	]);
</script>

<svelte:head><title>{name} (@{data.member.username}) · Rankr</title></svelte:head>

<div class="mx-auto max-w-2xl">
	<section
		class="card flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left"
	>
		<Avatar src={avatarUrl(data.member.avatar_path)} {name} class="size-24 text-4xl sm:size-28" />

		<div class="min-w-0 flex-1">
			<h1 class="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
			<p class="text-sm text-zinc-400">@{data.member.username}</p>
			{#if data.member.bio}
				<p class="mt-3 text-sm wrap-break-word whitespace-pre-line text-zinc-300">
					{data.member.bio}
				</p>
			{/if}
			<p
				class="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-500 sm:justify-start"
			>
				<CalendarDays class="size-3.5" /> Joined {formatMonthYear(data.member.created_at)}
			</p>
		</div>

		{#if data.isOwner}
			<a href={resolve("/(app)/settings")} class="btn btn-ghost h-9 shrink-0 px-3">
				<Settings class="size-4" /> Edit profile
			</a>
		{/if}
	</section>

	<section class="mt-6" aria-labelledby="stats-heading">
		<h2 id="stats-heading" class="sr-only">Stats</h2>
		<dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each stats as s (s.label)}
				<div class="card p-4">
					<dt class="flex items-center gap-2 text-xs font-medium text-zinc-400">
						<s.icon class="size-4 text-brand-400" />
						{s.label}
					</dt>
					<dd class="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{s.value}</dd>
					{#if s.hint}<dd class="mt-0.5 text-xs text-zinc-500">{s.hint}</dd>{/if}
				</div>
			{/each}
		</dl>

		{#if data.stats.episodes_watched === 0}
			<p class="mt-4 text-center text-sm text-zinc-500">
				{data.isOwner
					? "Mark episodes as watched and your stats will fill in here."
					: "No episodes watched yet."}
			</p>
		{/if}
	</section>
</div>
