"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { sizeCharts } from "@/config/sizeCharts";

export function SizeGuide({ chart, fit }: { chart: keyof typeof sizeCharts; fit: string | null }) {
  const [open, setOpen] = useState(false);
  const data = sizeCharts[chart];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs underline underline-offset-4">
        <Ruler size={14} /> Size guide
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Size guide">
        <p className="eyebrow text-muted">{data.title}</p>
        {fit && <p className="mt-2 text-sm">This style is a <strong className="font-medium">{fit.toLowerCase()}</strong>.</p>}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm tabular-nums">
            <thead>
              <tr className="border-b border-ink">
                {data.columns.map((c) => (
                  <th key={c} scope="col" className="py-3 pr-4 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row[0]} className="border-b border-line">
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="py-3 pr-4 font-medium">{cell}</th>
                    ) : (
                      <td key={i} className="py-3 pr-4 text-ink-soft">{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted">Measurements in inches unless marked. {data.tip}</p>
      </Modal>
    </>
  );
}
