<script lang="ts">
	let { data } = $props();
	const name = $derived(data.profile?.display_name ?? data.profile?.username ?? "there");
</script>

<svelte:head><title>Dashboard · Rankr</title></svelte:head>

<h1 class="text-3xl font-semibold tracking-tight">Hey, {name} 👋</h1>
<p class="mt-1 text-zinc-400">@{data.profile?.username}</p>

<div class="card mt-8 text-center">
	<p class="text-zinc-300">Your lists will live here.</p>
	<p class="mt-1 text-sm text-zinc-500">Next up: create your first ranking.</p>
</div>
