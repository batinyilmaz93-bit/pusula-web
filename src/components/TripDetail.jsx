import React, { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Copy, Check, Share2, LogOut, Home, Wallet, Compass, ShieldAlert } from "lucide-react";
import { T } from "../lib/theme.js";
import { AirmailStripe, Empty, Spinner } from "./primitives.jsx";
import Sidebar from "./Sidebar.jsx";
import HomeTab from "./HomeTab.jsx";
import BudgetTab from "./BudgetTab.jsx";
import ExploreHub from "./ExploreHub.jsx";
import CategoryPage from "./CategoryPage.jsx";
import WeatherTab from "./WeatherTab.jsx";
import CurrencyTab from "./CurrencyTab.jsx";
import SecurityTab from "./SecurityTab.jsx";
import VlogTab from "./VlogTab.jsx";
import MapTab from "./MapTab.jsx";
import Profile from "./Profile.jsx";
import {
  getTrip, deleteTripApi, addMemberApi, removeMemberApi, addExpenseApi, deleteExpenseApi,
  settleDebtApi, addHazardApi, deleteHazardApi, leaveTripApi, updateTripCurrencyApi,
  proxyGeocode, proxyWeather, proxyFx, proxyPoi, proxyNews, getAuth,
} from "../lib/api.js";
import { getSocket, joinTripRoom, leaveTripRoom } from "../lib/socket.js";
import { matchOfflineCity, OFFLINE_RATES } from "../lib/offline.js";
import { safeConfirm, nowISO } from "../lib/utils.js";

const WEATHER_REFRESH_MS = 5 * 60 * 1000;
const DATA_REFRESH_MS = 3 * 60 * 1000;

