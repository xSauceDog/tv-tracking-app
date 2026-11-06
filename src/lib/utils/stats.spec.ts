import { describe, expect, it } from "vitest";
import { watchTime } from "./stats";

describe("watchTime", () => {
	it("shows one decimal under 10 hours", () => {
		expect(watchTime(0)).toEqual({ value: "0", hint: null });
		expect(watchTime(90)).toEqual({ value: "1.5", hint: null });
	});
	it("rounds larger values and adds a days hint from 24h", () => {
		expect(watchTime(600).value).toBe("10");
		expect(watchTime(3000)).toEqual({ value: "50", hint: "≈ 2.1 days" });
		expect(watchTime(60000).value).toBe("1,000");
	});
});
