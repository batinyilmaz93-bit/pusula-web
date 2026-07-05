/* ============================= DESIGN TOKENS =============================
   LIGHT is now "Sustainable Eco-Travel" (nature-light: sage green primary,
   sky blue secondary, warm wood-brown tertiary, soft off-white base) — one
   of 5 concepts the user picked from a reference mockup. DARK stays the
   "vintage airmail" dusk-navy alternative from before. `T` is a single
   MUTABLE object — every component already does `import { T } from
   "../lib/theme.js"` and reads `T.xxx` fresh at render time, so switching
   palettes just needs to mutate T's properties in place (via applyTheme)
   and trigger a re-render; no context/hook rewrite needed in the ~15 files
   that already use T this way.
============================================================================ */
export const LIGHT = {
  bg: "#F7F1DF", surface: "#EFE9D2", card: "#FFFCF3", cardAlt: "#F3EDD9",
  border: "rgba(107,90,45,0.12)", dash: "rgba(150,138,70,0.35)",
  text: "#33301F", muted: "#7D7455",
  amber: "#8C8F42", amberDim: "rgba(140,143,66,0.15)",
  teal: "#5B9BD5", tealDim: "rgba(91,155,213,0.14)",
  navy: "#8B6F47", navyDim: "rgba(139,111,71,0.13)",
  danger: "#C24C42", dangerDim: "rgba(194,76,66,0.12)",
  success: "#7A9142", successDim: "rgba(122,145,66,0.14)",
  stripeRed: "#8C8F42",
  shadow: "0 3px 14px rgba(107,90,45,0.11)", shadowSoft: "0 1px 6px rgba(107,90,45,0.07)",
  headerBar: "linear-gradient(120deg, #D4A83E, #8C8F42)",
  buttonTextOnAccent: "#FFFCF3",
};

export const DARK = {
  bg: "#141F2E", surface: "#1B2A3D", card: "#213244", cardAlt: "#28394E",
  border: "rgba(244,235,216,0.10)", dash: "rgba(244,235,216,0.24)",
  text: "#F4EBD8", muted: "#9AAAC0",
  amber: "#E2883D", amberDim: "rgba(226,136,61,0.18)",
  teal: "#4FA8D8", tealDim: "rgba(79,168,216,0.18)",
  navy: "#5E86B5", navyDim: "rgba(94,134,181,0.18)",
  danger: "#E2574C", dangerDim: "rgba(226,87,76,0.18)",
  success: "#5EC28A", successDim: "rgba(94,194,138,0.18)",
  stripeRed: "#C1443B",
  shadow: "0 4px 16px rgba(0,0,0,0.35)", shadowSoft: "0 2px 8px rgba(0,0,0,0.25)",
  headerBar: "linear-gradient(120deg, #E2883D, #C1443B)",
  buttonTextOnAccent: "#101820",
};

// The single mutable object every component imports as `T`.
export const T = { ...LIGHT };

const listeners = new Set();
export function onThemeChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function applyTheme(mode) {
  Object.assign(T, mode === "dark" ? DARK : LIGHT);
  listeners.forEach(fn => fn());
}

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

// Getter-based so `{...btnPrimary}` picks up the CURRENT T values at every
// render, not whatever T looked like the moment this module first loaded.
export const btnPrimary = {
  flex: 1, padding: "13px", borderRadius: 14, border: "none",
  get background() { return T.amber; },
  get color() { return T.buttonTextOnAccent; },
  fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "'Nunito',sans-serif",
  get boxShadow() { return T.shadow; },
};
export const btnGhost = {
  padding: "13px 16px", borderRadius: 14,
  get border() { return `1px solid ${T.border}`; },
  get background() { return T.card; },
  get color() { return T.muted; },
  fontSize: 14, cursor: "pointer", fontFamily: "'Nunito',sans-serif",
};
