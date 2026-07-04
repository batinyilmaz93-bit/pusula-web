import React from "react";
import { ChevronRight } from "lucide-react";
import { T } from "../lib/theme.js";
import { AirmailStripe } from "./primitives.jsx";
import { POI_CATEGORIES, poiEntries } from "../lib/poiCategories.js";

export default function ExploreHub({ trip, poi, poiOffline, setView }) {
  return (
    <div>
      <div style={{ background: `linear-gradient(160deg, ${T.cardAlt}, ${T.card})`, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 16, position: "relative", overflow: "hidden", boxShadow: T.shadow }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}><AirmailStripe height={4} /></div>
        <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 18, fontWeight: 600, marginTop: 8 }}>{trip.city} günlüğü ✈️</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
          {trip.city}, {trip.country} çevresinde 8 kategoride öneriler. Her birinde 15'e kadar yer, beğenmezsen yenisini getir.
        </div>
      </div>

      {POI_CATEGORIES.map(c => {
        const entries = poiEntries(poi?.[c.key], c.key);
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
              <div style={{ fontSize: 11.5, color: T.muted }}>
                {entries.length > 0 ? `${entries.length} öneri${poiOffline ? " (önceden hazırlanmış)" : ""}` : "yükleniyor..."}
              </div>
            </div>
            <ChevronRight size={18} color={T.muted} />
          </button>
        );
      })}
    </div>
  );
}
