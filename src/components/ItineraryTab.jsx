import React, { useEffect, useState } from "react";
import { CalendarDays, Plus, Trash2, Clock } from "lucide-react";
import { T } from "../lib/theme.js";
import { Empty, Spinner } from "./primitives.jsx";
import { getItineraryApi, addItineraryItemApi, deleteItineraryItemApi } from "../lib/api.js";

export default function ItineraryTab({ trip }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ dayNumber: 1, time: "", title: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const refresh = () => getItineraryApi(trip.id).then(r => setItems(r.items)).catch(e => setError(e.message));
  useEffect(() => { refresh(); }, [trip.id]); // eslint-disable-line

  const add = async () => {
    if (!form.title.trim()) { setError("Başlık gerekli."); return; }
    setBusy(true);
    try {
      const r = await addItineraryItemApi(trip.id, { ...form, dayNumber: Number(form.dayNumber) || 1 });
      setItems(r.items);
      setForm({ dayNumber: form.dayNumber, time: "", title: "", notes: "" });
      setError("");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    try { const r = await deleteItineraryItemApi(trip.id, id); setItems(r.items); } catch (e) { setError(e.message); }
  };

  const byDay = {};
  (items || []).forEach(i => { (byDay[i.dayNumber] = byDay[i.dayNumber] || []).push(i); });
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarDays size={18} color={T.amber} />
          <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 18, fontWeight: 800 }}>Gün Gün Plan</div>
        </div>
        <button onClick={() => setShowAdd(s => !s)} style={{
          display: "flex", alignItems: "center", gap: 5, background: T.amberDim, border: "none", borderRadius: 20,
          padding: "7px 12px", color: T.amber, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        }}><Plus size={13} /> Madde Ekle</button>
      </div>

      {showAdd && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 14, boxShadow: T.shadowSoft }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: "0 0 80px" }}>
              <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 4 }}>Gün</div>
              <input type="number" min={1} value={form.dayNumber} onChange={e => setForm(f => ({ ...f, dayNumber: e.target.value }))}
                style={{ width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", color: T.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 4 }}>Saat (opsiyonel)</div>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                style={{ width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", color: T.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Örn. Kastro Kalesi'ni gez"
            style={{ width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 14, marginBottom: 8, boxSizing: "border-box" }} />
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Not (opsiyonel)"
            style={{ width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 13, marginBottom: 10, boxSizing: "border-box" }} />
          {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 8 }}>{error}</div>}
          <button onClick={add} disabled={busy} style={{
            width: "100%", padding: "11px", borderRadius: 10, border: "none", background: T.amber, color: T.buttonTextOnAccent || "#fff",
            fontWeight: 700, fontSize: 13.5, cursor: "pointer",
          }}>{busy ? "Ekleniyor..." : "Plana Ekle"}</button>
        </div>
      )}

      {items === null && <Spinner label="Yükleniyor..." />}
      {items?.length === 0 && <Empty text="Henüz plan eklenmedi." />}
      {days.map(day => (
        <div key={day} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: T.amber, marginBottom: 8 }}>GÜN {day}</div>
          {byDay[day].map(item => (
            <div key={item.id} style={{
              display: "flex", gap: 10, background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "10px 12px", marginBottom: 7,
            }}>
              {item.time && (
                <div style={{ display: "flex", alignItems: "center", gap: 3, color: T.teal, fontSize: 12, fontWeight: 700, flexShrink: 0, minWidth: 44 }}>
                  <Clock size={11} /> {item.time.slice(0, 5)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.title}</div>
                {item.notes && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{item.notes}</div>}
              </div>
              <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", flexShrink: 0 }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
