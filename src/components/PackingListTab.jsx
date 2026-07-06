import React, { useEffect, useState } from "react";
import { Backpack, Plus, Trash2 } from "lucide-react";
import { T } from "../lib/theme.js";
import { Empty, Spinner, Avatar } from "./primitives.jsx";
import { getPackingApi, addPackingItemApi, togglePackingItemApi, deletePackingItemApi } from "../lib/api.js";

export default function PackingListTab({ trip }) {
  const [items, setItems] = useState(null);
  const [text, setText] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => getPackingApi(trip.id).then(r => setItems(r.items)).catch(e => setError(e.message));
  useEffect(() => { refresh(); }, [trip.id]); // eslint-disable-line

  const add = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const r = await addPackingItemApi(trip.id, text.trim(), assignedTo || null);
      setItems(r.items); setText(""); setAssignedTo("");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const toggle = async (id, done) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done } : i)); // optimistic
    try { const r = await togglePackingItemApi(trip.id, id, done); setItems(r.items); } catch (e) { setError(e.message); }
  };
  const remove = async (id) => {
    try { const r = await deletePackingItemApi(trip.id, id); setItems(r.items); } catch (e) { setError(e.message); }
  };

  const memberById = Object.fromEntries(trip.members.map(m => [m.id, m]));
  const doneCount = items?.filter(i => i.done).length || 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Backpack size={18} color={T.amber} />
        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 18, fontWeight: 800 }}>Paket Listesi</div>
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
        {items ? `${doneCount}/${items.length} hazır` : "Yükleniyor..."} — istersen birine ata.
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, marginBottom: 14, boxShadow: T.shadowSoft }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Örn. Şarj aleti"
            onKeyDown={e => { if (e.key === "Enter") add(); }}
            style={{ flex: 1, background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 14, boxSizing: "border-box" }} />
          <button onClick={add} disabled={busy || !text.trim()} style={{
            flexShrink: 0, width: 40, borderRadius: 10, border: "none", background: T.amber, color: T.buttonTextOnAccent || "#fff", cursor: "pointer",
          }}><Plus size={17} style={{ margin: "0 auto" }} /></button>
        </div>
        <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={{
          width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", color: T.text, fontSize: 13,
        }}>
          <option value="">Kime atanacak? (opsiyonel)</option>
          {trip.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}

      {items === null && <Spinner label="Yükleniyor..." />}
      {items?.length === 0 && <Empty text="Henüz madde eklenmedi." />}
      {items?.map(item => (
        <div key={item.id} style={{
          display: "flex", alignItems: "center", gap: 10, background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "10px 12px", marginBottom: 7,
        }}>
          <button onClick={() => toggle(item.id, !item.done)} style={{
            width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${item.done ? T.amber : T.dash}`,
            background: item.done ? T.amber : "transparent", cursor: "pointer", flexShrink: 0,
          }} />
          <span style={{ flex: 1, fontSize: 13.5, textDecoration: item.done ? "line-through" : "none", color: item.done ? T.muted : T.text }}>{item.text}</span>
          {item.assignedTo && memberById[item.assignedTo] && <Avatar member={memberById[item.assignedTo]} size={22} />}
          <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  );
}
