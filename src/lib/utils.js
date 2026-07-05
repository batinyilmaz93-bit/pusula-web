export const uid = () => Math.random().toString(36).slice(2, 10);
export const nowISO = () => new Date().toISOString();
export const fmtTime = (d) => d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
export const fmtMoney = (n, cur) => {
  if (n === undefined || n === null || isNaN(n)) return "-";
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} ${cur || ""}`.trim();
};
export const initials = (name) => (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
const AVATAR_COLORS = ["#6B8E4E", "#5B9BD5", "#8B6F47", "#C24C42", "#4E8E5C", "#B08CC9", "#5FA8CE", "#D4A83E"];
export const colorForId = (id) => AVATAR_COLORS[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
export const safeConfirm = (msg) => { try { return window.confirm(msg); } catch { return true; } };

// Resize + compress an image file to a reasonably small base64 JPEG before
// sending it to the server — keeps receipt photos well under the request
// size limit without needing any external image-processing service.
export function compressImageFile(file, maxDim = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Görsel yüklenemedi"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function weatherEmoji(code) {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "🌨️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

/* ---- balance logic ---- */
export function computeBalances(trip) {
  const net = {};
  trip.members.forEach(m => net[m.id] = 0);
  trip.expenses.forEach(exp => {
    net[exp.paidBy] = (net[exp.paidBy] || 0) + exp.amount;
    const share = exp.amount / (exp.splitAmong.length || 1);
    exp.splitAmong.forEach(id => net[id] = (net[id] || 0) - share);
  });
  return net;
}
export function simplifyDebts(net) {
  const creditors = Object.entries(net).filter(([, v]) => v > 0.01).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
  const debtors = Object.entries(net).filter(([, v]) => v < -0.01).map(([id, v]) => ({ id, v: -v })).sort((a, b) => b.v - a.v);
  const tx = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].v, creditors[j].v);
    tx.push({ from: debtors[i].id, to: creditors[j].id, amount: amt });
    debtors[i].v -= amt; creditors[j].v -= amt;
    if (debtors[i].v < 0.01) i++;
    if (creditors[j].v < 0.01) j++;
  }
  return tx;
}
