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
  /** Average of published reviews, or null when there are none. */
  rating: number | null;
  reviewCount: number;
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
  rating: number | null;
  reviewCount: number;
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

/** Delivery fees in taka, as the shop has set them. */
export type DeliveryFees = { insideDhaka: number; outsideDhaka: number; freeOver: number };

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
  /** Set while an online order waits for payment. */
  paymentExpiresAt: string | null;
  /** Set when the order is shipped with a courier. */
  courier: string | null;
  trackingCode: string | null;
  /** Care texts after delivery (the shopper can turn them off). */
  deliveredAt: string | null;
};

export type PaymentOptions = { online: boolean; holdMinutes: number };

export type Profile = { id: number; name: string; phone: string; email: string | null };

export type SavedAddress = {
  id: number;
  label: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  zone: Zone;
  note: string | null;
  isDefault: boolean;
};

export type OrderSummary = { number: string; status: OrderView["status"]; placedAt: string; itemCount: number; lineCount: number; total: number; images: string[] };
export type OrderHistory = { items: OrderSummary[]; page: number; pageSize: number; total: number };
export type Reordered = { added: number; unavailable: string[]; cart: Cart };

export type ReviewPhoto = { id: number; url: string };

/** How a reviewer said it fitted. */
export type Fit = "SMALL" | "TRUE" | "LARGE";

export type Review = {
  id: number;
  rating: number;
  title: string | null;
  body: string;
  fit: Fit | null;
  author: string;
  bought: string | null;
  photos: ReviewPhoto[];
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  edited: boolean;
};

/** `stars`: how many reviews gave 5, 4, 3, 2 and 1 stars. */
export type ReviewSummary = { average: number | null; count: number; stars: number[]; withPhotos: number; fit: { small: number; trueToSize: number; large: number } };
export type ReviewSort = "RECENT" | "HIGHEST" | "LOWEST" | "PHOTOS";
export type ReviewPage = { summary: ReviewSummary; items: Review[]; page: number; pageSize: number; total: number };

export type MyReview = {
  id: number;
  slug: string;
  product: string;
  image: string | null;
  rating: number;
  title: string | null;
  body: string;
  fit: Fit | null;
  bought: string | null;
  photos: ReviewPhoto[];
  status: "PUBLISHED" | "HIDDEN";
  reply: string | null;
  createdAt: string;
};
export type ToReview = { slug: string; product: string; image: string | null; bought: string | null; deliveredAt: string | null };
export type AccountReviews = { toReview: ToReview[]; mine: MyReview[] };
export type ReviewForProduct = { canReview: boolean; review: MyReview | null };

export type Sitemap = { categories: string[]; collections: string[]; products: { slug: string; updatedAt: string }[] };
