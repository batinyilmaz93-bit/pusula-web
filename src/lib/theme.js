/* ============================= DESIGN TOKENS =============================
   Two palettes: LIGHT ("Golden hour / Mediterranean warmth" — the original
   default) and DARK (a "vintage airmail" dusk-navy alternative). `T` is a
   single MUTABLE object — every component already does `import { T } from
   "../lib/theme.js"` and reads `T.xxx` fresh at render time, so switching
   themes just needs to mutate T's properties in place (via applyTheme) and
   trigger a re-render; no context/hook rewrite needed in the ~15 files that
   already use T this way.
============================================================================ */
export const LIGHT = {
  bg: "#FBF2E4", surface: "#F6E7D2", card: "#FFFBF3", cardAlt: "#FDF0D9",
  border: "rgba(120,72,32,0.10)", dash: "rgba(196,120,60,0.38)",
  text: "#3A2A1D", muted: "#8A7358",
  amber: "#E2683D", amberDim: "rgba(226,104,61,0.13)",
  teal: "#2E9E98", tealDim: "rgba(46,158,152,0.13)",
  navy: "#26415F", navyDim: "rgba(38,65,95,0.10)",
  danger: "#D64545", dangerDim: "rgba(214,69,69,0.11)",
  success: "#4CA771", successDim: "rgba(76,167,113,0.13)",
  stripeRed: "#C1443B",
  shadow: "0 3px 14px rgba(120,72,32,0.09)", shadowSoft: "0 1px 6px rgba(120,72,32,0.06)",
  headerBar: "linear-gradient(120deg, #E2683D, #C1443B)",
  buttonTextOnAccent: "#FFF9F0",
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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,500;1,600&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

// Getter-based so `{...btnPrimary}` picks up the CURRENT T values at every
// render, not whatever T looked like the moment this module first loaded.
export const btnPrimary = {
  flex: 1, padding: "13px", borderRadius: 14, border: "none",
  get background() { return T.amber; },
  get color() { return T.buttonTextOnAccent; },
  fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "'Inter',sans-serif",
  get boxShadow() { return T.shadow; },
};
export const btnGhost = {
  padding: "13px 16px", borderRadius: 14,
  get border() { return `1px solid ${T.border}`; },
  get background() { return T.card; },
  get color() { return T.muted; },
  fontSize: 14, cursor: "pointer", fontFamily: "'Inter',sans-serif",
};
