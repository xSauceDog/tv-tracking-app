import { z } from "zod";

export type FieldErrors = Partial<Record<string, string[]>>;

export const fieldErrors = (error: z.ZodError): FieldErrors => z.flattenError(error).fieldErrors;
