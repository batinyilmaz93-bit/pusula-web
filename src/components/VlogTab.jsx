import React, { useMemo } from "react";
import { Film, Info, Utensils, Coffee, MapPin, Beer } from "lucide-react";
import { T } from "../lib/theme.js";
import { AirmailStripe, Empty } from "./primitives.jsx";
import { weatherEmoji } from "../lib/utils.js";

// Deterministic pick based on a seed, so the same trip reads consistently
// across visits instead of re-shuffling every render.
function pick(arr, seed, n = 1) {
  if (!arr || arr.length === 0) return [];
  const out = [];
  let s = seed + 7;
  const pool = [...arr];
  for (let i = 0; i < Math.min(n, pool.length); i++) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
const nameOf = (item) => (typeof item === "string" ? item : item?.name);
const noteOf = (item, fallback) => (typeof item === "object" && item?.note) ? item.note : fallback;

// Short, varied editorial-comment templates per category — used when we only
// have a bare name (the common case for live Overpass results), so the list
// still reads like a curated guide instead of a flat name list.
const COMMENTS = {
  restaurant: [
    "yöre mutfağını denemek isteyenler için iyi bir başlangıç noktası.",
    "bölgede sık önerilen adreslerden, akşam yemeği için değerlendirilebilir.",
    "yerel lezzetlere yakın durmak isteyenlerin listesine girebilir.",
  ],
  cafe: [
    "kısa bir mola için sakin bir seçenek.",
    "güne başlamak ya da öğleden sonra ara vermek için uygun.",
    "gezinin arasına bir kahve molası eklemek isteyenler için.",
  ],
  bar: [
    "akşam için sakin bir içki molası arayanlara.",
    "günü kapatmadan önce uğranabilecek adreslerden.",
  ],
  attraction: [
    "bölgeyi ziyaret edenlerin genelde listesine aldığı bir durak.",
    "kısa bir gezi molasında görülebilecek noktalardan.",
    "yöreyi tanımak isteyenler için önerilen duraklardan biri.",
  ],
};
function commentFor(catKey, item, seed) {
  const explicit = noteOf(item, null);
  if (explicit) return explicit;
  const pool = COMMENTS[catKey] || COMMENTS.attraction;
  return pool[seed % pool.length];
}

export default function VlogTab({ trip, weather, poi }) {
  const seed = useMemo(() => [...trip.id].reduce((a, c) => a + c.charCodeAt(0), 0), [trip.id]);

  const restaurant = pick(poi?.restaurant, seed, 3);
  const cafe = pick(poi?.cafe, seed + 1, 2);
  const attraction = pick(poi?.attraction?.length ? poi.attraction : poi?.museum, seed + 2, 3);
  const bar = pick(poi?.bar, seed + 3, 2);

  const hasContent = restaurant.length || cafe.length || attraction.length || bar.length;
  const weatherLine = weather?.temp !== undefined
    ? `Şu anda ${trip.city}'de hava ${Math.round(weather.temp)}°C ${weatherEmoji(weather.code)} — ${weather.temp > 25 ? "gezi planlamak için elverişli bir sıcaklık" : weather.temp < 12 ? "üstüne bir şeyler almak faydalı olabilir" : "gezmek için fena bir gün değil"}.`
    : null;

  const Section = ({ icon: Icon, title, items, catKey }) => items.length === 0 ? null : (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        <Icon size={15} color={T.amber} />
        <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: 15, color: T.text }}>{title}</div>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
          <span style={{ color: T.amber, fontWeight: 700, flexShrink: 0 }}>·</span>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: T.text }}>
            <b>{nameOf(item)}</b> — {commentFor(catKey, item, seed + i)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${T.amber}, #F2A65A)`, borderRadius: 18, padding: 18, marginBottom: 14, boxShadow: T.shadow, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}><AirmailStripe height={4} /></div>
        <Film size={22} color="#FFF9F0" style={{ marginTop: 6 }} />
        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 20, fontWeight: 600, color: "#FFF9F0", marginTop: 8 }}>
          {trip.city} İçin Derlenmiş Öneriler
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(255,249,240,0.85)", marginTop: 4 }}>Seyahat Vlogu</div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, background: T.tealDim, border: `1px solid rgba(91,155,213,0.3)`, borderRadius: 10, padding: "8px 12px", marginBottom: 14, fontSize: 11.5, color: T.text }}>
        <Info size={13} color={T.teal} style={{ flexShrink: 0, marginTop: 1 }} />
        Bu sayfa, {trip.city} için Keşfet sekmesinde topladığımız yer/hava verilerinden derlenmiş editoryal bir özet — dış bir seyahat sitesinden alınmış bir yazı değildir (telif nedeniyle başka sitelerin metnini kopyalayamıyoruz), ama önerileri kendi verimizden yorumlayarak sunuyoruz.
      </div>

      {!hasContent && <Empty text="Vlog için henüz yeterli veri yok — Keşfet sekmesinin yüklenmesini bekle." />}

      {hasContent && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, boxShadow: T.shadowSoft }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.65, color: T.muted, marginTop: 0, marginBottom: 18 }}>
            {trip.city}, {trip.country} için derlediğimiz öneriler aşağıda. {weatherLine || ""}
          </p>
          <Section icon={Utensils} title="Nerede Yenir" items={restaurant} catKey="restaurant" />
          <Section icon={Coffee} title="Mola Noktaları" items={cafe} catKey="cafe" />
          <Section icon={MapPin} title="Görülmesi Önerilenler" items={attraction} catKey="attraction" />
          <Section icon={Beer} title="Akşam İçin" items={bar} catKey="bar" />
          <p style={{ color: T.muted, fontSize: 12, marginBottom: 0, marginTop: 4 }}>
            Bu listenin tamamına ve her birinin konumuna Keşfet sekmesinden ulaşabilirsin.
          </p>
        </div>
      )}
    </div>
  );
}
