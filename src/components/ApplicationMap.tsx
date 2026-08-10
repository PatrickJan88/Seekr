import React, { useEffect, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { JobApplication } from '../types';
import { MapPin, Building2, Info, Loader2, Maximize2, Minimize2 } from 'lucide-react';

interface ApplicationMapProps {
  applications: JobApplication[];
}

export interface GeoLocationMatch {
  city: string;
  country: string;
  coords: [number, number]; // [lng, lat]
}

const COUNTRY_FLAGS: Record<string, string> = {
  'Luxembourg': '🇱🇺',
  'Sweden': '🇸🇪',
  'Germany': '🇩🇪',
  'Austria': '🇦🇹',
  'Switzerland': '🇨🇭',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Ireland': '🇮🇪',
  'France': '🇫🇷',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Portugal': '🇵🇹',
  'Denmark': '🇩🇰',
  'Norway': '🇳🇴',
  'Finland': '🇫🇮',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Poland': '🇵🇱',
  'Czechia': '🇨🇿',
  'Czech Republic': '🇨🇿',
  'Hungary': '🇭🇺',
  'Romania': '🇷🇴',
  'Greece': '🇬🇷',
  'Estonia': '🇪🇪',
  'Latvia': '🇱🇻',
  'Lithuania': '🇱🇹',
  'Croatia': '🇭🇷',
  'Slovenia': '🇸🇮',
  'Serbia': '🇷🇸',
  'Slovakia': '🇸🇰',
  'Bulgaria': '🇧🇬',
  'Iceland': '🇮🇸',
  'Malta': '🇲🇹',
  'Cyprus': '🇨🇾',
  'United States of America': '🇺🇸',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Canada': '🇨🇦',
  'Japan': '🇯🇵',
  'Singapore': '🇸🇬',
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'India': '🇮🇳',
  'China': '🇨🇳',
  'Taiwan': '🇹🇼',
  'South Korea': '🇰🇷',
  'Korea': '🇰🇷',
  'Israel': '🇮🇱',
  'United Arab Emirates': '🇦🇪',
  'UAE': '🇦🇪',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'South Africa': '🇿🇦',
  'Egypt': '🇪🇬',
  'Turkey': '🇹🇷',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭'
};

export function getCountryFlagEmoji(countryName?: string): string {
  if (!countryName) return '📍';
  if (COUNTRY_FLAGS[countryName]) return COUNTRY_FLAGS[countryName];
  
  const lower = countryName.toLowerCase();
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (key.toLowerCase() === lower) return flag;
  }

  if (countryName.length === 2) {
    const code = countryName.toUpperCase();
    return code.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
  }

  return '📍';
}

