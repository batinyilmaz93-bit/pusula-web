import React, { useState } from "react";
import { Utensils, Coffee, Landmark, ShoppingBag, AlertTriangle, Shuffle } from "lucide-react";
import { T } from "../lib/theme.js";
import { SectionLabel, Empty, LastUpdated, AirmailStripe } from "./primitives.jsx";

const GENERIC_NOTES = {
  restaurant: "Yöre halkının sevdiği duraklardan biri.",
  cafe: "Kısa bir mola için iyi bir seçim.",
  museum: "Bölgeyi biraz daha yakından tanımak için uğranabilir.",
  shopping: "Yerel ürünler ve hediyelik eşya için göz atılabilir.",
};
const VLOG_INTRO = {
  restaurant: "Karnımızı doyurduğumuz yerler 🍽️",
  cafe: "Mola verip kahve içtiğimiz köşeler ☕️",
  museum: "Kültür molası için uğradığımız duraklar 🖼️",
  shopping: "Hediyelik ve alışveriş için gezdiğimiz yerler 🛍️",
};
const SHOW_COUNT = 15;

const poiEntries = (list, catKey) => (list || []).map(item =>
  typeof item === "string" ? { name: item, note: GENERIC_NOTES[catKey] } : item
);

// Deterministic shuffle so "başkalarını göster" gives a stable-but-different
// order per click, without needing a new network call.
function seededShuffle(arr, seed) {
  const out = [...arr];
  let s = seed + 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function ExploreTab({ trip, poi, poiLoading, poiError, poiOffline, lastUpdated, onRefresh }) {
  const [seeds, setSeeds] = useState({});
  const groups = [
    { key: "restaurant", label: "Restoranlar", icon: Utensils },
    { key: "cafe", label: "Cafeler", icon: Coffee },
    { key: "museum", label: "Müzeler", icon: Landmark },
    { key: "shopping", label: "Alışveriş", icon: ShoppingBag },
  ];
  const shuffleCategory = (key) => setSeeds(s => ({ ...s, [key]: (s[key] || 0) + 1 }));

  return (
    <div>
      <LastUpdated ts={lastUpdated} loading={poiLoading} onRefresh={onRefresh} />

      <div style={{ background: `linear-gradient(160deg, ${T.cardAlt}, ${T.card})`, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 6, position: "relative", overflow: "hidden", boxShadow: T.shadow }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}><AirmailStripe height={4} /></div>
        <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 18, fontWeight: 600, marginTop: 8 }}>{trip.city} günlüğü ✈️</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
          Yerel öneriler kısa notlarla — {trip.city}, {trip.country} çevresinde derlendi. Sıralama popülerliğe göre değil, keşif sırasına göre.
        </div>
      </div>

      {poiOffline && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.amberDim, border: `1px solid rgba(226,104,61,0.35)`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12 }}>
          <AlertTriangle size={13} color={T.amber} style={{ flexShrink: 0 }} />
          Canlı yer servisine şu an ulaşılamadı, {trip.city} için önceden hazırlanmış (daha kısa) bir günlük gösteriliyor.
        </div>
      )}
      {poiError && <Empty text={`Bu şehir için canlı veya örnek veri bulunamadı (${poiError}).`} />}

      {groups.map(g => {
        const pool = poiEntries(poi?.[g.key], g.key);
        const seed = seeds[g.key] || 0;
        const shown = pool.length > SHOW_COUNT ? seededShuffle(pool, seed).slice(0, SHOW_COUNT) : pool;
        return (
          <div key={g.key}>
            <SectionLabel icon={g.icon}>{g.label}</SectionLabel>
            {shown.length === 0 ? (
              <Empty text={poiLoading ? "Yükleniyor..." : "Sonuç bulunamadı."} />
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 13, color: T.muted }}>{VLOG_INTRO[g.key]}</div>
                  {pool.length > SHOW_COUNT && (
                    <button onClick={() => shuffleCategory(g.key)} style={{
                      display: "flex", alignItems: "center", gap: 4, background: "transparent", border: `1px solid ${T.dash}`,
                      borderRadius: 20, padding: "4px 9px", color: T.teal, fontSize: 11, cursor: "pointer", flexShrink: 0,
                    }}><Shuffle size={11} /> Başkalarını göster</button>
                  )}
                </div>
                {shown.map((item, i) => (
                  <div key={item.name + i} style={{ display: "flex", gap: 10, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: T.amberDim,
                      display: "flex", alignItems: "center", justifyContent: "center", color: T.amber,
                    }}><g.icon size={17} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{item.note}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
