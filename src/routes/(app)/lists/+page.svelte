<script lang="ts">
	import { resolve } from "$app/paths";
</script>

<svelte:head><title>Lists · Rankr</title></svelte:head>

<div class="card text-center">
	<h1 class="text-2xl font-semibold">Create your first list</h1>
	<p class="mt-2 text-zinc-400">Rank your favorite shows and anime, best to worst.</p>
	<a href={resolve("/(app)/lists/new")} class="btn btn-primary mt-6">Create a list</a>
</div>
