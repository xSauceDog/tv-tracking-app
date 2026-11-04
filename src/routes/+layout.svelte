<script lang="ts">
	import "../app.css";
	import { invalidate } from "$app/navigation";
	import { onMount } from "svelte";

	let { data, children } = $props();
	let { supabase, expiresAt } = $derived(data);

	onMount(() => {
		const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
			if ((newSession?.expires_at ?? null) !== expiresAt) invalidate("supabase:auth");
		});
		return () => listener.subscription.unsubscribe();
	});
</script>

{@render children()}
