<script lang="ts">
	import { untrack } from "svelte";

	let { text, class: className = "" }: { text: string; class?: string } = $props();

	const id = $props.id();
	let el = $state<HTMLParagraphElement>();
	let expanded = $state(false);
	let overflows = $state(false);

	// Truncation can only be measured while clamped. Re-check on resize (rotation,
	// window width) and when the text changes. While expanded we keep the last
	// result so the "Less" button stays put.
	$effect(() => {
		if (!el || !text) return;
		const node = el;
		const measure = () => {
			if (!untrack(() => expanded)) overflows = node.scrollHeight > node.clientHeight + 1;
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	});
</script>

<div class={className}>
	<p {id} bind:this={el} class={["whitespace-pre-line", !expanded && "line-clamp-4"]}>{text}</p>
	{#if overflows}
		<button
			type="button"
			aria-expanded={expanded}
			aria-controls={id}
			class="mt-1 rounded text-sm font-medium text-brand-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
			onclick={() => (expanded = !expanded)}
		>
			{expanded ? "Less" : "More"}
		</button>
	{/if}
</div>
