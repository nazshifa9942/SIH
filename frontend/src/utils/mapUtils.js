/**
 * mapUtils.js
 * Maritime GIS & Coordinates lookup engine.
 * Provides known coordinates for global ports and calculates realistic maritime shipping routes.
 */

// ─── Global Port Coordinates Database ───────────────────────────────────────────

export const KNOWN_PORT_COORDINATES = {
  // Australian Ports
  'newcastle': { lat: -32.9272, lng: 151.7828, name: 'Newcastle', country: 'Australia' },
  'port hedland': { lat: -20.3117, lng: 118.5756, name: 'Port Hedland', country: 'Australia' },
  'dampier': { lat: -20.6622, lng: 116.7119, name: 'Dampier', country: 'Australia' },
  'hay point': { lat: -21.2858, lng: 149.3000, name: 'Hay Point', country: 'Australia' },
  'gladstone': { lat: -23.8431, lng: 151.2589, name: 'Gladstone', country: 'Australia' },
  'brisbane': { lat: -27.3850, lng: 153.1700, name: 'Brisbane', country: 'Australia' },
  'sydney': { lat: -33.8688, lng: 151.2093, name: 'Sydney', country: 'Australia' },
  'fremantle': { lat: -32.0569, lng: 115.7439, name: 'Fremantle', country: 'Australia' },

  // Indian Ports
  'paradip': { lat: 20.2644, lng: 86.6713, name: 'Paradip', country: 'India' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam', country: 'India' },
  'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai', country: 'India' },
  'mumbai': { lat: 18.9499, lng: 72.9510, name: 'Mumbai / JNPT', country: 'India' },
  'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata / Haldia', country: 'India' },
  'mundra': { lat: 22.8390, lng: 69.7042, name: 'Mundra', country: 'India' },
  'kandla': { lat: 23.0118, lng: 70.2198, name: 'Deendayal / Kandla', country: 'India' },
  'mangalore': { lat: 12.9234, lng: 74.8142, name: 'New Mangalore', country: 'India' },
  'cochin': { lat: 9.9674, lng: 76.2711, name: 'Cochin', country: 'India' },

  // Asian Hubs
  'singapore': { lat: 1.29027, lng: 103.851959, name: 'Singapore', country: 'Singapore' },
  'qingdao': { lat: 36.0671, lng: 120.3826, name: 'Qingdao', country: 'China' },
  'shanghai': { lat: 31.2304, lng: 121.4737, name: 'Shanghai', country: 'China' },
  'ningbo': { lat: 29.8683, lng: 121.5440, name: 'Ningbo-Zhoushan', country: 'China' },
  'tianjin': { lat: 38.9866, lng: 117.7449, name: 'Tianjin', country: 'China' },
  'dalian': { lat: 38.9140, lng: 121.6147, name: 'Dalian', country: 'China' },
  'guangzhou': { lat: 23.1291, lng: 113.2644, name: 'Guangzhou', country: 'China' },
  'tanjung pelepas': { lat: 1.3622, lng: 103.5511, name: 'Tanjung Pelepas', country: 'Malaysia' },
  'port klang': { lat: 3.0000, lng: 101.4000, name: 'Port Klang', country: 'Malaysia' },
  'colombo': { lat: 6.9271, lng: 79.8612, name: 'Colombo', country: 'Sri Lanka' },

  // Middle East & Africa
  'fujairah': { lat: 25.1288, lng: 56.3265, name: 'Fujairah', country: 'UAE' },
  'jebel ali': { lat: 24.9857, lng: 55.0273, name: 'Jebel Ali / Dubai', country: 'UAE' },
  'salalah': { lat: 17.0151, lng: 54.0924, name: 'Salalah', country: 'Oman' },
  'richards bay': { lat: -28.7997, lng: 32.0383, name: 'Richards Bay', country: 'South Africa' },
  'durban': { lat: -29.8587, lng: 31.0218, name: 'Durban', country: 'South Africa' },
  'cape town': { lat: -33.9249, lng: 18.4241, name: 'Cape Town', country: 'South Africa' },
  'port said': { lat: 31.2653, lng: 32.3019, name: 'Port Said (Suez)', country: 'Egypt' },

  // European Hubs
  'rotterdam': { lat: 51.9244, lng: 4.4777, name: 'Rotterdam', country: 'Netherlands' },
  'antwerp': { lat: 51.2194, lng: 4.4025, name: 'Antwerp', country: 'Belgium' },
  'hamburg': { lat: 53.5511, lng: 9.9937, name: 'Hamburg', country: 'Germany' },
  'gibraltar': { lat: 36.1408, lng: -5.3536, name: 'Gibraltar', country: 'UK' },

  // Americas
  'houston': { lat: 29.7604, lng: -95.3698, name: 'Houston', country: 'USA' },
  'new orleans': { lat: 29.9511, lng: -90.0715, name: 'New Orleans', country: 'USA' },
  'los angeles': { lat: 33.7432, lng: -118.2673, name: 'Los Angeles', country: 'USA' },
  'santos': { lat: -23.9618, lng: -46.3322, name: 'Santos', country: 'Brazil' },
  'tubarao': { lat: -20.2976, lng: -40.2425, name: 'Tubarao', country: 'Brazil' },
  'vancouver': { lat: 49.2827, lng: -123.1207, name: 'Vancouver', country: 'Canada' },
};

