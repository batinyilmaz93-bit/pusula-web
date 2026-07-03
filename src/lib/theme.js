/* ============================= DESIGN TOKENS =============================
   Concept: "Golden hour / Mediterranean warmth". A soft sun-warmed sand
   background instead of the previous dusk-navy, terracotta as the primary
   accent (like sun-baked clay rooftops), a turquoise secondary accent (the
   sea against the coastline), warm ink text instead of near-black, and soft
   card shadows instead of hard borders — the goal is a screen that feels
   inviting to linger in, like a seaside café table, not a control panel.
============================================================================ */
export const T = {
  bg: "#FBF2E4",
  surface: "#F6E7D2",
  card: "#FFFBF3",
  cardAlt: "#FDF0D9",
  border: "rgba(120,72,32,0.10)",
  dash: "rgba(196,120,60,0.38)",
  text: "#3A2A1D",
  muted: "#8A7358",
  amber: "#E2683D",
  amberDim: "rgba(226,104,61,0.13)",
  teal: "#2E9E98",
  tealDim: "rgba(46,158,152,0.13)",
  danger: "#D64545",
  dangerDim: "rgba(214,69,69,0.11)",
  success: "#4CA771",
  successDim: "rgba(76,167,113,0.13)",
  stripeRed: "#C1443B",
  shadow: "0 3px 14px rgba(120,72,32,0.09)",
  shadowSoft: "0 1px 6px rgba(120,72,32,0.06)",
};

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,500;1,600&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

export const btnPrimary = {
  flex: 1, padding: "13px", borderRadius: 14, border: "none", background: T.amber, color: "#FFF9F0",
  fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "'Inter',sans-serif",
  boxShadow: "0 3px 10px rgba(226,104,61,0.28)",
};
export const btnGhost = {
  padding: "13px 16px", borderRadius: 14, border: `1px solid ${T.border}`, background: T.card,
  color: T.muted, fontSize: 14, cursor: "pointer", fontFamily: "'Inter',sans-serif",
};
