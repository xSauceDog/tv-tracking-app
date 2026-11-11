import { describe, expect, it } from "vitest";
import { addonInfo } from "./providers";

describe("addonInfo", () => {
	it("detects channel add-ons", () => {
		expect(addonInfo("Max Amazon Channel")).toEqual({ name: "Max", via: "Prime Video" });
		expect(addonInfo("Starz Apple TV Channel")).toEqual({ name: "Starz", via: "Apple TV" });
		expect(addonInfo("AMC+ Roku Premium Channel")).toEqual({ name: "AMC+", via: "Roku" });
	});
	it("leaves regular providers alone", () => {
		expect(addonInfo("Netflix")).toEqual({ name: "Netflix", via: null });
		expect(addonInfo("The Roku Channel")).toEqual({ name: "The Roku Channel", via: null });
	});
});
