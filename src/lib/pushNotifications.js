// pushNotifications.js — the browser-facing half of Web Push. This is the
// piece that makes notifications arrive even when the app is closed or the
// phone is locked, which the earlier in-app-only toast system couldn't do.

import { getVapidPublicKeyApi, subscribePushApi, unsubscribePushApi, updatePushPrefsApi } from "./api.js";

const PUSH_ENDPOINT_KEY = "pusula_push_endpoint";

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function getPermissionState() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission; // "granted" | "denied" | "default"
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function registerServiceWorker() {
  return navigator.serviceWorker.register("/sw.js");
}

// Subscribes this device to push and tells the backend about it, including
// the current per-category preferences so server-side sends respect them
// even though the app isn't running to check localStorage itself.
export async function subscribeToPush(prefs) {
  if (!isPushSupported()) throw new Error("Bu tarayıcı/cihaz push bildirimlerini desteklemiyor.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Bildirim izni verilmedi.");

  const { publicKey, configured } = await getVapidPublicKeyApi();
  if (!configured) throw new Error("Sunucu tarafında push henüz kurulmamış (VAPID anahtarları eksik).");

  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await subscribePushApi(subscription.toJSON(), prefs);
  try { localStorage.setItem(PUSH_ENDPOINT_KEY, subscription.endpoint); } catch { /* ignore */ }
  return subscription;
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await unsubscribePushApi(subscription.endpoint).catch(() => {});
    await subscription.unsubscribe().catch(() => {});
  }
  try { localStorage.removeItem(PUSH_ENDPOINT_KEY); } catch { /* ignore */ }
}

// Called whenever a category toggle changes, so an already-subscribed
// device's server-side prefs stay in sync without needing to resubscribe.
export async function syncPushPrefs(prefs) {
  const endpoint = (() => { try { return localStorage.getItem(PUSH_ENDPOINT_KEY); } catch { return null; } })();
  if (!endpoint) return; // not subscribed on this device — nothing to sync
  await updatePushPrefsApi(endpoint, prefs).catch(() => {});
}

export function isSubscribedOnThisDevice() {
  try { return !!localStorage.getItem(PUSH_ENDPOINT_KEY); } catch { return false; }
}
