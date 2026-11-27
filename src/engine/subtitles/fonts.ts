/**
 * Local Thai font loading (Noto Sans Thai, SIL OFL — licence in
 * public/assets/fonts). Fonts are bundled locally so renders never depend on
 * network access, and Remotion waits for them before capturing frames.
 */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const THAI_FONT_FAMILY = "Noto Sans Thai";
export const THAI_FONT_STACK = `"${THAI_FONT_FAMILY}", "Noto Sans", sans-serif`;

const faces: Array<{ weight: string; subset: "thai" | "latin" }> = [
  { weight: "400", subset: "thai" },
  { weight: "700", subset: "thai" },
  { weight: "800", subset: "thai" },
  { weight: "400", subset: "latin" },
  { weight: "700", subset: "latin" },
  { weight: "800", subset: "latin" },
];

let loaded: Promise<unknown> | null = null;

export function ensureFonts() {
  if (!loaded) {
    loaded = Promise.all(
      faces.map((f) =>
        loadFont({
          family: THAI_FONT_FAMILY,
          url: staticFile(`assets/fonts/noto-sans-thai-${f.subset}-${f.weight}-normal.woff2`),
          weight: f.weight,
          format: "woff2",
          unicodeRange: f.subset === "thai" ? "U+0E01-0E5B, U+200C-200D, U+25CC" : "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
        }),
      ),
    );
  }
  return loaded;
}
