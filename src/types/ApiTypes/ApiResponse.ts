// Meta Information for Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  meta?: PaginationMeta;
  data: T;
}
export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: "active" | "inactive";
}
