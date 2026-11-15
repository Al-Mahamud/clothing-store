import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The heading font as TrueType (what the image renderer reads); null falls back to the default font. */
async function headingFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Fraunces:wght@300")).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** The picture shown when someone shares a Tanti link (product pages use the product's own picture). */
export default async function OpenGraphImage() {
  const font = await headingFont();
  const threads = Array.from({ length: 30 }, (_, i) => i);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f6f3ee", color: "#171614", padding: "64px 72px 0", fontFamily: font ? "Fraunces" : undefined }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 44, letterSpacing: 18 }}>TANTI</div>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#9c4a2f", fontFamily: "sans-serif" }}>MADE IN BANGLADESH</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1.02, maxWidth: 1000 }}>
            <span>Clothes woven for</span>
            <span style={{ color: "#9c4a2f", fontStyle: "italic" }}>everyday Bangladesh.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: "#6f6a63", fontFamily: "sans-serif" }}>
            Panjabis, kurtis, three-pieces & everyday basics · Cash on delivery nationwide
          </div>
        </div>
        <div style={{ display: "flex", height: 28, marginTop: 40, marginLeft: -72, marginRight: -72 }}>
          {threads.map((i) => <div key={i} style={{ flex: 1, background: i % 3 === 0 ? "#9c4a2f" : i % 3 === 1 ? "#171614" : "#ece6dc" }} />)}
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Fraunces", data: font, weight: 300, style: "normal" }] : undefined },
  );
}
