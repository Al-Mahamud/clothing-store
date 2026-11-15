/** Brand settings in one place: change the name, contact details and promises here. */
export const site = {
  name: "Tanti",
  /** The public address of the shop, for search engines and shared links (NEXT_PUBLIC_SITE_URL). */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  tagline: "Clothes woven for everyday Bangladesh",
  description:
    "Panjabis, kurtis, three-pieces and everyday essentials, made with care in Bangladesh. Cash on delivery nationwide.",
  phone: "+880 1700-000000",
  email: "hello@tanti.example",
  address: "House 12, Road 5, Dhanmondi, Dhaka 1205",
  /** Only a fallback: the shop sets delivery fees in the admin area. */
  freeDeliveryOver: 3000,
  deliveryFees: { insideDhaka: 70, outsideDhaka: 130 },
  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
  },
} as const;
