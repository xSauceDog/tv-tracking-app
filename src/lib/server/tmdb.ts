import { z } from "zod";
import { TMDB_READ_TOKEN } from "$app/env/private";
import type { TablesInsert } from "#lib/database.types.js";
import type { ShowSearchResult } from "#lib/types.js";
import { addonInfo, WATCH_KINDS, type WatchOptions } from "#lib/utils/providers.js";

const BASE = "https://api.themoviedb.org/3";

// TMDB sends "" for unknown dates/paths; normalise to null.
const nullable = z
	.string()
	.nullish()
	.transform((v) => v || null);

const searchSchema = z.object({
	results: z.array(
		z.object({ id: z.number(), name: z.string(), first_air_date: nullable, poster_path: nullable })
	)
});

const showSchema = z.object({
	id: z.number(),
	name: z.string(),
	original_name: nullable,
	overview: nullable,
	poster_path: nullable,
	backdrop_path: nullable,
	first_air_date: nullable,
	status: nullable
});

async function request<S extends z.ZodType>(
	path: string,
	schema: S,
	params: Record<string, string> = {},
	fetchFn: typeof fetch = fetch
): Promise<z.output<S> | null> {
	const url = new URL(BASE + path);
	for (const [key, value] of Object.entries({ language: "en-US", ...params })) {
		url.searchParams.set(key, value);
	}
	const res = await fetchFn(url, {
		headers: { Authorization: `Bearer ${TMDB_READ_TOKEN}`, Accept: "application/json" },
		signal: AbortSignal.timeout(5000)
	});
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`TMDB responded ${res.status}`);
	return schema.parse(await res.json());
}

export async function searchShows(
	query: string,
	fetchFn?: typeof fetch
): Promise<ShowSearchResult[]> {
	const data = await request(
		"/search/tv",
		searchSchema,
		{ query, include_adult: "false" },
		fetchFn
	);
	return (data?.results ?? []).slice(0, 8).map((r) => ({
		tmdb_id: r.id,
		name: r.name,
		first_air_date: r.first_air_date,
		poster_path: r.poster_path
	}));
}

export async function getShow(tmdbId: number): Promise<TablesInsert<"shows"> | null> {
	const s = await request(`/tv/${tmdbId}`, showSchema);
	if (!s) return null;
	return {
		tmdb_id: s.id,
		name: s.name,
		original_name: s.original_name,
		overview: s.overview,
		poster_path: s.poster_path,
		backdrop_path: s.backdrop_path,
		first_air_date: s.first_air_date,
		status: s.status
	};
}

const showDetailSchema = showSchema.extend({
	seasons: z.array(z.object({ season_number: z.number(), episode_count: z.number() }))
});

const seasonSchema = z.object({
	episodes: z.array(
		z.object({
			season_number: z.number(),
			episode_number: z.number(),
			name: z.string(),
			overview: nullable,
			air_date: nullable,
			runtime: z
				.number()
				.nullish()
				.transform((v) => v ?? null),
			still_path: nullable
		})
	)
});

export const getShowDetail = (tmdbId: number) => request(`/tv/${tmdbId}`, showDetailSchema);

export const getSeasonEpisodes = (tmdbId: number, season: number) =>
	request(`/tv/${tmdbId}/season/${season}`, seasonSchema);

const providerSchema = z.object({
	provider_id: z.number(),
	provider_name: z.string(),
	logo_path: nullable,
	display_priority: z
		.number()
		.nullish()
		.transform((v) => v ?? 999)
});
const providerList = z.array(providerSchema).default([]);

const watchProvidersSchema = z.object({
	results: z.record(
		z.string(),
		z.object({
			link: nullable,
			flatrate: providerList,
			free: providerList,
			ads: providerList,
			rent: providerList,
			buy: providerList
		})
	)
});

/** Providers for one country. An unknown show or country simply yields empty options. */
export async function getWatchProviders(
	tmdbId: number,
	region: string
): Promise<{ link: string | null; options: WatchOptions }> {
	const data = await request(`/tv/${tmdbId}/watch/providers`, watchProvidersSchema);
	const r = data?.results[region];

	const options = Object.fromEntries(
		WATCH_KINDS.map((kind) => [
			kind,
			(r?.[kind] ?? [])
				.slice()
				.sort((a, b) => a.display_priority - b.display_priority)
				.map((p) => {
					const { name, via } = addonInfo(p.provider_name);
					return { id: p.provider_id, name, logo_path: p.logo_path, addon_via: via };
				})
		])
	) as WatchOptions;

	return { link: r?.link?.startsWith("https://") ? r.link : null, options };
}