// ─── Maritime Chokepoints ──────────────────────────────────────────────────────

export const MARITIME_CHOKEPOINTS = [
  { name: 'Malacca Strait', lat: 2.5, lng: 101.5, type: 'Strait' },
  { name: 'Sunda Strait', lat: -5.9, lng: 105.8, type: 'Strait' },
  { name: 'Lombok Strait', lat: -8.5, lng: 115.7, type: 'Strait' },
  { name: 'Suez Canal', lat: 30.5, lng: 32.3, type: 'Canal' },
  { name: 'Bab el-Mandeb', lat: 12.6, lng: 43.3, type: 'Strait' },
  { name: 'Strait of Hormuz', lat: 26.5, lng: 56.2, type: 'Strait' },
  { name: 'Cape of Good Hope', lat: -34.4, lng: 18.5, type: 'Cape' },
  { name: 'Panama Canal', lat: 9.08, lng: -79.68, type: 'Canal' },
  { name: 'Torres Strait', lat: -10.4, lng: 142.2, type: 'Strait' },
  { name: 'Bass Strait', lat: -39.5, lng: 145.5, type: 'Strait' },
];

// ─── Coordinate Lookup Helper ──────────────────────────────────────────────────

export function getPortCoordinates(port) {
  if (!port) return { lat: 0, lng: 0 };

  // If port already has lat/lng fields
  if (port.lat !== undefined && port.lng !== undefined) {
    return { lat: Number(port.lat), lng: Number(port.lng) };
  }
  if (port.latitude !== undefined && port.longitude !== undefined) {
    return { lat: Number(port.latitude), lng: Number(port.longitude) };
  }

  const nameKey = (port.name || port.id || '').toLowerCase().trim();
  if (KNOWN_PORT_COORDINATES[nameKey]) {
    return KNOWN_PORT_COORDINATES[nameKey];
  }

  // Substring match
  for (const [key, coords] of Object.entries(KNOWN_PORT_COORDINATES)) {
    if (nameKey.includes(key) || key.includes(nameKey)) {
      return coords;
    }
  }

  // Country based fallback centers
  const country = (port.country || '').toLowerCase();
  if (country.includes('australia')) return { lat: -32.0, lng: 135.0 };
  if (country.includes('india')) return { lat: 18.0, lng: 83.0 };
  if (country.includes('china')) return { lat: 35.0, lng: 120.0 };
  if (country.includes('singapore')) return { lat: 1.29, lng: 103.85 };
  if (country.includes('brazil')) return { lat: -22.0, lng: -42.0 };
  if (country.includes('usa') || country.includes('states')) return { lat: 29.0, lng: -90.0 };
  if (country.includes('netherlands')) return { lat: 51.9, lng: 4.5 };
  if (country.includes('south africa')) return { lat: -30.0, lng: 30.0 };

  // Default ocean position
  return { lat: 10.0, lng: 80.0 };
}

