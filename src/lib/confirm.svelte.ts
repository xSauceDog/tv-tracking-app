type ConfirmOptions = { title: string; message: string; confirmLabel?: string };
type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

class ConfirmState {
	current = $state.raw<Pending | null>(null);

	ask(options: ConfirmOptions): Promise<boolean> {
		this.current?.resolve(false); // never leave an earlier prompt hanging
		return new Promise((resolve) => {
			this.current = { ...options, resolve };
		});
	}

	settle(ok: boolean) {
		const pending = this.current;
		this.current = null;
		pending?.resolve(ok);
	}
}

export const confirmDialog = new ConfirmState();
