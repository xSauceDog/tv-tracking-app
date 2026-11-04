import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$app/env/public";
import { SUPABASE_SECRET_KEY } from "$app/env/private";
import type { Database } from "#lib/database.types.js";

// Bypasses RLS. Server-only, and only for trusted writes (e.g. the shows catalog).
export const supabaseAdmin = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
	auth: { persistSession: false, autoRefreshToken: false }
});
