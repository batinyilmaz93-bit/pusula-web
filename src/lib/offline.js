// lib/offline.js — last-resort fallback data if BOTH the live upstream
// AND our own backend proxy are unreachable (e.g. backend is down, or the
// device is offline). Ported from the original artifact 1:1.

export const normalizeTxt = (s) => (s || "")
  .toLocaleLowerCase("tr-TR")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/ı/g, "i")
  .trim();

/* Offline seed data: used whenever a live API call is unreachable (e.g. the
   in-chat artifact preview sandbox, which blocks outbound network requests
   entirely). Covers popular destinations so Keşfet/Hava/Kur still show real
   content in that context; when the file is opened directly in a browser or
   deployed, live Overpass/Open-Meteo/Frankfurter data is tried first. */
export const OFFLINE_CITIES = {
  "sakiz adasi": { country: "Yunanistan", currencyCode: "EUR", lat: 38.3667, lon: 26.1333, timezone: "Europe/Athens",
    typicalWeather: { temp: 29, code: 0, humidity: 55, wind: 14 },
    poi: { restaurant: [
             { name: "Ouzerie Erasmion", note: "Limana nazır, akşamüstü ouzo eşliğinde meze." },
             { name: "Metaxi Mas", note: "Yerel ailelerin favori adres, ev yapımı tabaklar." },
             { name: "Salt Restaurant", note: "Modern sunumlu Ege mutfağı, gün batımı manzarası." },
             { name: "Taverna Hotzas", note: "Adanın en eski tavernalarından, samimi atmosfer." }],
           cafe: [
             { name: "Rolo Cafe", note: "Sabah kahvesi için sakin bir köşe." },
             { name: "Fabrika Cafe", note: "Eski bir fabrikadan bozma şık mekan." },
             { name: "Aegli Cafe", note: "Deniz kenarında yavaş bir mola." }],
           museum: [
             { name: "Chios Arkeoloji Müzesi", note: "Adanın antik geçmişine hızlı bir yolculuk." },
             { name: "Bizans Müzesi", note: "Küçük ama etkileyici bir koleksiyon." },
             { name: "Sakız (Mastic) Müzesi", note: "Adayı ünlü yapan sakızın hikayesi." },
             { name: "Denizcilik Müzesi", note: "Chios'un denizcilik geçmişini anlatıyor." }],
           shopping: [
             { name: "Chios Belediye Pazarı", note: "Yerel üretim, taze ürün ve renkli sokaklar." },
             { name: "Mastic Shop", note: "Hediyelik için birebir mastic ürünleri." },
             { name: "Sakız Çarşısı", note: "Küçük butikler ve el yapımı ürünler." }] } },
  "istanbul": { country: "Türkiye", currencyCode: "TRY", lat: 41.0082, lon: 28.9784, timezone: "Europe/Istanbul",
    typicalWeather: { temp: 28, code: 1, humidity: 60, wind: 12 },
    poi: { restaurant: [
             { name: "Karaköy Lokantası", note: "Klasik meyhane sofrası, her zaman kalabalık." },
             { name: "Çiya Sofrası", note: "Anadolu mutfağının unutulmuş lezzetleri." },
             { name: "Balıkçı Sabahattin", note: "Taze balık, tarihi Sultanahmet sokağında." },
             { name: "Hamdi Restaurant", note: "Boğaz manzaralı terasta kebap keyfi." }],
           cafe: [
             { name: "Fazıl Bey", note: "Osmanlı usulü kahve, tarihi Kadıköy sokağı." },
             { name: "Petra Roasting Co.", note: "Üçüncü nesil kahve severler için durak." },
             { name: "Kronotrop", note: "Filtre kahve tutkunlarının buluşma noktası." }],
           museum: [
             { name: "Topkapı Sarayı", note: "Osmanlı'nın kalbine bir yolculuk." },
             { name: "İstanbul Modern", note: "Türk çağdaş sanatının vitrini." },
             { name: "Pera Müzesi", note: "Şık bir bina, seçkin sergiler." },
             { name: "Ayasofya", note: "1500 yıllık tarihin taşları arasında." }],
           shopping: [
             { name: "Kapalıçarşı", note: "Dünyanın en eski alışveriş labirenti." },
             { name: "İstinye Park", note: "Modern markalar tek çatı altında." },
             { name: "Mısır Çarşısı", note: "Baharat kokuları eşliğinde gezinti." }] } },
  "paris": { country: "Fransa", currencyCode: "EUR", lat: 48.8566, lon: 2.3522, timezone: "Europe/Paris",
    typicalWeather: { temp: 23, code: 2, humidity: 58, wind: 15 },
    poi: { restaurant: [
             { name: "Le Comptoir du Relais", note: "Klasik bir Paris bistrosu deneyimi." },
             { name: "Chez L'Ami Jean", note: "Baskça esintili, cömert porsiyonlar." },
             { name: "Bouillon Chartier", note: "Tarihi salon, uygun fiyatlı Fransız mutfağı." }],
           cafe: [
             { name: "Café de Flore", note: "Edebiyatçıların uğrak noktası, tarihi kahve." },
             { name: "Angelina", note: "Sıcak çikolatasıyla ünlü şık salon." },
             { name: "Café de la Paix", note: "Opera binasına nazır zarif bir mola." }],
           museum: [
             { name: "Louvre", note: "Mona Lisa'dan Venüs'e sanat dolu koridorlar." },
             { name: "Musée d'Orsay", note: "Empresyonistlerin en güzel eserleri burada." },
             { name: "Centre Pompidou", note: "Modern sanatın renkli, cesur yüzü." }],
           shopping: [
             { name: "Galeries Lafayette", note: "Cam kubbe altında lüks alışveriş." },
             { name: "Le Marais", note: "Butik mağazalar ve vintage dükkanlar." },
             { name: "Champs-Élysées", note: "Paris'in ünlü alışveriş caddesi." }] } },
  "roma": { country: "İtalya", currencyCode: "EUR", lat: 41.9028, lon: 12.4964, timezone: "Europe/Rome",
    typicalWeather: { temp: 30, code: 0, humidity: 48, wind: 10 },
    poi: { restaurant: [
             { name: "Roscioli", note: "Roma usulü carbonara için efsane adres." },
             { name: "Da Enzo al 29", note: "Küçük, sıcak, kesinlikle rezervasyonlu bir yer." },
             { name: "Armando al Pantheon", note: "Pantheon'un hemen yanında otantik lezzetler." }],
           cafe: [
             { name: "Sant'Eustachio Il Caffè", note: "Roma'nın en iyi espressosu iddiasında." },
             { name: "Antico Caffè Greco", note: "1760'dan beri açık, tarihi bir kahvehane." }],
           museum: [
             { name: "Vatikan Müzeleri", note: "Sistine Şapeli'ni kaçırma, erken git." },
             { name: "Kolezyum", note: "Roma İmparatorluğu'nun devasa arenası." },
             { name: "Galleria Borghese", note: "Bernini heykelleriyle nefes kesen bir koleksiyon." }],
           shopping: [
             { name: "Via del Corso", note: "Roma'nın kalabalık alışveriş caddesi." },
             { name: "Via Condotti", note: "Lüks markaların buluştuğu şık sokak." }] } },
  "barselona": { country: "İspanya", currencyCode: "EUR", lat: 41.3874, lon: 2.1686, timezone: "Europe/Madrid",
    typicalWeather: { temp: 28, code: 0, humidity: 62, wind: 13 },
    poi: { restaurant: [
             { name: "Cal Pep", note: "Tezgahta tapas, hızlı ve lezzetli." },
             { name: "Can Culleretes", note: "Barselona'nın en eski restoranlarından biri." }],
           cafe: [{ name: "Federal Café", note: "Brunch için popüler, avlulu bir mekan." }],
           museum: [
             { name: "Sagrada Familia", note: "Gaudí'nin bitmeyen başyapıtı." },
             { name: "Picasso Müzesi", note: "Ustanın erken dönem eserleri burada." },
             { name: "MACBA", note: "Çağdaş sanatseverler için doğru adres." }],
           shopping: [
             { name: "La Boqueria", note: "Renkli, canlı bir pazar deneyimi." },
             { name: "Passeig de Gràcia", note: "Barselona'nın gösterişli alışveriş bulvarı." }] } },
  "amsterdam": { country: "Hollanda", currencyCode: "EUR", lat: 52.3676, lon: 4.9041, timezone: "Europe/Amsterdam",
    typicalWeather: { temp: 20, code: 3, humidity: 70, wind: 18 },
    poi: { restaurant: [
             { name: "Moeders", note: "'Anneler' temalı, ev sıcaklığında yemekler." },
             { name: "De Kas", note: "Seranın içinde, çiftlikten sofraya konsept." }],
           cafe: [{ name: "Winkel 43", note: "Elma pastasıyla ünlü, kanal kenarında." }],
           museum: [
             { name: "Rijksmuseum", note: "Hollanda altın çağı sanatının evi." },
             { name: "Van Gogh Müzesi", note: "Sanatçının en büyük koleksiyonu burada." },
             { name: "Anne Frank Evi", note: "Duygusal ve önemli bir tarih dersi." }],
           shopping: [{ name: "De Negen Straatjes", note: "Butik mağazalarla dolu dokuz sokak." }] } },
  "atina": { country: "Yunanistan", currencyCode: "EUR", lat: 37.9838, lon: 23.7275, timezone: "Europe/Athens",
    typicalWeather: { temp: 31, code: 0, humidity: 45, wind: 11 },
    poi: { restaurant: [
             { name: "Karamanlidika tou Fani", note: "Şarküteri tadında zengin bir meze sofrası." },
             { name: "To Kafeneio", note: "Plaka'nın ortasında sade, otantik lezzetler." }],
           cafe: [{ name: "Little Kook", note: "Masalsı dekoruyla Instagram'lık bir kahve." }],
           museum: [
             { name: "Akropolis Müzesi", note: "Antik heykellerle göz göze gelmek." },
             { name: "Ulusal Arkeoloji Müzesi", note: "Yunanistan'ın en zengin antik koleksiyonu." }],
           shopping: [
             { name: "Monastiraki Pazarı", note: "Bitpazarı havasında rengarenk bir gezinti." },
             { name: "Ermou Caddesi", note: "Atina'nın ana alışveriş caddesi." }] } },
  "londra": { country: "İngiltere", currencyCode: "GBP", lat: 51.5072, lon: -0.1276, timezone: "Europe/London",
    typicalWeather: { temp: 21, code: 3, humidity: 68, wind: 20 },
    poi: { restaurant: [
             { name: "Dishoom", note: "Bombay kahvehanesi ruhunu taşıyan popüler zincir." },
             { name: "Borough Market", note: "Dünya mutfaklarını bir arada tatma şansı." }],
           cafe: [{ name: "Monmouth Coffee", note: "Şehrin en sevilen kahve kavurucularından." }],
           museum: [
             { name: "British Museum", note: "Dünya tarihini tek çatı altında gezmek." },
             { name: "Tate Modern", note: "Eski bir santralde çağdaş sanat." },
             { name: "National Gallery", note: "Van Gogh'tan Rembrandt'a klasikler." }],
           shopping: [
             { name: "Oxford Street", note: "Londra'nın kalabalık ana alışveriş caddesi." },
             { name: "Camden Market", note: "Alternatif ruhlu, renkli bir pazar." }] } },
  "dubai": { country: "Birleşik Arap Emirlikleri", currencyCode: "AED", lat: 25.2048, lon: 55.2708, timezone: "Asia/Dubai",
    typicalWeather: { temp: 41, code: 0, humidity: 50, wind: 16 },
    poi: { restaurant: [
             { name: "Al Ustad Special Kabab", note: "1978'den beri değişmeyen İran mutfağı lezzeti." },
             { name: "Ravi Restaurant", note: "Bütçe dostu, otantik Pakistan mutfağı." }],
           cafe: [{ name: "Arabian Tea House", note: "Geleneksel dekorda çay ve nane limonata." }],
           museum: [
             { name: "Dubai Museum", note: "Şehrin balıkçı köyünden metropole yolculuğu." },
             { name: "Etihad Müzesi", note: "BAE'nin kuruluş hikayesini anlatıyor." }],
           shopping: [
             { name: "Dubai Mall", note: "Akvaryumu ve mağazalarıyla devasa bir kompleks." },
             { name: "Gold Souk", note: "Altın parıltısıyla göz kamaştıran çarşı." }] } },
  "bangkok": { country: "Tayland", currencyCode: "THB", lat: 13.7563, lon: 100.5018, timezone: "Asia/Bangkok",
    typicalWeather: { temp: 30, code: 61, humidity: 78, wind: 10 },
    poi: { restaurant: [
             { name: "Jay Fai", note: "Michelin yıldızlı sokak lezzeti, uzun kuyruklar normal." },
             { name: "Thip Samai", note: "Şehrin en meşhur pad thai'si." }],
           cafe: [{ name: "Rocket Coffeebar", note: "Modern, ferah bir üçüncü nesil kahveci." }],
           museum: [
             { name: "Grand Palace", note: "Altın yaldızlı çatılar ve tapınaklar." },
             { name: "Bangkok Ulusal Müzesi", note: "Tayland tarihine kapsamlı bir bakış." }],
           shopping: [
             { name: "Chatuchak Pazarı", note: "Hafta sonu dev pazarında kaybolmaya hazır ol." },
             { name: "MBK Center", note: "Pazarlık yapılabilen dev bir alışveriş merkezi." }] } },
};

/* Approximate offline FX fallback (asOf noted, sourced late Jun 2026) — used
   only when the live Frankfurter/ECB call is unreachable. Always clearly
   labeled as an approximation in the UI; live rate is tried first. */
export const OFFLINE_RATES = {
  TRY: { rate: 1, asOf: "canlı" },
  EUR: { rate: 53.29, asOf: "30 Haz 2026" },
  USD: { rate: 46.66, asOf: "30 Haz 2026" },
  GBP: { rate: 61.79, asOf: "30 Haz 2026" },
  AED: { rate: 12.65, asOf: "30 Haz 2026" },
  THB: { rate: 1.40, asOf: "30 Haz 2026" },
};

export function matchOfflineCity(city) {
  const q = normalizeTxt(city);
  if (!q) return null;
  const key = Object.keys(OFFLINE_CITIES).find(k => k === q || k.includes(q) || q.includes(k));
  return key ? { key, ...OFFLINE_CITIES[key] } : null;
}
