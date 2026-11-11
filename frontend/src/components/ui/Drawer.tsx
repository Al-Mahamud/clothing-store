"use client";

import { useEffect } from "react";

/** A panel that slides in from the side, with a dimmed backdrop. Escape and backdrop clicks close it. */
export function Drawer({
  open,
  onClose,
  side = "right",
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  label: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "visible" : "pointer-events-none invisible"}`}
      style={{ transition: `visibility 0s linear ${open ? 0 : 300}ms` }}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-ink/35 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-label={label}
        className={`absolute inset-y-0 ${side === "left" ? "left-0" : "right-0"} flex w-[min(26rem,92vw)] flex-col bg-paper shadow-2xl transition-transform duration-300 ease-out-soft ${
          open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"
        }`}
      >
        {open && children}
      </div>
    </div>
  );
}