const CITY_COORDINATES: Record<string, { city: string; country: string; coords: [number, number] }> = {
  // Luxembourg
  'luxembourg': { city: 'Luxembourg', country: 'Luxembourg', coords: [6.1319, 49.6116] },
  'luxembourg city': { city: 'Luxembourg', country: 'Luxembourg', coords: [6.1319, 49.6116] },
  'kirchberg': { city: 'Luxembourg', country: 'Luxembourg', coords: [6.1550, 49.6275] },
  'esch-sur-alzette': { city: 'Esch-sur-Alzette', country: 'Luxembourg', coords: [5.9806, 49.4958] },
  'esch': { city: 'Esch-sur-Alzette', country: 'Luxembourg', coords: [5.9806, 49.4958] },
  'strassen': { city: 'Strassen', country: 'Luxembourg', coords: [6.0736, 49.6208] },
  'bertrange': { city: 'Bertrange', country: 'Luxembourg', coords: [6.0489, 49.6111] },

  // Sweden / Stockholm Region
  'solna': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'kista': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'sundbyberg': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'täby': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'taby': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'nacka': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'huddinge': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'bromma': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'danderyd': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'sollentuna': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'stockholm': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'gothenburg': { city: 'Gothenburg', country: 'Sweden', coords: [11.9745, 57.7088] },
  'göteborg': { city: 'Gothenburg', country: 'Sweden', coords: [11.9745, 57.7088] },
  'malmö': { city: 'Malmö', country: 'Sweden', coords: [13.0038, 55.6050] },
  'malmo': { city: 'Malmö', country: 'Sweden', coords: [13.0038, 55.6050] },
  'uppsala': { city: 'Uppsala', country: 'Sweden', coords: [17.6389, 59.8588] },
  'lund': { city: 'Lund', country: 'Sweden', coords: [13.1910, 55.7047] },

  // Germany & DACH
  'berlin': { city: 'Berlin', country: 'Germany', coords: [13.4050, 52.5200] },
  'kreuzberg': { city: 'Berlin', country: 'Germany', coords: [13.4050, 52.5200] },
  'mitte': { city: 'Berlin', country: 'Germany', coords: [13.4050, 52.5200] },
  'neukölln': { city: 'Berlin', country: 'Germany', coords: [13.4050, 52.5200] },
  'munich': { city: 'Munich', country: 'Germany', coords: [11.5820, 48.1351] },
  'münchen': { city: 'Munich', country: 'Germany', coords: [11.5820, 48.1351] },
  'hamburg': { city: 'Hamburg', country: 'Germany', coords: [9.9937, 53.5511] },
  'frankfurt': { city: 'Frankfurt', country: 'Germany', coords: [8.6821, 50.1109] },
  'cologne': { city: 'Cologne', country: 'Germany', coords: [6.9603, 50.9375] },
  'köln': { city: 'Cologne', country: 'Germany', coords: [6.9603, 50.9375] },
  'stuttgart': { city: 'Stuttgart', country: 'Germany', coords: [9.1829, 48.7758] },
  'düsseldorf': { city: 'Düsseldorf', country: 'Germany', coords: [6.7735, 51.2277] },
  'dusseldorf': { city: 'Düsseldorf', country: 'Germany', coords: [6.7735, 51.2277] },
  'leipzig': { city: 'Leipzig', country: 'Germany', coords: [12.3731, 51.3397] },
  'dresden': { city: 'Dresden', country: 'Germany', coords: [13.7373, 51.0509] },
  'nuremberg': { city: 'Nuremberg', country: 'Germany', coords: [11.0767, 49.4521] },
  'nürnberg': { city: 'Nuremberg', country: 'Germany', coords: [11.0767, 49.4521] },
  'bonn': { city: 'Bonn', country: 'Germany', coords: [7.0982, 50.7374] },
  'vienna': { city: 'Vienna', country: 'Austria', coords: [16.3738, 48.2082] },
  'wien': { city: 'Vienna', country: 'Austria', coords: [16.3738, 48.2082] },
  'graz': { city: 'Graz', country: 'Austria', coords: [15.4395, 47.0707] },
  'zurich': { city: 'Zurich', country: 'Switzerland', coords: [8.5417, 47.3769] },
  'zürich': { city: 'Zurich', country: 'Switzerland', coords: [8.5417, 47.3769] },
  'geneva': { city: 'Geneva', country: 'Switzerland', coords: [6.1432, 46.2044] },
  'genève': { city: 'Geneva', country: 'Switzerland', coords: [6.1432, 46.2044] },
  'basel': { city: 'Basel', country: 'Switzerland', coords: [7.5886, 47.5596] },

  // UK & Ireland
  'london': { city: 'London', country: 'United Kingdom', coords: [-0.1276, 51.5074] },
  'canary wharf': { city: 'London', country: 'United Kingdom', coords: [-0.1276, 51.5074] },
  'manchester': { city: 'Manchester', country: 'United Kingdom', coords: [-2.2426, 53.4808] },
  'birmingham': { city: 'Birmingham', country: 'United Kingdom', coords: [-1.8904, 52.4862] },
  'edinburgh': { city: 'Edinburgh', country: 'United Kingdom', coords: [-3.1883, 55.9533] },
  'glasgow': { city: 'Glasgow', country: 'United Kingdom', coords: [-4.2518, 55.8642] },
  'bristol': { city: 'Bristol', country: 'United Kingdom', coords: [-2.5879, 51.4545] },
  'leeds': { city: 'Leeds', country: 'United Kingdom', coords: [-1.5491, 53.8008] },
  'cambridge': { city: 'Cambridge', country: 'United Kingdom', coords: [0.1218, 52.2053] },
  'oxford': { city: 'Oxford', country: 'United Kingdom', coords: [-1.2577, 51.7520] },
  'dublin': { city: 'Dublin', country: 'Ireland', coords: [-6.2603, 53.3498] },
  'cork': { city: 'Cork', country: 'Ireland', coords: [-8.4756, 51.8985] },

  // France & Western Europe
  'paris': { city: 'Paris', country: 'France', coords: [2.3522, 48.8566] },
  'lyon': { city: 'Lyon', country: 'France', coords: [4.8357, 45.7640] },
  'marseille': { city: 'Marseille', country: 'France', coords: [5.3698, 43.2965] },
  'toulouse': { city: 'Toulouse', country: 'France', coords: [1.4442, 43.6047] },
  'nice': { city: 'Nice', country: 'France', coords: [7.2620, 43.7102] },
  'bordeaux': { city: 'Bordeaux', country: 'France', coords: [-0.5792, 44.8378] },
  'lille': { city: 'Lille', country: 'France', coords: [3.0573, 50.6292] },
  'madrid': { city: 'Madrid', country: 'Spain', coords: [-3.7038, 40.4168] },
  'barcelona': { city: 'Barcelona', country: 'Spain', coords: [2.1734, 41.3851] },
  'valencia': { city: 'Valencia', country: 'Spain', coords: [-0.3763, 39.4699] },
  'seville': { city: 'Seville', country: 'Spain', coords: [-5.9845, 37.3891] },
  'sevilla': { city: 'Seville', country: 'Spain', coords: [-5.9845, 37.3891] },
  'malaga': { city: 'Malaga', country: 'Spain', coords: [-4.4214, 36.7213] },
  'málaga': { city: 'Malaga', country: 'Spain', coords: [-4.4214, 36.7213] },
  'milan': { city: 'Milan', country: 'Italy', coords: [9.1900, 45.4642] },
  'milano': { city: 'Milan', country: 'Italy', coords: [9.1900, 45.4642] },
  'rome': { city: 'Rome', country: 'Italy', coords: [12.4964, 41.9028] },
  'roma': { city: 'Rome', country: 'Italy', coords: [12.4964, 41.9028] },
  'turin': { city: 'Turin', country: 'Italy', coords: [7.6869, 45.0703] },
  'torino': { city: 'Turin', country: 'Italy', coords: [7.6869, 45.0703] },
  'lisbon': { city: 'Lisbon', country: 'Portugal', coords: [-9.1393, 38.7223] },
  'lisboa': { city: 'Lisbon', country: 'Portugal', coords: [-9.1393, 38.7223] },
  'porto': { city: 'Porto', country: 'Portugal', coords: [-8.6291, 41.1579] },
  'copenhagen': { city: 'Copenhagen', country: 'Denmark', coords: [12.5683, 55.6761] },
  'københavn': { city: 'Copenhagen', country: 'Denmark', coords: [12.5683, 55.6761] },
  'oslo': { city: 'Oslo', country: 'Norway', coords: [10.7522, 59.9139] },
  'bergen': { city: 'Bergen', country: 'Norway', coords: [5.3221, 60.3913] },
  'helsinki': { city: 'Helsinki', country: 'Finland', coords: [24.9384, 60.1699] },
  'amsterdam': { city: 'Amsterdam', country: 'Netherlands', coords: [4.9041, 52.3676] },
  'schiphol': { city: 'Amsterdam', country: 'Netherlands', coords: [4.9041, 52.3676] },
  'rotterdam': { city: 'Rotterdam', country: 'Netherlands', coords: [4.4777, 51.9244] },
  'the hague': { city: 'The Hague', country: 'Netherlands', coords: [4.3007, 52.0705] },
  'den haag': { city: 'The Hague', country: 'Netherlands', coords: [4.3007, 52.0705] },
  'utrecht': { city: 'Utrecht', country: 'Netherlands', coords: [5.1214, 52.0907] },
  'eindhoven': { city: 'Eindhoven', country: 'Netherlands', coords: [5.4697, 51.4416] },
  'brussels': { city: 'Brussels', country: 'Belgium', coords: [4.3517, 50.8503] },
  'bruxelles': { city: 'Brussels', country: 'Belgium', coords: [4.3517, 50.8503] },
  'antwerp': { city: 'Antwerp', country: 'Belgium', coords: [4.4025, 51.2194] },
  'warsaw': { city: 'Warsaw', country: 'Poland', coords: [21.0122, 52.2297] },
  'warszawa': { city: 'Warsaw', country: 'Poland', coords: [21.0122, 52.2297] },
  'krakow': { city: 'Krakow', country: 'Poland', coords: [19.9450, 50.0647] },
  'kraków': { city: 'Krakow', country: 'Poland', coords: [19.9450, 50.0647] },
  'wroclaw': { city: 'Wroclaw', country: 'Poland', coords: [17.0385, 51.1100] },
  'prague': { city: 'Prague', country: 'Czechia', coords: [14.4378, 50.0755] },
  'praha': { city: 'Prague', country: 'Czechia', coords: [14.4378, 50.0755] },
  'budapest': { city: 'Budapest', country: 'Hungary', coords: [19.0402, 47.4979] },
  'bucharest': { city: 'Bucharest', country: 'Romania', coords: [26.1025, 44.4323] },
  'athens': { city: 'Athens', country: 'Greece', coords: [23.7275, 37.9838] },
  'tallinn': { city: 'Tallinn', country: 'Estonia', coords: [24.7535, 59.4370] },
  'riga': { city: 'Riga', country: 'Latvia', coords: [24.1052, 56.9496] },
  'vilnius': { city: 'Vilnius', country: 'Lithuania', coords: [25.2797, 54.6872] },

  // US & Canada
  'san francisco': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'sf': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'palo alto': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'mountain view': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'sunnyvale': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'cupertino': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'san jose': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'silicon valley': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'menlo park': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'redwood city': { city: 'San Francisco', country: 'United States of America', coords: [-122.4194, 37.7749] },
  'new york': { city: 'New York', country: 'United States of America', coords: [-74.0060, 40.7128] },
  'nyc': { city: 'New York', country: 'United States of America', coords: [-74.0060, 40.7128] },
  'manhattan': { city: 'New York', country: 'United States of America', coords: [-74.0060, 40.7128] },
  'brooklyn': { city: 'New York', country: 'United States of America', coords: [-74.0060, 40.7128] },
  'seattle': { city: 'Seattle', country: 'United States of America', coords: [-122.3321, 47.6062] },
  'redmond': { city: 'Seattle', country: 'United States of America', coords: [-122.3321, 47.6062] },
  'bellevue': { city: 'Seattle', country: 'United States of America', coords: [-122.3321, 47.6062] },
  'austin': { city: 'Austin', country: 'United States of America', coords: [-97.7431, 30.2672] },
  'boston': { city: 'Boston', country: 'United States of America', coords: [-71.0589, 42.3601] },
  'chicago': { city: 'Chicago', country: 'United States of America', coords: [-87.6298, 41.8781] },
  'los angeles': { city: 'Los Angeles', country: 'United States of America', coords: [-118.2437, 34.0522] },
  'la': { city: 'Los Angeles', country: 'United States of America', coords: [-118.2437, 34.0522] },
  'santa monica': { city: 'Los Angeles', country: 'United States of America', coords: [-118.2437, 34.0522] },
  'san diego': { city: 'San Diego', country: 'United States of America', coords: [-117.1611, 32.7157] },
  'denver': { city: 'Denver', country: 'United States of America', coords: [-104.9903, 39.7392] },
  'atlanta': { city: 'Atlanta', country: 'United States of America', coords: [-84.3880, 33.7490] },
  'miami': { city: 'Miami', country: 'United States of America', coords: [-80.1918, 25.7617] },
  'washington': { city: 'Washington D.C.', country: 'United States of America', coords: [-77.0369, 38.9072] },
  'toronto': { city: 'Toronto', country: 'Canada', coords: [-79.3832, 43.6532] },
  'vancouver': { city: 'Vancouver', country: 'Canada', coords: [-123.1207, 49.2827] },
  'montreal': { city: 'Montreal', country: 'Canada', coords: [-73.5673, 45.5017] },
  'montréal': { city: 'Montreal', country: 'Canada', coords: [-73.5673, 45.5017] },

  // Asia / Pacific / Middle East / Latin America / Africa
  'tokyo': { city: 'Tokyo', country: 'Japan', coords: [139.6917, 35.6895] },
  'singapore': { city: 'Singapore', country: 'Singapore', coords: [103.8198, 1.3521] },
  'sydney': { city: 'Sydney', country: 'Australia', coords: [151.2093, -33.8688] },
  'melbourne': { city: 'Melbourne', country: 'Australia', coords: [144.9631, -37.8136] },
  'auckland': { city: 'Auckland', country: 'New Zealand', coords: [174.7633, -36.8485] },
  'bangalore': { city: 'Bangalore', country: 'India', coords: [77.5946, 12.9716] },
  'bengaluru': { city: 'Bangalore', country: 'India', coords: [77.5946, 12.9716] },
  'hyderabad': { city: 'Hyderabad', country: 'India', coords: [78.4867, 17.3850] },
  'mumbai': { city: 'Mumbai', country: 'India', coords: [72.8777, 19.0760] },
  'delhi': { city: 'Delhi', country: 'India', coords: [77.2090, 28.6139] },
  'new delhi': { city: 'Delhi', country: 'India', coords: [77.2090, 28.6139] },
  'gurgaon': { city: 'Delhi', country: 'India', coords: [77.2090, 28.6139] },
  'noida': { city: 'Delhi', country: 'India', coords: [77.2090, 28.6139] },
  'hong kong': { city: 'Hong Kong', country: 'China', coords: [114.1694, 22.3193] },
  'taipei': { city: 'Taipei', country: 'Taiwan', coords: [121.5654, 25.0330] },
  'seoul': { city: 'Seoul', country: 'South Korea', coords: [126.9780, 37.5665] },
  'beijing': { city: 'Beijing', country: 'China', coords: [116.4074, 39.9042] },
  'shanghai': { city: 'Shanghai', country: 'China', coords: [121.4737, 31.2304] },
  'shenzhen': { city: 'Shenzhen', country: 'China', coords: [114.0579, 22.5431] },
  'tel aviv': { city: 'Tel Aviv', country: 'Israel', coords: [34.7818, 32.0853] },
  'dubai': { city: 'Dubai', country: 'United Arab Emirates', coords: [55.2708, 25.2048] },
  'abu dhabi': { city: 'Abu Dhabi', country: 'United Arab Emirates', coords: [54.3773, 24.4539] },
  'sao paulo': { city: 'São Paulo', country: 'Brazil', coords: [-46.6333, -23.5505] },
  'são paulo': { city: 'São Paulo', country: 'Brazil', coords: [-46.6333, -23.5505] },
  'mexico city': { city: 'Mexico City', country: 'Mexico', coords: [-99.1332, 19.4326] },
  'cdmx': { city: 'Mexico City', country: 'Mexico', coords: [-99.1332, 19.4326] },
  'buenos aires': { city: 'Buenos Aires', country: 'Argentina', coords: [-58.3816, -34.6037] },
  'cape town': { city: 'Cape Town', country: 'South Africa', coords: [18.4241, -33.9249] },
  'istanbul': { city: 'Istanbul', country: 'Turkey', coords: [28.9784, 41.0082] },
  'bangkok': { city: 'Bangkok', country: 'Thailand', coords: [100.5018, 13.7563] },
  'kuala lumpur': { city: 'Kuala Lumpur', country: 'Malaysia', coords: [101.6869, 3.1390] },
  'jakarta': { city: 'Jakarta', country: 'Indonesia', coords: [106.8456, -6.2088] },
  'manila': { city: 'Manila', country: 'Philippines', coords: [120.9842, 14.5995] }
};

