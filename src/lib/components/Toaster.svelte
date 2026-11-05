<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { MediaQuery } from "svelte/reactivity";
	import { Check, CircleAlert, X } from "@lucide/svelte";
	import { toast } from "#lib/toast.svelte.js";

	const reducedMotion = new MediaQuery("(prefers-reduced-motion: reduce)");
	const duration = $derived(reducedMotion.current ? 0 : 200);
</script>

<!-- The live region is always mounted so screen readers announce new toasts. -->
<div
	class="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
	role="status"
	aria-live="polite"
>
	{#each toast.items as t (t.id)}
		<div
			in:fly={{ y: 12, duration }}
			out:fade={{ duration }}
			class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/95 py-2.5 pr-2 pl-3.5 text-sm shadow-2xl shadow-black/40 backdrop-blur-xl"
		>
			{#if t.kind === "error"}
				<CircleAlert class="size-4 shrink-0 text-red-400" />
			{:else}
				<Check class="size-4 shrink-0 text-emerald-400" />
			{/if}
			<p class="min-w-0 flex-1 wrap-break-word">{t.message}</p>
			<button
				type="button"
				class="icon-btn size-8"
				aria-label="Dismiss"
				onclick={() => toast.dismiss(t.id)}
			>
				<X class="size-4" />
			</button>
		</div>
	{/each}
</div>
