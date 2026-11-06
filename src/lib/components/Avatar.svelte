<script lang="ts">
	let {
		src,
		name,
		class: className = ""
	}: { src: string | null | undefined; name: string; class?: string } = $props();

	// Remember which URL failed, so a new src gets a fresh attempt.
	let failedSrc = $state<string | null>(null);
	const initial = $derived(name.trim().charAt(0).toUpperCase() || "?");
</script>

<span
	class={[
		"inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-500/20 font-semibold text-brand-300 ring-1 ring-white/10 select-none",
		className
	]}
>
	{#if src && failedSrc !== src}
		<img
			{src}
			alt=""
			referrerpolicy="no-referrer"
			loading="lazy"
			decoding="async"
			class="size-full object-cover"
			onerror={() => (failedSrc = src)}
		/>
	{:else}
		<span aria-hidden="true">{initial}</span>
	{/if}
</span>
