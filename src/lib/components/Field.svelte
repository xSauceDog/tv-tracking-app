<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	interface Props extends HTMLInputAttributes {
		label: string;
		error?: string;
	}

	let { label, error, id, ...rest }: Props = $props();
	const fallbackId = $props.id();
	const inputId = $derived(id ?? fallbackId);
</script>

<div class="field">
	<label for={inputId}>{label}</label>
	<input
		id={inputId}
		aria-invalid={error ? true : undefined}
		aria-describedby={error ? `${inputId}-error` : undefined}
		{...rest}
	/>
	{#if error}
		<p id="{inputId}-error" class="field-error" role="alert">{error}</p>
	{/if}
</div>
