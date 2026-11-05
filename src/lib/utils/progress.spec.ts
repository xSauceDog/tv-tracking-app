import { describe, expect, it } from "vitest";
import { airingLabel, buildAiringSoon, progressBadge, type ShowStatusRow } from "./progress";

describe("airingLabel", () => {
	it("formats countdowns", () => {
		expect(airingLabel(null)).toBe("TBD");
		expect(airingLabel(0)).toBe("Today");
		expect(airingLabel(1)).toBe("Tomorrow");
		expect(airingLabel(12)).toBe("In 12 days");
	});
});

describe("progressBadge", () => {
	it("hides when nothing has aired or nothing is cached", () => {
		expect(progressBadge(null, "Returning Series")).toBeNull();
		expect(progressBadge({ aired: 0, watched: 0 }, null)).toBeNull();
	});
	it("classifies progress", () => {
		expect(progressBadge({ aired: 10, watched: 0 }, null)?.label).toBe("Not started");
		expect(progressBadge({ aired: 10, watched: 4 }, null)?.label).toBe("4/10");
		expect(progressBadge({ aired: 10, watched: 10 }, "Returning Series")?.label).toBe("Caught up");
		expect(progressBadge({ aired: 10, watched: 10 }, "Ended")?.label).toBe("Completed");
	});
});

describe("buildAiringSoon", () => {
	const show = (id: string, name: string, status: string | null) => ({
		id,
		name,
		poster_path: null,
		status
	});
	const row = (show_id: string, days: number | null): ShowStatusRow => ({
		show_id,
		aired: 0,
		watched: 0,
		next_air_date: null,
		days_until: days,
		next_season: days === null ? null : 1,
		next_episode: days === null ? null : 2,
		next_name: days === null ? null : "Ep"
	});

	it("sorts soonest first, puts TBD last, and drops finished shows without a date", () => {
		const shows = new Map([
			["a", show("a", "Alpha", "Returning Series")],
			["b", show("b", "Bravo", "Returning Series")],
			["c", show("c", "Charlie", "Ended")],
			["d", show("d", "Delta", "Returning Series")]
		]);
		const result = buildAiringSoon(shows, [
			row("a", null),
			row("b", 5),
			row("c", null),
			row("d", 1)
		]);
		expect(result.map((i) => [i.show.id, i.daysUntil])).toEqual([
			["d", 1],
			["b", 5],
			["a", null]
		]);
	});
});
