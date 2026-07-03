import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, X, Newspaper, MapPinned, PhoneCall } from "lucide-react";
import { T, btnPrimary } from "../lib/theme.js";
import { SectionLabel, Empty, LastUpdated } from "./primitives.jsx";

export default function SecurityTab({ trip, actions, news, newsLoading, newsError, lastUpdated, onRefresh }) {
  const [hazard, setHazard] = useState("");
  const [busy, setBusy] = useState(false);

  const addHazard = async () => {
    if (!hazard.trim()) return;
    setBusy(true);
    try { await actions.addHazard(hazard.trim()); setHazard(""); } finally { setBusy(false); }
  };
  const removeHazard = (id) => actions.deleteHazard(id);

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${T.navy}, #1A2E47)`, borderRadius: 16, padding: 16,
        marginBottom: 14, boxShadow: T.shadow, display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MapPinned size={22} color="#FFF9F0" />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontWeight: 600, fontSize: 16, color: "#FFF9F0" }}>Güvenlik Notları</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,249,240,0.75)", marginTop: 2 }}>{trip.city}, {trip.country} için topluluk uyarıları</div>
        </div>
      </div>

      <SectionLabel icon={AlertTriangle}>Dikkat Edilmesi Gereken Bölgeler</SectionLabel>
      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8 }}>
        Bu bölüm topluluk kaynaklıdır — katılımcılar bildikleri riskli sokak/bölgeleri buradan paylaşır.
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, boxShadow: T.shadowSoft, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={hazard} onChange={e => setHazard(e.target.value)} placeholder="Örn. Falan sokak, gece tenha"
            style={{ flex: 1, background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 16 }} />
          <button onClick={addHazard} disabled={busy} style={{ ...btnPrimary, flex: "none", padding: "9px 14px" }}>Ekle</button>
        </div>
      </div>
      {(!trip.hazards || trip.hazards.length === 0) ? <Empty text="Henüz bir not eklenmedi." /> : trip.hazards.map(h => (
        <div key={h.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: T.dangerDim, border: `1px solid rgba(214,69,69,0.3)`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
          <ShieldAlert size={15} color={T.danger} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, flex: 1 }}>{h.text}</span>
          <button onClick={() => removeHazard(h.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={13} /></button>
        </div>
      ))}

      <div style={{ marginTop: 6 }}>
        <SectionLabel icon={Newspaper}>Son Dakika Haberler</SectionLabel>
        <LastUpdated ts={lastUpdated} loading={newsLoading} onRefresh={onRefresh} />
      </div>
      {newsError && <Empty text="Haber servisine şu an ulaşılamıyor. Resmi kaynakları (Dışişleri Bakanlığı seyahat uyarıları vb.) kontrol etmeniz önerilir." />}
      {!newsError && (!news || news.length === 0) && <Empty text={newsLoading ? "Haberler yükleniyor..." : "Haber bulunamadı."} />}
      {news && news.map((n, i) => (
        <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8, textDecoration: "none", color: T.text, boxShadow: T.shadowSoft }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</div>
        </a>
      ))}

      <a href="tel:112" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16,
        background: T.navy, color: "#FFF9F0", borderRadius: 14, padding: "13px", textDecoration: "none",
        fontWeight: 600, fontSize: 14.5, boxShadow: "0 3px 10px rgba(38,65,95,0.3)",
      }}>
        <PhoneCall size={16} /> Acil Durum: 112
      </a>
    </div>
  );
}
