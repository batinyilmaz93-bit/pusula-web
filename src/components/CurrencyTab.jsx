import React, { useState } from "react";
import { TrendingUp, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { T } from "../lib/theme.js";
import { SectionLabel, Dashed, Empty, LastUpdated, AirmailStripe } from "./primitives.jsx";
import { fmtMoney } from "../lib/utils.js";

export default function CurrencyTab({ trip, fx, fxLoading, fxOffline, lastUpdated, onRefresh, error }) {
  const [amount, setAmount] = useState("100");
  const amt = parseFloat(amount) || 0;
  return (
    <div>
      <LastUpdated ts={lastUpdated} loading={fxLoading} onRefresh={onRefresh} />
      {fxOffline && fx?.asOf && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.amberDim, border: `1px solid rgba(226,104,61,0.35)`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12 }}>
          <AlertTriangle size={13} color={T.amber} style={{ flexShrink: 0 }} />
          Canlı kur servisine ulaşılamadı — {fx.asOf} tarihli yaklaşık kur gösteriliyor.
        </div>
      )}
      {error && <Empty text={error} />}

      <SectionLabel icon={TrendingUp}>Döviz Kuru {fx ? `(${fx.code} / TRY)` : ""}</SectionLabel>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, position: "relative", overflow: "hidden", boxShadow: T.shadow }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}><AirmailStripe height={4} /></div>
        {fx ? (
          <div style={{ marginTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>1 {fx.code}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: T.amber, fontSize: 17 }}>{fx.rate.toFixed(4)} TRY</span>
            </div>
            <Dashed />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>1 TRY</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: T.teal, fontSize: 17 }}>{fx.inverse.toFixed(4)} {fx.code}</span>
            </div>
          </div>
        ) : <Empty text={fxLoading ? "Kur alınıyor..." : "Kur verisi yok."} />}
      </div>

      {fx && fx.code !== "TRY" && (
        <>
          <SectionLabel icon={ArrowRightLeft}>Hızlı Çevirici</SectionLabel>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>Tutar ({fx.code})</div>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" style={{
              width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10,
              padding: "10px 12px", color: T.text, fontSize: 16, fontFamily: "'JetBrains Mono',monospace", boxSizing: "border-box", marginBottom: 12,
            }} />
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontSize: 11, color: T.muted }}>karşılığı</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 24, fontWeight: 700, color: T.amber }}>{fmtMoney(amt * fx.rate, "TRY")}</div>
            </div>
          </div>
        </>
      )}
      <div style={{ fontSize: 11, color: T.muted, marginTop: 10, textAlign: "center" }}>Kur 3 dakikada bir otomatik güncellenir.</div>
    </div>
  );
}
