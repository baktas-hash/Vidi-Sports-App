// One response shape for the whole API, so the client never has to guess.
// Success: the payload. Failure: { error: { code, message, fields? } }.

import { hasPgCode, PG_ERROR_CODES } from '@vidi/db';
import { ZodError } from 'zod';

export type ErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'unprocessable'
  | 'internal';

const STATUS: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  unprocessable: 422,
  internal: 500,
};

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (m: string, f?: Record<string, string[]>) =>
  new ApiError('bad_request', m, f);
export const unauthorized = (m = 'Giriş yapmanız gerekiyor') => new ApiError('unauthorized', m);
export const forbidden = (m = 'Bu işlem için yetkiniz yok') => new ApiError('forbidden', m);
export const notFound = (m = 'Bulunamadı') => new ApiError('not_found', m);
export const conflict = (m: string) => new ApiError('conflict', m);
export const unprocessable = (m: string, f?: Record<string, string[]>) =>
  new ApiError('unprocessable', m, f);

export function ok(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function created(data: unknown): Response {
  return Response.json(data, { status: 201 });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

function errorResponse(code: ErrorCode, message: string, fields?: Record<string, string[]>) {
  return Response.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status: STATUS[code] },
  );
}

// Constraints in the database are the last line of defence for several product
// rules. When one of them fires it means the request was bad, not that the
// server broke — mapping them here is what keeps those cases off the 500 pile.
function fromDatabaseError(error: unknown): Response | null {
  if (hasPgCode(error, PG_ERROR_CODES.uniqueViolation)) {
    if (error.constraint?.includes('log_user_id_event_id_watched_on_key')) {
      return errorResponse('conflict', 'Bu event için o güne ait log zaten var.');
    }
    if (error.constraint?.includes('app_user_email_lower_idx')) {
      return errorResponse('conflict', 'Bu e-posta zaten kayıtlı.');
    }
    if (error.constraint?.includes('app_user_handle_key')) {
      return errorResponse('conflict', 'Bu kullanıcı adı alınmış.');
    }
    if (error.constraint?.includes('list_user_slug_idx')) {
      return errorResponse('conflict', 'Bu başlıkla zaten bir listen var.');
    }
    if (error.constraint?.includes('list_item_event_idx')) {
      return errorResponse('conflict', 'Bu event zaten listede var.');
    }
    return errorResponse('conflict', 'Kayıt zaten var.');
  }

  if (hasPgCode(error, PG_ERROR_CODES.checkViolation)) {
    // The watched_on trigger raises check_violation with a readable message.
    if (error.message.includes('watched_on')) {
      return errorResponse('unprocessable', 'İzleme tarihi event tarihinden önce olamaz.', {
        watchedOn: ['event tarihinden önce olamaz'],
      });
    }
    return errorResponse('unprocessable', 'Gönderilen veri kuralları ihlal ediyor.');
  }

  if (hasPgCode(error, PG_ERROR_CODES.foreignKeyViolation)) {
    return errorResponse('unprocessable', 'Referans verilen kayıt bulunamadı.');
  }

  if (hasPgCode(error, PG_ERROR_CODES.invalidTextRepresentation)) {
    // e.g. a malformed uuid arriving as a path or body value.
    return errorResponse('bad_request', 'Geçersiz kimlik biçimi.');
  }

  return null;
}

/**
 * Wraps a route handler so every throw becomes the right status code.
 * Unexpected errors are logged server-side and reported as a bare 500 — no
 * stack traces or SQL in the response body.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.code, error.message, error.fields);
      }
      if (error instanceof ZodError) {
        const { fieldErrors, formErrors } = error.flatten();
        // Object-level refinements (e.g. "a PATCH must change something") land
        // in formErrors, not fieldErrors — without this they'd surface as an
        // empty `fields` object and a useless generic message.
        return errorResponse(
          'unprocessable',
          formErrors[0] ?? 'Geçersiz istek gövdesi.',
          Object.keys(fieldErrors).length ? (fieldErrors as Record<string, string[]>) : undefined,
        );
      }
      const mapped = fromDatabaseError(error);
      if (mapped) return mapped;

      console.error('[api] unhandled', error);
      return errorResponse('internal', 'Beklenmeyen bir hata oluştu.');
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw badRequest('Gövde geçerli JSON olmalı.');
  }
}
