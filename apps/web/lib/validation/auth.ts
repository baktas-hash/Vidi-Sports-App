import { z } from 'zod';

// Same rule as the CHECK on app_user.handle. Kept in one place because it also
// has to be shown to the user while they type.
export const HANDLE_RE = /^[a-z0-9_]{2,24}$/;

export const registerSchema = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HANDLE_RE, '2-24 karakter; küçük harf, rakam ve alt çizgi'),
  email: z.string().trim().toLowerCase().email('geçerli bir e-posta olmalı'),
  // Length beats composition rules: 8 characters of anything is a weaker gate
  // than a long passphrase, and symbol requirements just push people to Aa1!.
  password: z.string().min(10, 'en az 10 karakter').max(200),
  displayName: z.string().trim().min(1).max(60).optional(),
  country: z.string().length(2).toUpperCase().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
