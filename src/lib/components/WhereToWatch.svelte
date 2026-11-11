<script lang="ts">
	import { resolve } from "$app/paths";
	import { slide } from "svelte/transition";
	import { MediaQuery } from "svelte/reactivity";
	import { ChevronDown, ExternalLink, Tv } from "@lucide/svelte";
	import { providerLogoSrcset, providerLogoUrl } from "#lib/utils/images.js";
	import {
		hasAnyOptions,
		WATCH_KINDS,
		WATCH_LABELS,
		type WhereToWatch
	} from "#lib/utils/providers.js";
	import { regionName } from "#lib/utils/regions.js";

	let { showId, class: className = "" }: { showId: string; class?: string } = $props();

	const panelId = $props.id();
	const reducedMotion = new MediaQuery("(prefers-reduced-motion: reduce)");
	const duration = $derived(reducedMotion.current ? 0 : 200);

	let open = $state(false);
	let status = $state<"idle" | "loading" | "ready" | "error">("idle");
	let result = $state.raw<WhereToWatch | null>(null);

	async function load() {
		status = "loading";
		try {
			const res = await fetch(resolve("/(app)/api/shows/[id=uuid]/providers", { id: showId }));
			if (!res.ok) throw new Error(String(res.status));
			result = await res.json();
			status = "ready";
		} catch {
			status = "error";
		}
	}

	// Fetched on first open only; reopening reuses the result.
	function toggle() {
		open = !open;
		if (open && (status === "idle" || status === "error")) load();
	}
</script>

<div class={["card p-0", className]}>
	<button
		type="button"
		aria-expanded={open}
		aria-controls={panelId}
		onclick={toggle}
		class="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
	>
		<Tv class="size-5 shrink-0 text-brand-400" />
		<span class="flex-1 font-medium">Where to watch?</span>
		<ChevronDown
			class={["size-5 shrink-0 text-zinc-500 transition-transform", open && "rotate-180"]}
		/>
	</button>

	<div id={panelId}>
		{#if open}
			<div transition:slide={{ duration }} class="border-t border-white/10 px-4 py-4">
				{#if status === "loading"}
					<p class="animate-pulse text-sm text-zinc-400" role="status">
						Looking up where to watch…
					</p>
				{:else if status === "error"}
					<p class="text-sm text-red-300" role="alert">Couldn't load streaming info.</p>
					<button type="button" class="btn btn-ghost mt-3 h-9 px-3" onclick={load}>
						Try again
					</button>
				{:else if status === "ready" && result}
					{#if hasAnyOptions(result.options)}
						<div class="space-y-5">
							{#each WATCH_KINDS as kind (kind)}
								{@const providers = result.options[kind]}
								{#if providers.length}
									<section>
										<h3 class="text-xs font-medium tracking-wide text-zinc-500 uppercase">
											{WATCH_LABELS[kind]}
										</h3>
										<ul class="mt-2 flex flex-wrap gap-2">
											{#each providers as p (p.id)}
												<li
													class="flex items-center gap-2.5 rounded-xl border border-white/10 bg-zinc-900/80 py-1.5 pr-3 pl-1.5"
												>
													{#if p.logo_path}
														<img
															src={providerLogoUrl(p.logo_path)}
															srcset={providerLogoSrcset(p.logo_path)}
															alt=""
															width="36"
															height="36"
															loading="lazy"
															decoding="async"
															class="size-9 shrink-0 rounded-lg bg-zinc-800"
														/>
													{:else}
														<span
															class="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-800 text-zinc-600"
															aria-hidden="true"
														>
															<Tv class="size-4" />
														</span>
													{/if}
													<div class="min-w-0">
														<p class="text-sm leading-tight font-medium">{p.name}</p>
														{#if p.addon_via}
															<span
																class="mt-1 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/30 ring-inset"
															>
																Add-on via {p.addon_via}
															</span>
														{/if}
													</div>
												</li>
											{/each}
										</ul>
									</section>
								{/if}
							{/each}
						</div>
					{:else}
						<p class="text-sm text-zinc-400">
							Not available to stream in {regionName(result.region)} right now.
						</p>
					{/if}

					<p class="mt-5 text-xs text-zinc-500">
						Showing {regionName(result.region)} ·
						<a href={resolve("/(app)/settings")} class="text-brand-300 hover:underline">
							Change country
						</a>
						{#if result.link}
							·
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<a
								href={result.link}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1 text-brand-300 hover:underline"
							>
								More on TMDB <ExternalLink class="size-3" />
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						{/if}
					</p>
					<p class="mt-1 text-xs text-zinc-600">
						An add-on needs a separate subscription through another service. Data from JustWatch.
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
