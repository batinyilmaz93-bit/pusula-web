import React, { useCallback, useEffect, useRef, useState } from "react";
import { Wallet, Compass, TrendingUp, Cloud, ShieldAlert, ChevronLeft, Copy, Check } from "lucide-react";
import { T } from "../lib/theme.js";
import { AirmailStripe, Empty } from "./primitives.jsx";
import BudgetTab from "./BudgetTab.jsx";
import ExploreTab from "./ExploreTab.jsx";
import WeatherTab from "./WeatherTab.jsx";
import CurrencyTab from "./CurrencyTab.jsx";
import SecurityTab from "./SecurityTab.jsx";
import {
  getTrip, deleteTripApi, addMemberApi, removeMemberApi, addExpenseApi, deleteExpenseApi,
  settleDebtApi, addHazardApi, deleteHazardApi, proxyGeocode, proxyWeather, proxyFx, proxyPoi, proxyNews,
} from "../lib/api.js";
import { getSocket, joinTripRoom, leaveTripRoom } from "../lib/socket.js";
import { matchOfflineCity, OFFLINE_RATES } from "../lib/offline.js";
import { safeConfirm, nowISO } from "../lib/utils.js";

const WEATHER_REFRESH_MS = 5 * 60 * 1000;
const DATA_REFRESH_MS = 3 * 60 * 1000;

