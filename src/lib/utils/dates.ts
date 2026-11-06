const fmt = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC"
});

export const formatAirDate = (iso: string) => fmt.format(new Date(`${iso}T00:00:00Z`));

const monthYear = new Intl.DateTimeFormat("en-US", {
	month: "long",
	year: "numeric",
	timeZone: "UTC"
});

export const formatMonthYear = (iso: string) => monthYear.format(new Date(iso));
