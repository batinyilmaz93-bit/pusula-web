export const T = {
  bg: "#141F2E",
  surface: "#1B2A3D",
  card: "#213244",
  cardAlt: "#28394E",
  border: "rgba(244,235,216,0.10)",
  dash: "rgba(244,235,216,0.26)",
  text: "#F4EBD8",
  muted: "#9AAAC0",
  amber: "#E2883D",
  amberDim: "rgba(226,136,61,0.16)",
  teal: "#4FA8D8",
  tealDim: "rgba(79,168,216,0.16)",
  danger: "#E2574C",
  dangerDim: "rgba(226,87,76,0.15)",
  success: "#5EC28A",
  stripeRed: "#C1443B",
};

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,500;1,600&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

export const btnPrimary = {
  flex: 1, padding: "11px", borderRadius: 10, border: "none", background: T.amber, color: "#101010",
  fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Inter',sans-serif",
};
export const btnGhost = {
  padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent",
  color: T.muted, fontSize: 14, cursor: "pointer", fontFamily: "'Inter',sans-serif",
};
