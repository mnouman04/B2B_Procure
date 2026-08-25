const RADIUS_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in km between two {lat, lng} points. */
export const distanceKm = (a, b) => {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * RADIUS_KM * Math.asin(Math.sqrt(h)));
};

/** Coordinates for the Saudi cities used across the platform. */
export const CITY_COORDS = {
  Riyadh: { lat: 24.7136, lng: 46.6753 },
  Jeddah: { lat: 21.4858, lng: 39.1925 },
  Jazan: { lat: 16.8892, lng: 42.5706 },
  Dammam: { lat: 26.4207, lng: 50.0888 },
  Makkah: { lat: 21.3891, lng: 39.8579 },
  Madinah: { lat: 24.5247, lng: 39.5692 },
  Khobar: { lat: 26.2794, lng: 50.2083 },
  Abha: { lat: 18.2465, lng: 42.5117 },
  Tabuk: { lat: 28.3835, lng: 36.5662 },
  Yanbu: { lat: 24.0895, lng: 38.0618 },
  Buraidah: { lat: 26.3260, lng: 43.9750 },
  Hail: { lat: 27.5114, lng: 41.7208 },
  Najran: { lat: 17.4924, lng: 44.1277 },
  Jubail: { lat: 27.0046, lng: 49.6459 },
  Taif: { lat: 21.2703, lng: 40.4158 },
};

export const coordsForCity = (city) => CITY_COORDS[city] || null;
