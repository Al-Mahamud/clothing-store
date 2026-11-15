/** A labelled control with a hint or an error underneath. Wraps one input, select or textarea. */
export function Field({ label, hint, error, className = "", children }: { label: string; hint?: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      <span className={`block border bg-white/70 transition focus-within:border-ink [&>*]:w-full [&>*]:bg-transparent [&>*]:px-3.5 [&>*]:py-3 [&>*]:text-sm [&>*]:outline-none [&>textarea]:resize-none ${error ? "border-sale" : "border-line"}`}>
        {children}
      </span>
      {error ? <span className="mt-1.5 block text-xs text-sale">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
