<script lang="ts">
	import { enhance } from '$app/forms';
	import Field from '$lib/components/Field.svelte';

	let { data, form } = $props();
	let submitting = $state(false);
	const v = $derived(form?.values ?? data.profile);
</script>

<svelte:head><title>Settings · Rankr</title></svelte:head>

<h1 class="text-3xl font-semibold tracking-tight">Profile</h1>

<form
	method="POST"
	class="card mt-6 max-w-xl space-y-4"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<Field
		label="Username"
		name="username"
		required
		minlength={3}
		maxlength={20}
		value={v?.username ?? ''}
		error={form?.errors?.username?.[0]}
	/>
	<Field
		label="Display name"
		name="display_name"
		maxlength={50}
		value={v?.display_name ?? ''}
		error={form?.errors?.display_name?.[0]}
	/>

	<div class="field">
		<label for="bio">Bio</label>
		<textarea
			id="bio"
			name="bio"
			rows="4"
			maxlength="280"
			aria-invalid={form?.errors?.bio ? true : undefined}>{v?.bio ?? ''}</textarea
		>
		{#if form?.errors?.bio?.[0]}<p class="field-error" role="alert">{form.errors.bio[0]}</p>{/if}
	</div>

	{#if form?.message}<p class="text-sm text-red-400" role="alert">{form.message}</p>{/if}
	{#if form?.success}<p class="text-sm text-emerald-400" role="status">Saved.</p>{/if}

	<button class="btn btn-primary" disabled={submitting}
		>{submitting ? 'Saving…' : 'Save changes'}</button
	>
</form>
