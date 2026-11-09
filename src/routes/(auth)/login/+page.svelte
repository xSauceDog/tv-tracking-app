<script lang="ts">
	import { resolve } from "$app/paths";
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import Field from "#lib/components/Field.svelte";

	let { form } = $props();
	let submitting = $state(false);
	const urlError = $derived(page.url.searchParams.get("error"));
</script>

<svelte:head><title>Sign in · Rankr</title></svelte:head>

<h1 class="text-2xl font-semibold">Welcome back</h1>
<p class="mt-1 text-sm text-zinc-400">Sign in to your lists.</p>

{#if form?.message || urlError}
	<p class="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300" role="alert">
		{form?.message ?? "Something went wrong. Please try again."}
	</p>
{/if}

<form
	method="POST"
	class="mt-6 space-y-4"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<Field
		label="Email"
		name="email"
		type="email"
		autocomplete="email"
		required
		value={form?.email ?? ""}
		error={form?.errors?.email?.[0]}
	/>
	<Field
		label="Password"
		name="password"
		type="password"
		autocomplete="current-password"
		required
		error={form?.errors?.password?.[0]}
	/>
	<button class="btn btn-primary w-full" disabled={submitting}>
		{submitting ? "Signing in…" : "Sign in"}
	</button>
</form>

<p class="mt-6 text-center text-sm text-zinc-400">
	New here? <a class="text-brand-300 hover:underline" href={resolve("/(auth)/register")}
		>Create an account</a
	>
</p>
