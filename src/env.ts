import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: { public: true, static: true },
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: { public: true, static: true },
	SUPABASE_SECRET_KEY: { public: false, static: false },
	TMDB_READ_TOKEN: { public: false, static: false },
	CRON_SECRET: { public: false, static: false }
});
