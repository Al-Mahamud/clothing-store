"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Heart, MapPin, Package } from "lucide-react";
import { ApiError, request } from "@/lib/client";
import type { Profile } from "@/lib/types";
import { Field } from "@/components/ui/Field";
import { useCart } from "@/components/cart/CartProvider";
import { useAccount } from "./AccountProvider";

type Mode = "login" | "register";

/** Only paths inside the shop, so a crafted link can't send people elsewhere after sign-in. */
export function safeNext(next: string | undefined, fallback = "/account"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const { setMe } = useAccount();
  const { refresh } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ sentTo: string; until: number } | null>(null);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const register = mode === "register";
  const target = safeNext(next);
  const other = `${register ? "/login" : "/register"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  useEffect(() => {
    if (!sent) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sent]);
  const wait = sent ? Math.max(0, Math.ceil((sent.until - now) / 1000)) : 0;

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const fail = (err: unknown) => {
    if (err instanceof ApiError) {
      setErrors(err.fields);
      setFormError(err.message);
    } else setFormError("Something went wrong. Please try again.");
  };

  const sendCode = async () => {
    const local: Record<string, string> = {};
    if (!form.name.trim()) local.name = "Please enter your name.";
    if (form.password.length < 8) local.password = "Use at least 8 characters.";
    if (Object.keys(local).length) return setErrors(local);
    setBusy(true);
    setFormError(null);
    try {
      const r = await request<{ sentTo: string; resendAfterSeconds: number }>("POST", "/auth/codes", { phone: form.phone, purpose: "REGISTER" });
      setSent({ sentTo: r.sentTo, until: Date.now() + r.resendAfterSeconds * 1000 });
      setNow(Date.now());
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (register && !sent) return sendCode();
    setBusy(true);
    setFormError(null);
    try {
      const body = register ? { ...form, code } : { phone: form.phone, password: form.password };
      const { customer } = await request<{ customer: Profile }>("POST", register ? "/auth/register" : "/auth/login", body);
      setMe(customer);
      await refresh();
      router.replace(target);
      router.refresh();
    } catch (err) {
      setBusy(false);
      fail(err);
    }
  };

  const perks = [
    { icon: <Heart size={17} strokeWidth={1.6} />, title: "A wishlist", text: "Keep the pieces you love for payday" },
    { icon: <Package size={17} strokeWidth={1.6} />, title: "Every order in one place", text: "Track deliveries and order again in your size" },
    { icon: <MapPin size={17} strokeWidth={1.6} />, title: "Addresses remembered", text: "Home, office, or the family home for Eid" },
  ];

  return (
    <div className="container-page max-w-5xl py-8 md:py-16">
      <div className="grid border border-line bg-white/50 md:grid-cols-5">
        <aside className="border-b border-line bg-sand p-7 md:col-span-2 md:border-b-0 md:border-r md:p-10">
          <p className="eyebrow text-clay">{register ? "Join Tanti" : "Welcome back"}</p>
          <h1 className="mt-4 font-display text-4xl font-light leading-[1.05] md:text-5xl">
            {register ? <>Dressed for <em>every day,</em> remembered.</> : <>Good to see <em>you again.</em></>}
          </h1>
          <ul className="mt-10 hidden divide-y divide-line border-y border-line md:block">
            {perks.map((p) => (
              <li key={p.title} className="flex gap-3 py-4">
                <span className="mt-0.5 text-clay">{p.icon}</span>
                <span><span className="block text-sm font-medium">{p.title}</span><span className="block text-xs text-muted">{p.text}</span></span>
              </li>
            ))}
          </ul>
        </aside>

        <form onSubmit={submit} noValidate className="space-y-4 p-7 md:col-span-3 md:p-10">
          <div>
            <h2 className="font-display text-3xl font-light">{register ? "Create your account" : "Sign in"}</h2>
            <p className="mt-1 text-sm text-muted">
              {register ? "Already have one? " : "New to Tanti? "}
              <Link href={other} className="font-medium text-ink underline underline-offset-4 hover:text-clay">{register ? "Sign in" : "Create an account"}</Link>
            </p>
          </div>
          {register && <Field label="Full name" error={errors.name}><input autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>}
          <Field label="Mobile number" error={errors.phone} hint={register ? "We'll text a code to check it. You'll sign in with this number." : undefined}>
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" value={form.phone} readOnly={register && !!sent} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          {register && <Field label="Email (optional)" error={errors.email}><input type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>}
          <div className="relative">
            <Field label="Password" error={errors.password} hint={register ? "At least 8 characters." : undefined}>
              <input type={show ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} value={form.password} onChange={(e) => set("password", e.target.value)} className="pr-12!" />
            </Field>
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-[1.85rem] grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink">
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {register && sent && (
            <div className="animate-fade-up border border-line bg-sand/60 p-4">
              <p className="text-sm">We texted a 6-digit code to <strong>{sent.sentTo}</strong>.</p>
              <Field label="Code" error={errors.code} className="mt-3">
                <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setErrors((x) => ({ ...x, code: "" })); }} className="text-center font-display text-3xl! font-light tracking-[0.5em]" autoFocus />
              </Field>
              <div className="mt-2 flex flex-wrap gap-x-4 text-xs font-medium">
                <button type="button" disabled={wait > 0 || busy} onClick={sendCode} className="text-clay disabled:text-muted">{wait > 0 ? `Send again in ${wait}s` : "Send a new code"}</button>
                <button type="button" onClick={() => { setSent(null); setCode(""); }} className="text-ink-soft">Change number</button>
              </div>
            </div>
          )}
          {formError && <p role="alert" className="border border-sale/30 bg-sale/5 p-3 text-sm text-sale">{formError}</p>}
          <button type="submit" disabled={busy} className="w-full bg-ink py-4 text-sm font-medium text-paper transition hover:bg-clay disabled:opacity-60">
            {busy ? (register ? (sent ? "Creating account…" : "Sending code…") : "Signing in…") : register ? (sent ? "Create account" : "Text me a code") : "Sign in"}
          </button>
          {!register && <p className="text-center text-sm"><Link href="/forgot-password" className="text-ink-soft underline underline-offset-4 hover:text-ink">Forgot your password?</Link></p>}
          <p className="text-center text-xs text-muted">Your bag comes with you when you sign in.</p>
        </form>
      </div>
    </div>
  );
}