export default function TripDetail({ tripId, onBack }) {
  const [trip, setTrip] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("budget");
  const [copied, setCopied] = useState(false);

  const [weather, setWeather] = useState(null);
  const [weatherOffline, setWeatherOffline] = useState(false);
  const [fx, setFx] = useState(null);
  const [fxOffline, setFxOffline] = useState(false);
  const [poi, setPoi] = useState(null);
  const [poiOffline, setPoiOffline] = useState(false);
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState({ weather: false, fx: false, poi: false, news: false });
  const [errors, setErrors] = useState({});
  const [ts, setTs] = useState({});
  const geoRef = useRef(null);
  const geoPromiseRef = useRef(null);

  // ---- load trip + realtime subscription ----
  useEffect(() => {
    let cancelled = false;
    getTrip(tripId).then(t => { if (!cancelled) setTrip(t); }).catch(e => setLoadError(e.message));
    const socket = getSocket();
    joinTripRoom(tripId);
    const onUpdate = (t) => { if (t.id === tripId) setTrip(t); };
    const onDeleted = ({ id }) => { if (id === tripId) onBack(); };
    socket.on("trip:update", onUpdate);
    socket.on("trip:deleted", onDeleted);
    return () => {
      cancelled = true;
      leaveTripRoom(tripId);
      socket.off("trip:update", onUpdate);
      socket.off("trip:deleted", onDeleted);
    };
  }, [tripId]); // eslint-disable-line

  // ---- geocode (shared by weather + poi), backend proxy first, offline fallback ----
  const resolveGeo = useCallback(async () => {
    if (!trip) return null;
    if (geoRef.current) return geoRef.current;
    if (!geoPromiseRef.current) {
      geoPromiseRef.current = (async () => {
        try {
          const live = await proxyGeocode(trip.city, trip.country);
          return { ...live, offline: false };
        } catch {
          const off = matchOfflineCity(trip.city);
          if (off) return { lat: off.lat, lon: off.lon, timezone: off.timezone, offline: true, offlineData: off };
          return null;
        }
      })();
    }
    geoRef.current = await geoPromiseRef.current;
    return geoRef.current;
  }, [trip?.city, trip?.country]); // eslint-disable-line

  const refreshWeather = useCallback(async () => {
    if (!trip) return;
    setLoading(l => ({ ...l, weather: true }));
    setErrors(er => ({ ...er, weather: undefined }));
    const geo = await resolveGeo();
    if (!geo) { setLoading(l => ({ ...l, weather: false })); return; }
    if (geo.offline) {
      setWeather({ ...geo.offlineData.typicalWeather, localTime: null, timezone: geo.timezone });
      setWeatherOffline(true);
      setTs(t => ({ ...t, weather: nowISO() }));
      setLoading(l => ({ ...l, weather: false }));
      return;
    }
    try {
      const w = await proxyWeather(geo.lat, geo.lon, geo.timezone);
      setWeather(w); setWeatherOffline(false);
      setTs(t => ({ ...t, weather: nowISO() }));
    } catch {
      const off = matchOfflineCity(trip.city);
      if (off) {
        setWeather({ ...off.typicalWeather, localTime: null, timezone: off.timezone });
        setWeatherOffline(true);
        setTs(t => ({ ...t, weather: nowISO() }));
      } else {
        setErrors(er => ({ ...er, weather: "Hava servisine ulaşılamadı" }));
      }
    } finally {
      setLoading(l => ({ ...l, weather: false }));
    }
  }, [trip, resolveGeo]);

  const refreshCurrency = useCallback(async () => {
    if (!trip) return;
    setLoading(l => ({ ...l, fx: true }));
    setErrors(er => ({ ...er, fx: undefined }));
    try {
      const out = await proxyFx(trip.country);
      setFx(out); setFxOffline(false);
      setTs(t => ({ ...t, fx: nowISO() }));
    } catch {
      const geo = geoRef.current;
      const off = matchOfflineCity(trip.city);
      const code = geo?.offlineData?.currencyCode || off?.currencyCode;
      const offRate = code && OFFLINE_RATES[code];
      if (offRate) {
        setFx({ code, rate: offRate.rate, inverse: 1 / offRate.rate, asOf: offRate.asOf });
        setFxOffline(true);
        setTs(t => ({ ...t, fx: nowISO() }));
      } else {
        setErrors(er => ({ ...er, fx: "Kur servisine ulaşılamadı" }));
      }
    } finally {
      setLoading(l => ({ ...l, fx: false }));
    }
  }, [trip]);

  const refreshExplore = useCallback(async () => {
    if (!trip) return;
    setLoading(l => ({ ...l, poi: true, news: true }));
    setErrors(er => ({ ...er, poi: undefined, news: undefined }));
    const geo = await resolveGeo();
    if (geo) {
      if (geo.offline) {
        setPoi(geo.offlineData.poi); setPoiOffline(true);
        setTs(t => ({ ...t, poi: nowISO() }));
        setLoading(l => ({ ...l, poi: false }));
      } else {
        proxyPoi(geo.lat, geo.lon)
          .then(p => { setPoi(p); setPoiOffline(false); setTs(t => ({ ...t, poi: nowISO() })); })
          .catch(() => {
            const off = matchOfflineCity(trip.city);
            if (off) { setPoi(off.poi); setPoiOffline(true); setTs(t => ({ ...t, poi: nowISO() })); }
            else setErrors(er => ({ ...er, poi: "canlı yerler servisine ulaşılamadı" }));
          })
          .finally(() => setLoading(l => ({ ...l, poi: false })));
      }
    } else {
      setLoading(l => ({ ...l, poi: false }));
    }

    proxyNews(trip.country)
      .then(res => { setNews(res.items); setTs(t => ({ ...t, news: nowISO() })); })
      .catch(e => setErrors(er => ({ ...er, news: e.message })))
      .finally(() => setLoading(l => ({ ...l, news: false })));
  }, [trip, resolveGeo]);

  useEffect(() => {
    if (!trip) return;
    geoRef.current = null; geoPromiseRef.current = null;
    refreshWeather(); refreshCurrency(); refreshExplore();
    const ivW = setInterval(refreshWeather, WEATHER_REFRESH_MS);
    const ivD = setInterval(() => { refreshCurrency(); refreshExplore(); }, DATA_REFRESH_MS);
    return () => { clearInterval(ivW); clearInterval(ivD); };
  }, [trip?.city, trip?.country]); // eslint-disable-line

  if (loadError) return <Empty text={`Seyahat yüklenemedi: ${loadError}`} />;
  if (!trip) return <div style={{ padding: 24, color: T.muted }}>Yükleniyor...</div>;

  const actions = {
    addMember: (name) => addMemberApi(trip.id, name).then(setTrip),
    removeMember: (id) => removeMemberApi(trip.id, id).then(setTrip),
    addExpense: (payload) => addExpenseApi(trip.id, payload).then(setTrip),
    deleteExpense: (id) => deleteExpenseApi(trip.id, id).then(setTrip),
    settleDebt: (d) => settleDebtApi(trip.id, d).then(setTrip),
    addHazard: (text) => addHazardApi(trip.id, text).then(setTrip),
    deleteHazard: (id) => deleteHazardApi(trip.id, id).then(setTrip),
  };

  const deleteTrip = async () => {
    if (!safeConfirm(`"${trip.name}" seyahatini silmek istediğine emin misin? Bu işlem geri alınamaz.`)) return;
    await deleteTripApi(trip.id);
    onBack();
  };

  const copyInvite = () => {
    navigator.clipboard?.writeText(trip.inviteCode).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  const tabs = [
    { key: "budget", label: "Bütçe", icon: Wallet },
    { key: "explore", label: "Keşfet", icon: Compass },
    { key: "weather", label: "Hava", icon: Cloud },
    { key: "currency", label: "Kur", icon: TrendingUp },
    { key: "security", label: "Güvenlik", icon: ShieldAlert },
  ];

  return (
    <div>
      <div style={{ position: "sticky", top: 0, background: T.bg, zIndex: 5, padding: "16px 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.border}` }}>
        <button onClick={onBack} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 6, color: T.text, cursor: "pointer", display: "flex" }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontWeight: 600, fontSize: 17 }}>{trip.name}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{trip.city}, {trip.country}</div>
        </div>
        <button onClick={copyInvite} title="Davet kodunu kopyala" style={{
          background: T.tealDim, border: `1px solid rgba(79,168,216,0.4)`, borderRadius: 10, padding: "6px 10px",
          color: T.teal, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontFamily: "'JetBrains Mono',monospace",
        }}>
          {copied ? <Check size={12} /> : <Copy size={12} />} {trip.inviteCode}
        </button>
      </div>

      <div style={{ padding: "14px 16px 100px" }}>
        {tab === "budget" && <BudgetTab trip={trip} fx={fx} actions={actions} />}
        {tab === "explore" && <ExploreTab trip={trip} poi={poi} poiLoading={loading.poi} poiError={errors.poi} poiOffline={poiOffline} lastUpdated={ts.poi} onRefresh={refreshExplore} />}
        {tab === "weather" && <WeatherTab trip={trip} weather={weather} wLoading={loading.weather} weatherOffline={weatherOffline} lastUpdated={ts.weather} onRefresh={refreshWeather} error={errors.weather} />}
        {tab === "currency" && <CurrencyTab trip={trip} fx={fx} fxLoading={loading.fx} fxOffline={fxOffline} lastUpdated={ts.fx} onRefresh={refreshCurrency} error={errors.fx} />}
        {tab === "security" && <SecurityTab trip={trip} actions={actions} news={news} newsLoading={loading.news} newsError={errors.news} lastUpdated={ts.news} onRefresh={refreshExplore} />}
        {tab === "budget" && (
          <button onClick={deleteTrip} style={{ marginTop: 18, background: "none", border: "none", color: T.muted, fontSize: 11.5, textDecoration: "underline", cursor: "pointer" }}>
            Bu seyahati sil
          </button>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: T.surface, borderTop: `1px solid ${T.border}` }}>
        <AirmailStripe height={3} />
        <div style={{ display: "flex", padding: "8px 4px calc(8px + env(safe-area-inset-bottom))" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, padding: "6px 0", cursor: "pointer", color: tab === t.key ? T.amber : T.muted,
            }}>
              <t.icon size={19} />
              <span style={{ fontSize: 10, fontFamily: "'Inter',sans-serif", fontWeight: tab === t.key ? 600 : 400 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
