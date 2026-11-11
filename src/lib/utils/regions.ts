// Common TMDB watch regions. Extend as needed.
export const REGIONS = [
	"US",
	"CA",
	"GB",
	"IE",
	"AU",
	"NZ",
	"DE",
	"AT",
	"CH",
	"FR",
	"BE",
	"NL",
	"ES",
	"PT",
	"IT",
	"SE",
	"NO",
	"DK",
	"FI",
	"PL",
	"BR",
	"MX",
	"AR",
	"CL",
	"CO",
	"JP",
	"KR",
	"IN",
	"SG",
	"ZA"
] as const;
export type Region = (typeof REGIONS)[number];
export const DEFAULT_REGION: Region = "US";

const names = new Intl.DisplayNames("en", { type: "region" });
export const regionName = (code: string) => names.of(code) ?? code;

export const REGION_OPTIONS = REGIONS.map((code) => ({ code, name: regionName(code) })).sort(
	(a, b) => a.name.localeCompare(b.name)
);
