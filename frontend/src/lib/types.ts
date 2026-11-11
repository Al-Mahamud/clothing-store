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
