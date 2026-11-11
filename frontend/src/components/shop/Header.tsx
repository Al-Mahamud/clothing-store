import Link from "next/link";
import { Heart, User } from "lucide-react";
import { api } from "@/lib/api";
import { site } from "@/config/site";
import { MobileMenu } from "./MobileMenu";
import { SearchButton } from "./SearchButton";
import { BagButton } from "./BagButton";

/* eslint-disable @next/next/no-img-element */
export async function Header() {
  const [categories, collections] = await Promise.all([api.categories(), api.collections()]);
  return (
    <>
      <div className="bg-ink text-paper">
        <p className="container-page py-2 text-center text-[0.6875rem] tracking-[0.12em] uppercase">
          Free delivery over ৳{site.freeDeliveryOver.toLocaleString("en-IN")}
          <span className="hidden sm:inline">
            <span className="mx-3 text-paper/40">·</span>
            Cash on delivery across Bangladesh
          </span>
        </p>
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/75">
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-[4.5rem]">
          <div className="flex items-center gap-1">
            <MobileMenu categories={categories} collections={collections} />
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center">
                {categories.map((top) => (
                  <li key={top.id} className="group">
                    <Link
                      href={`/c/${top.slug}`}
                      className="relative inline-flex h-[4.5rem] items-center px-3 text-sm font-medium after:absolute after:inset-x-3 after:bottom-5 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform group-hover:after:scale-x-100"
                    >
                      {top.name}
                    </Link>
                    <div className="invisible absolute inset-x-0 top-full border-b border-line bg-paper opacity-0 shadow-[0_24px_40px_-24px_rgba(0,0,0,0.18)] transition duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      <div className="container-page grid grid-cols-12 gap-8 py-10">
                        <div className="col-span-3">
                          <p className="eyebrow mb-5 text-muted">Shop {top.name}</p>
                          <ul className="space-y-3">
                            <li>
                              <Link href={`/c/${top.slug}`} className="font-display text-2xl font-light hover:text-clay">
                                Everything {top.name.toLowerCase()}
                              </Link>
                            </li>
                            {top.children.map((child) => (
                              <li key={child.id}>
                                <Link href={`/c/${child.slug}`} className="text-[0.9375rem] text-ink-soft hover:text-ink hover:underline underline-offset-4">
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="col-span-9 grid grid-cols-4 gap-4">
                          {top.children.slice(0, 4).map((child) => (
                            <Link key={child.id} href={`/c/${child.slug}`} className="group/tile block">
                              <div className="aspect-[4/5] overflow-hidden bg-sand">
                                {child.image && (
                                  <img src={child.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover/tile:scale-105" />
                                )}
                              </div>
                              <p className="mt-2 text-sm font-medium">{child.name}</p>
                              <p className="text-xs text-muted">{child.productCount} styles</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                <li>
                  <Link href={collections[0] ? `/collections/${collections[0].slug}` : "/shop"} className="inline-flex h-[4.5rem] items-center px-3 text-sm font-medium hover:text-clay">
                    {collections[0]?.name ?? "Collections"}
                  </Link>
                </li>
                <li>
                  <Link href="/shop?sale=true" className="inline-flex h-[4.5rem] items-center px-3 text-sm font-medium text-sale">
                    Sale
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <Link href="/" className="font-display text-[1.65rem] font-normal uppercase tracking-[0.32em] md:text-3xl" aria-label={`${site.name} home`}>
            {site.name}
          </Link>

          <div className="flex items-center justify-end gap-0.5">
            <SearchButton />
            <Link href="/account" aria-label="Account" className="hidden h-10 w-10 place-items-center rounded-full hover:bg-sand sm:grid">
              <User size={20} strokeWidth={1.6} />
            </Link>
            <Link href="/account/wishlist" aria-label="Wishlist" className="hidden h-10 w-10 place-items-center rounded-full hover:bg-sand sm:grid">
              <Heart size={20} strokeWidth={1.6} />
            </Link>
            <BagButton />
          </div>
        </div>
      </header>
    </>
  );
}
