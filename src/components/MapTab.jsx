import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Info, AlertTriangle } from "lucide-react";
import { T } from "../lib/theme.js";
import { Spinner } from "./primitives.jsx";
import { getMessagesApi } from "../lib/api.js";
import { getSocket } from "../lib/socket.js";

// Leaflet's default marker icons reference image files via relative URLs
// that don't resolve correctly under Vite's bundling — rebuild the icon
// from the same CDN-hosted images explicitly instead.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
// A visually distinct marker for people's shared locations (vs. the city pin).
const personIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50%;background:${T.teal};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15],
});

export default function MapTab({ trip, geo }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const personLayerRef = useRef(null);
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
      personLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      map.whenReady(() => setReady(true));
      setTimeout(() => map.invalidateSize(), 250);
    } catch (e) {
      setMapError(e.message || "Harita başlatılamadı.");
    }
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [geo, trip.city, trip.country]);

  // Plot everyone's shared locations (from chat) as pins, keeping exactly
  // ONE marker per person — a live/repeated share moves that same marker
  // instead of stacking a new pin on top of their last one.
  useEffect(() => {
    const markersBySender = new Map();
    const addPin = (msg) => {
      if (msg.kind !== "location" || !personLayerRef.current) return;
      const existing = markersBySender.get(msg.senderMemberId);
      const label = `<b>${msg.senderName}</b><br/>${msg.live ? "canlı konum" : "konum paylaştı"}`;
      if (existing) {
        existing.setLatLng([msg.lat, msg.lon]).setPopupContent(label);
      } else {
        const marker = L.marker([msg.lat, msg.lon], { icon: personIcon }).addTo(personLayerRef.current).bindPopup(label);
        markersBySender.set(msg.senderMemberId, marker);
      }
    };
    getMessagesApi(trip.id).then(r => {
      (r.messages || []).filter(m => m.kind === "location").forEach(addPin);
    }).catch(() => {});
    const socket = getSocket();
    const onMessage = (msg) => { if (msg.tripId === trip.id) addPin(msg); };
    socket.on("trip:message", onMessage);
    return () => socket.off("trip:message", onMessage);
  }, [trip.id, ready]); // eslint-disable-line

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
