/**
 * Geohash encoding, decoding & spatial bounding-box calculation
 * for Firestore spatial queries and fast "Near Me" queue discovery.
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const BITS = [16, 8, 4, 2, 1];

/**
 * Encodes latitude and longitude into a geohash string.
 * @param lat Latitude (-90 to 90)
 * @param lng Longitude (-180 to 180)
 * @param precision Length of geohash string (default 7, ~150m accuracy)
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 7): string {
  let isEven = true;
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  let geohash = '';
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lngMin + lngMax) / 2;
      if (lng > mid) {
        ch |= BITS[bit];
        lngMin = mid;
      } else {
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat > mid) {
        ch |= BITS[bit];
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Returns geohash query range bounds [start, end] for a given center and search radius (in km).
 */
export function getGeohashRange(lat: number, lng: number, radiusKm: number): [string, string] {
  // Approximate precision from radius
  let precision = 4; // ~40km
  if (radiusKm <= 1.2) precision = 7; // ~150m
  else if (radiusKm <= 5) precision = 6; // ~1.2km
  else if (radiusKm <= 20) precision = 5; // ~5km

  const hash = encodeGeohash(lat, lng, precision);
  return [hash, hash + '~'];
}
