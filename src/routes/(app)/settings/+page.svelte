<script lang="ts">
	import { enhance } from "$app/forms";
	import Field from "#lib/components/Field.svelte";
	import { toast } from "#lib/toast.svelte.js";
	import { resolve } from "$app/paths";

	let savingPrefs = $state(false);

	const previousOptions = [
		{
			value: "ask",
			label: "Ask me each time",
			hint: "Choose whether to also mark earlier episodes."
		},
		{
			value: "all",
			label: "Mark earlier episodes too",
			hint: "Skipping ahead checks off everything before it."
		},
		{ value: "single", label: "Only that episode", hint: "Never touch other episodes." }
	] as const;

	let { data, form } = $props();
	let submitting = $state(false);
	const v = $derived(form?.values ?? data.profile);
</script>

<svelte:head><title>Settings · Rankr</title></svelte:head>

<h1 class="text-3xl font-semibold tracking-tight">Settings</h1>
{#if data.profile}
	<a
		href={resolve("/(app)/@[username=username]", { username: data.profile.username })}
		class="mt-1 inline-block text-sm text-brand-300 hover:underline"
	>
		View your profile →
	</a>
{/if}

<h2 class="mt-8 text-2xl font-semibold tracking-tight">Account</h2>

<dl class="card mt-6 max-w-xl space-y-5">
	<div>
		<dt class="text-sm font-medium text-zinc-300">Email</dt>
		<dd class="mt-1 break-all text-zinc-100">{data.user?.email}</dd>
		<dd class="mt-1 text-xs text-zinc-500">This is what you use to sign in.</dd>
	</div>
	<div>
		<dt class="text-sm font-medium text-zinc-300">Username</dt>
		<dd class="mt-1 text-zinc-100">@{data.profile?.username}</dd>
		<dd class="mt-1 text-xs text-zinc-500">
			Usernames can't be changed because they're part of your profile link.
		</dd>
	</div>
</dl>

<h2 class="mt-10 text-2xl font-semibold tracking-tight">Profile</h2>

<form
	method="POST"
	action="?/profile"
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
		label="Display name"
		name="display_name"
		maxlength={50}
		value={v?.display_name ?? ""}
		error={form?.errors?.display_name?.[0]}
	/>

	<div class="field">
		<label for="bio">Bio</label>
		<textarea
			id="bio"
			name="bio"
			rows="4"
			maxlength="280"
			aria-invalid={form?.errors?.bio ? true : undefined}>{v?.bio ?? ""}</textarea
		>
		{#if form?.errors?.bio?.[0]}<p class="field-error" role="alert">{form.errors.bio[0]}</p>{/if}
	</div>

	{#if form?.message}<p class="text-sm text-red-400" role="alert">{form.message}</p>{/if}
	{#if form?.success}<p class="text-sm text-emerald-400" role="status">Saved.</p>{/if}

	<button class="btn btn-primary" disabled={submitting}
		>{submitting ? "Saving…" : "Save changes"}</button
	>
</form>

<h2 class="mt-10 text-2xl font-semibold tracking-tight">Episode tracking</h2>

<form
	method="POST"
	action="?/preferences"
	class="card mt-6 max-w-xl space-y-4"
	use:enhance={() => {
		savingPrefs = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			savingPrefs = false;
			if (result.type === "success") toast.show("Preference saved");
		};
	}}
>
	<fieldset class="space-y-2">
		<legend class="mb-1.5 text-sm font-medium text-zinc-300">
			When I mark an episode as watched
		</legend>
		{#each previousOptions as o (o.value)}
			<label
				class="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3 has-checked:border-brand-400/60 has-checked:bg-brand-500/10"
			>
				<input
					type="radio"
					name="previous_episodes"
					value={o.value}
					checked={data.previousEpisodes === o.value}
					class="mt-1 border-white/20 bg-zinc-900 text-brand-500 focus:ring-brand-400/40"
				/>
				<span>
					<span class="block text-sm font-medium">{o.label}</span>
					<span class="block text-xs text-zinc-500">{o.hint}</span>
				</span>
			</label>
		{/each}
	</fieldset>

	{#if form?.prefsMessage}
		<p class="text-sm text-red-400" role="alert">{form.prefsMessage}</p>
	{/if}

	<button class="btn btn-primary" disabled={savingPrefs}>
		{savingPrefs ? "Saving…" : "Save preference"}
	</button>
</form>
