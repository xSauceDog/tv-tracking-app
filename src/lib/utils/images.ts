import { PUBLIC_SUPABASE_URL } from "$app/env/public";

const IMG = "https://image.tmdb.org/t/p";
const WIDTHS = [92, 154, 185, 342] as const;

export const posterUrl = (path: string, width: (typeof WIDTHS)[number] = 185) =>
	`${IMG}/w${width}${path}`;

export const posterSrcset = (path: string) =>
	WIDTHS.map((w) => `${posterUrl(path, w)} ${w}w`).join(", ");

export const avatarUrl = (path: string | null | undefined) =>
	path ? `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null;
