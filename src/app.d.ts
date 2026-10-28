import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';
import type { AuthUser } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: AuthUser | null }>;
			session: Session | null;
			user: AuthUser | null;
		}
	}
}

export {};
