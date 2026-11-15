"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { ApiError, request } from "@/lib/client";
import { site } from "@/config/site";
import { Field } from "@/components/ui/Field";
import { safeNext } from "@/components/account/AuthForm";

function LoginForm() {
  const next = safeNext(useSearchParams().get("next") ?? undefined, "/admin");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      noValidate
      className="w-full max-w-sm space-y-4 bg-paper p-7 shadow-2xl"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await request("POST", "/staff/login", { phone, password });
          // A full load, so the admin frame starts fresh with the new sign-in.
          window.location.assign(next.startsWith("/admin") ? next : "/admin");
        } catch (err) {
          setBusy(false);
          setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
        }
      }}
    >
      <div>
        <p className="eyebrow text-clay">Tanti staff only</p>
        <h1 className="mt-2 font-display text-4xl font-light leading-none">{site.name} admin</h1>
      </div>
      <Field label="Mobile number"><input type="tel" autoComplete="username" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" /></Field>
      <Field label="Password"><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      {error && <p role="alert" className="border-l-2 border-sale bg-sale/5 p-3 text-sm text-sale">{error}</p>}
      <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 bg-ink py-3.5 font-medium text-paper transition hover:bg-clay disabled:opacity-60"><Lock size={16} /> {busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ink p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
