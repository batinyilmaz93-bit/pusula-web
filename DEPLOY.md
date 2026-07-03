# Deploy — Pusula Seyahat Web

## 1) Backend'i önce yayına al

Frontend'in konuşacağı bir backend adresi olmadan bu adımların anlamı yok.
`seyahat-backend.zip` içindeki DEPLOY.md'yi takip ederek backend'i
Render/Railway/Fly.io'ya al, `https://pusula-api.onrender.com` gibi bir
adres elde et.

## 2) Frontend'i Vercel'e deploy et

1. Bu klasörü GitHub'a push et (backend'den ayrı bir repo olabilir).
2. [vercel.com](https://vercel.com) → New Project → repoyu bağla.
3. Framework preset: **Vite** (otomatik algılanır).
4. Environment variable ekle: `VITE_API_URL` = backend adresin (adım 1).
5. Deploy → `https://pusula-senin-adin.vercel.app` gibi bir adres alırsın.

Netlify de aynı şekilde çalışır (`npm run build`, publish dizini `dist`).

## 3) iPhone'a kurulum

Deploy bitince Safari'den o adresi aç → Paylaş → **Ana Ekrana Ekle**. Detaylar README.md'de.

## 4) Kendi alan adını bağlamak (opsiyonel)

Vercel/Netlify ayarlarından "Domains" kısmına kendi domainini ekleyip
DNS kaydını yönlendirmen yeterli — `manifest.webmanifest` ve
`apple-touch-icon` zaten göreli yollarla tanımlı, alan adı değişse de
bozulmaz.

## 5) HTTPS zorunlu

iOS'ta "Ana Ekrana Ekle" ve Socket.IO WebSocket bağlantısı HTTPS/WSS
gerektirir — hem Vercel/Netlify hem Render/Railway/Fly.io bunu otomatik
sağlar, ekstra ayar gerekmez.
