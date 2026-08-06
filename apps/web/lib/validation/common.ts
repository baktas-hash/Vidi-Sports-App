import { z } from 'zod';

// A calendar day, never a timestamp. `new Date('2026-02-15')` would drag a time
// zone into a field that has none, so it stays a string all the way to Postgres.
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-AA-GG biçiminde olmalı')
  .refine((value) => {
    const [y, m, d] = value.split('-').map(Number) as [number, number, number];
    const date = new Date(Date.UTC(y, m - 1, d));
    return (
      date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    );
  }, 'geçerli bir tarih olmalı');

export const uuid = z.string().uuid('geçerli bir kimlik olmalı');

export const limitParam = z.coerce.number().int().min(1).max(50).default(20);

export const paginationParams = z.object({
  cursor: z.string().optional(),
  limit: limitParam,
});
