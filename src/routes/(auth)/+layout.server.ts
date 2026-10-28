import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals: { user } }) => {
	if (user) redirect(303, '/dashboard');
};
