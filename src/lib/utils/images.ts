const IMG = "https://image.tmdb.org/t/p";
const WIDTHS = [92, 154, 185, 342] as const;

export const posterUrl = (path: string, width: (typeof WIDTHS)[number] = 185) =>
	`${IMG}/w${width}${path}`;

export const posterSrcset = (path: string) =>
	WIDTHS.map((w) => `${posterUrl(path, w)} ${w}w`).join(", ");
