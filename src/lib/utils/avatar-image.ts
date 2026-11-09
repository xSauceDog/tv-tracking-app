const SIZE = 256;

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
	new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export async function prepareAvatar(file: File): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
	const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
	try {
		const side = Math.min(bitmap.width, bitmap.height);
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = SIZE;

		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas unavailable");
		ctx.imageSmoothingQuality = "high";
		ctx.fillStyle = "#18181b"; // flatten transparent PNGs onto the dark theme
		ctx.fillRect(0, 0, SIZE, SIZE);
		ctx.drawImage(
			bitmap,
			(bitmap.width - side) / 2,
			(bitmap.height - side) / 2,
			side,
			side,
			0,
			0,
			SIZE,
			SIZE
		);

		const webp = await toBlob(canvas, "image/webp", 0.85);
		if (webp?.type === "image/webp") return { blob: webp, ext: "webp" };

		const jpeg = await toBlob(canvas, "image/jpeg", 0.88);
		if (jpeg) return { blob: jpeg, ext: "jpg" };
		throw new Error("Could not encode image");
	} finally {
		bitmap.close();
	}
}
