export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  slug?: string;
  parentId?: number | null;
  active?: boolean;
  children?: CategoryResponse[];
}

export interface CategoryRequest {
  name: string;
  description?: string;
  parentId?: number | null;
  slug?: string;
  active?: boolean;
}