const COUNTRY_COORDINATES: Record<string, { city: string; country: string; coords: [number, number] }> = {
  'luxembourg': { city: 'Luxembourg', country: 'Luxembourg', coords: [6.1319, 49.6116] },
  'sweden': { city: 'Stockholm', country: 'Sweden', coords: [18.0686, 59.3293] },
  'germany': { city: 'Berlin', country: 'Germany', coords: [13.4050, 52.5200] },
  'france': { city: 'Paris', country: 'France', coords: [2.3522, 48.8566] },
  'united kingdom': { city: 'London', country: 'United Kingdom', coords: [-0.1276, 51.5074] },
  'uk': { city: 'London', country: 'United Kingdom', coords: [-0.1276, 51.5074] },
  'great britain': { city: 'London', country: 'United Kingdom', coords: [-0.1276, 51.5074] },
  'united states': { city: 'Washington D.C.', country: 'United States of America', coords: [-77.0369, 38.9072] },
  'united states of america': { city: 'Washington D.C.', country: 'United States of America', coords: [-77.0369, 38.9072] },
  'usa': { city: 'Washington D.C.', country: 'United States of America', coords: [-77.0369, 38.9072] },
  'us': { city: 'Washington D.C.', country: 'United States of America', coords: [-77.0369, 38.9072] },
  'canada': { city: 'Toronto', country: 'Canada', coords: [-79.3832, 43.6532] },
  'netherlands': { city: 'Amsterdam', country: 'Netherlands', coords: [4.9041, 52.3676] },
  'holland': { city: 'Amsterdam', country: 'Netherlands', coords: [4.9041, 52.3676] },
  'belgium': { city: 'Brussels', country: 'Belgium', coords: [4.3517, 50.8503] },
  'switzerland': { city: 'Zurich', country: 'Switzerland', coords: [8.5417, 47.3769] },
  'austria': { city: 'Vienna', country: 'Austria', coords: [16.3738, 48.2082] },
  'spain': { city: 'Madrid', country: 'Spain', coords: [-3.7038, 40.4168] },
  'italy': { city: 'Rome', country: 'Italy', coords: [12.4964, 41.9028] },
  'portugal': { city: 'Lisbon', country: 'Portugal', coords: [-9.1393, 38.7223] },
  'ireland': { city: 'Dublin', country: 'Ireland', coords: [-6.2603, 53.3498] },
  'denmark': { city: 'Copenhagen', country: 'Denmark', coords: [12.5683, 55.6761] },
  'norway': { city: 'Oslo', country: 'Norway', coords: [10.7522, 59.9139] },
  'finland': { city: 'Helsinki', country: 'Finland', coords: [24.9384, 60.1699] },
  'poland': { city: 'Warsaw', country: 'Poland', coords: [21.0122, 52.2297] },
  'czech republic': { city: 'Prague', country: 'Czechia', coords: [14.4378, 50.0755] },
  'czechia': { city: 'Prague', country: 'Czechia', coords: [14.4378, 50.0755] },
  'hungary': { city: 'Budapest', country: 'Hungary', coords: [19.0402, 47.4979] },
  'romania': { city: 'Bucharest', country: 'Romania', coords: [26.1025, 44.4323] },
  'greece': { city: 'Athens', country: 'Greece', coords: [23.7275, 37.9838] },
  'estonia': { city: 'Tallinn', country: 'Estonia', coords: [24.7535, 59.4370] },
  'latvia': { city: 'Riga', country: 'Latvia', coords: [24.1052, 56.9496] },
  'lithuania': { city: 'Vilnius', country: 'Lithuania', coords: [25.2797, 54.6872] },
  'japan': { city: 'Tokyo', country: 'Japan', coords: [139.6917, 35.6895] },
  'singapore': { city: 'Singapore', country: 'Singapore', coords: [103.8198, 1.3521] },
  'australia': { city: 'Sydney', country: 'Australia', coords: [151.2093, -33.8688] },
  'new zealand': { city: 'Auckland', country: 'New Zealand', coords: [174.7633, -36.8485] },
  'india': { city: 'Bangalore', country: 'India', coords: [77.5946, 12.9716] },
  'china': { city: 'Beijing', country: 'China', coords: [116.4074, 39.9042] },
  'taiwan': { city: 'Taipei', country: 'Taiwan', coords: [121.5654, 25.0330] },
  'south korea': { city: 'Seoul', country: 'South Korea', coords: [126.9780, 37.5665] },
  'korea': { city: 'Seoul', country: 'South Korea', coords: [126.9780, 37.5665] },
  'israel': { city: 'Tel Aviv', country: 'Israel', coords: [34.7818, 32.0853] },
  'united arab emirates': { city: 'Dubai', country: 'United Arab Emirates', coords: [55.2708, 25.2048] },
  'uae': { city: 'Dubai', country: 'United Arab Emirates', coords: [55.2708, 25.2048] },
  'brazil': { city: 'São Paulo', country: 'Brazil', coords: [-46.6333, -23.5505] },
  'mexico': { city: 'Mexico City', country: 'Mexico', coords: [-99.1332, 19.4326] },
  'argentina': { city: 'Buenos Aires', country: 'Argentina', coords: [-58.3816, -34.6037] },
  'chile': { city: 'Santiago', country: 'Chile', coords: [-70.6693, -33.4489] },
  'south africa': { city: 'Cape Town', country: 'South Africa', coords: [18.4241, -33.9249] },
  'turkey': { city: 'Istanbul', country: 'Turkey', coords: [28.9784, 41.0082] },
  'thailand': { city: 'Bangkok', country: 'Thailand', coords: [100.5018, 13.7563] },
  'vietnam': { city: 'Ho Chi Minh City', country: 'Vietnam', coords: [106.6297, 10.8231] },
  'indonesia': { city: 'Jakarta', country: 'Indonesia', coords: [106.8456, -6.2088] },
  'malaysia': { city: 'Kuala Lumpur', country: 'Malaysia', coords: [101.6869, 3.1390] }
};

