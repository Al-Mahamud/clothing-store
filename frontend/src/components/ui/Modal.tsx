"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** A centred dialog built on <dialog>, so focus trapping and Escape work natively. */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(40rem,calc(100vw-2rem))] bg-paper p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 className="font-display text-2xl font-light">{title}</h2>
        <button type="button" aria-label="Close" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand">
          <X size={20} />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
    </dialog>
  );
}
