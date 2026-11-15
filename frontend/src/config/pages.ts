import { site } from "./site";

/**
 * The information pages linked from the footer. Written for a shop that is not open yet: the owner
 * must check every promise here (and have Terms and Privacy read by a lawyer) before launch.
 * Delivery fees come live from the shop's settings; the size guide page shows config/sizeCharts.ts.
 */
export type InfoPage = {
  slug: string;
  title: string;
  /** For search results and link previews. */
  description: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
};

/** Days a shopper has to ask for an exchange or return after delivery. */
export const exchangeDays = 7;

export const pages: InfoPage[] = [
  {
    slug: "about",
    title: "Our story",
    description: `${site.name} makes panjabis, kurtis, three-pieces and everyday clothes in Bangladesh, and delivers them nationwide.`,
    intro: `${site.name} (তাঁতি) means "weaver". We started with a simple idea: clothes for everyday Bangladesh that feel good in our heat, last more than one season and don't cost a festival budget.`,
    sections: [
      {
        heading: "Made here",
        body: [
          "Our cotton, lawn and linen are woven and dyed in Bangladesh, and every piece is cut and stitched by tailoring partners we visit ourselves. Block prints are printed by hand, so no two are quite the same.",
          "We make small batches and add new styles often, so we rarely have racks of leftovers to clear.",
        ],
      },
      {
        heading: "Honest sizes",
        body: [
          "Every product shows its fit, its fabric and a size chart. Reviews tell you whether a style runs small, true to size or large, and a wrong size is easy to swap.",
        ],
      },
      {
        heading: "Pay when it arrives",
        body: [
          "Cash on delivery works everywhere in Bangladesh, and you can also pay online with bKash, Nagad or a card. We call to confirm every order before it leaves us.",
        ],
      },
    ],
  },
  {
    slug: "delivery-returns",
    title: "Delivery & returns",
    description: `How ${site.name} delivers inside and outside Dhaka, what it costs, and how exchanges and returns work.`,
    intro: "We deliver everywhere in Bangladesh, and a wrong size is easy to swap.",
    sections: [
      {
        heading: "Inside Dhaka",
        body: [
          "Our own riders bring orders inside Dhaka city in 1–2 days after we confirm them by phone. You can check the parcel before paying the rider.",
        ],
      },
      {
        heading: "Outside Dhaka",
        body: [
          "Orders outside Dhaka go by courier (such as Sundarban Courier or SA Paribahan) and usually arrive in 2–4 days. We text you the courier's name and tracking number when the parcel leaves us. Some couriers deliver to their branch office and call you to collect.",
        ],
      },
      {
        heading: "Fees",
        body: [
          "The delivery fee is shown in your bag and at checkout, and delivery is free above a certain order value (shown at the top of every page). Cash on delivery is available everywhere; you can also pay online with bKash, Nagad or a card.",
        ],
      },
      {
        heading: `Exchanges within ${exchangeDays} days`,
        body: [
          `Wrong size or colour? Call or WhatsApp us within ${exchangeDays} days of delivery with your order number. Inside Dhaka our rider swaps it at your door; outside Dhaka, send it back by courier and we send the new size free.`,
          "Pieces must be unworn and unwashed, with their tags on. Exchanges depend on the new size or colour being in stock; if it isn't, we refund you instead.",
        ],
      },
      {
        heading: "Returns and refunds",
        body: [
          `If something arrives damaged or isn't what you ordered, tell us within ${exchangeDays} days and we take it back and refund it in full, delivery included. Online payments are refunded to the same account within 7 working days; cash orders by bKash or Nagad.`,
          "For hygiene reasons we can't take back innerwear or pieces altered after delivery.",
        ],
      },
    ],
  },
  {
    slug: "size-guide",
    title: "Size guide",
    description: `${site.name} size charts for tops, panjabis, kurtis, trousers and kids, with how to measure yourself.`,
    intro: "Our charts give body measurements in inches: measure yourself, then pick the size whose numbers are closest. Each product page also says whether the style is a slim, regular or relaxed fit.",
    sections: [
      {
        heading: "How to measure",
        body: [
          "Chest: measure around the fullest part of your chest, keeping the tape level under your arms. Waist: measure around your natural waist, where you usually wear your trousers. Use a soft tape and keep it snug, not tight. Length is the garment's length from the shoulder to the hem.",
          "Between two sizes? Choose the larger one for a relaxed fit, or read the reviews: they tell you whether a style runs small or large.",
        ],
      },
    ],
  },
  {
    slug: "faq",
    title: "Questions & answers",
    description: `Answers about ordering, paying, delivery, sizes and exchanges at ${site.name}.`,
    intro: "The questions we hear most. If yours isn't here, call or WhatsApp us.",
    sections: [
      { heading: "Do I need an account to order?", body: ["No. You can check out as a guest with your name, mobile number and address. An account remembers your addresses, keeps your order history and lets you save pieces to a wishlist."] },
      { heading: "How do I pay?", body: ["Cash on delivery anywhere in Bangladesh, or online with bKash, Nagad, Rocket or a card through SSLCommerz. Online payments are confirmed with SSLCommerz before your order goes ahead."] },
      { heading: "Why do you call me?", body: ["We call every new order to confirm the size, colour and address before it leaves us. It saves wrong deliveries and wasted trips."] },
      { heading: "How do I know my size?", body: ["Every product has a size guide, and reviews say whether a style runs small, true to size or large. If you're unsure, call us and we'll measure the piece for you."] },
      { heading: "Can I change or cancel my order?", body: ["Yes, until it is sent out: call us with your order number. After that, you can exchange or return it as described on the Delivery & returns page."] },
      { heading: "How do I track my order?", body: ["Use Track your order with your order number and mobile number, or open the order in your account. When a courier carries it, we text you their tracking number."] },
    ],
  },
  {
    slug: "contact",
    title: "Contact us",
    description: `Call, WhatsApp or email ${site.name} about an order, a size or a bulk enquiry.`,
    intro: "Real people, happy to help with an order, a size question or anything else.",
    sections: [
      { heading: "Phone and WhatsApp", body: [`${site.phone}, 10 am to 8 pm every day except Eid days.`] },
      { heading: "Email", body: [`${site.email}. We reply within one working day.`] },
      { heading: "Studio", body: [`${site.address}. Pick-ups and try-ons by appointment: call ahead.`] },
      { heading: "Bulk and corporate orders", body: ["Uniforms, matching Eid sets for a family or a team, and corporate gifts: email us what you have in mind and how many, and we'll send a quote within two working days."] },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy",
    description: `What ${site.name} collects about you, why, and what you can ask us to do with it.`,
    intro: "We collect only what we need to deliver your order and run the shop, and we never sell it.",
    sections: [
      {
        heading: "What we keep",
        body: [
          "Your name, mobile number, delivery address, optional email and what you ordered. If you make an account, we also keep a scrambled form of your password (we can't read it), your saved addresses, your wishlist and your reviews.",
          "When you pay online, SSLCommerz handles your card or mobile wallet details; we only receive whether the payment succeeded and its reference.",
        ],
      },
      {
        heading: "What we use it for",
        body: [
          "To deliver and track orders and to text you about them. We share your name, phone and address with the rider or courier carrying your parcel and nobody else, except where the law requires it.",
        ],
      },
      {
        heading: "Reviews",
        body: ["A review shows your first name and the first letter of your last name, the colour and size you bought, and the date. You can change or delete your review from your account at any time."],
      },
      {
        heading: "Your choices",
        body: [`You can update your details in your account and ask us to delete your account by writing to ${site.email}. We keep order records for as long as tax law requires.`],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of sale",
    description: `The terms that apply when you buy from ${site.name}.`,
    intro: "These terms apply to orders placed on this website. By placing an order you agree to them.",
    sections: [
      {
        heading: "Orders and prices",
        body: [
          "Prices are in taka and include VAT where it applies. We confirm every order by phone before sending it. We may cancel an order (and refund anything paid) if a piece is no longer available or a price was shown wrongly.",
        ],
      },
      {
        heading: "Colours and handwork",
        body: [
          "We photograph every piece in daylight, but screens differ, so colours can look slightly different in person. Block prints and embroidery are made by hand and vary a little from piece to piece.",
        ],
      },
      {
        heading: "Cancelling, exchanges and returns",
        body: [
          `You can cancel free of charge until we send your order out; call us. After delivery, exchanges and returns work as described on the Delivery & returns page, within ${exchangeDays} days.`,
        ],
      },
      {
        heading: "Reviews",
        body: ["Only customers whose order was delivered can review a piece. We may hide reviews that are abusive, contain personal details or aren't about the product."],
      },
    ],
  },
];

export const pageSlugs = pages.map((p) => p.slug);
