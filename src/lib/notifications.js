// notifications.js — per-category on/off settings (localStorage) and a
// short notification beep generated with the Web Audio API (no audio file
// to bundle/host). This covers IN-APP real-time notifications only: they
// fire while the app is open and connected. True OS-level push
// notifications (that wake the phone while the app/browser is closed) need
// a separate Service Worker + Web Push backend — a bigger, separate project.

const STORAGE_KEY = "pusula_notification_settings";

export const NOTIFICATION_TYPES = [
  { key: "chat_message", label: "Sohbet mesajları" },
  { key: "location_shared", label: "Konum paylaşımları" },
  { key: "expense_added", label: "Harcama eklendiğinde" },
  { key: "payment_made", label: "Ödeme yapıldığında" },
  { key: "member_joined", label: "Yeni üye katıldığında" },
];

const DEFAULTS = Object.fromEntries(NOTIFICATION_TYPES.map(t => [t.key, true]));

export function getNotificationSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setNotificationSetting(key, enabled) {
  const current = getNotificationSettings();
  current[key] = enabled;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* ignore */ }
}

export function isNotificationEnabled(key) {
  return getNotificationSettings()[key] !== false;
}

// Master on/off switch, separate from individual category toggles.
const MASTER_KEY = "pusula_notifications_master";
export function getMasterEnabled() {
  try { return localStorage.getItem(MASTER_KEY) !== "off"; } catch { return true; }
}
export function setMasterEnabled(enabled) {
  try { localStorage.setItem(MASTER_KEY, enabled ? "on" : "off"); } catch { /* ignore */ }
}

let audioCtx = null;
export function playNotificationSound() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    // Two quick soft tones — a simple, pleasant "ding-dong" rather than a harsh beep.
    [[880, now, 0.12], [660, now + 0.1, 0.16]].forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  } catch { /* AudioContext unavailable/blocked — fail silently */ }
}
