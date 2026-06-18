export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
