<script lang="ts">
	import { Tv } from '@lucide/svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>Rankr: rank every show you love</title>
</svelte:head>

<main
	class="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 text-center"
>
	<div
		class="bg-brand-500/20 ring-brand-400/40 mb-6 grid size-14 place-items-center rounded-2xl ring-1"
	>
		<Tv class="text-brand-300 size-7" />
	</div>
	<h1 class="text-4xl font-semibold tracking-tight sm:text-6xl">Rank every show you love.</h1>
	<p class="mt-4 max-w-xl text-lg text-zinc-400">
		Build custom lists of your favorite TV shows and anime, and share your taste with the world.
	</p>
	<div class="mt-8 flex flex-wrap justify-center gap-3">
		{#if data.user}
			<a href="/dashboard" class="btn btn-primary">Go to dashboard</a>
		{:else}
			<a href="/register" class="btn btn-primary">Get started</a>
			<a href="/login" class="btn btn-ghost">Sign in</a>
		{/if}
	</div>
</main>
