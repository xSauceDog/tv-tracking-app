<script lang="ts">
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { House, Library, ListOrdered, Settings, Tv } from "@lucide/svelte";
	import Avatar from "#lib/components/Avatar.svelte";
	import Toaster from "#lib/components/Toaster.svelte";
	import ConfirmDialog from "#lib/components/ConfirmDialog.svelte";
	import { avatarUrl } from "#lib/utils/images.js";

	let { data, children } = $props();

	const links = [
		{ route: "/(app)/dashboard", label: "Home", icon: House },
		{ route: "/(app)/lists", label: "Lists", icon: ListOrdered },
		{ route: "/(app)/shows", label: "Shows", icon: Library }
	] as const;
	const isActive = (route: string) => page.route.id?.startsWith(route) ?? false;

	const me = $derived(data.profile);
	const meName = $derived(me ? (me.display_name ?? me.username) : "");
	const myProfileHref = $derived(
		me ? resolve("/(app)/@[username=username]", { username: me.username }) : null
	);
	// Only "current" when viewing your own profile, not a friend's.
	const onMyProfile = $derived(!!me && page.params.username === me.username);
</script>

<div class="min-h-dvh pb-20 md:pb-0">
	<header class="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
		<div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
			<div class="flex items-center gap-4">
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
			</div>

			<div class="flex items-center gap-1.5">
				{#if me && myProfileHref}
					<a
						href={myProfileHref}
						aria-current={onMyProfile ? "page" : undefined}
						class="hidden items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 aria-[current=page]:bg-white/10 aria-[current=page]:text-zinc-100 md:flex"
					>
						<Avatar src={avatarUrl(me.avatar_path)} name={meName} class="size-7 text-xs" />
						<span class="max-w-32 truncate">{me.username}</span>
					</a>
				{/if}

				<a
					href={resolve("/(app)/settings")}
					aria-label="Settings"
					aria-current={isActive("/(app)/settings") ? "page" : undefined}
					class="icon-btn aria-[current=page]:bg-white/10 aria-[current=page]:text-zinc-100"
				>
					<Settings class="size-5" />
				</a>

				<form method="POST" action="/auth/logout">
					<button class="btn btn-ghost h-9 px-3">Sign out</button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-8">
		{@render children()}
	</main>

	<nav
		class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/10 bg-zinc-950/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
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
		{#if me && myProfileHref}
			<a
				href={myProfileHref}
				aria-current={onMyProfile ? "page" : undefined}
				class="flex flex-col items-center gap-1 py-2.5 text-xs text-zinc-500 aria-[current=page]:text-brand-300"
			>
				<Avatar src={avatarUrl(me.avatar_path)} name={meName} class="size-5 text-[10px]" />
				Profile
			</a>
		{/if}
	</nav>
	<Toaster />
	<ConfirmDialog />
</div>
