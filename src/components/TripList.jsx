import React, { useEffect, useState } from "react";
import { Luggage, Plus, MapPin, Trash2, UserPlus } from "lucide-react";
import { T, btnPrimary, btnGhost } from "../lib/theme.js";
import { Field, Avatar, AirmailStripe, Spinner } from "./primitives.jsx";
import { listTrips, createTrip, joinTrip, deleteTripApi, getAuth } from "../lib/api.js";
import { safeConfirm } from "../lib/utils.js";

export default function TripList({ onOpen, pendingInvite, onConsumeInvite, onLogout }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(pendingInvite ? "join" : null);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [inviteCode, setInviteCode] = useState(pendingInvite || "");
  const [busy, setBusy] = useState(false);

  const user = getAuth()?.user;

  const refresh = () => {
    setLoading(true); setError("");
    listTrips().then(setTrips).catch(e => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(refresh, []);
  useEffect(() => {
    if (pendingInvite) {
      setMode("join"); setInviteCode(pendingInvite);
      onConsumeInvite?.();
    }
  }, [pendingInvite]); // eslint-disable-line

  const submitCreate = async () => {
    const n = name.trim(), c = country.trim(), ci = city.trim();
    if (!n || !c || !ci) return;
    setBusy(true); setError("");
    try {
      const trip = await createTrip({ name: n, country: c, city: ci });
      setName(""); setCountry(""); setCity(""); setMode(null);
      onOpen(trip.id);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const submitJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true); setError("");
    try {
      const trip = await joinTrip(code);
      setInviteCode(""); setMode(null);
      onOpen(trip.id);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const handleDelete = async (id, tripName) => {
    if (!safeConfirm(`"${tripName}" seyahatini silmek istediğine emin misin? Bu işlem geri alınamaz.`)) return;
    try { await deleteTripApi(id); refresh(); } catch (e) { setError(e.message); }
  };

  return (
    <div style={{ padding: "20px 16px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: T.amberDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Luggage size={20} color={T.amber} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 22, fontWeight: 600 }}>Seyahatlerim</div>
          <div style={{ fontSize: 12, color: T.muted }}>{user?.name ? `Merhaba, ${user.name}` : "Ortak bütçe & seyahat asistanı"}</div>
        </div>
        {onLogout && (
          <button onClick={onLogout} style={{ background: "none", border: "none", color: T.muted, fontSize: 11, textDecoration: "underline", cursor: "pointer" }}>
            başka isimle gir
          </button>
        )}
      </div>

      {pendingInvite && mode === "join" && (
        <div style={{ background: T.tealDim, border: `1px solid rgba(46,158,152,0.35)`, borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12 }}>
          Bir davet linkiyle geldin — davet kodu aşağıya otomatik dolduruldu, katılmak için "Katıl" de yeter.
        </div>
      )}

      {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 12 }}>{error}</div>}
      {loading && <Spinner label="Seyahatlerin yükleniyor..." />}

      {!loading && trips.length === 0 && !mode && (
        <div style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>Henüz bir seyahatin yok. Yeni bir tane oluştur ya da arkadaşının davet koduyla katıl.</div>
      )}

      {trips.map(t => (
        <div key={t.id} onClick={() => onOpen(t.id)} style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16,
          marginBottom: 12, cursor: "pointer", position: "relative", overflow: "hidden", boxShadow: T.shadowSoft,
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}><AirmailStripe height={4} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 }}>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontWeight: 600, fontSize: 17 }}>{t.name}</div>
              <div style={{ fontSize: 12.5, color: T.muted, display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                <MapPin size={11} /> {t.city}, {t.country}
              </div>
              <div style={{ fontSize: 10.5, color: T.muted, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>davet kodu: {t.inviteCode}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.name); }} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
              <Trash2 size={15} />
            </button>
          </div>
          <div style={{ display: "flex", marginTop: 12, gap: -6 }}>
            {t.members.slice(0, 5).map((m, i) => (
              <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}><Avatar member={m} size={26} /></div>
            ))}
            <span style={{ fontSize: 11, color: T.muted, marginLeft: 8, alignSelf: "center" }}>{t.members.length} kişi</span>
          </div>
        </div>
      ))}

      {!mode && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("create")} style={{
            flex: 1, padding: "14px", borderRadius: 14, border: `1.5px dashed ${T.dash}`,
            background: "transparent", color: T.amber, fontWeight: 600, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
          }}><Plus size={16} /> Yeni seyahat</button>
          <button onClick={() => setMode("join")} style={{
            flex: 1, padding: "14px", borderRadius: 14, border: `1.5px dashed ${T.dash}`,
            background: "transparent", color: T.teal, fontWeight: 600, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
          }}><UserPlus size={16} /> Davetle katıl</button>
        </div>
      )}

      {mode === "create" && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginTop: 6 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontWeight: 600, marginBottom: 12 }}>Yeni Seyahat</div>
          <Field label="Seyahat adı" value={name} onChange={setName} placeholder="Örn. Ege Turu 2026" />
          <Field label="Ülke" value={country} onChange={setCountry} placeholder="Örn. Yunanistan" />
          <Field label="Şehir" value={city} onChange={setCity} placeholder="Örn. Sakız Adası" />
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Sen otomatik olarak admin olacaksın; kurduktan sonra davet kodunu arkadaşlarınla paylaşabilirsin.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={submitCreate} disabled={busy} style={btnPrimary}>{busy ? "Oluşturuluyor..." : "Oluştur"}</button>
            <button onClick={() => setMode(null)} style={btnGhost}>Vazgeç</button>
          </div>
        </div>
      )}

      {mode === "join" && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginTop: 6 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontWeight: 600, marginBottom: 12 }}>Davetle Katıl</div>
          <Field label="Davet kodu" value={inviteCode} onChange={v => setInviteCode(v.toUpperCase())} placeholder="Örn. BD7649" />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={submitJoin} disabled={busy} style={btnPrimary}>{busy ? "Katılıyor..." : "Katıl"}</button>
            <button onClick={() => setMode(null)} style={btnGhost}>Vazgeç</button>
          </div>
        </div>
      )}
    </div>
  );
}
