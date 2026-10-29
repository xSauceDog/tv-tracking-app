<script lang="ts">
	import { enhance } from '$app/forms';
	import Field from '#lib/components/Field.svelte';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Create account · Rankr</title></svelte:head>

{#if form?.checkEmail}
	<h1 class="text-2xl font-semibold">Check your email</h1>
	<p class="mt-2 text-zinc-400">
		We sent a confirmation link to <strong class="text-zinc-200">{form.email}</strong>. Click it to
		finish creating your account.
	</p>
{:else}
	<h1 class="text-2xl font-semibold">Create your account</h1>
	<p class="mt-1 text-sm text-zinc-400">Start ranking what you watch.</p>

	{#if form?.message}
		<p class="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300" role="alert">
			{form.message}
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
			value={form?.email ?? ''}
			error={form?.errors?.email?.[0]}
		/>
		<Field
			label="Username"
			name="username"
			autocomplete="username"
			required
			minlength={3}
			maxlength={20}
			value={form?.username ?? ''}
			error={form?.errors?.username?.[0]}
		/>
		<Field
			label="Password"
			name="password"
			type="password"
			autocomplete="new-password"
			required
			minlength={8}
			error={form?.errors?.password?.[0]}
		/>
		<button class="btn btn-primary w-full" disabled={submitting}>
			{submitting ? 'Creating account…' : 'Create account'}
		</button>
	</form>

	<p class="mt-6 text-center text-sm text-zinc-400">
		Already have an account? <a class="text-brand-300 hover:underline" href="/login">Sign in</a>
	</p>
{/if}
