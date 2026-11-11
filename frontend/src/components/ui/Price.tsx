import { percentOff, taka } from "@/lib/money";

export function Price({
  price,
  compareAt,
  size = "sm",
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "lg";
}) {
  const off = percentOff(price, compareAt);
  const main = size === "lg" ? "text-xl" : "text-sm";
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${main} font-medium tabular-nums ${off ? "text-sale" : "text-ink"}`}>{taka(price)}</span>
      {off && compareAt ? (
        <>
          <span className={`${size === "lg" ? "text-base" : "text-xs"} text-muted line-through tabular-nums`}>
            {taka(compareAt)}
          </span>
          {size === "lg" && <span className="text-xs font-semibold text-sale">Save {off}%</span>}
        </>
      ) : null}
    </div>
  );
}
