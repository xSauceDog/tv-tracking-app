<script lang="ts">
	import { resolve } from "$app/paths";
	import Avatar from "#lib/components/Avatar.svelte";
	import { formatMonthYear } from "#lib/utils/dates.js";
	import { formatNumber, watchTime } from "#lib/utils/stats.js";
	import { avatarUrl } from "#lib/utils/images.js";
	import {
		CalendarDays,
		ChevronRight,
		CircleCheck,
		Clock,
		Eye,
		Library,
		ListOrdered,
		Lock,
		Plus,
		Settings
	} from "@lucide/svelte";

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
	<section class="mt-8" aria-labelledby="lists-heading">
		<div class="flex items-center justify-between gap-3">
			<h2 id="lists-heading" class="flex items-baseline gap-2 text-lg font-semibold">
				Lists
				<span class="text-sm font-normal text-zinc-500 tabular-nums">{data.lists.length}</span>
			</h2>
			{#if data.isOwner}
				<a href={resolve("/(app)/lists/new")} class="btn btn-ghost h-9 px-3">
					<Plus class="size-4" /> New list
				</a>
			{/if}
		</div>

		{#if data.lists.length}
			<ul class="mt-3 space-y-2">
				{#each data.lists as list (list.id)}
					<li>
						<a
							href={resolve("/(app)/@[username=username]/lists/[id=uuid]", {
								username: data.member.username,
								id: list.id
							})}
							class="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/80 p-3 transition hover:border-white/25"
						>
							<span
								class="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-300"
							>
								<ListOrdered class="size-5" />
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{list.name}</p>
								<p class="text-xs text-zinc-500">
									{list.count}
									{list.count === 1 ? "show" : "shows"}
								</p>
							</div>
							{#if !list.is_public}
								<span
									class="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400 ring-1 ring-white/10 ring-inset"
								>
									<Lock class="size-3" /> Private
								</span>
							{/if}
							<ChevronRight class="size-4 shrink-0 text-zinc-600" />
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p
				class="mt-3 rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500"
			>
				{data.isOwner ? "You haven't created any lists yet." : "No public lists yet."}
			</p>
		{/if}
	</section>
</div>
