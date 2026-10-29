<script lang="ts">
	import { enhance } from "$app/forms";
	import Field from "#lib/components/Field.svelte";

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>New list · Rankr</title></svelte:head>

<h1 class="text-2xl font-semibold tracking-tight">New list</h1>

<form
	method="POST"
	class="card mt-6 space-y-4"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<Field
		label="List name"
		name="name"
		placeholder="e.g. All-time favorites"
		required
		maxlength={60}
		value={form?.name ?? ""}
		error={form?.errors?.name?.[0]}
	/>
	<label class="flex items-center gap-2 text-sm text-zinc-300">
		<input
			type="checkbox"
			name="is_public"
			checked
			class="rounded border-white/20 bg-zinc-900 text-brand-500 focus:ring-brand-400/40"
		/>
		Make this list public
	</label>
	{#if form?.message}<p class="text-sm text-red-400" role="alert">{form.message}</p>{/if}
	<button class="btn btn-primary" disabled={submitting}>
		{submitting ? "Creating…" : "Create list"}
	</button>
</form>
