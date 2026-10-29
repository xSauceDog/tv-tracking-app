<script lang="ts">
	import { flip } from "svelte/animate";
	import { tick } from "svelte";
	import { MediaQuery } from "svelte/reactivity";
	import { deserialize, enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { dragHandle, dragHandleZone, type DndEvent } from "svelte-dnd-action";
	import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "@lucide/svelte";

	type Item = { id: string; title: string };

	let { items: serverItems }: { items: Item[] } = $props();

	const orderKey = (list: Item[]) => list.map((i) => i.id).join(",");

	// Local, optimistic copies. Both reset automatically whenever the server data changes.
	let items = $derived(serverItems);
	let savedKey = $derived(orderKey(serverItems));

	let status = $state<"idle" | "saving" | "saved" | "error">("idle");
	let announcement = $state("");
	let movedId = $state<string | null>(null);

	const reducedMotion = new MediaQuery("(prefers-reduced-motion: reduce)");
	const flipDurationMs = $derived(reducedMotion.current ? 0 : 220);

	const podium = [
		"bg-amber-400/20 text-amber-300",
		"bg-zinc-300/15 text-zinc-200",
		"bg-orange-500/20 text-orange-300"
	];

	// ---- persistence: one request at a time, latest order wins ----
	let inFlight = false;
	let queued = false;

	async function save(ids: string[]): Promise<boolean> {
		const body = new FormData();
		for (const id of ids) body.append("id", id);
		try {
			const res = await fetch("?/reorder", {
				method: "POST",
				body,
				headers: { "x-sveltekit-action": "true" }
			});
			return deserialize(await res.text()).type === "success";
		} catch {
			return false;
		}
	}

	async function persist() {
		if (inFlight) {
			queued = true;
			return;
		}
		inFlight = true;
		let didSave = false;
		try {
			do {
				queued = false;
				const key = orderKey(items);
				if (key === savedKey) continue; // dropped back where it started
				status = "saving";
				if (!(await save(items.map((i) => i.id)))) {
					status = "error";
					announcement = "Couldn't save the new order. Restoring the previous order.";
					await invalidateAll(); // pull the real order back from the server
					return;
				}
				savedKey = key;
				didSave = true;
			} while (queued);

			if (didSave) {
				status = "saved";
				setTimeout(() => status === "saved" && (status = "idle"), 1500);
			}
		} finally {
			inFlight = false;
		}
	}

	// ---- up / down buttons ----
	let movedTimer: ReturnType<typeof setTimeout>;

	async function move(index: number, delta: -1 | 1) {
		const target = index + delta;
		if (target < 0 || target >= items.length) return;

		const next = items.slice();
		[next[index], next[target]] = [next[target], next[index]];
		const moved = next[target];
		items = next;

		announcement = `${moved.title} moved to position ${target + 1} of ${items.length}`;
		movedId = moved.id;
		clearTimeout(movedTimer);
		movedTimer = setTimeout(() => (movedId = null), 700);
		persist();

		// The row's DOM node moves; put keyboard focus back on the same kind of button.
		await tick();
		const row = document.querySelector<HTMLElement>(`[data-item-id="${moved.id}"]`);
		const direction = delta === -1 ? "up" : "down";
		(
			row?.querySelector<HTMLButtonElement>(`[data-move="${direction}"]:not(:disabled)`) ??
			row?.querySelector<HTMLButtonElement>("[data-move]:not(:disabled)")
		)?.focus();
	}

	// ---- drag and drop ----
	function onconsider(e: CustomEvent<DndEvent<Item>>) {
		items = e.detail.items;
	}

	function onfinalize(e: CustomEvent<DndEvent<Item>>) {
		items = e.detail.items;
		persist();
	}
</script>

<div class="mb-2 h-4 text-right text-xs text-zinc-500" aria-hidden="true">
	{#if status === "saving"}Saving…{:else if status === "saved"}Saved{:else if status === "error"}Couldn't
		save. Order restored.{/if}
</div>
<p class="sr-only" role="status" aria-live="polite">{announcement}</p>

{#if items.length === 0}
	<div
		class="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500"
	>
		Nothing ranked yet. Add your first show above.
	</div>
{:else}
	<ol
		aria-label="Ranked shows"
		class="space-y-2"
		use:dragHandleZone={{ items, flipDurationMs, dropTargetStyle: {} }}
		{onconsider}
		{onfinalize}
	>
		{#each items as item, i (item.id)}
			<li
				data-item-id={item.id}
				animate:flip={{ duration: flipDurationMs }}
				class={[
					"flex items-center gap-1.5 rounded-xl border p-2 transition-colors duration-500 sm:gap-3 sm:p-3",
					movedId === item.id
						? "border-brand-400/60 bg-brand-500/10"
						: "border-white/10 bg-zinc-900/80"
				]}
			>
				<div
					use:dragHandle
					aria-label="Drag to reorder {item.title}"
					class="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-zinc-500 hover:text-zinc-200 active:cursor-grabbing"
				>
					<GripVertical class="size-5" />
				</div>

				<span
					class={[
						"grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
						podium[i] ?? "bg-white/5 text-zinc-400"
					]}
				>
					{i + 1}
				</span>

				<p
					class="line-clamp-2 min-w-0 flex-1 text-sm leading-snug font-medium break-words sm:text-base"
				>
					{item.title}
				</p>

				<button
					type="button"
					class="icon-btn"
					data-move="up"
					disabled={i === 0}
					aria-label="Move {item.title} up"
					onclick={() => move(i, -1)}
				>
					<ChevronUp class="size-5" />
				</button>
				<button
					type="button"
					class="icon-btn"
					data-move="down"
					disabled={i === items.length - 1}
					aria-label="Move {item.title} down"
					onclick={() => move(i, 1)}
				>
					<ChevronDown class="size-5" />
				</button>

				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={item.id} />
					<button class="icon-btn hover:text-red-300" aria-label="Remove {item.title}">
						<Trash2 class="size-4" />
					</button>
				</form>
			</li>
		{/each}
	</ol>
{/if}
