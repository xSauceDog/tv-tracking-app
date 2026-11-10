<script lang="ts">
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import { Share2 } from "@lucide/svelte";
	import { toast } from "#lib/toast.svelte.js";

	let { username, listId, isPublic }: { username: string; listId: string; isPublic: boolean } =
		$props();

	const tooltipId = $props.id();
	const privateMessage = "This list needs to be changed to public before it can be shared.";

	const url = $derived(
		new URL(
			resolve("/(app)/@[username=username]/lists/[id=uuid]", { username, id: listId }),
			page.url.origin
		).href
	);

	async function share() {
		// aria-disabled (not `disabled`) keeps the button hoverable/focusable, so a tap on
		// touch screens, where there is no hover, can still explain why it's unavailable.
		if (!isPublic) {
			toast.show(privateMessage, "error");
			return;
		}
		try {
			await navigator.clipboard.writeText(url);
			toast.show("Link copied to clipboard");
		} catch {
			toast.show("Couldn't copy the link", "error");
		}
	}
</script>

<div class="group relative shrink-0">
	<button
		type="button"
		class="btn btn-ghost h-9 px-3 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-white/5"
		aria-disabled={!isPublic || undefined}
		aria-describedby={isPublic ? undefined : tooltipId}
		onclick={share}
	>
		<Share2 class="size-4" /> Share
	</button>

	{#if !isPublic}
		<div
			id={tooltipId}
			role="tooltip"
			class="pointer-events-none absolute top-full right-0 z-20 mt-2 w-56 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 opacity-0 shadow-xl shadow-black/40 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
		>
			{privateMessage}
		</div>
	{/if}
</div>
