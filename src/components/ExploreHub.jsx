import React from "react";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { T } from "../lib/theme.js";
import { AirmailStripe } from "./primitives.jsx";
import { POI_CATEGORIES, poiEntries } from "../lib/poiCategories.js";

export default function ExploreHub({ trip, poi, poiOffline, poiLoading, poiError, setView }) {
  return (
    <div>
      <div style={{ background: `linear-gradient(160deg, ${T.cardAlt}, ${T.card})`, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 16, position: "relative", overflow: "hidden", boxShadow: T.shadow }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}><AirmailStripe height={4} /></div>
        <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 18, fontWeight: 600, marginTop: 8 }}>{trip.city} günlüğü ✈️</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
          {trip.city}, {trip.country} çevresinde 8 kategoride öneriler. Her birinde 15'e kadar yer, beğenmezsen yenisini getir.
        </div>
      </div>

      {poiError && !poi && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.dangerDim, border: `1px solid rgba(214,69,69,0.3)`, borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12 }}>
          <AlertTriangle size={13} color={T.danger} style={{ flexShrink: 0 }} />
          Yer verisi alınamadı ({poiError}). Yukarı çekip yenilemeyi dene, ya da bir kategoriye girip "yenile" butonuna bas.
        </div>
      )}

      {POI_CATEGORIES.map(c => {
        const entries = poiEntries(poi?.[c.key], c.key);
        let statusText;
        if (entries.length > 0) statusText = `${entries.length} öneri${poiOffline ? " (önceden hazırlanmış)" : ""}`;
        else if (poiLoading && !poi) statusText = "yükleniyor...";
        else if (poiError && !poi) statusText = "veri alınamadı";
        else statusText = "sonuç bulunamadı";
        return (
          <button key={c.key} onClick={() => setView(`category:${c.key}`)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer",
            boxShadow: T.shadowSoft, textAlign: "left",
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: T.amberDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.amber, flexShrink: 0 }}>
              <c.icon size={19} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5, color: T.text }}>{c.label}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{statusText}</div>
            </div>
            <ChevronRight size={18} color={T.muted} />
          </button>
        );
      })}
    </div>
  );
}
