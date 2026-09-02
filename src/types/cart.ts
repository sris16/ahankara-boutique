export interface CartItemResponse {
  cartItemId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
  variant: {
    id: string;
    sku: string | null;
    size: string | null;
    color: string | null;
  };
  pricing: {
    unitPrice: number;
    compareAtPrice: number | null;
    lineTotal: number;
  };
  availability: {
    available: boolean;
    stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PRODUCT_UNAVAILABLE" | "INSUFFICIENT_STOCK" | string;
  };
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  itemCount: number;
  subtotal: number;
}
