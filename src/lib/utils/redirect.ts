export function safeRedirectPath(path: string | null | undefined, fallback = '/dashboard'): string {
	if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
		return fallback;
	}
	return path;
}
