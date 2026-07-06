import React, { useState } from "react";
import { ChevronLeft, Shuffle, ExternalLink, AlertTriangle } from "lucide-react";
import { T } from "../lib/theme.js";
import { SectionLabel, Empty, LastUpdated } from "./primitives.jsx";
import { poiCategory, poiEntries, mapsSearchUrl } from "../lib/poiCategories.js";

const SHOW_COUNT = 15;
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

export default function CategoryPage({ trip, categoryKey, poi, poiLoading, poiOffline, poiError, lastUpdated, onRefresh, onBack }) {
  const [seed, setSeed] = useState(0);
  const cat = poiCategory(categoryKey);
  const pool = poiEntries(poi?.[categoryKey], categoryKey);
  const shown = pool.length > SHOW_COUNT ? seededShuffle(pool, seed).slice(0, SHOW_COUNT) : pool;

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 }}>
        <ChevronLeft size={16} /> Keşfet'e dön
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: T.amberDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.amber }}>
          <cat.icon size={20} />
        </div>
        <div>
          <div style={{ fontFamily: "'Libre Baskerville',sans-serif", fontWeight: 600, fontSize: 19 }}>{cat.label}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{trip.city}, {trip.country}</div>
        </div>
      </div>

      <LastUpdated ts={lastUpdated} loading={poiLoading} onRefresh={onRefresh} />

      {poiOffline && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.amberDim, border: `1px solid rgba(107,142,78,0.35)`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12 }}>
          <AlertTriangle size={13} color={T.amber} style={{ flexShrink: 0 }} />
          Canlı yer servisine şu an ulaşılamadı, önceden hazırlanmış bir liste gösteriliyor.
        </div>
      )}
      {poiError && <Empty text={`Bu kategori için veri bulunamadı (${poiError}).`} />}

      {shown.length === 0 && !poiLoading && !poiError && <Empty text="Bu kategoride sonuç bulunamadı." />}

      {shown.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontFamily: "'Libre Baskerville',sans-serif", fontSize: 13, color: T.muted }}>{cat.intro}</div>
            {pool.length > SHOW_COUNT && (
              <button onClick={() => setSeed(s => s + 1)} style={{
                display: "flex", alignItems: "center", gap: 4, background: "transparent", border: `1px solid ${T.dash}`,
                borderRadius: 20, padding: "4px 9px", color: T.teal, fontSize: 11, cursor: "pointer", flexShrink: 0,
              }}><Shuffle size={11} /> Daha fazlası</button>
            )}
          </div>
          {shown.map((item, i) => (
            <a key={item.name + i} href={mapsSearchUrl(item.name, trip.city, trip.country)} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", gap: 10, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 8,
              textDecoration: "none", color: T.text, boxShadow: T.shadowSoft, alignItems: "center",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: T.amberDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.amber }}>
                <cat.icon size={16} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: "'Libre Baskerville',sans-serif", fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{item.note}</div>
              </div>
              <ExternalLink size={14} color={T.muted} style={{ flexShrink: 0 }} />
            </a>
          ))}
        </>
      )}
    </div>
  );
}
