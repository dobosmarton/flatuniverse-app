import { z } from 'zod';

export type PaginationInput =
  | {
      page?: number;
      pageSize?: number;
    }
  | undefined;

export const paginationInputSchema = z
  .object({
    page: z.number().int().nonnegative().optional().default(0),
    pageSize: z.number().int().positive().optional().default(10),
  })
  .optional()
  .default({
    page: 0,
    pageSize: 10,
  });

export type PaginationParsedInput = z.infer<typeof paginationInputSchema>;