const ECHARTS_COUNTRY_NAMES: Record<string, string[]> = {
  'Luxembourg': ['Luxembourg'],
  'United States': ['United States of America', 'United States'],
  'United States of America': ['United States of America', 'United States'],
  'USA': ['United States of America', 'United States'],
  'UK': ['United Kingdom'],
  'United Kingdom': ['United Kingdom'],
  'Czech Republic': ['Czech Rep.', 'Czechia', 'Czech Republic'],
  'Czechia': ['Czech Rep.', 'Czechia', 'Czech Republic'],
  'South Korea': ['Korea', 'South Korea'],
  'Korea': ['Korea', 'South Korea'],
  'UAE': ['United Arab Emirates'],
  'United Arab Emirates': ['United Arab Emirates']
};

export function matchLocation(locationRaw?: string, notesRaw?: string): GeoLocationMatch | null {
  const combined = `${locationRaw || ''} ${notesRaw || ''}`.toLowerCase();
  
  if (!combined.trim()) return null;

  // 1. Direct city dictionary check against known keywords
  for (const [key, val] of Object.entries(CITY_COORDINATES)) {
    const regex = new RegExp(`\\b${key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(combined)) {
      return val;
    }
  }

  // 2. Direct country dictionary check
  for (const [key, val] of Object.entries(COUNTRY_COORDINATES)) {
    const regex = new RegExp(`\\b${key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(combined)) {
      return val;
    }
  }

  // 3. Fallback: Parse locationRaw clean string if provided
  if (locationRaw) {
    const cleanStr = locationRaw
      .replace(/[\(\[\{](?:On-site|Hybrid|Remote|Full-time|Part-time)[\)\]\}]/gi, '')
      .split(/[\·\•\|,]/)[0]
      .trim();
    if (cleanStr && cleanStr.length >= 2) {
      const cleanLower = cleanStr.toLowerCase();
      if (CITY_COORDINATES[cleanLower]) return CITY_COORDINATES[cleanLower];
      if (COUNTRY_COORDINATES[cleanLower]) return COUNTRY_COORDINATES[cleanLower];

      let hash = 0;
      for (let i = 0; i < cleanStr.length; i++) {
        hash = cleanStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const lat = ((Math.abs(hash) % 80) / 80) * 80 - 30;
      const lng = ((Math.abs(hash >> 3) % 100) / 100) * 320 - 160;
      return {
        city: cleanStr,
        country: cleanStr,
        coords: [lng, lat]
      };
    }
  }

  return null;
}

// World GeoJSON CDN endpoints with failover
const GEOJSON_URLS = [
  'https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json',
  'https://raw.githubusercontent.com/apache/echarts/master/test/data/map/json/world.json'
];

export function ApplicationMap({ applications }: ApplicationMapProps) {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle ESC key to exit full screen and trigger chart resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Trigger chart resize when toggling full screen
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Parse applications into location groups
  const locationGroups = useMemo(() => {
    const groups: Record<string, {
      city: string;
      country: string;
      coords: [number, number];
      count: number;
      applications: JobApplication[];
    }> = {};

    applications.forEach(app => {
      const match = matchLocation(app.location, `${app.company || ''} ${app.notes || ''}`);
      if (match) {
        const key = `${match.city}-${match.country}`;
        if (!groups[key]) {
          groups[key] = {
            city: match.city,
            country: match.country,
            coords: match.coords,
            count: 0,
            applications: []
          };
        }
        groups[key].count += 1;
        groups[key].applications.push(app);
      }
    });

    return Object.values(groups);
  }, [applications]);

  // Country aggregations for choropleth map
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    locationGroups.forEach(g => {
      counts[g.country] = (counts[g.country] || 0) + g.count;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [locationGroups]);

  // Scatter data format: [[lng, lat, count, city, country, appNames], ...]
  const scatterData = useMemo(() => {
    return locationGroups.map(g => ({
      name: g.city,
      value: [
        g.coords[0],
        g.coords[1],
        g.count,
        g.city,
        g.country,
        g.applications.map(a => `${a.company} - ${a.position}`).join('<br/>• ')
      ]
    }));
  }, [locationGroups]);

  // Register World Map GeoJSON
  useEffect(() => {
    let isMounted = true;

    async function loadMap() {
      if (echarts.getMap('world')) {
        if (isMounted) setIsMapLoaded(true);
        return;
      }

      for (const url of GEOJSON_URLS) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const geoJson = await response.json();
            if (isMounted) {
              echarts.registerMap('world', geoJson);
              setIsMapLoaded(true);
              return;
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch GeoJSON from ${url}`, e);
        }
      }

      if (isMounted) {
        setMapError('Unable to load world map resources.');
      }
    }

    loadMap();

    return () => {
      isMounted = false;
    };
  }, []);

  const option = useMemo<echarts.EChartsOption | null>(() => {
    if (!isMapLoaded) return null;

    const maxVal = Math.max(...scatterData.map(d => (Array.isArray(d.value) ? (d.value[2] as number) : 0)), 1);

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params: any) => {
          if (!params) return '<div></div>';
          
          if (params.seriesType === 'scatter' || (Array.isArray(params.value) && params.value.length >= 3)) {
            const val = Array.isArray(params.value) ? params.value : [];
            const city = val[3] || params.name || 'Location';
            const country = val[4] || '';
            const count = val[2] ?? 0;
            const rolesList = val[5] || '';
            const flag = getCountryFlagEmoji(country);
            return `
              <div style="font-family: sans-serif; padding: 2px;">
                <div style="font-weight: bold; font-size: 13px; color: #38bdf8; margin-bottom: 4px;">
                  ${flag} ${city}${country ? `, ${country}` : ''}
                </div>
                <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 6px;">
                  Total Applications: <strong style="color: #ffffff;">${count}</strong>
                </div>
                ${rolesList ? `<div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #475569; padding-top: 4px; max-height: 120px; overflow-y: auto;">
                  • ${rolesList}
                </div>` : ''}
              </div>
            `;
          }

          if (params.name) {
            const matchedCountry = countryData.find(c => c.name.toLowerCase() === String(params.name).toLowerCase());
            const val = matchedCountry ? matchedCountry.value : 0;
            const flag = getCountryFlagEmoji(params.name);
            return `
              <div style="font-family: sans-serif; padding: 2px;">
                <div style="font-weight: bold; color: #38bdf8;">${flag} ${params.name}</div>
                <div style="font-size: 11px; color: #cbd5e1;">Applications: ${val}</div>
              </div>
            `;
          }

          return `<div style="font-family: sans-serif; padding: 2px; font-size: 11px; color: #cbd5e1;">Applications</div>`;
        }
      },
      geo: {
        map: 'world',
        roam: true,
        aspectScale: 0.75,
        zoom: 1.1,
        label: {
          show: false
        },
        itemStyle: {
          areaColor: '#f1f5f9',
          borderColor: '#cbd5e1',
          borderWidth: 0.8
        },
        emphasis: {
          label: { show: false },
          itemStyle: { areaColor: '#e2e8f0' }
        },
        regions: countryData.flatMap(c => {
          const names = ECHARTS_COUNTRY_NAMES[c.name] || [c.name];
          return names.map(name => ({
            name,
            itemStyle: {
              areaColor: '#bfdbfe',
              borderColor: '#2563eb',
              borderWidth: 1.2
            }
          }));
        })
      },
      visualMap: [
        {
          type: 'continuous',
          orient: 'horizontal',
          calculable: true,
          right: 15,
          bottom: 15,
          seriesIndex: 0,
          min: 1,
          max: maxVal,
          dimension: 2,
          text: ['High', 'Low'],
          textStyle: { color: '#64748b', fontSize: 10 },
          inRange: {
            symbolSize: [12, 30],
            color: ['#60a5fa', '#1d4ed8']
          }
        }
      ],
      series: [
        {
          name: 'City Hubs',
          type: 'scatter',
          coordinateSystem: 'geo',
          geoIndex: 0,
          encode: {
            tooltip: 2,
            label: 2
          },
          data: scatterData,
          itemStyle: {
            color: '#2563eb',
            borderWidth: 2,
            borderColor: '#ffffff'
          }
        }
      ]
    };
  }, [isMapLoaded, scatterData, countryData]);

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-center items-center overflow-auto" : "relative w-full"}>
      <div className={`flex flex-col gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 w-full ${isFullscreen ? 'max-w-7xl h-[92vh] overflow-hidden' : ''}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 m-0">Global Application Map</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              <Building2 size={13} className="text-blue-500" />
              {locationGroups.length} Location Hubs
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              <MapPin size={13} className="text-emerald-500" />
              {applications.length} Total Applications
            </span>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0 text-slate-600 ml-1 cursor-pointer"
              title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        {!isMapLoaded && !mapError && (
          <div className={`${isFullscreen ? 'flex-1 min-h-[500px]' : 'h-[600px]'} w-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 gap-2`}>
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span className="text-xs font-medium">Loading World Map resources...</span>
          </div>
        )}

        {mapError && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
            <Info size={16} />
            {mapError}
          </div>
        )}

        {isMapLoaded && option && (
          <div className={`relative w-full ${isFullscreen ? 'flex-1 min-h-0' : 'h-[600px]'}`}>
            <ReactECharts 
              option={option} 
              style={{ height: '100%', width: '100%' }} 
              notMerge={true} 
            />
          </div>
        )}

        {/* Location Pills Breakdown */}
        {locationGroups.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 mb-2">Locations</div>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {locationGroups.map((g, idx) => (
                <div 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                >
                  <span>{getCountryFlagEmoji(g.country)}</span>
                  <span>{g.city}, {g.country}</span>
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                    {g.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
