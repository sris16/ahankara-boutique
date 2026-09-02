export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  secureUrl: string;
  altText: string | null;
  isPrimary: boolean;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  basePrice: number; // in paise
  compareAtPrice: number | null; // in paise
  categoryId: string;
  isFeatured: boolean;
  hasAvailableStock: boolean;
  category: Category;
  collections: { collection: Collection }[];
  images: ProductImage[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListResponse {
  data: ProductSummary[];
  meta: PaginationMeta;
}

export interface ProductVariantDetail {
  id: string;
  size: string | null;
  color: string | null;
  effectivePrice: number; // in paise
  compareAtPrice: number | null; // in paise
  available: boolean;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | string;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  basePrice: number; // in paise
  compareAtPrice: number | null; // in paise
  categoryId: string;
  isFeatured: boolean;
  category: Category;
  collections: { collection: Collection }[];
  images: ProductImage[];
  variants: ProductVariantDetail[];
}
