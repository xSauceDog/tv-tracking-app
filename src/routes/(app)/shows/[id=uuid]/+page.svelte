<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import { Check, ChevronLeft } from "@lucide/svelte";
	import Poster from "#lib/components/Poster.svelte";
	import { toast } from "#lib/toast.svelte.js";
	import { formatAirDate } from "#lib/utils/dates.js";
	import ProgressBadge from "#lib/components/ProgressBadge.svelte";

	let { data, form } = $props();

	type Episode = (typeof data.episodes)[number];

	// Optimistic overrides keyed by episode id; cleared once the server has answered.
	let overrides = $state<Record<string, boolean>>({});
	const isWatched = (ep: { id: string; watched: boolean }) => overrides[ep.id] ?? ep.watched;

	const base = $derived(resolve("/(app)/shows/[id=uuid]", { id: data.show.id }));
	const year = $derived(data.show.first_air_date?.slice(0, 4));

	const totals = $derived(
		data.seasons.reduce((t, s) => ({ aired: t.aired + s.aired, watched: t.watched + s.watched }), {
			aired: 0,
			watched: 0
		})
	);
	const percent = $derived(totals.aired ? Math.round((totals.watched / totals.aired) * 100) : 0);

	const airedInSeason = $derived(data.episodes.filter((e) => e.aired).length);
	const watchedInSeason = $derived(data.episodes.filter(isWatched).length);
	const seasonDone = $derived(airedInSeason > 0 && watchedInSeason >= airedInSeason);

	// ---- "mark earlier episodes too?" ----
	let dialogEl = $state<HTMLDialogElement>();
	let promptForm = $state<HTMLFormElement>();
	let previousPrompt = $state.raw<{ episode: Episode; count: number } | null>(null);

	// Aired-but-unwatched episodes in earlier seasons (server data)...
	const earlierSeasons = $derived(
		data.seasons
			.filter((s) => s.season_number < (data.selected ?? 0))
			.reduce((n, s) => n + Math.max(0, s.aired - s.watched), 0)
	);
	// ...plus those earlier in the season on screen.
	const earlierInSeason = (ep: Episode) =>
		data.episodes.filter((e) => e.episode_number < ep.episode_number && e.aired && !isWatched(e));
	const unwatchedBefore = (ep: Episode) => earlierSeasons + earlierInSeason(ep).length;

	/** Optimistically tick the episode (and earlier ones on screen); returns ids to clear afterwards. */
	function markOptimistically(ep: Episode, includePrevious: boolean) {
		const ids = [ep.id, ...(includePrevious ? earlierInSeason(ep).map((e) => e.id) : [])];
		for (const id of ids) overrides[id] = true;
		return ids;
	}
</script>

<svelte:head><title>{data.show.name} · Rankr</title></svelte:head>

