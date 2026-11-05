export type ToastKind = "success" | "error";
export type Toast = { id: number; message: string; kind: ToastKind };

class ToastState {
	items = $state<Toast[]>([]);
	#nextId = 0;

	show(message: string, kind: ToastKind = "success", durationMs = 3500) {
		const id = this.#nextId++;
		this.items.push({ id, message, kind });
		setTimeout(() => this.dismiss(id), durationMs);
		return id;
	}

	dismiss(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toast = new ToastState();
