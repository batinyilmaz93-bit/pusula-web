import React from "react";
import { RefreshCw } from "lucide-react";
import { T } from "../lib/theme.js";
import { initials, colorForId, fmtTime } from "../lib/utils.js";

export function Avatar({ member, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: colorForId(member?.id || "?"),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "#101010",
      fontSize: size * 0.38, flexShrink: 0,
    }}>{initials(member?.name)}</div>
  );
}

export function SectionLabel({ children, icon: Icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Inter',sans-serif", margin: "18px 0 10px" }}>
      {Icon && <Icon size={13} />} {children}
    </div>
  );
}

export function Dashed() {
  return <div style={{ borderTop: `1.5px dashed ${T.dash}`, margin: "10px 0" }} />;
}

export function AirmailStripe({ height = 5 }) {
  return (
    <div style={{
      height, width: "100%",
      background: `repeating-linear-gradient(-45deg, ${T.stripeRed} 0 10px, ${T.text} 10px 20px, ${T.teal} 20px 30px)`,
      opacity: 0.85,
    }} />
  );
}

export function StampBadge({ children, size = 54 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px dashed ${T.amber}`, display: "flex", alignItems: "center",
      justifyContent: "center", transform: "rotate(-9deg)", color: T.amber,
      background: T.amberDim, flexShrink: 0,
    }}>{children}</div>
  );
}

export function Empty({ text }) {
  return <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "24px 10px", fontFamily: "'Inter',sans-serif" }}>{text}</div>;
}

export function LastUpdated({ ts, loading, onRefresh }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 10.5, color: T.muted, fontFamily: "'JetBrains Mono',monospace" }}>
        {ts ? `güncellendi ${fmtTime(new Date(ts))}` : "yükleniyor..."}
      </span>
      <button onClick={onRefresh} style={{
        background: "none", border: "none", color: T.teal, display: "flex", alignItems: "center",
        gap: 4, fontSize: 10.5, cursor: "pointer", fontFamily: "'Inter',sans-serif",
      }}>
        <RefreshCw size={11} className={loading ? "spin" : ""} /> yenile
      </button>
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        style={{
          width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10,
          padding: "10px 12px", color: T.text, fontSize: 14, fontFamily: "'Inter',sans-serif", boxSizing: "border-box",
        }} />
    </div>
  );
}
