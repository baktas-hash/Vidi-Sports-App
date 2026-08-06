import { MEDIUMS, RATING_MAX, VISIBILITIES } from '@vidi/shared';
import { z } from 'zod';

import { isoDate, uuid } from './common';

// Ratings arrive as stars (0.5 .. 5) and are stored as 1..10. The API speaks
// stars because that is what the UI shows; the integer is an implementation
// detail of the column.
const stars = z
  .number()
  .min(0.5, 'en az 0,5 yıldız')
  .max(RATING_MAX / 2, 'en fazla 5 yıldız')
  .refine((value) => Number.isInteger(value * 2), 'yarım yıldız adımlarında olmalı');

export const createLogSchema = z.object({
  eventId: uuid,
  medium: z.enum(MEDIUMS),
  watchedOn: isoDate,
  rating: stars.optional(),
  atmosphere: stars.optional(),
  review: z.string().trim().max(10_000).optional(),
  hasSpoilers: z.boolean().default(false),
  isLiveWatch: z.boolean().default(true),
  isRewatch: z.boolean().default(false),
  ticketRef: z.string().trim().max(200).optional(),
  // Empty or omitted means "watched the whole thing" — never make the user
  // fill this in for the common case.
  segments: z.array(z.number().int().positive()).max(50).optional(),
  visibility: z.enum(VISIBILITIES).default('public'),
});

export const updateLogSchema = createLogSchema
  .omit({ eventId: true })
  .partial()
  // A PATCH with no fields is a mistake on the caller's side, not a no-op we
  // should quietly accept.
  .refine((body) => Object.keys(body).length > 0, 'en az bir alan gönderilmeli');

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;
