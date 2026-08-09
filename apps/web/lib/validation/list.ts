import { VISIBILITIES } from '@vidi/shared';
import { z } from 'zod';

import { uuid } from './common';

export const createListSchema = z.object({
  title: z.string().trim().min(1, 'başlık gerekli').max(120),
  description: z.string().trim().max(2000).optional(),
  isRanked: z.boolean().default(false),
  visibility: z.enum(VISIBILITIES).default('public'),
});

export const updateListSchema = createListSchema
  .partial()
  // Same discipline as updateLogSchema: an empty PATCH is a caller mistake,
  // not a no-op we should quietly accept.
  .refine((body) => Object.keys(body).length > 0, 'en az bir alan gönderilmeli');

export const setListItemsSchema = z.object({
  eventIds: z.array(uuid).max(200),
});

export const addListItemSchema = z.object({
  eventId: uuid,
  note: z.string().trim().max(500).optional(),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type SetListItemsInput = z.infer<typeof setListItemsSchema>;
export type AddListItemInput = z.infer<typeof addListItemSchema>;
