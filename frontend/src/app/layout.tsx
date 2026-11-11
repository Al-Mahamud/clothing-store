import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Sans_Bengali } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Only for the taka sign (৳) and any Bangla text; browsers download it when such characters appear.
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", display: "swap", weight: ["400", "500", "600"] });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#f6f3ee",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${bengali.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
