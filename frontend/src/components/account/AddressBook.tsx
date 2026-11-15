"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { ApiError, request } from "@/lib/client";
import type { SavedAddress } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { useCart } from "@/components/cart/CartProvider";
import { useAccount } from "./AccountProvider";
import { AddressForm, addressValues, emptyAddress } from "./AddressForm";

export function AddressBook() {
  const { me } = useAccount();
  const { notify } = useCart();
  const [list, setList] = useState<SavedAddress[] | null>(null);
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);

  const load = useCallback(() => request<SavedAddress[]>("GET", "/account/addresses").then(setList).catch(() => setList([])), []);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (method: string, path: string, done: string) => {
    try {
      await request(method, path);
      await load();
      notify(done);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    }
  };

  if (!list) return <div className="h-64 animate-pulse bg-white/50" aria-busy="true" />;

  return (
    <section aria-labelledby="addresses-title">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="addresses-title" className="font-display text-3xl font-light">Saved addresses</h2>
          <p className="text-sm text-muted">Pick one at checkout instead of typing it again.</p>
        </div>
        {list.length > 0 && list.length < 10 && (
          <button type="button" onClick={() => setEditing("new")} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-clay"><Plus size={16} /> Add address</button>
        )}
      </div>
      {list.length === 0 ? (
        <button type="button" onClick={() => setEditing("new")} className="grid w-full place-items-center border border-dashed border-ink/25 bg-white/50 px-6 py-14 text-center transition hover:border-ink">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-line text-clay"><MapPin size={24} strokeWidth={1.5} /></span>
          <span className="mt-3 font-display text-2xl font-light">Add your first address</span>
          <span className="mt-1 text-sm text-muted">Home, office, or family anywhere in Bangladesh.</span>
        </button>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className={`flex flex-col border bg-white/60 p-5 ${a.isDefault ? "border-ink" : "border-line"}`}>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-light">{a.label}</span>
                {a.isDefault && <span className="rounded-full bg-ink px-2.5 py-0.5 text-[0.6875rem] font-medium text-paper">Default</span>}
                <span className="ml-auto rounded-full bg-sand px-2.5 py-0.5 text-[0.6875rem] font-medium">{a.zone === "DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}</span>
              </div>
              <p className="mt-2 text-sm font-medium">{a.name} · {a.phone}</p>
              <p className="text-sm text-ink-soft">{a.address}, {a.area}, {a.city}</p>
              {a.note && <p className="mt-1 text-xs italic text-muted">“{a.note}”</p>}
              <div className="mt-auto flex flex-wrap gap-1.5 border-t border-line pt-4 [li>&]:mt-4">
                <button type="button" onClick={() => setEditing(a)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-medium hover:border-ink"><Pencil size={13} /> Edit</button>
                {!a.isDefault && (
                  <button type="button" onClick={() => act("POST", `/account/addresses/${a.id}/default`, `${a.label} is now your default address.`)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-medium hover:border-ink"><Star size={13} /> Make default</button>
                )}
                <button
                  type="button"
                  onClick={() => window.confirm(`Remove “${a.label}”?`) && act("DELETE", `/account/addresses/${a.id}`, "Address removed.")}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-sale hover:bg-sale/5"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New address" : "Edit address"}>
        {editing !== null && (
          <AddressForm
            key={editing === "new" ? "new" : editing.id}
            id={editing === "new" ? undefined : editing.id}
            initial={editing === "new" ? emptyAddress(me?.name ?? "", me?.phone ?? "") : addressValues(editing)}
            onCancel={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              await load();
              notify("Address saved.");
            }}
          />
        )}
      </Modal>
    </section>
  );
}
