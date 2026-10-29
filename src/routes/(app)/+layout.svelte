<script lang="ts">
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { House, Settings, Tv } from "@lucide/svelte";

	let { children } = $props();

	const links = [
		{ route: "/(app)/dashboard", label: "Home", icon: House },
		{ route: "/(app)/settings", label: "Settings", icon: Settings }
	] as const;
	const isActive = (route: string) => page.route.id?.startsWith(route) ?? false;
</script>

<div class="min-h-dvh pb-20 md:pb-0">
	<header class="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
		<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
			<a href={resolve("/(app)/dashboard")} class="flex items-center gap-2 font-semibold">
				<Tv class="size-5 text-brand-400" /> Rankr
			</a>

			<nav class="hidden items-center gap-1 md:flex" aria-label="Main">
				{#each links as link (link.route)}
					<a
						href={resolve(link.route)}
						aria-current={isActive(link.route) ? "page" : undefined}
						class="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:text-zinc-100 aria-[current=page]:bg-white/10 aria-[current=page]:text-zinc-100"
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<form method="POST" action="/auth/logout">
				<button class="btn btn-ghost h-9 px-3">Sign out</button>
			</form>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-8">
		{@render children()}
	</main>

	<nav
		class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-white/10 bg-zinc-950/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
		aria-label="Main"
	>
		{#each links as link (link.route)}
			<a
				href={resolve(link.route)}
				aria-current={isActive(link.route) ? "page" : undefined}
				class="flex flex-col items-center gap-1 py-2.5 text-xs text-zinc-500 aria-[current=page]:text-brand-300"
			>
				<link.icon class="size-5" />
				{link.label}
			</a>
		{/each}
	</nav>
</div>
