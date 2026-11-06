const nf = new Intl.NumberFormat("en-US");
export const formatNumber = (n: number) => nf.format(n);

/** Minutes -> a compact hours figure, plus a "days" hint once it's worth mentioning. */
export function watchTime(minutes: number): { value: string; hint: string | null } {
	const hours = minutes / 60;
	return {
		value: hours === 0 ? "0" : hours < 10 ? hours.toFixed(1) : formatNumber(Math.round(hours)),
		hint: hours >= 24 ? `≈ ${(hours / 24).toFixed(1)} days` : null
	};
}
