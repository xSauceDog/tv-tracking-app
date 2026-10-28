import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

const username = z
	.string()
	.trim()
	.toLowerCase()
	.regex(/^[a-z0-9_]{3,20}$/, 'Use 3–20 letters, numbers or underscores');

export const loginSchema = z.object({
	email,
	password: z.string().min(1, 'Enter your password')
});

export const registerSchema = z.object({
	email,
	username,
	password: z.string().min(8, 'At least 8 characters').max(72, 'At most 72 characters')
});

export const profileSchema = z.object({
	username,
	display_name: z
		.string()
		.trim()
		.max(50, 'At most 50 characters')
		.transform((v) => v || null),
	bio: z
		.string()
		.trim()
		.max(280, 'At most 280 characters')
		.transform((v) => v || null)
});

export const oauthProviderSchema = z.enum(['discord', 'google']);
