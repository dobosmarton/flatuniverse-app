import { z } from 'zod';

const authorSearchParamsSchema = z
  .object({
    search: z.string().nullable(),
    page: z
      .string()
      .nullable()
      .transform((val) => parseInt(val ?? '0')),
    pageSize: z
      .string()
      .nullable()
      .transform((val) => parseInt(val ?? '100')),
  })
  .optional();

export const authorSearchSchema = authorSearchParamsSchema.transform((data) => {
  return {
    search: data?.search ?? '',
    page: data?.page ?? undefined,
    pageSize: data?.pageSize ?? undefined,
  };
});

export type AuthorSearchParams = z.infer<typeof authorSearchParamsSchema>;
export type AuthorSearch = z.infer<typeof authorSearchSchema>;
