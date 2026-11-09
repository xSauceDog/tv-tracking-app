<script lang="ts">
	import { confirmDialog } from "#lib/confirm.svelte.js";

	let dialogEl = $state<HTMLDialogElement>();
	const current = $derived(confirmDialog.current);

	$effect(() => {
		if (current && dialogEl && !dialogEl.open) dialogEl.showModal();
		else if (!current && dialogEl?.open) dialogEl.close();
	});
</script>

<!-- Escape and backdrop clicks both end up in onclose, which counts as "cancel". -->
<dialog
	bind:this={dialogEl}
	onclose={() => confirmDialog.settle(false)}
	onclick={(e) => e.target === dialogEl && dialogEl?.close()}
	aria-labelledby="confirm-title"
	aria-describedby="confirm-message"
	class="mt-auto mb-0 w-full max-w-none rounded-t-2xl border border-white/10 bg-zinc-900 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-sm sm:rounded-2xl"
>
	{#if current}
		<div class="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6">
			<h2 id="confirm-title" class="text-lg font-semibold">{current.title}</h2>
			<p id="confirm-message" class="mt-2 text-sm text-zinc-400">{current.message}</p>

			<!-- Cancel comes first in the DOM, so it receives focus when the dialog opens. -->
			<div class="mt-5 flex gap-2">
				<button
					type="button"
					class="btn btn-ghost flex-1"
					onclick={() => confirmDialog.settle(false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-danger flex-1"
					onclick={() => confirmDialog.settle(true)}
				>
					{current.confirmLabel ?? "Confirm"}
				</button>
			</div>
		</div>
	{/if}
</dialog>
