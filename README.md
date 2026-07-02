# Pusula Seyahat — Web (PWA)

Artifact'in bağımsız, gerçek backend'e bağlı hâli. Aynı tasarım (vintage
airmail teması), aynı sekmeler (Bütçe / Keşfet / Hava / Kur / Güvenlik) —
ama artık veriler `seyahat-backend` sunucusunda tutuluyor, gerçek zamanlı
WebSocket ile senkronize oluyor, ve iPhone'a "Ana Ekrana Ekle" ile
kurulabiliyor.

## Hızlı başlangıç

```bash
# Önce backend'i ayrı bir terminalde çalıştır (seyahat-backend.zip içinden)
cd ../server && npm install && npm start   # http://localhost:4000

# Sonra bu projeyi çalıştır
npm install
cp .env.example .env    # VITE_API_URL backend'i gösteriyor mu kontrol et
npm run dev              # http://localhost:5173
```

## iPhone'a kurmak (yayına aldıktan sonra)

1. Bu projeyi Vercel/Netlify'a deploy et (DEPLOY.md'ye bak).
2. iPhone'da **Safari**'de deploy edilen adresi aç (Chrome değil — Add to
   Home Screen sadece Safari'de var).
3. Alt paylaş ikonu → **Ana Ekrana Ekle**.
4. Ana ekranda gerçek bir uygulama gibi görünen "Pusula" ikonu oluşur —
   dokununca tam ekran açılır, Safari çubuğu görünmez.

## Yapı

- `src/lib/api.js` — backend REST istemcisi
- `src/lib/socket.js` — canlı senkronizasyon (Socket.IO)
- `src/lib/offline.js` — backend de ulaşılamazsa devreye giren yedek veri
- `src/components/` — TripList, TripDetail, ve beş sekme

## Test edildi

`npm run build` başarıyla derleniyor, `npm run preview` ile servis edilen
HTML/manifest/ikonlar 200 dönüyor. Backend ile birlikte gerçek bir
tarayıcıda uçtan uca akışı (isim gir → seyahat oluştur → arkadaş davet et →
harcama ekle) test etmeni öneririm — bu ortamda gerçek bir tarayıcı
bulunmadığı için o adımı sen tamamlamalısın.
