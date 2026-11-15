"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { ApiError, request, upload as send } from "@/lib/client";
import type { AdminImage, AdminProduct, CategoryAdmin, CollectionAdmin, ColorFamily, ProductStatus, SizeChart } from "@/lib/admin-types";
import { bySize } from "@/lib/sizes";
import { Card, Loading, btn, input } from "./ui";
import { useAdmin } from "./AdminShell";

const STATUSES: { value: ProductStatus; label: string; note: string }[] = [
  { value: "DRAFT", label: "Draft", note: "Hidden from the shop" },
  { value: "ACTIVE", label: "On sale", note: "In the shop now" },
  { value: "ARCHIVED", label: "Archived", note: "Kept for old orders" },
];

const CHARTS: { value: SizeChart; label: string }[] = [
  { value: "TOPS", label: "Tops & panjabis" },
  { value: "BOTTOMS", label: "Trousers (waist)" },
  { value: "KIDS", label: "Kids (age)" },
  { value: "NONE", label: "No size guide" },
];

const PRESETS: { label: string; sizes: string[] }[] = [
  { label: "S–XXL", sizes: ["S", "M", "L", "XL", "XXL"] },
  { label: "XS–XL", sizes: ["XS", "S", "M", "L", "XL"] },
  { label: "Waist 28–36", sizes: ["28", "30", "32", "34", "36"] },
  { label: "Kids 2–11 years", sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y"] },
  { label: "Free size", sizes: ["FREE"] },
];

type ColorForm = { key: string; id: number | null; name: string; hex: string; family: string };
type Cell = { id: number | null; on: boolean; sku: string; stock: string };
type Form = {
  name: string; slug: string; categoryId: string; description: string; details: string;
  fabric: string; care: string; fit: string; sizeChart: SizeChart; price: string; compareAtPrice: string;
  featured: boolean; status: ProductStatus; collectionIds: number[];
  colors: ColorForm[]; sizes: string[]; cells: Record<string, Cell>;
};

let counter = 0;
const newKey = () => `new-${++counter}`;
const cellKey = (color: string, size: string) => `${color}:${size}`;
const blankCell = (): Cell => ({ id: null, on: false, sku: "", stock: "0" });

function toForm(p: AdminProduct | null): Form {
  const colors: ColorForm[] = p ? p.colors.map((c) => ({ key: `id-${c.id}`, id: c.id, name: c.name, hex: c.hex, family: c.family })) : [];
  const sizes = [...new Set((p?.variants ?? []).map((v) => v.size))].sort(bySize);
  const cells: Record<string, Cell> = {};
  for (const v of p?.variants ?? []) cells[cellKey(`id-${v.colorId}`, v.size)] = { id: v.id, on: true, sku: v.sku, stock: String(v.stock) };
  return {
    name: p?.name ?? "", slug: p?.slug ?? "", categoryId: p ? String(p.categoryId) : "", description: p?.description ?? "", details: p?.details ?? "",
    fabric: p?.fabric ?? "", care: p?.care ?? "", fit: p?.fit ?? "", sizeChart: p?.sizeChart ?? "TOPS",
    price: p ? String(p.price) : "", compareAtPrice: p?.compareAtPrice ? String(p.compareAtPrice) : "",
    featured: p?.featured ?? false, status: p?.status ?? "DRAFT", collectionIds: p?.collectionIds ?? [], colors, sizes, cells,
  };
}

/** Builds the request and remembers which cell each size came from, so errors land on the right box. */
function toBody(form: Form) {
  const order: string[] = [];
  const variants = form.colors.flatMap((c, index) =>
    form.sizes.flatMap((size) => {
      const cell = form.cells[cellKey(c.key, size)];
      if (!cell?.on) return [];
      order.push(cellKey(c.key, size));
      return [{ id: cell.id, color: index, size, sku: cell.sku, stock: cell.stock.trim() === "" ? 0 : Number(cell.stock) }];
    }),
  );
  const n = (v: string) => (v.trim() === "" ? null : Number(v));
  const body = {
    name: form.name, slug: form.slug, categoryId: form.categoryId ? Number(form.categoryId) : null, description: form.description, details: form.details,
    fabric: form.fabric, care: form.care, fit: form.fit, sizeChart: form.sizeChart, price: n(form.price), compareAtPrice: n(form.compareAtPrice),
    featured: form.featured, status: form.status, collectionIds: form.collectionIds,
    colors: form.colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex, family: c.family })), variants,
  };
  return { body, order };
}

