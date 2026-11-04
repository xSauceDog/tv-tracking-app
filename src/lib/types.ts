export interface AuthUser {
	id: string;
	email?: string;
}

export interface ShowSearchResult {
	tmdb_id: number;
	name: string;
	first_air_date: string | null;
	poster_path: string | null;
}
