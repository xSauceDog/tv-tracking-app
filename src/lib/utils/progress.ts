export const FINISHED_STATUSES = ["Ended", "Canceled"] as const;

export const isFinished = (status: string | null | undefined) =>
	!!status && (FINISHED_STATUSES as readonly string[]).includes(status);

/** One row of the `show_status` RPC. */
export type ShowStatusRow = {
	show_id: string;
	aired: number;
	watched: number;
	next_air_date: string | null;
	days_until: number | null;
	next_season: number | null;
	next_episode: number | null;
	next_name: string | null;
};

// ---- progress badges ----

export type BadgeTone = "idle" | "progress" | "caught-up" | "done";
export type ProgressBadge = { label: string; description: string; tone: BadgeTone };

/** null = nothing to show yet (episodes not cached, or nothing has aired). */
export function progressBadge(
	progress: { aired: number; watched: number } | null | undefined,
	status: string | null | undefined
): ProgressBadge | null {
	if (!progress || progress.aired === 0) return null;
	const { aired, watched } = progress;

	if (watched >= aired) {
		return isFinished(status)
			? { label: "Completed", description: "Every episode watched", tone: "done" }
			: { label: "Caught up", description: "Every aired episode watched", tone: "caught-up" };
	}
	if (watched === 0) {
		return { label: "Not started", description: `${aired} aired episodes to watch`, tone: "idle" };
	}
	return {
		label: `${watched}/${aired}`,
		description: `${watched} of ${aired} aired episodes watched`,
		tone: "progress"
	};
}

// ---- airing soon ----

export type AiringShow = {
	id: string;
	name: string;
	poster_path: string | null;
	status: string | null;
};

export type AiringItem = {
	show: AiringShow;
	/** null = no date announced yet (TBD) */
	daysUntil: number | null;
	episode: { season: number; number: number; name: string } | null;
};

export function airingLabel(daysUntil: number | null): string {
	if (daysUntil === null) return "TBD";
	if (daysUntil <= 0) return "Today";
	if (daysUntil === 1) return "Tomorrow";
	return `In ${daysUntil} days`;
}

/**
 * A show with a dated upcoming episode shows its countdown. A show that is still running but
 * has no dated episode shows "TBD". Finished shows are left out. Soonest first, TBD last.
 */
export function buildAiringSoon(
	shows: Map<string, AiringShow>,
	rows: ShowStatusRow[],
	limit = 12
): AiringItem[] {
	const items: AiringItem[] = [];

	for (const r of rows) {
		const show = shows.get(r.show_id);
		if (!show) continue;

		if (r.days_until !== null && r.next_season !== null && r.next_episode !== null) {
			items.push({
				show,
				daysUntil: r.days_until,
				episode: { season: r.next_season, number: r.next_episode, name: r.next_name ?? "" }
			});
		} else if (!isFinished(show.status)) {
			items.push({ show, daysUntil: null, episode: null });
		}
	}

	items.sort(
		(a, b) =>
			(a.daysUntil ?? Infinity) - (b.daysUntil ?? Infinity) ||
			a.show.name.localeCompare(b.show.name)
	);
	return items.slice(0, limit);
}
