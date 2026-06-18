/**
 * lib/api/pagination.ts
 *
 * Reusable pagination helpers for API route handlers.
 *
 * Supports two strategies:
 *   1. Offset pagination  — classic page/limit, useful for small datasets.
 *   2. Cursor pagination  — opaque base64 cursor, efficient for large lists.
 *
 * Usage (offset):
 *   const { limit, offset } = parsePaginationParams(req.nextUrl.searchParams);
 *   const { rows, count } = await db.query(...);
 *   return successResponse(rows, buildOffsetMeta(count, limit, offset));
 *
 * Usage (cursor):
 *   const cursor = decodeCursor(req.nextUrl.searchParams.get("cursor"));
 *   const items = await db.query(...where id > cursor...);
 *   const nextCursor = items.length === limit ? encodeCursor(items.at(-1)!.id) : null;
 *   return successResponse(items, buildCursorMeta(nextCursor, items.length));
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OffsetPaginationParams {
  limit: number;
  offset: number;
  page: number;
}

export interface OffsetPaginationMeta {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CursorPaginationMeta {
  limit: number;
  count: number;
  nextCursor: string | null;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Offset helpers
// ---------------------------------------------------------------------------

/**
 * Parses `limit` and `page` query params from a URLSearchParams instance.
 * Clamps and sanitises values so they are always safe to pass to SQL.
 */
export function parsePaginationParams(
  params: URLSearchParams,
): OffsetPaginationParams {
  const rawLimit = parseInt(params.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const rawPage = parseInt(params.get("page") ?? "1", 10);

  const limit = Math.min(Math.max(Number.isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit, 1), MAX_LIMIT);
  const page = Math.max(Number.isNaN(rawPage) ? 1 : rawPage, 1);
  const offset = (page - 1) * limit;

  return { limit, offset, page };
}

/**
 * Builds the `meta` object included in paginated successResponse() calls.
 */
export function buildOffsetMeta(
  total: number,
  limit: number,
  offset: number,
): OffsetPaginationMeta {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    total,
    limit,
    offset,
    page,
    totalPages,
    hasNextPage: offset + limit < total,
    hasPrevPage: offset > 0,
  };
}

// ---------------------------------------------------------------------------
// Cursor helpers
// ---------------------------------------------------------------------------

/**
 * Base64-encodes an arbitrary string cursor value.
 * The encoded value is URL-safe and opaque to the client.
 */
export function encodeCursor(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

/**
 * Decodes a base64 cursor back to its original string value.
 * Returns `null` if the cursor is absent or malformed.
 */
export function decodeCursor(cursor: string | null): string | null {
  if (!cursor) return null;
  try {
    return Buffer.from(cursor, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Builds the `meta` object for cursor-paginated responses.
 */
export function buildCursorMeta(
  nextCursor: string | null,
  count: number,
  limit: number = DEFAULT_LIMIT,
): CursorPaginationMeta {
  return {
    limit,
    count,
    nextCursor,
    hasMore: nextCursor !== null,
  };
}
