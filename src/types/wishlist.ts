export interface WishlistItemResponse {
  id: string;
  productId: string;
  name: string;
  slug: string;
  primaryImage: string | null;
  effectiveStartingPrice: number;
  hasAvailableStock: boolean;
  createdAt: string;
}
