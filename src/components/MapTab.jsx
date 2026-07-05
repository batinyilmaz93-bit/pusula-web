import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Info, AlertTriangle } from "lucide-react";
import { T } from "../lib/theme.js";
import { Spinner } from "./primitives.jsx";

// Leaflet's default marker icons reference image files via relative URLs
// that don't resolve correctly under Vite's bundling — rebuild the icon
// from the same CDN-hosted images explicitly instead.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function MapTab({ trip, geo }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!geo || !containerRef.current || mapRef.current) return;
    try {
      const map = L.map(containerRef.current, { attributionControl: true }).setView([geo.lat, geo.lon], 13);
      // CartoDB's free basemap tiles — OSM-derived data but explicitly meant
      // for this kind of app-embedded use, unlike hotlinking OSM's own raw
      // tile servers directly (which discourage exactly that and can serve
      // slowly/inconsistently or drop requests under their usage policy).
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 20, subdomains: "abcd",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);
      L.marker([geo.lat, geo.lon], { icon: markerIcon }).addTo(map)
        .bindPopup(`<b>${trip.city}</b><br/>${trip.country}`).openPopup();
      mapRef.current = map;
      map.whenReady(() => setReady(true));
      setTimeout(() => map.invalidateSize(), 250);
    } catch (e) {
      setMapError(e.message || "Harita başlatılamadı.");
    }
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [geo, trip.city, trip.country]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <MapPin size={18} color={T.amber} />
        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 18, fontWeight: 600 }}>{trip.city}, {trip.country}</div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, background: T.tealDim, border: `1px solid rgba(91,155,213,0.3)`, borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 11.5, color: T.text }}>
        <Info size={13} color={T.teal} style={{ flexShrink: 0, marginTop: 1 }} />
        Bu harita canlıdır — çevrimdışı çalışmaz, internet bağlantısı gerektirir (bir şehrin haritasını cihaza tamamen indirmek gigabaytlarca yer ister, bu yüzden çevrimdışı desteklemiyoruz).
      </div>

      {mapError && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.dangerDim, border: `1px solid rgba(194,76,66,0.3)`, borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12 }}>
          <AlertTriangle size={13} color={T.danger} style={{ flexShrink: 0 }} />
          Harita başlatılamadı: {mapError}
        </div>
      )}

      <div style={{ position: "relative", width: "100%", height: 420, borderRadius: 16, overflow: "hidden", boxShadow: T.shadow, border: `1px solid ${T.border}`, background: T.cardAlt }}>
        {!geo && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spinner label="Konum çözülüyor..." />
          </div>
        )}
        {geo && !ready && !mapError && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, background: T.cardAlt }}>
            <Spinner label="Harita yükleniyor..." />
          </div>
        )}
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
