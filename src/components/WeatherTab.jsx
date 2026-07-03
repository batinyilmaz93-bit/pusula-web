import React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { T } from "../lib/theme.js";
import { Dashed, Empty, LastUpdated, AirmailStripe } from "./primitives.jsx";
import { weatherEmoji } from "../lib/utils.js";

export default function WeatherTab({ trip, weather, wLoading, weatherOffline, lastUpdated, onRefresh, error }) {
  return (
    <div>
      <LastUpdated ts={lastUpdated} loading={wLoading} onRefresh={onRefresh} />
      {weatherOffline && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.amberDim, border: `1px solid rgba(226,104,61,0.35)`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12 }}>
          <AlertTriangle size={13} color={T.amber} style={{ flexShrink: 0 }} />
          Canlı hava servisine ulaşılamadı — {trip.city} için mevsim ortalamasına dayalı yaklaşık bir değer (anlık değil).
        </div>
      )}
      {error && <Empty text={error} />}

      <div style={{ background: `linear-gradient(160deg, ${T.cardAlt}, ${T.card})`, border: `1px solid ${T.border}`, borderRadius: 18, padding: 20, textAlign: "center", position: "relative", overflow: "hidden", boxShadow: T.shadow }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}><AirmailStripe height={4} /></div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 8, marginBottom: 4 }}>{trip.city}, {trip.country}</div>
        <div style={{ fontSize: 48 }}>{weather ? weatherEmoji(weather.code) : "…"}</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 34, fontWeight: 700 }}>
          {weather?.temp !== undefined ? `${Math.round(weather.temp)}°C` : "—"}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, fontSize: 12, color: T.muted }}>
          <span>💧 {weather?.humidity ?? "-"}%</span>
          <span>💨 {weather?.wind ?? "-"} km/s</span>
        </div>
        {!weatherOffline && (
          <>
            <Dashed />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 600 }}>
              <Clock size={16} color={T.teal} />
              {weather?.localTime ? weather.localTime.split("T")[1] : "--:--"}
            </div>
            <div style={{ fontSize: 10.5, color: T.muted, marginTop: 2 }}>yerel saat · {weather?.timezone}</div>
          </>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginTop: 10, textAlign: "center" }}>Hava durumu 5 dakikada bir otomatik güncellenir.</div>
    </div>
  );
}
