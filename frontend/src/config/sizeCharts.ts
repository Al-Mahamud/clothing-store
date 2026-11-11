/** Garment measurements in inches, shown in the size guide. Edit to match your patterns. */
export const sizeCharts = {
  TOPS: {
    title: "Tops, panjabis & kurtis",
    columns: ["Size", "Chest", "Length", "Shoulder"],
    rows: [
      ["XS", "36", "27", "16"],
      ["S", "38", "28", "16.5"],
      ["M", "40", "29", "17"],
      ["L", "42", "30", "18"],
      ["XL", "44", "31", "18.5"],
      ["XXL", "46", "32", "19"],
    ],
    tip: "Measure around the fullest part of your chest, keeping the tape level under your arms.",
  },
  BOTTOMS: {
    title: "Trousers & jeans",
    columns: ["Size", "Waist", "Hip", "Inseam"],
    rows: [
      ["28", "28", "36", "30"],
      ["30", "30", "38", "31"],
      ["32", "32", "40", "32"],
      ["34", "34", "42", "32"],
      ["36", "36", "44", "32"],
    ],
    tip: "Measure around your natural waist, where you normally wear your trousers.",
  },
  KIDS: {
    title: "Kids",
    columns: ["Size", "Height (cm)", "Chest", "Length"],
    rows: [
      ["2-3Y", "92–98", "21", "15"],
      ["4-5Y", "104–110", "23", "17"],
      ["6-7Y", "116–122", "25", "19"],
      ["8-9Y", "128–134", "27", "21"],
      ["10-11Y", "140–146", "29", "23"],
    ],
    tip: "Between sizes? Choose the larger one so there is room to grow.",
  },
} as const;