<div class="mx-auto max-w-2xl">
	<a
		href={resolve("/(app)/lists")}
		class="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-100"
	>
		<ChevronLeft class="size-4" /> Lists
	</a>

	<div class="mt-4 flex gap-4">
		<Poster
			path={data.show.poster_path}
			class="w-24 shrink-0 sm:w-32"
			sizes="(min-width: 640px) 128px, 96px"
		/>
		<div class="min-w-0">
			<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{data.show.name}</h1>
			<p class="mt-1 text-sm text-zinc-400">
				{[year, data.show.status].filter(Boolean).join(" · ")}
			</p>
			<ProgressBadge
				class="mt-2"
				aired={totals.aired}
				watched={totals.watched}
				status={data.show.status}
			/>
			{#if data.show.overview}
				<p class="mt-3 line-clamp-4 text-sm text-zinc-300">{data.show.overview}</p>
			{/if}
		</div>
	</div>

	{#if form?.message}
		<p class="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300" role="alert">
			{form.message}
		</p>
	{/if}

	{#if data.seasons.length === 0}
		<div class="card mt-8 text-center text-sm text-zinc-400">
			{data.syncFailed
				? "Couldn't load episodes right now. Try again in a bit."
				: "No episodes are available for this show yet."}
		</div>
	{:else}
		<div class="mt-6">
			<div class="flex justify-between text-xs text-zinc-400">
				<span>{totals.watched} of {totals.aired} aired episodes watched</span>
				<span>{percent}%</span>
			</div>
			<div
				class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"
				role="progressbar"
				aria-label="Overall progress"
				aria-valuenow={percent}
				aria-valuemin="0"
				aria-valuemax="100"
			>
				<div
					class="h-full rounded-full bg-brand-500 transition-[width]"
					style:width="{percent}%"
				></div>
			</div>
		</div>

		<nav aria-label="Seasons" class="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
			{#each data.seasons as s (s.season_number)}
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href={`${base}?season=${s.season_number}`}
					data-sveltekit-noscroll
					aria-current={s.season_number === data.selected ? "page" : undefined}
					class="shrink-0 rounded-full px-3.5 py-1.5 text-sm text-zinc-400 ring-1 ring-white/10 transition hover:text-zinc-100 aria-[current=page]:bg-brand-500/20 aria-[current=page]:text-brand-300 aria-[current=page]:ring-brand-400/50"
				>
					S{s.season_number}
					{#if s.aired > 0 && s.watched >= s.aired}
						<Check class="ml-0.5 inline size-3.5" aria-label="Completed" />
					{/if}
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/each}
		</nav>

		<div class="mt-6 flex items-center justify-between gap-3">
			<h2 class="text-lg font-semibold">Season {data.selected}</h2>
			<form
				method="POST"
				action="?/season"
				use:enhance={() =>
					async ({ update }) =>
						update({ reset: false })}
			>
				<input type="hidden" name="season" value={data.selected} />
				<input type="hidden" name="watched" value={String(!seasonDone)} />
				<button class="btn btn-ghost h-9 px-3" disabled={airedInSeason === 0}>
					{seasonDone
						? "Unmark season"
						: data.selected > 1
							? `Mark seasons 1–${data.selected} watched`
							: "Mark season watched"}
				</button>
			</form>
		</div>

		<ul class="mt-3 space-y-2">
			{#each data.episodes as ep (ep.id)}
				{@const watched = isWatched(ep)}
				<li class="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/80 p-3">
					<form
						method="POST"
						action="?/toggle"
						use:enhance={({ formData, cancel }) => {
							const marking = formData.get("watched") === "true";

							// Unmarking never prompts.
							if (!marking) {
								overrides[ep.id] = false;
								return async ({ update }) => {
									await update({ reset: false });
									delete overrides[ep.id];
								};
							}

							const count = unwatchedBefore(ep);
							if (count > 0 && data.previousEpisodes === "ask") {
								cancel();
								previousPrompt = { episode: ep, count };
								promptForm?.reset();
								dialogEl?.showModal();
								dialogEl?.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
								return;
							}

							const include = count > 0 && data.previousEpisodes === "all";
							if (include) formData.set("include_previous", "true");
							const ids = markOptimistically(ep, include);
							return async ({ update }) => {
								await update({ reset: false });
								for (const id of ids) delete overrides[id];
							};
						}}
					>
						<input type="hidden" name="episode_id" value={ep.id} />
						<input type="hidden" name="watched" value={String(!watched)} />
						<button
							disabled={!ep.aired}
							aria-pressed={watched}
							aria-label="Watched: episode {ep.episode_number}, {ep.name}"
							class={[
								"grid size-10 shrink-0 place-items-center rounded-full ring-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 active:scale-90 disabled:pointer-events-none disabled:opacity-30",
								watched
									? "bg-brand-500 text-white ring-brand-400"
									: "text-zinc-500 ring-white/15 hover:text-zinc-200"
							]}
						>
							<Check class="size-5" />
						</button>
					</form>

					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">
							<span class="text-zinc-500 tabular-nums">E{ep.episode_number}</span>
							{ep.name}
						</p>
						<p class="text-xs text-zinc-500">
							{#if !ep.air_date}
								TBA
							{:else if ep.aired}
								{formatAirDate(ep.air_date)}
							{:else}
								Airs {formatAirDate(ep.air_date)}
							{/if}
							{#if ep.runtime}· {ep.runtime}m{/if}
						</p>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<dialog
	bind:this={dialogEl}
	onclose={() => (previousPrompt = null)}
	aria-labelledby="previous-title"
	class="mt-auto mb-0 w-full max-w-none rounded-t-2xl border border-white/10 bg-zinc-900 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-zinc-100 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-md sm:rounded-2xl sm:pb-6"
>
	<form
		bind:this={promptForm}
		method="POST"
		action="?/toggle"
		use:enhance={({ formData, cancel }) => {
			const target = previousPrompt?.episode;
			if (!target) return cancel();

			const include = formData.get("include_previous") === "true";
			const remember = formData.has("remember");
			const ids = markOptimistically(target, include);
			dialogEl?.close();

			return async ({ result, update }) => {
				await update({ reset: false });
				for (const id of ids) delete overrides[id];
				if (result.type === "success" && remember) {
					toast.show("Preference saved. You can change it in Settings.");
				}
			};
		}}
	>
		<input type="hidden" name="episode_id" value={previousPrompt?.episode.id ?? ""} />
		<input type="hidden" name="watched" value="true" />

		<h2 id="previous-title" class="text-lg font-semibold">Mark earlier episodes too?</h2>
		<p class="mt-2 text-sm text-zinc-400">
			You're marking
			<strong class="text-zinc-200">
				E{previousPrompt?.episode.episode_number}
				{previousPrompt?.episode.name}
			</strong>
			as watched. {previousPrompt?.count}
			earlier {previousPrompt?.count === 1 ? "episode isn't" : "episodes aren't"} marked yet.
		</p>

		<label class="mt-4 flex items-start gap-2 text-sm text-zinc-300">
			<input
				type="checkbox"
				name="remember"
				class="mt-0.5 rounded border-white/20 bg-zinc-900 text-brand-500 focus:ring-brand-400/40"
			/>
			<span>
				Don't ask again
				<span class="block text-xs text-zinc-500">
					Uses whichever option you pick below. Change it anytime in Settings.
				</span>
			</span>
		</label>

		<div class="mt-5 flex flex-col gap-2">
			<button name="include_previous" value="true" class="btn btn-primary">
				Mark {previousPrompt?.count} earlier {previousPrompt?.count === 1 ? "episode" : "episodes"} too
			</button>
			<button name="include_previous" value="false" class="btn btn-ghost" data-initial-focus>
				Just this episode
			</button>
			<button type="button" class="btn h-9 text-zinc-400" onclick={() => dialogEl?.close()}>
				Cancel
			</button>
		</div>
	</form>
</dialog>
