<script lang="ts">
	import { resolve } from "$app/paths";
	import { ChevronLeft } from "@lucide/svelte";
</script>

<svelte:head><title>About & credits · Rankr</title></svelte:head>

<main class="mx-auto min-h-dvh max-w-2xl px-4 py-10">
	<a
		href={resolve("/")}
		class="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-100"
	>
		<ChevronLeft class="size-4" /> Home
	</a>

	<h1 class="mt-4 text-3xl font-semibold tracking-tight">About & credits</h1>

	<section class="card mt-6" aria-labelledby="tmdb-heading">
		<h2 id="tmdb-heading" class="text-lg font-semibold">Show data</h2>

		<a
			href="https://www.themoviedb.org"
			target="_blank"
			rel="noopener noreferrer"
			class="mt-4 inline-block"
		>
			<img src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" class="h-5 w-auto" />
		</a>

		<p class="mt-4 text-sm text-zinc-300">
			This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved
			by TMDB.
		</p>
		<p class="mt-2 text-sm text-zinc-400">
			Show titles, descriptions, posters and episode air dates are provided by TMDB.
		</p>
	</section>
</main>
