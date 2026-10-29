<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import Field from "#lib/components/Field.svelte";

	let { form } = $props();
	let submitting = $state(false);
	const next = $derived(page.url.searchParams.get("next") ?? "");
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
	action="?/login"
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

<div class="my-6 flex items-center gap-3 text-xs text-zinc-500">
	<span class="h-px flex-1 bg-white/10"></span> or <span class="h-px flex-1 bg-white/10"></span>
</div>

<form method="POST" action="?/oauth" class="grid grid-cols-2 gap-3">
	<input type="hidden" name="next" value={next} />
	<button class="btn btn-ghost" name="provider" value="discord">Discord</button>
	<button class="btn btn-ghost" name="provider" value="google">Google</button>
</form>

<p class="mt-6 text-center text-sm text-zinc-400">
	New here? <a class="text-brand-300 hover:underline" href="/register">Create an account</a>
</p>
