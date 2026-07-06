import React, { useEffect, useRef, useState } from "react";
import { FileText, Upload, Trash2, Download } from "lucide-react";
import { T } from "../lib/theme.js";
import { Empty, Spinner } from "./primitives.jsx";
import { getDocumentsApi, addDocumentApi, deleteDocumentApi } from "../lib/api.js";

export default function DocumentsTab({ trip }) {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const refresh = () => getDocumentsApi(trip.id).then(r => setDocs(r.documents)).catch(e => setError(e.message));
  useEffect(() => { refresh(); }, [trip.id]); // eslint-disable-line

  const handleSelect = async (file) => {
    if (!file) return;
    setError("");
    if (file.size > 5_500_000) { setError("Dosya çok büyük (en fazla ~5MB)."); return; }
    setBusy(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const r = await addDocumentApi(trip.id, file.name, dataUrl);
      setDocs(r.documents);
    } catch (e) {
      setError(e.message || "Belge yüklenemedi.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const remove = async (id) => {
    try { const r = await deleteDocumentApi(trip.id, id); setDocs(r.documents); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <FileText size={18} color={T.amber} />
        <div style={{ fontFamily: "'Libre Baskerville',sans-serif", fontSize: 18, fontWeight: 800 }}>Belgeler</div>
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
        Pasaport, rezervasyon onayı, sigorta gibi belgeleri buraya yükleyip herkesle paylaş.
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
        onChange={e => handleSelect(e.target.files?.[0])} />
      <button onClick={() => fileInputRef.current?.click()} disabled={busy} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.cardAlt,
        border: `1.5px dashed ${T.dash}`, borderRadius: 12, padding: "14px", color: T.teal, fontSize: 13.5, cursor: "pointer", marginBottom: 14,
      }}>
        {busy ? <Spinner label="Yükleniyor..." /> : <><Upload size={16} /> Belge Yükle (fotoğraf veya PDF)</>}
      </button>
      {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}

      {docs === null && <Spinner label="Yükleniyor..." />}
      {docs?.length === 0 && <Empty text="Henüz belge eklenmedi." />}
      {docs?.map(doc => (
        <div key={doc.id} style={{
          display: "flex", alignItems: "center", gap: 10, background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "12px 14px", marginBottom: 8,
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: T.amberDim, color: T.amber, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={16} />
          </div>
          <span style={{ flex: 1, fontSize: 13.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
          <a href={doc.file} download={doc.name} style={{ color: T.teal, display: "flex" }}><Download size={15} /></a>
          <button onClick={() => remove(doc.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );
}
