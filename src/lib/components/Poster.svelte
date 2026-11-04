<script lang="ts">
	import { Tv } from "@lucide/svelte";
	import { posterSrcset, posterUrl } from "#lib/utils/images.js";

	let {
		path,
		sizes = "48px",
		class: className = ""
	}: { path: string | null; sizes?: string; class?: string } = $props();
</script>

{#if path}
	<img
		src={posterUrl(path)}
		srcset={posterSrcset(path)}
		{sizes}
		alt=""
		width="92"
		height="138"
		loading="lazy"
		decoding="async"
		class={["aspect-2/3 rounded-md bg-zinc-800 object-cover", className]}
	/>
{:else}
	<div
		class={["grid aspect-2/3 place-items-center rounded-md bg-zinc-800 text-zinc-600", className]}
		aria-hidden="true"
	>
		<Tv class="size-1/3" />
	</div>
{/if}