// ─── Distance Calculation (Haversine Nautical Miles) ──────────────────────────

export function calculateDistanceNM(pos1, pos2) {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const dLon = ((pos2.lng - pos1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pos1.lat * Math.PI) / 180) *
      Math.cos((pos2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ─── Maritime Route Generator (Primary & Alternative) ─────────────────────────

export function generateMaritimeRoutes(originCoords, destCoords) {
  if (!originCoords || !destCoords) return { primaryRoute: [], alternativeRoute: [] };

  const isAustraliaToIndia =
    originCoords.lng > 110 &&
    originCoords.lat < -10 &&
    destCoords.lng > 70 &&
    destCoords.lat > 5;

  const isIndiaToAustralia =
    destCoords.lng > 110 &&
    destCoords.lat < -10 &&
    originCoords.lng > 70 &&
    originCoords.lat > 5;

  if (isAustraliaToIndia) {
    // 1. Primary Route: Southern Ocean / Cocos Keeling route
    const primaryWaypoints = [
      [originCoords.lat, originCoords.lng],
      [-35.5, 140.0], // Great Australian Bight entrance
      [-37.2, 128.0], // Bight deep water
      [-35.2, 114.5], // Cape Leeuwin off-point
      [-28.0, 106.0], // Indian Ocean Northwest bound
      [-12.2, 96.8],  // Cocos (Keeling) Islands passage
      [5.5, 83.0],    // Off Sri Lanka / Bay of Bengal entry
      [14.0, 85.0],   // Bay of Bengal transit
      [destCoords.lat, destCoords.lng],
    ];

    // 2. Alternative Route: Sunda Strait / Indonesian Archipelago
    const alternativeWaypoints = [
      [originCoords.lat, originCoords.lng],
      [-22.0, 153.5], // East Coast Australia
      [-10.5, 142.5], // Torres Strait / Arafura
      [-8.5, 125.0],  // Timor Sea
      [-6.0, 105.8],  // Sunda Strait
      [5.0, 93.0],    // Andaman Sea
      [15.0, 88.0],   // Central Bay of Bengal
      [destCoords.lat, destCoords.lng],
    ];

    return { primaryRoute: primaryWaypoints, alternativeRoute: alternativeWaypoints };
  }

  if (isIndiaToAustralia) {
    const primaryWaypoints = [
      [originCoords.lat, originCoords.lng],
      [14.0, 85.0],
      [5.5, 83.0],
      [-12.2, 96.8],
      [-35.2, 114.5],
      [-37.2, 128.0],
      [destCoords.lat, destCoords.lng],
    ];

    const alternativeWaypoints = [
      [originCoords.lat, originCoords.lng],
      [5.0, 93.0],
      [-6.0, 105.8],
      [-8.5, 125.0],
      [destCoords.lat, destCoords.lng],
    ];

    return { primaryRoute: primaryWaypoints, alternativeRoute: alternativeWaypoints };
  }

  // Generic Nautical Interpolation with Midpoint arc
  const midLat = (originCoords.lat + destCoords.lat) / 2;
  const midLng = (originCoords.lng + destCoords.lng) / 2;

  // Primary: gentle curve
  const primaryWaypoints = [
    [originCoords.lat, originCoords.lng],
    [midLat + 3.0, midLng],
    [destCoords.lat, destCoords.lng],
  ];

  // Alternative: wider oceanic arc
  const alternativeWaypoints = [
    [originCoords.lat, originCoords.lng],
    [midLat - 5.0, midLng - 4.0],
    [destCoords.lat, destCoords.lng],
  ];

  return { primaryRoute: primaryWaypoints, alternativeRoute: alternativeWaypoints };
}
