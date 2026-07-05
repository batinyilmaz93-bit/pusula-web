import { Utensils, Coffee, Beer, Landmark, MapPin, BedDouble, ShoppingBag, Gift } from "lucide-react";

// Single source of truth for the 8 explore categories — used by the Explore
// hub grid, each category's detail page, and the offline-fallback matcher.
export const POI_CATEGORIES = [
  { key: "restaurant", label: "Restoranlar", icon: Utensils, intro: "Karnımızı doyurduğumuz yerler 🍽️" },
  { key: "cafe", label: "Cafeler", icon: Coffee, intro: "Mola verip kahve içtiğimiz köşeler ☕️" },
  { key: "bar", label: "Barlar", icon: Beer, intro: "Akşamüstü bir şeyler içmek için 🍻" },
  { key: "museum", label: "Müzeler", icon: Landmark, intro: "Kültür molası için uğradığımız duraklar 🖼️" },
  { key: "attraction", label: "Gezilecek Yerler", icon: MapPin, intro: "Kaçırılmaması gereken duraklar 📍" },
  { key: "lodging", label: "Konaklama", icon: BedDouble, intro: "Kalınacak yerler için öneriler 🛏️" },
  { key: "shopping", label: "Alışveriş", icon: ShoppingBag, intro: "Alışveriş için gezdiğimiz yerler 🛍️" },
  { key: "gift", label: "Hediyelik Eşya", icon: Gift, intro: "Sevdiklerine götürmelik ✨" },
];
export const poiCategory = (key) => POI_CATEGORIES.find(c => c.key === key);

const GENERIC_NOTES = {
  restaurant: [
    "Bölgede yemek için sık tercih edilen adreslerden. Konumuna bakıp menüsünü kontrol etmeni öneririz.",
    "Yöre mutfağına yakın durmak isteyenler için değerlendirilebilecek bir seçenek.",
    "Haritada konumunu kontrol edip, yorumlarına bakarak karar vermen faydalı olur.",
  ],
  cafe: [
    "Kısa bir mola için uygun bir konum. Saatlerini kontrol etmeyi unutma.",
    "Güne başlamak ya da öğleden sonra ara vermek için değerlendirilebilir.",
  ],
  bar: [
    "Akşam için sakin bir mola noktası olabilir, konumunu kontrol et.",
    "Günü kapatmadan önce uğranabilecek adreslerden biri.",
  ],
  museum: [
    "Bölgenin tarihini/kültürünü tanımak isteyenler için değerlendirilebilir. Açılış saatlerini önceden kontrol et.",
    "Gezi listene ekleyip konumuna göre planlama yapabilirsin.",
  ],
  attraction: [
    "Bölgeyi ziyaret edenlerin genelde listesine aldığı bir durak.",
    "Konumunu haritada kontrol edip gezi rotana ekleyebilirsin.",
  ],
  lodging: [
    "Konaklama için değerlendirilebilecek bir seçenek — rezervasyon öncesi güncel yorumlara bakmanı öneririz.",
    "Konumuna göre bölgeye yakınlığını kontrol edip karşılaştırabilirsin.",
  ],
  shopping: [
    "Yerel ürünler için göz atılabilecek bir adres.",
    "Alışveriş rotana eklenebilir, konumunu kontrol et.",
  ],
  gift: [
    "Hediyelik eşya için değerlendirilebilecek bir durak.",
    "Sevdiklerine götürmelik bir şeyler için uğranabilir.",
  ],
};
const pickNote = (catKey, seed) => {
  const pool = GENERIC_NOTES[catKey] || GENERIC_NOTES.attraction;
  return pool[seed % pool.length];
};
export const poiEntries = (list, catKey) => (list || [])
  .map((item, i) => {
    const name = (typeof item === "string" ? item : item?.name || "").trim();
    if (!name) return null;
    const note = (typeof item === "object" && item?.note) ? item.note : pickNote(catKey, i);
    return { name, note };
  })
  .filter(Boolean);

export const mapsSearchUrl = (placeName, city, country) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeName}, ${city}, ${country}`)}`;
