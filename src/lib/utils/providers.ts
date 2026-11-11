export const WATCH_KINDS = ["flatrate", "free", "ads", "rent", "buy"] as const;
export type WatchKind = (typeof WATCH_KINDS)[number];

export const WATCH_LABELS: Record<WatchKind, string> = {
	flatrate: "Stream",
	free: "Free",
	ads: "Free with ads",
	rent: "Rent",
	buy: "Buy"
};

// `type` (not `interface`) so these stay assignable to the Supabase `Json` type.
export type WatchProvider = {
	id: number;
	name: string;
	logo_path: string | null;
	addon_via: string | null;
};
export type WatchOptions = Record<WatchKind, WatchProvider[]>;
export type WhereToWatch = { region: string; link: string | null; options: WatchOptions };

// TMDB lists add-ons as e.g. "Max Amazon Channel". "The Roku Channel" is a normal free
// service and deliberately doesn't match.
const ADDON = /^(.+?)\s+(Amazon|Apple TV|Roku Premium|YouTube Primetime)\s+Channels?$/i;
const VIA = {
	amazon: "Prime Video",
	"apple tv": "Apple TV",
	"roku premium": "Roku",
	"youtube primetime": "YouTube"
} as const;

export function addonInfo(providerName: string): { name: string; via: string | null } {
	const m = ADDON.exec(providerName.trim());
	if (!m) return { name: providerName, via: null };
	return { name: m[1], via: VIA[m[2].toLowerCase() as keyof typeof VIA] };
}

export const hasAnyOptions = (o: WatchOptions) => WATCH_KINDS.some((k) => o[k].length > 0);