function slugify(text: string) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** A short SKU from the product's name, the colour and the size, e.g. OXFORD-BUTTON-NAV-M. */
function suggestSku(name: string, color: ColorForm, size: string) {
  const base = slugify(name).split("-").filter(Boolean).slice(0, 2).join("-").toUpperCase() || "ITEM";
  const code = slugify(color.name).replace(/-/g, "").slice(0, 3).toUpperCase() || "CLR";
  return `${base}-${code}-${size.toUpperCase()}`;
}

/* eslint-disable @next/next/no-img-element */
export function ProductEditor({ id }: { id: number | null }) {
  const router = useRouter();
  const { notify } = useAdmin();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<Form | null>(id === null ? toForm(null) : null);
  const [categories, setCategories] = useState<CategoryAdmin[]>([]);
  const [collections, setCollections] = useState<CollectionAdmin[]>([]);
  const [families, setFamilies] = useState<ColorFamily[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [showSkus, setShowSkus] = useState(false);

  useEffect(() => {
    request<CategoryAdmin[]>("GET", "/admin/categories").then(setCategories).catch(() => undefined);
    request<CollectionAdmin[]>("GET", "/admin/collections").then(setCollections).catch(() => undefined);
    request<ColorFamily[]>("GET", "/admin/color-families").then(setFamilies).catch(() => undefined);
    if (id !== null) {
      request<AdminProduct>("GET", `/admin/products/${id}`).then((p) => { setProduct(p); setForm(toForm(p)); }).catch(() => notify("Couldn't load the product."));
    }
  }, [id, notify]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!form) return <Loading />;

  const set = (changes: Partial<Form>) => {
    setForm({ ...form, ...changes });
    setDirty(true);
  };
  const clear = (...keys: string[]) => setErrors((e) => { const n = { ...e }; keys.forEach((k) => delete n[k]); return n; });
  const setCell = (key: string, changes: Partial<Cell>) => {
    set({ cells: { ...form.cells, [key]: { ...(form.cells[key] ?? blankCell()), ...changes } } });
    clear(...Object.keys(changes).map((k) => `${key}:${k}`), `${key}:size`, "variants");
  };
  const toggleCell = (color: ColorForm, size: string, on: boolean) => {
    const key = cellKey(color.key, size);
    const c = form.cells[key] ?? blankCell();
    setCell(key, { on, sku: c.sku || suggestSku(form.name, color, size) });
  };
  const familyHex = (family: string) => families.find((f) => f.value === family)?.hex;
  /** Picking a family also sets the swatch, unless the swatch was already chosen by hand. */
  const chooseFamily = (index: number, family: string) => {
    const c = form.colors[index];
    if (!c) return;
    const untouched = c.hex.toUpperCase() === (familyHex(c.family) ?? "").toUpperCase() || c.hex.toUpperCase() === "#1E1E20";
    setColor(index, untouched && familyHex(family) ? { family, hex: familyHex(family)!.toUpperCase() } : { family });
  };
  const setColor = (index: number, changes: Partial<ColorForm>) => {
    set({ colors: form.colors.map((c, i) => (i === index ? { ...c, ...changes } : c)) });
    clear(...Object.keys(changes).map((k) => `colors.${index}.${k}`));
  };
  const addColor = () => {
    const color: ColorForm = { key: newKey(), id: null, name: "", hex: (familyHex("BLACK") ?? "#1E1E20").toUpperCase(), family: "BLACK" };
    // A new colour comes in every size already listed.
    const cells = { ...form.cells };
    for (const s of form.sizes) cells[cellKey(color.key, s)] = { ...blankCell(), on: true };
    set({ colors: [...form.colors, color], cells });
    clear("colors");
  };
  const removeColor = (index: number) => {
    const color = form.colors[index];
    if (!color) return;
    const used = form.sizes.some((s) => form.cells[cellKey(color.key, s)]?.id);
    if (used && !window.confirm(`Remove ${color.name || "this colour"} and its sizes? Its pictures stay with the product.`)) return;
    set({ colors: form.colors.filter((_, i) => i !== index) });
    setErrors({});
  };
  const moveColor = (index: number, direction: number) => {
    const to = index + direction;
    if (to < 0 || to >= form.colors.length) return;
    const colors = [...form.colors];
    const [moved] = colors.splice(index, 1);
    if (moved) colors.splice(to, 0, moved);
    set({ colors });
    setErrors({});
  };
  const addSizes = (sizes: string[]) => {
    const wanted = sizes.map((s) => s.trim().toUpperCase()).filter((s) => s && s.length <= 10 && !form.sizes.includes(s));
    if (wanted.length === 0) return;
    const cells = { ...form.cells };
    for (const c of form.colors) for (const s of wanted) cells[cellKey(c.key, s)] = { ...blankCell(), on: true, sku: suggestSku(form.name, c, s) };
    set({ sizes: [...form.sizes, ...wanted].sort(bySize), cells });
    clear("variants");
  };
  const removeSize = (size: string) => {
    const used = form.colors.some((c) => form.cells[cellKey(c.key, size)]?.id);
    if (used && !window.confirm(`Stop offering size ${size} in every colour?`)) return;
    set({ sizes: form.sizes.filter((s) => s !== size) });
    setErrors({});
  };

  const save = async () => {
    // Fill in any missing SKUs before saving.
    const filled = { ...form, cells: { ...form.cells } };
    for (const c of form.colors) for (const s of form.sizes) {
      const key = cellKey(c.key, s);
      const cell = form.cells[key];
      if (cell?.on && !cell.sku.trim()) filled.cells[key] = { ...cell, sku: suggestSku(form.name, c, s) };
    }
    const { body, order } = toBody(filled);
    setBusy(true);
    try {
      const saved = id === null ? await request<AdminProduct>("POST", "/admin/products", body) : await request<AdminProduct>("PUT", `/admin/products/${id}`, body);
      setDirty(false);
      setErrors({});
      notify(`${saved.name} saved`);
      if (id === null) router.replace(`/admin/products/${saved.id}`);
      else { setProduct(saved); setForm(toForm(saved)); }
    } catch (e) {
      setForm(filled);
      if (e instanceof ApiError) {
        // "variants.3.sku" → "<colour>:<size>:sku"
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(e.fields)) {
          const m = k.match(/^variants\.(\d+)\.(\w+)$/);
          mapped[m ? `${order[Number(m[1])]}:${m[2]}` : k] = v;
        }
        setErrors(mapped);
        if (Object.keys(mapped).some((k) => k.endsWith(":sku"))) setShowSkus(true);
        notify(Object.keys(mapped).length ? "Please check the highlighted fields." : e.message);
      } else notify("Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const err = (key: string) => errors[key] && <span className="mt-1 block text-xs text-sale">{errors[key]}</span>;
  const label = (text: string) => <span className="mb-1 block text-xs font-medium text-ink-soft">{text}</span>;
  const text = (title: string, key: keyof Form, props: React.InputHTMLAttributes<HTMLInputElement> & { hint?: string } = {}) => {
    const { hint, ...rest } = props;
    return (
      <label className="block">
        {label(title)}
        <input value={form[key] as string} onChange={(e) => { set({ [key]: e.target.value } as Partial<Form>); clear(key); }} className={`${input} ${errors[key] ? "border-sale" : ""}`} {...rest} />
        {errors[key] ? err(key) : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      </label>
    );
  };

  const flat = categories.flatMap((c) => [{ id: c.id, label: c.name }, ...c.children.map((k) => ({ id: k.id, label: `${c.name} › ${k.name}` }))]);
  const offered = form.colors.reduce((n, c) => n + form.sizes.filter((s) => form.cells[cellKey(c.key, s)]?.on).length, 0);
  const totalStock = form.colors.reduce((n, c) => n + form.sizes.reduce((m, s) => { const cell = form.cells[cellKey(c.key, s)]; return m + (cell?.on ? Number(cell.stock) || 0 : 0); }, 0), 0);
  const cellError = (key: string) => ["stock", "sku", "size", "color"].map((f) => errors[`${key}:${f}`]).find(Boolean);

  return (
    <div className="pb-24">
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={15} /> Products</Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-light leading-none">{id === null ? "New product" : product?.name}</h1>
          {product && <p className="mt-1.5 text-sm text-muted">{product.soldCount} sold · {product.category}</p>}
        </div>
        {product?.status === "ACTIVE" && <a href={`/p/${product.slug}`} target="_blank" rel="noreferrer" className={btn.ghost}><ExternalLink size={15} /> View in shop</a>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <Card title="The product">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">{text("Name", "name", { placeholder: "e.g. Oxford Button-Down Shirt" })}</div>
              <label className="block">
                {label("Category")}
                <select value={form.categoryId} onChange={(e) => { set({ categoryId: e.target.value }); clear("categoryId"); }} className={`${input} ${errors.categoryId ? "border-sale" : ""}`}>
                  <option value="">Choose…</option>
                  {flat.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                {err("categoryId")}
              </label>
              {text("Web address", "slug", { placeholder: slugify(form.name) || "oxford-button-down-shirt", hint: `/p/${form.slug || slugify(form.name) || "…"}` })}
              {text("Fabric", "fabric", { placeholder: "e.g. 100% cotton oxford" })}
              {text("Fit", "fit", { placeholder: "e.g. Regular fit" })}
              <div className="sm:col-span-2">{text("Care", "care", { placeholder: "e.g. Machine wash cold, iron on medium" })}</div>
              <label className="block sm:col-span-2">
                {label("Description")}
                <textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} className={input} placeholder="What it is, how it feels, when to wear it." />
              </label>
              <label className="block sm:col-span-2">
                {label("Good to know")}
                <textarea rows={3} value={form.details} onChange={(e) => set({ details: e.target.value })} className={input} placeholder={"One point per line\nMother-of-pearl buttons"} />
                <span className="mt-1 block text-xs text-muted">One point per line; shown as a list on the product page.</span>
              </label>
            </div>
          </Card>

          <Card title="Price">
            <div className="grid gap-3 sm:grid-cols-3">
              {text("Price ৳", "price", { inputMode: "numeric", placeholder: "1990" })}
              {text("Old price ৳ (optional)", "compareAtPrice", { inputMode: "numeric", placeholder: "—", hint: "Shows the price as a sale" })}
              <label className="block">
                {label("Size guide")}
                <select value={form.sizeChart} onChange={(e) => set({ sizeChart: e.target.value as SizeChart })} className={input}>
                  {CHARTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
            </div>
          </Card>

          <Card title="Colours" action={<span className="text-xs text-muted">Each colour has its own pictures and stock</span>}>
            {err("colors")}
            {form.colors.length === 0 && <p className="mb-3 text-sm text-muted">Add the colours this comes in. The first one is shown first in the shop.</p>}
            <ul className="space-y-2">
              {form.colors.map((c, i) => (
                <li key={c.key} className="flex flex-wrap items-start gap-2 border border-line bg-paper p-2.5">
                  <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/10" style={{ background: c.hex }} title="Swatch colour">
                    <span className="sr-only">Swatch colour of {c.name || "this colour"}</span>
                    <input type="color" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value.toUpperCase() })} className="absolute inset-0 cursor-pointer opacity-0" />
                  </label>
                  <label className="min-w-40 flex-1">
                    <span className="sr-only">Colour name</span>
                    <input value={c.name} placeholder="e.g. Navy" onChange={(e) => setColor(i, { name: e.target.value })} className={`${input} ${errors[`colors.${i}.name`] ? "border-sale" : ""}`} />
                    {err(`colors.${i}.name`)}
                  </label>
                  <label>
                    <span className="sr-only">Colour family</span>
                    <select value={c.family} onChange={(e) => chooseFamily(i, e.target.value)} className={`${input} w-auto! ${errors[`colors.${i}.family`] ? "border-sale" : ""}`} title="Shoppers filter by this">
                      {families.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    {err(`colors.${i}.family`)}
                  </label>
                  <span className="flex gap-1">
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => moveColor(i, -1)} className={btn.icon}><ArrowUp size={15} /></button>
                    <button type="button" aria-label="Move down" disabled={i === form.colors.length - 1} onClick={() => moveColor(i, 1)} className={btn.icon}><ArrowDown size={15} /></button>
                    <button type="button" aria-label={`Remove ${c.name || "colour"}`} onClick={() => removeColor(i)} className={btn.icon}><Trash2 size={15} /></button>
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={addColor} className={`${btn.ghost} mt-3`}><Plus size={15} /> Add a colour</button>
            <p className="mt-2 text-xs text-muted">The family (e.g. Blue for &ldquo;Navy&rdquo;) is what shoppers pick in the colour filter.</p>
          </Card>

          <Card title="Sizes and stock" action={<span className="text-xs text-muted">{offered} offered · {totalStock} in stock</span>}>
            {err("variants")}
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-ink-soft">Add sizes</span>
              {PRESETS.map((p) => <button key={p.label} type="button" onClick={() => addSizes(p.sizes)} className="rounded-full px-3 py-1.5 text-xs ring-1 ring-line transition hover:ring-ink">{p.label}</button>)}
              <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); addSizes([newSize]); setNewSize(""); }}>
                <label><span className="sr-only">Another size</span><input value={newSize} onChange={(e) => setNewSize(e.target.value.toUpperCase())} maxLength={10} placeholder="Other, e.g. 3XL" className={`${input} w-32! py-1.5 text-xs`} /></label>
                <button type="submit" aria-label="Add this size" className={btn.icon}><Plus size={15} /></button>
              </form>
            </div>
            {form.colors.length === 0 || form.sizes.length === 0 ? (
              <p className="border border-dashed border-line bg-paper/60 px-4 py-8 text-center text-sm text-muted">Add at least one colour and one size to fill in the stock.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-1 text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-muted">Colour</th>
                      {form.sizes.map((s) => (
                        <th key={s} className="min-w-16 text-xs font-medium">
                          <span className="inline-flex items-center gap-0.5">{s}<button type="button" aria-label={`Remove size ${s}`} onClick={() => removeSize(s)} className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"><X size={11} /></button></span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.colors.map((c) => (
                      <tr key={c.key}>
                        <td className="whitespace-nowrap pr-2 text-ink-soft"><span className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />{c.name || "New colour"}</span></td>
                        {form.sizes.map((s) => {
                          const key = cellKey(c.key, s);
                          const cell = form.cells[key] ?? blankCell();
                          const problem = cellError(key);
                          return (
                            <td key={s} className="text-center align-top">
                              {cell.on ? (
                                <span className="relative block">
                                  <input
                                    aria-label={`Stock of ${c.name || "new colour"}, size ${s}`}
                                    inputMode="numeric"
                                    value={cell.stock}
                                    onChange={(ev) => setCell(key, { stock: ev.target.value.replace(/[^0-9]/g, "") })}
                                    title={problem ?? `SKU ${cell.sku || suggestSku(form.name, c, s)}`}
                                    className={`${input} px-1 pr-5 text-center tabular-nums ${problem ? "border-sale" : Number(cell.stock) === 0 ? "bg-sale/5" : ""}`}
                                  />
                                  <button type="button" aria-label={`Don't offer ${c.name || "this colour"} in ${s}`} onClick={() => toggleCell(c, s, false)} className="absolute right-0.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"><X size={11} /></button>
                                </span>
                              ) : (
                                <button type="button" aria-label={`Offer ${c.name || "this colour"} in ${s}`} onClick={() => toggleCell(c, s, true)} className="block w-full border border-dashed border-line py-2 text-xs text-muted hover:border-ink hover:text-ink">+</button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {Object.entries(errors).filter(([k]) => /:(stock|size|color)$/.test(k)).map(([k, v]) => <p key={k} className="mt-1 text-xs text-sale">{k.split(":")[1]}: {v}</p>)}
            {offered > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <button type="button" onClick={() => setShowSkus((v) => !v)} aria-expanded={showSkus} className="text-xs font-medium text-ink-soft underline underline-offset-4 hover:text-ink">{showSkus ? "Hide SKUs" : "Edit SKUs"}</button>
                {showSkus && (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {form.colors.flatMap((c) => form.sizes.filter((s) => form.cells[cellKey(c.key, s)]?.on).map((s) => {
                      const key = cellKey(c.key, s);
                      const cell = form.cells[key]!;
                      return (
                        <li key={key}>
                          <label className="flex items-center gap-2">
                            <span className="w-28 shrink-0 truncate text-xs text-muted">{c.name || "New colour"} · {s}</span>
                            <input value={cell.sku} onChange={(ev) => setCell(key, { sku: ev.target.value.toUpperCase() })} className={`${input} py-1.5 font-mono text-xs uppercase ${errors[`${key}:sku`] ? "border-sale" : ""}`} />
                          </label>
                          {err(`${key}:sku`)}
                        </li>
                      );
                    }))}
                  </ul>
                )}
              </div>
            )}
          </Card>

          {product ? <Pictures product={product} onChange={(p) => { setProduct(p); }} /> : (
            <Card title="Pictures"><p className="text-sm text-muted">Save the product first, then add pictures.</p></Card>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <Card title="Status">
            <div className="space-y-1.5">
              {STATUSES.map((s) => (
                <label key={s.value} className={`flex cursor-pointer items-center gap-3 border p-2.5 transition ${form.status === s.value ? "border-ink bg-sand/40" : "border-line hover:border-ink/40"}`}>
                  <input type="radio" name="status" checked={form.status === s.value} onChange={() => { set({ status: s.value }); clear("status"); }} className="h-4 w-4 accent-ink" />
                  <span><span className="block text-sm font-medium">{s.label}</span><span className="text-xs text-muted">{s.note}</span></span>
                </label>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-ink" /> Feature on the home page</label>
          </Card>
          <Card title="Collections">
            {collections.length === 0 ? <p className="text-sm text-muted">No collections yet.</p> : (
              <div className="flex flex-wrap gap-1.5">
                {collections.map((c) => {
                  const on = form.collectionIds.includes(c.id);
                  return (
                    <button key={c.id} type="button" aria-pressed={on} onClick={() => set({ collectionIds: on ? form.collectionIds.filter((x) => x !== c.id) : [...form.collectionIds, c.id] })} className={`rounded-full px-3 py-1.5 text-xs transition ${on ? "bg-ink text-paper" : "bg-white text-ink-soft ring-1 ring-line hover:ring-ink"}`}>
                      {c.name}{!c.active && " (hidden)"}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-[15.5rem]">
        <div className="flex items-center justify-end gap-3 px-4 py-3 md:px-8">
          <span className="mr-auto text-sm text-muted">{dirty ? "Unsaved changes" : id === null ? "New product" : "All changes saved"}</span>
          {dirty && id !== null && product && <button type="button" onClick={() => { setForm(toForm(product)); setDirty(false); setErrors({}); }} className={btn.ghost}>Discard</button>}
          <button type="button" disabled={busy} onClick={save} className={btn.primary}>{busy ? "Saving…" : id === null ? "Create product" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

/** Pictures save at once (they don't wait for the save button). The first one is on cards. */
function Pictures({ product, onChange }: { product: AdminProduct; onChange: (p: AdminProduct) => void }) {
  const { notify } = useAdmin();
  const file = useRef<HTMLInputElement>(null);
  const [colorId, setColorId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const colorName = useMemo(() => new Map(product.colors.map((c) => [c.id, c.name])), [product.colors]);

  const run = async (work: () => Promise<AdminProduct>, done: string) => {
    setBusy(true);
    try {
      onChange(await work());
      notify(done);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const query = new URLSearchParams({ alt: product.name });
    if (colorId) {
      query.set("colorId", colorId);
      query.set("alt", `${product.name} in ${colorName.get(Number(colorId)) ?? ""}`.trim());
    }
    for (const f of Array.from(files)) {
      await run(() => send<AdminProduct>(`/admin/products/${product.id}/images?${query}`, f), "Picture added");
    }
    if (file.current) file.current.value = "";
  };

  const patch = (img: AdminImage, changes: Partial<AdminImage>) =>
    run(() => request<AdminProduct>("PATCH", `/admin/products/${product.id}/images/${img.id}`, { colorId: img.colorId, alt: img.alt, ...changes }), "Picture updated");

  return (
    <Card title="Pictures" action={<span className="text-xs text-muted">Saved as you go</span>}>
      {product.images.length === 0 && <p className="mb-3 text-sm text-muted">No pictures yet. Upright photos (3:4) on a plain background look best in the shop.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {product.images.map((img, i) => (
          <li key={img.id} className="overflow-hidden border border-line bg-paper">
            <div className="relative aspect-[3/4] bg-sand">
              <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
              {i === 0 && <span className="eyebrow absolute left-2 top-2 bg-ink px-2 py-0.5 text-[0.6rem] text-paper">On cards</span>}
            </div>
            <div className="space-y-1.5 p-2">
              <select aria-label="Shown with" value={img.colorId ?? ""} disabled={busy} onChange={(e) => patch(img, { colorId: e.target.value ? Number(e.target.value) : null })} className={`${input} py-1.5 text-xs`}>
                <option value="">Every colour</option>
                {product.colors.map((c) => <option key={c.id} value={c.id}>{c.name} only</option>)}
              </select>
              <div className="flex justify-between gap-1">
                <button type="button" aria-label="Earlier" disabled={busy || i === 0} onClick={() => run(() => request<AdminProduct>("POST", `/admin/products/${product.id}/images/${img.id}/move`, { direction: -1 }), "Moved")} className={btn.icon}><ArrowUp size={14} className="-rotate-90" /></button>
                <button type="button" aria-label="Later" disabled={busy || i === product.images.length - 1} onClick={() => run(() => request<AdminProduct>("POST", `/admin/products/${product.id}/images/${img.id}/move`, { direction: 1 }), "Moved")} className={btn.icon}><ArrowDown size={14} className="-rotate-90" /></button>
                <button type="button" aria-label="Remove picture" disabled={busy} onClick={() => window.confirm("Remove this picture?") && run(() => request<AdminProduct>("DELETE", `/admin/products/${product.id}/images/${img.id}`), "Picture removed")} className={btn.icon}><X size={14} /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select aria-label="New pictures show with" value={colorId} onChange={(e) => setColorId(e.target.value)} className={`${input} w-auto!`}>
          <option value="">For every colour</option>
          {product.colors.map((c) => <option key={c.id} value={c.id}>For {c.name} only</option>)}
        </select>
        <button type="button" disabled={busy} onClick={() => file.current?.click()} className={btn.accent}><ImagePlus size={16} /> {busy ? "Uploading…" : "Add pictures"}</button>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
        <span className="text-xs text-muted">JPEG, PNG or WebP, up to 5 MB.</span>
      </div>
    </Card>
  );
}