export default function TripDetail({ tripId, onBack, onLogout }) {
  const [trip, setTrip] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [weather, setWeather] = useState(null);
  const [weatherOffline, setWeatherOffline] = useState(false);
  const [fx, setFx] = useState(null);
  const [fxOffline, setFxOffline] = useState(false);
  const [poi, setPoi] = useState(null);
  const [poiOffline, setPoiOffline] = useState(false);
  const [news, setNews] = useState(null);
  const [geoInfo, setGeoInfo] = useState(null);
  const [loading, setLoading] = useState({ weather: false, fx: false, poi: false, news: false });
  const [errors, setErrors] = useState({});
  const [ts, setTs] = useState({});
  const geoRef = useRef(null);
  const geoPromiseRef = useRef(null);

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

  const resolveGeo = useCallback(async () => {
    if (!trip) return null;
    if (geoRef.current) return geoRef.current;
    if (!geoPromiseRef.current) {
      geoPromiseRef.current = (async () => {
        const off = matchOfflineCity(trip.city);
        try {
          const live = await proxyGeocode(trip.city, trip.country);
          return { lat: live.lat, lon: live.lon, timezone: live.timezone, offlineData: off };
        } catch {
          if (off) return { lat: off.lat, lon: off.lon, timezone: off.timezone, offlineData: off };
          return null;
        }
      })();
    }
    geoRef.current = await geoPromiseRef.current;
    setGeoInfo(geoRef.current);
    return geoRef.current;
  }, [trip?.city, trip?.country]); // eslint-disable-line

  const refreshWeather = useCallback(async () => {
    if (!trip) return;
    setLoading(l => ({ ...l, weather: true }));
    setErrors(er => ({ ...er, weather: undefined }));
    const geo = await resolveGeo();
    if (!geo) { setLoading(l => ({ ...l, weather: false })); return; }
    try {
      const w = await proxyWeather(geo.lat, geo.lon, geo.timezone);
      setWeather(w); setWeatherOffline(false);
      setTs(t => ({ ...t, weather: nowISO() }));
    } catch {
      if (geo.offlineData) {
        setWeather({ ...geo.offlineData.typicalWeather, localTime: null, timezone: geo.timezone });
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
    const persistCode = (code) => {
      if (code && code !== trip.currencyCode) {
        updateTripCurrencyApi(trip.id, code).then(setTrip).catch(() => {});
      }
    };
    try {
      const out = await proxyFx(trip.country);
      setFx(out); setFxOffline(false);
      setTs(t => ({ ...t, fx: nowISO() }));
      persistCode(out.code);
    } catch {
      const geo = geoRef.current;
      const off = matchOfflineCity(trip.city);
      const code = geo?.offlineData?.currencyCode || off?.currencyCode;
      const offRate = code && OFFLINE_RATES[code];
      if (offRate) {
        setFx({ code, rate: offRate.rate, inverse: 1 / offRate.rate, asOf: offRate.asOf });
        setFxOffline(true);
        setTs(t => ({ ...t, fx: nowISO() }));
        persistCode(code);
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
      proxyPoi(geo.lat, geo.lon)
        .then(p => { setPoi(p); setPoiOffline(false); setTs(t => ({ ...t, poi: nowISO() })); })
        .catch(() => {
          if (geo.offlineData) { setPoi(geo.offlineData.poi); setPoiOffline(true); setTs(t => ({ ...t, poi: nowISO() })); }
          else setErrors(er => ({ ...er, poi: "canlı yerler servisine ulaşılamadı" }));
        })
        .finally(() => setLoading(l => ({ ...l, poi: false })));
    } else {
      setErrors(er => ({ ...er, poi: "Şehir bulunamadı" }));
      setLoading(l => ({ ...l, poi: false }));
    }

    proxyNews(trip.country)
      .then(res => { setNews(res.items); setTs(t => ({ ...t, news: nowISO() })); })
      .catch(e => setErrors(er => ({ ...er, news: e.message })))
      .finally(() => setLoading(l => ({ ...l, news: false })));
  }, [trip, resolveGeo]);

  useEffect(() => {
    if (!trip) return;
    geoRef.current = null; geoPromiseRef.current = null; setGeoInfo(null);
    refreshWeather(); refreshCurrency(); refreshExplore();
    const ivW = setInterval(refreshWeather, WEATHER_REFRESH_MS);
    const ivD = setInterval(() => { refreshCurrency(); refreshExplore(); }, DATA_REFRESH_MS);
    return () => { clearInterval(ivW); clearInterval(ivD); };
  }, [trip?.city, trip?.country]); // eslint-disable-line

  if (loadError) return <Empty text={`Seyahat yüklenemedi: ${loadError}`} />;
  if (!trip) return <Spinner label="Seyahat yükleniyor..." />;

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

  const myUserId = getAuth()?.user?.id;
  const myMember = trip.members.find(m => m.userId === myUserId);
  const isAdmin = myMember?.id === trip.admin;

  const leaveTrip = async () => {
    if (!myMember) return;
    if (!safeConfirm(`"${trip.name}" seyahatinden ayrılmak istediğine emin misin?`)) return;
    try {
      await leaveTripApi(trip.id, myMember.id);
      onBack();
    } catch (e) {
      alert(e.message);
    }
  };

  const copyInvite = () => {
    navigator.clipboard?.writeText(trip.inviteCode).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  const shareInvite = async () => {
    const url = `${window.location.origin}/?join=${trip.inviteCode}`;
    const shareData = { title: `Pusula — ${trip.name}`, text: `${trip.name} seyahatine katıl!`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
    }
  };

  const bottomTabs = [
    { key: "home", label: "Ana Sayfa", icon: Home },
    { key: "budget", label: "Bütçe", icon: Wallet },
    { key: "explore", label: "Keşfet", icon: Compass },
    { key: "security", label: "Güvenlik", icon: ShieldAlert },
  ];
  const isCategory = view.startsWith("category:");
  const categoryKey = isCategory ? view.split(":")[1] : null;
  const activeBottomKey = isCategory ? "explore" : view;

  return (
    <div>
      <Sidebar
        open={sidebarOpen} onClose={() => setSidebarOpen(false)}
        view={isCategory ? "explore" : view} setView={setView}
        tripName={trip.name} onBackToList={onBack} onLogout={onLogout}
      />

      <div style={{
        position: "sticky", top: 0, background: T.headerBar, zIndex: 5,
        padding: "calc(16px + env(safe-area-inset-top)) 16px 14px", display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 4px 16px rgba(193,68,59,0.22)",
      }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 10, padding: 9, color: "#FFF9F0", cursor: "pointer", display: "flex", flexShrink: 0 }}>
          <Menu size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontWeight: 600, fontSize: 18, color: "#FFF9F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trip.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,249,240,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trip.city}, {trip.country}</div>
        </div>
        <button onClick={shareInvite} title="Davet linkini paylaş" style={{
          background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 10, padding: "9px 11px",
          color: "#FFF9F0", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0,
        }}>
          <Share2 size={14} />
        </button>
        <button onClick={copyInvite} title="Davet kodunu kopyala" style={{
          background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 10, padding: "9px 12px",
          color: "#FFF9F0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0,
        }}>
          {copied ? <Check size={12} /> : <Copy size={12} />} <span className="invite-code-text">{trip.inviteCode}</span>
        </button>
      </div>

      <div style={{ padding: "14px 16px 100px" }}>
        {view === "home" && <HomeTab trip={trip} fx={fx} weather={weather} setView={setView} />}
        {view === "budget" && <BudgetTab trip={trip} fx={fx} actions={actions} myMemberId={myMember?.id} />}
        {view === "explore" && <ExploreHub trip={trip} poi={poi} poiOffline={poiOffline} setView={setView} />}
        {isCategory && (
          <CategoryPage
            trip={trip} categoryKey={categoryKey} poi={poi} poiLoading={loading.poi} poiOffline={poiOffline}
            poiError={errors.poi} lastUpdated={ts.poi} onRefresh={refreshExplore} onBack={() => setView("explore")}
          />
        )}
        {view === "weather" && <WeatherTab trip={trip} weather={weather} wLoading={loading.weather} weatherOffline={weatherOffline} lastUpdated={ts.weather} onRefresh={refreshWeather} error={errors.weather} />}
        {view === "currency" && <CurrencyTab trip={trip} fx={fx} fxLoading={loading.fx} fxOffline={fxOffline} lastUpdated={ts.fx} onRefresh={refreshCurrency} error={errors.fx} />}
        {view === "security" && <SecurityTab trip={trip} actions={actions} news={news} newsLoading={loading.news} newsError={errors.news} lastUpdated={ts.news} onRefresh={refreshExplore} />}
        {view === "vlog" && <VlogTab trip={trip} weather={weather} poi={poi} />}
        {view === "map" && <MapTab trip={trip} geo={geoInfo} />}
        {view === "profile" && <Profile />}

        {view === "budget" && (
          <div style={{ marginTop: 18, display: "flex", gap: 14 }}>
            {isAdmin && (
              <button onClick={deleteTrip} style={{ background: "none", border: "none", color: T.muted, fontSize: 11.5, textDecoration: "underline", cursor: "pointer" }}>
                Bu seyahati sil
              </button>
            )}
            {!isAdmin && myMember && (
              <button onClick={leaveTrip} style={{ background: "none", border: "none", color: T.muted, fontSize: 11.5, textDecoration: "underline", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <LogOut size={11} /> Seyahatten ayrıl
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: T.surface, borderTop: `1px solid ${T.border}` }}>
        <AirmailStripe height={3} />
        <div style={{ display: "flex", padding: "8px 4px calc(8px + env(safe-area-inset-bottom))" }}>
          {bottomTabs.map(t => (
            <button key={t.key} onClick={() => setView(t.key)} style={{
              flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, padding: "6px 0", cursor: "pointer", color: activeBottomKey === t.key ? T.amber : T.muted,
            }}>
              <t.icon size={18} />
              <span style={{ fontSize: 10, fontFamily: "'Inter',sans-serif", fontWeight: activeBottomKey === t.key ? 600 : 400 }}>{t.label}</span>
            </button>
          ))}
          <button onClick={() => setSidebarOpen(true)} style={{
            flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "6px 0", cursor: "pointer", color: T.muted,
          }}>
            <Menu size={17} />
            <span style={{ fontSize: 10 }}>Daha Fazla</span>
          </button>
        </div>
      </div>
    </div>
  );
}
