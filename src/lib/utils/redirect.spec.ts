import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
	it("allows same-origin paths", () => {
		expect(safeRedirectPath("/settings?tab=1")).toBe("/settings?tab=1");
	});
	it("rejects external and protocol-relative URLs", () => {
		expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
		expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
		expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
		expect(safeRedirectPath(null)).toBe("/dashboard");
	});
});
