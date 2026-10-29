<script lang="ts">
	import { Tv } from "@lucide/svelte";
	let { children } = $props();
</script>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
	<a href="/" class="mx-auto mb-8 flex items-center gap-2 text-lg font-semibold">
		<Tv class="size-6 text-brand-400" /> Rankr
	</a>
	<div class="card">
		{@render children()}
	</div>
</main>
