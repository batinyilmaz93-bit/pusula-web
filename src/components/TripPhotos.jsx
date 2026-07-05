import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Trash2, Images } from "lucide-react";
import { T } from "../lib/theme.js";
import { Empty } from "./primitives.jsx";
import { compressImageFile } from "../lib/utils.js";
import { safeConfirm } from "../lib/utils.js";

export default function TripPhotos({ trip, actions }) {
  const photos = trip.photos || [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const full = photos.length >= 5;

  const handleSelect = async (file) => {
    if (!file) return;
    setError("");
    if (full) { setError("Bu seyahat için en fazla 5 fotoğraf yüklenebilir."); return; }
    if (!file.type.startsWith("image/")) { setError("Sadece görsel dosyası yükleyebilirsin."); return; }
    setBusy(true);
    try {
      const dataUrl = await compressImageFile(file, 900, 0.75);
      await actions.addTripPhoto(dataUrl);
    } catch (e) {
      setError(e.message || "Fotoğraf yüklenemedi.");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (photoId) => {
    if (!safeConfirm("Bu fotoğrafı silmek istediğine emin misin?")) return;
    await actions.deleteTripPhoto(photoId);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Images size={18} color={T.amber} />
        <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 18, fontWeight: 600 }}>Seyahat Fotoğrafları</div>
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
        Bu seyahatteki herkesin görüp ekleyebileceği ortak bir albüm — en fazla {5} fotoğraf. ({photos.length}/5)
      </div>

      <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => handleSelect(e.target.files?.[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={e => handleSelect(e.target.files?.[0])} />

      {!full && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => galleryInputRef.current?.click()} disabled={busy} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: T.cardAlt,
            border: `1.5px dashed ${T.dash}`, borderRadius: 12, padding: "12px", color: T.teal, fontSize: 13, cursor: "pointer",
          }}><ImageIcon size={15} /> Galeriden Seç</button>
          <button onClick={() => cameraInputRef.current?.click()} disabled={busy} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: T.cardAlt,
            border: `1.5px dashed ${T.dash}`, borderRadius: 12, padding: "12px", color: T.teal, fontSize: 13, cursor: "pointer",
          }}><Camera size={15} /> Kamera</button>
        </div>
      )}
      {busy && <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Yükleniyor...</div>}
      {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
      {full && <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 12 }}>5/5 doldu — yeni eklemek için önce birini sil.</div>}

      {photos.length === 0 ? (
        <Empty text="Henüz fotoğraf eklenmedi." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", boxShadow: T.shadowSoft }}>
              <img src={p.photo} onClick={() => setLightbox(p.photo)} alt="Seyahat fotoğrafı"
                style={{ width: "100%", height: 130, objectFit: "cover", cursor: "zoom-in", display: "block" }} />
              <button onClick={() => removePhoto(p.id)} style={{
                position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 8,
                padding: 5, color: "#fff", cursor: "pointer", display: "flex",
              }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out",
        }}>
          <img src={lightbox} alt="Büyük" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
