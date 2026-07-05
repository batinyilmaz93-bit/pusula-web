import React from "react";
import { Wallet, Cloud, TrendingUp, Compass, ShieldAlert, Film, Map as MapIcon, Users, Sparkles } from "lucide-react";
import { T } from "../lib/theme.js";
import { Avatar, AirmailStripe } from "./primitives.jsx";
import { POI_CATEGORIES } from "../lib/poiCategories.js";
import { fmtMoney, weatherEmoji } from "../lib/utils.js";

function QuickCard({ icon: Icon, label, value, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 14,
      boxShadow: T.shadowSoft, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: accent + "22", display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
        <Icon size={17} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: T.muted }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>
      </div>
    </button>
  );
}

export default function HomeTab({ trip, fx, weather, setView }) {
  const total = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const currency = trip.currencyCode || "TRY";

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${T.navy}, #1A2E47)`, borderRadius: 20, padding: 20,
        boxShadow: T.shadow, position: "relative", overflow: "hidden", marginBottom: 16,
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}><AirmailStripe height={4} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F2A65A", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginTop: 6 }}>
          <Sparkles size={12} /> Seyahatine hoş geldin
        </div>
        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 26, fontWeight: 600, color: "#FFF9F0", marginTop: 6 }}>{trip.name}</div>
        <div style={{ fontSize: 13, color: "rgba(255,249,240,0.75)", marginTop: 4 }}>{trip.city}, {trip.country}</div>
        <div style={{ display: "flex", marginTop: 14, gap: -6, alignItems: "center" }}>
          {trip.members.slice(0, 6).map((m, i) => (
            <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, border: "2px solid #1A2E47", borderRadius: "50%" }}><Avatar member={m} size={28} /></div>
          ))}
          <span style={{ fontSize: 11.5, color: "rgba(255,249,240,0.7)", marginLeft: 10, display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={12} /> {trip.members.length} kişi
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <QuickCard icon={Wallet} label="Toplam Harcama" value={fmtMoney(total, currency)} onClick={() => setView("budget")} accent={T.amber} />
        <QuickCard icon={Cloud} label="Şu An" value={weather?.temp !== undefined ? `${Math.round(weather.temp)}°C ${weatherEmoji(weather.code)}` : "—"} onClick={() => setView("weather")} accent={T.teal} />
        <QuickCard icon={TrendingUp} label="Kur" value={fx ? `1 ${fx.code} = ${fx.rate.toFixed(2)} TRY` : "—"} onClick={() => setView("currency")} accent={T.navy} />
        <QuickCard icon={ShieldAlert} label="Güvenlik" value={`${trip.hazards?.length || 0} not`} onClick={() => setView("security")} accent={T.danger} />
      </div>

      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Keşfetmeye Başla</div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginBottom: 20 }}>
        {POI_CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setView(`category:${c.key}`)} style={{
            flexShrink: 0, width: 84, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px 8px", cursor: "pointer", boxShadow: T.shadowSoft,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.amberDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.amber }}>
              <c.icon size={17} />
            </div>
            <span style={{ fontSize: 10.5, color: T.text, textAlign: "center", lineHeight: 1.2 }}>{c.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={() => setView("vlog")} style={{
          background: `linear-gradient(135deg, ${T.amber}, #F2A65A)`, border: "none", borderRadius: 16, padding: 16,
          color: "#FFF9F0", cursor: "pointer", textAlign: "left", boxShadow: "0 3px 10px rgba(107,142,78,0.28)",
        }}>
          <Film size={20} />
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 8 }}>Seyahat Vlogu</div>
          <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>Günlük tarzı bir anlatı oku</div>
        </button>
        <button onClick={() => setView("map")} style={{
          background: `linear-gradient(135deg, ${T.teal}, #3ABFB8)`, border: "none", borderRadius: 16, padding: 16,
          color: "#FFF9F0", cursor: "pointer", textAlign: "left", boxShadow: "0 3px 10px rgba(91,155,213,0.28)",
        }}>
          <MapIcon size={20} />
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 8 }}>Harita</div>
          <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>Konumu haritada gör</div>
        </button>
      </div>
    </div>
  );
}
