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
  bg: "#EDE0C3", surface: "#E3D3A9", card: "#FBF6E9", cardAlt: "#F1E4C5",
  border: "rgba(107,74,46,0.14)", dash: "rgba(139,90,43,0.38)",
  text: "#3A2A18", muted: "#8A7355",
  amber: "#8B5A2B", amberDim: "rgba(139,90,43,0.15)",
  teal: "#4A6670", tealDim: "rgba(74,102,112,0.15)",
  navy: "#5C3D24", navyDim: "rgba(92,61,36,0.13)",
  danger: "#A8433A", dangerDim: "rgba(168,67,58,0.13)",
  success: "#6B7A4A", successDim: "rgba(107,122,74,0.15)",
  stripeRed: "#8B5A2B",
  shadow: "0 3px 14px rgba(92,61,36,0.14)", shadowSoft: "0 1px 6px rgba(92,61,36,0.09)",
  headerBar: "linear-gradient(120deg, #8B5A2B, #B8863C)",
  buttonTextOnAccent: "#FBF6E9",
};

export const DARK = {
  bg: "#1E160F", surface: "#2A2016", card: "#332619", cardAlt: "#3D2E1E",
  border: "rgba(237,224,195,0.12)", dash: "rgba(237,224,195,0.28)",
  text: "#EDE0C3", muted: "#B8A57E",
  amber: "#C9954B", amberDim: "rgba(201,149,75,0.20)",
  teal: "#7A9BA0", tealDim: "rgba(122,155,160,0.20)",
  navy: "#8B6B3D", navyDim: "rgba(139,107,61,0.20)",
  danger: "#C96856", dangerDim: "rgba(201,104,86,0.20)",
  success: "#8FA05F", successDim: "rgba(143,160,95,0.20)",
  stripeRed: "#C9954B",
  shadow: "0 4px 16px rgba(0,0,0,0.4)", shadowSoft: "0 2px 8px rgba(0,0,0,0.3)",
  headerBar: "linear-gradient(120deg, #C9954B, #8B5A2B)",
  buttonTextOnAccent: "#1E160F",
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
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

// Getter-based so `{...btnPrimary}` picks up the CURRENT T values at every
// render, not whatever T looked like the moment this module first loaded.
export const btnPrimary = {
  flex: 1, padding: "13px", borderRadius: 14, border: "none",
  get background() { return T.amber; },
  get color() { return T.buttonTextOnAccent; },
  fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "'Libre Baskerville',sans-serif",
  get boxShadow() { return T.shadow; },
};
export const btnGhost = {
  padding: "13px 16px", borderRadius: 14,
  get border() { return `1px solid ${T.border}`; },
  get background() { return T.card; },
  get color() { return T.muted; },
  fontSize: 14, cursor: "pointer", fontFamily: "'Libre Baskerville',sans-serif",
};
