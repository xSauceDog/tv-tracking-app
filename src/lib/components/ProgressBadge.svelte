<script lang="ts">
	import { Check } from "@lucide/svelte";
	import { progressBadge } from "#lib/utils/progress.js";

	let {
		aired,
		watched,
		status,
		class: className = ""
	}: { aired: number; watched: number; status: string | null; class?: string } = $props();

	const badge = $derived(progressBadge({ aired, watched }, status));

	const tones = {
		idle: "bg-white/5 text-zinc-400 ring-white/10",
		progress: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
		"caught-up": "bg-sky-500/15 text-sky-300 ring-sky-400/30",
		done: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
	};
</script>

{#if badge}
	<span
		class={[
			"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ring-1 ring-inset",
			tones[badge.tone],
			className
		]}
	>
		{#if badge.tone === "caught-up" || badge.tone === "done"}<Check class="size-3" />{/if}
		<span aria-hidden="true">{badge.label}</span>
		<span class="sr-only">{badge.description}</span>
	</span>
{/if}
