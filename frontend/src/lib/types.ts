export type Swatch = { name: string; hex: string };

export type ProductCard = {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  hoverImage: string | null;
  colors: Swatch[];
  isNew: boolean;
  soldOut: boolean;
};

export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
  children: CategoryNode[];
};

export type FacetValue = { value: string; label: string; hex: string | null; count: number; selected: boolean };

export type ProductPage = {
  items: ProductCard[];
  page: number;
  pageSize: number;
  total: number;
  facets: { sizes: FacetValue[]; colors: FacetValue[]; price: { min: number; max: number } };
};

export type SizeStock = { variantId: number; size: string; sku: string; stock: number };

export type ColorOption = {
  id: number;
  name: string;
  hex: string;
  images: { url: string; alt: string }[];
  sizes: SizeStock[];
};

export type ProductDetail = {
  id: number;
  slug: string;
  name: string;
  breadcrumb: { name: string; slug: string }[];
  description: string;
  details: string[];
  fabric: string | null;
  care: string | null;
  fit: string | null;
  sizeChart: "NONE" | "TOPS" | "BOTTOMS" | "KIDS";
  price: number;
  compareAtPrice: number | null;
  isNew: boolean;
  colors: ColorOption[];
};

export type Collection = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  image: string | null;
  productCount: number;
};

export type Home = {
  collections: Collection[];
  categories: CategoryNode[];
  newArrivals: ProductCard[];
  bestSellers: ProductCard[];
};

export type CartLine = {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  image: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  stock: number;
  lineTotal: number;
  problem: "UNAVAILABLE" | "OUT_OF_STOCK" | "NOT_ENOUGH_STOCK" | null;
};

export type Cart = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  discount: number;
  coupon: { code: string; description: string; discount: number; freeShipping: boolean } | null;
  couponProblem: string | null;
  total: number;
  freeDeliveryOver: number;
  remainingForFreeDelivery: number;
  canCheckout: boolean;
};

export type Zone = "DHAKA" | "OUTSIDE";

export type Quote = { subtotal: number; discount: number; shippingFee: number; total: number; couponCode: string | null };

export type OrderView = {
  number: string;
  status: "PENDING_PAYMENT" | "PLACED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "COD" | "ONLINE";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  placedAt: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  area: string;
  city: string;
  zone: Zone;
  note: string | null;
  items: { slug: string; name: string; color: string; size: string; image: string | null; unitPrice: number; quantity: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode: string | null;
  events: { status: string; note: string | null; at: string }[];
};
