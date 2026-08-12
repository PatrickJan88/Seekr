export interface CityOption {
  label: string;
  value: string;
}

export interface CountryLocationGroup {
  country: string;
  cities: CityOption[];
}

export const LOCATION_DATA: CountryLocationGroup[] = [
  {
    country: 'Australia',
    cities: [
      { label: 'Adelaide, SA', value: 'Adelaide, Australia' },
      { label: 'Australia Remote', value: 'Australia Remote, Australia' },
      { label: 'Brisbane, QLD', value: 'Brisbane, Australia' },
      { label: 'Melbourne, VIC', value: 'Melbourne, Australia' },
      { label: 'Perth, WA', value: 'Perth, Australia' },
      { label: 'Sydney, NSW', value: 'Sydney, Australia' },
      { label: 'Custom / Other Australian City', value: 'custom_au' }
    ]
  },
  {
    country: 'Austria',
    cities: [
      { label: 'Graz, Styria', value: 'Graz, Austria' },
      { label: 'Linz, Upper Austria', value: 'Linz, Austria' },
      { label: 'Salzburg', value: 'Salzburg, Austria' },
      { label: 'Vienna', value: 'Vienna, Austria' },
      { label: 'Custom / Other Austrian City', value: 'custom_at' }
    ]
  },
  {
    country: 'Canada',
    cities: [
      { label: 'Calgary, AB', value: 'Calgary, AB, Canada' },
      { label: 'Canada Remote', value: 'Canada Remote, Canada' },
      { label: 'Montreal, QC', value: 'Montreal, QC, Canada' },
      { label: 'Ottawa, ON', value: 'Ottawa, ON, Canada' },
      { label: 'Toronto, ON', value: 'Toronto, ON, Canada' },
      { label: 'Vancouver, BC', value: 'Vancouver, BC, Canada' },
      { label: 'Custom / Other Canadian City', value: 'custom_ca' }
    ]
  },
  {
    country: 'China',
    cities: [
      { label: 'Beijing', value: 'Beijing, China' },
      { label: 'China Remote', value: 'China Remote, China' },
      { label: 'Hong Kong', value: 'Hong Kong, China' },
      { label: 'Shanghai', value: 'Shanghai, China' },
      { label: 'Shenzhen, Guangdong', value: 'Shenzhen, China' },
      { label: 'Taipei, Taiwan', value: 'Taipei, Taiwan' },
      { label: 'Custom / Other Chinese City', value: 'custom_cn' }
    ]
  },
  {
    country: 'Czechia',
    cities: [
      { label: 'Brno, South Moravian', value: 'Brno, Czechia' },
      { label: 'Czechia Remote', value: 'Czechia Remote, Czechia' },
      { label: 'Prague', value: 'Prague, Czechia' },
      { label: 'Custom / Other Czech City', value: 'custom_cz' }
    ]
  },
  {
    country: 'Denmark',
    cities: [
      { label: 'Aarhus, Central Denmark', value: 'Aarhus, Denmark' },
      { label: 'Copenhagen', value: 'Copenhagen, Denmark' },
      { label: 'Denmark Remote', value: 'Denmark Remote, Denmark' },
      { label: 'Custom / Other Danish City', value: 'custom_dk' }
    ]
  },
  {
    country: 'Finland',
    cities: [
      { label: 'Espoo, Uusimaa', value: 'Espoo, Finland' },
      { label: 'Finland Remote', value: 'Finland Remote, Finland' },
      { label: 'Helsinki, Uusimaa', value: 'Helsinki, Finland' },
      { label: 'Tampere, Pirkanmaa', value: 'Tampere, Finland' },
      { label: 'Custom / Other Finnish City', value: 'custom_fi' }
    ]
  },
  {
    country: 'France',
    cities: [
      { label: 'Bordeaux, Nouvelle-Aquitaine', value: 'Bordeaux, France' },
      { label: 'France Remote', value: 'France Remote, France' },
      { label: 'Lille, Hauts-de-France', value: 'Lille, France' },
      { label: 'Lyon, Auvergne-Rhône-Alpes', value: 'Lyon, France' },
      { label: 'Marseille, Provence-Alpes-Côte d\'Azur', value: 'Marseille, France' },
      { label: 'Nice, Provence-Alpes-Côte d\'Azur', value: 'Nice, France' },
      { label: 'Paris, Île-de-France', value: 'Paris, France' },
      { label: 'Toulouse, Occitanie', value: 'Toulouse, France' },
      { label: 'Custom / Other French City', value: 'custom_fr' }
    ]
  },
  {
    country: 'Germany',
    cities: [
      { label: 'Berlin', value: 'Berlin, Germany' },
      { label: 'Cologne, North Rhine-Westphalia', value: 'Cologne, Germany' },
      { label: 'Düsseldorf, North Rhine-Westphalia', value: 'Düsseldorf, Germany' },
      { label: 'Frankfurt, Hesse', value: 'Frankfurt, Germany' },
      { label: 'Germany Remote', value: 'Germany Remote, Germany' },
      { label: 'Hamburg', value: 'Hamburg, Germany' },
      { label: 'Leipzig, Saxony', value: 'Leipzig, Germany' },
      { label: 'Munich, Bavaria', value: 'Munich, Germany' },
      { label: 'Stuttgart, Baden-Württemberg', value: 'Stuttgart, Germany' },
      { label: 'Custom / Other German City', value: 'custom_de' }
    ]
  },
  {
    country: 'India',
    cities: [
      { label: 'Bangalore, Karnataka', value: 'Bangalore, India' },
      { label: 'Chennai, Tamil Nadu', value: 'Chennai, India' },
      { label: 'Delhi / NCR', value: 'Delhi, India' },
      { label: 'Hyderabad, Telangana', value: 'Hyderabad, India' },
      { label: 'India Remote', value: 'India Remote, India' },
      { label: 'Mumbai, Maharashtra', value: 'Mumbai, India' },
      { label: 'Pune, Maharashtra', value: 'Pune, India' },
      { label: 'Custom / Other Indian City', value: 'custom_in' }
    ]
  },
  {
    country: 'Ireland',
    cities: [
      { label: 'Cork', value: 'Cork, Ireland' },
      { label: 'Dublin', value: 'Dublin, Ireland' },
      { label: 'Galway', value: 'Galway, Ireland' },
      { label: 'Ireland Remote', value: 'Ireland Remote, Ireland' },
      { label: 'Custom / Other Irish City', value: 'custom_ie' }
    ]
  },
  {
    country: 'Italy',
    cities: [
      { label: 'Italy Remote', value: 'Italy Remote, Italy' },
      { label: 'Milan, Lombardy', value: 'Milan, Italy' },
      { label: 'Rome, Lazio', value: 'Rome, Italy' },
      { label: 'Turin, Piedmont', value: 'Turin, Italy' },
      { label: 'Custom / Other Italian City', value: 'custom_it' }
    ]
  },
  {
    country: 'Japan',
    cities: [
      { label: 'Japan Remote', value: 'Japan Remote, Japan' },
      { label: 'Kyoto', value: 'Kyoto, Japan' },
      { label: 'Osaka', value: 'Osaka, Japan' },
      { label: 'Tokyo', value: 'Tokyo, Japan' },
      { label: 'Yokohama, Kanagawa', value: 'Yokohama, Japan' },
      { label: 'Custom / Other Japanese City', value: 'custom_jp' }
    ]
  },
  {
    country: 'Luxembourg',
    cities: [
      { label: 'Bertrange', value: 'Bertrange, Luxembourg' },
      { label: 'Esch-sur-Alzette', value: 'Esch-sur-Alzette, Luxembourg' },
      { label: 'Kirchberg', value: 'Kirchberg, Luxembourg' },
      { label: 'Luxembourg City', value: 'Luxembourg' },
      { label: 'Strassen', value: 'Strassen, Luxembourg' },
      { label: 'Custom / Other Luxembourg City', value: 'custom_lu' }
    ]
  },
  {
    country: 'Netherlands',
    cities: [
      { label: 'Amsterdam, North Holland', value: 'Amsterdam, Netherlands' },
      { label: 'Eindhoven, North Brabant', value: 'Eindhoven, Netherlands' },
      { label: 'Netherlands Remote', value: 'Netherlands Remote, Netherlands' },
      { label: 'Rotterdam, South Holland', value: 'Rotterdam, Netherlands' },
      { label: 'The Hague, South Holland', value: 'The Hague, Netherlands' },
      { label: 'Utrecht', value: 'Utrecht, Netherlands' },
      { label: 'Custom / Other Dutch City', value: 'custom_nl' }
    ]
  },
  {
    country: 'Norway',
    cities: [
      { label: 'Bergen, Vestland', value: 'Bergen, Norway' },
      { label: 'Norway Remote', value: 'Norway Remote, Norway' },
      { label: 'Oslo', value: 'Oslo, Norway' },
      { label: 'Trondheim, Trøndelag', value: 'Trondheim, Norway' },
      { label: 'Custom / Other Norwegian City', value: 'custom_no' }
    ]
  },
  {
    country: 'Poland',
    cities: [
      { label: 'Gdansk, Pomeranian', value: 'Gdansk, Poland' },
      { label: 'Krakow, Lesser Poland', value: 'Krakow, Poland' },
      { label: 'Poland Remote', value: 'Poland Remote, Poland' },
      { label: 'Warsaw, Masovian', value: 'Warsaw, Poland' },
      { label: 'Wroclaw, Lower Silesian', value: 'Wroclaw, Poland' },
      { label: 'Custom / Other Polish City', value: 'custom_pl' }
    ]
  },
  {
    country: 'Portugal',
    cities: [
      { label: 'Lisbon', value: 'Lisbon, Portugal' },
      { label: 'Porto', value: 'Porto, Portugal' },
      { label: 'Portugal Remote', value: 'Portugal Remote, Portugal' },
      { label: 'Custom / Other Portuguese City', value: 'custom_pt' }
    ]
  },
  {
    country: 'Singapore',
    cities: [
      { label: 'Singapore', value: 'Singapore' },
      { label: 'Singapore Remote', value: 'Singapore Remote, Singapore' }
    ]
  },
  {
    country: 'Spain',
    cities: [
      { label: 'Barcelona, Catalonia', value: 'Barcelona, Spain' },
      { label: 'Madrid', value: 'Madrid, Spain' },
      { label: 'Malaga, Andalusia', value: 'Malaga, Spain' },
      { label: 'Seville, Andalusia', value: 'Seville, Spain' },
      { label: 'Spain Remote', value: 'Spain Remote, Spain' },
      { label: 'Valencia', value: 'Valencia, Spain' },
      { label: 'Custom / Other Spanish City', value: 'custom_es' }
    ]
  },
  {
    country: 'Sweden',
    cities: [
      { label: 'Gothenburg, Västra Götaland', value: 'Gothenburg, Sweden' },
      { label: 'Lund, Skåne', value: 'Lund, Sweden' },
      { label: 'Malmö, Skåne', value: 'Malmö, Sweden' },
      { label: 'Solna, Stockholm', value: 'Solna, Stockholm, Sweden' },
      { label: 'Stockholm', value: 'Stockholm, Sweden' },
      { label: 'Sweden Remote', value: 'Sweden Remote, Sweden' },
      { label: 'Uppsala', value: 'Uppsala, Sweden' },
      { label: 'Custom / Other Swedish City', value: 'custom_se' }
    ]
  },
  {
    country: 'Switzerland',
    cities: [
      { label: 'Basel', value: 'Basel, Switzerland' },
      { label: 'Bern', value: 'Bern, Switzerland' },
      { label: 'Geneva', value: 'Geneva, Switzerland' },
      { label: 'Lausanne, Vaud', value: 'Lausanne, Switzerland' },
      { label: 'Switzerland Remote', value: 'Switzerland Remote, Switzerland' },
      { label: 'Zurich', value: 'Zurich, Switzerland' },
      { label: 'Custom / Other Swiss City', value: 'custom_ch' }
    ]
  },
  {
    country: 'United Arab Emirates',
    cities: [
      { label: 'Abu Dhabi', value: 'Abu Dhabi, UAE' },
      { label: 'Dubai', value: 'Dubai, UAE' },
      { label: 'UAE Remote', value: 'UAE Remote, UAE' }
    ]
  },
  {
    country: 'United Kingdom',
    cities: [
      { label: 'Birmingham, England', value: 'Birmingham, United Kingdom' },
      { label: 'Bristol, England', value: 'Bristol, United Kingdom' },
      { label: 'Cambridge, England', value: 'Cambridge, United Kingdom' },
      { label: 'Edinburgh, Scotland', value: 'Edinburgh, United Kingdom' },
      { label: 'Glasgow, Scotland', value: 'Glasgow, United Kingdom' },
      { label: 'Leeds, England', value: 'Leeds, United Kingdom' },
      { label: 'London, England', value: 'London, United Kingdom' },
      { label: 'Manchester, England', value: 'Manchester, United Kingdom' },
      { label: 'Oxford, England', value: 'Oxford, United Kingdom' },
      { label: 'UK Remote', value: 'UK Remote, United Kingdom' },
      { label: 'Custom / Other UK City', value: 'custom_uk' }
    ]
  },
  {
    country: 'United States',
    cities: [
      { label: 'Atlanta, GA', value: 'Atlanta, GA, United States' },
      { label: 'Austin, TX', value: 'Austin, TX, United States' },
      { label: 'Boston, MA', value: 'Boston, MA, United States' },
      { label: 'Chicago, IL', value: 'Chicago, IL, United States' },
      { label: 'Denver, CO', value: 'Denver, CO, United States' },
      { label: 'Los Angeles, CA', value: 'Los Angeles, CA, United States' },
      { label: 'Miami, FL', value: 'Miami, FL, United States' },
      { label: 'New York, NY', value: 'New York, NY, United States' },
      { label: 'San Diego, CA', value: 'San Diego, CA, United States' },
      { label: 'San Francisco, CA', value: 'San Francisco, CA, United States' },
      { label: 'San Jose / Silicon Valley, CA', value: 'San Jose, CA, United States' },
      { label: 'Seattle, WA', value: 'Seattle, WA, United States' },
      { label: 'US Remote', value: 'US Remote, United States' },
      { label: 'Washington, D.C.', value: 'Washington D.C., United States' },
      { label: 'Custom / Other US City', value: 'custom_us' }
    ]
  },
  {
    country: 'Other Country',
    cities: [
      { label: 'Custom Location Input', value: 'custom_other' }
    ]
  }
];

export function parseLocationToGroup(locString?: string): {
  country: string;
  cityValue: string;
  customText?: string;
} {
  if (!locString || !locString.trim()) {
    return { country: '', cityValue: '' };
  }

  const clean = locString.trim();
  const lower = clean.toLowerCase();

  // 1. Exact match on city value
  for (const group of LOCATION_DATA) {
    for (const city of group.cities) {
      if (city.value.toLowerCase() === lower) {
        return { country: group.country, cityValue: city.value };
      }
    }
  }

  // 2. Exact match or partial match on city label/value (where lower matches or contains city label)
  for (const group of LOCATION_DATA) {
    for (const city of group.cities) {
      if (!city.value.startsWith('custom_')) {
        const cLabel = city.label.toLowerCase();
        const cVal = city.value.toLowerCase();
        if (lower === cLabel || lower === cVal || lower.includes(cLabel)) {
          return { country: group.country, cityValue: city.value };
        }
      }
    }
  }

  // 3. Match on country name
  for (const group of LOCATION_DATA) {
    if (group.country !== 'Other Country' && lower.includes(group.country.toLowerCase())) {
      const customCityVal = group.cities.find(c => c.value.startsWith('custom_'))?.value || 'custom_other';
      let customText = clean;
      const countryRegex = new RegExp(`,\\s*${group.country}$`, 'i');
      if (countryRegex.test(customText)) {
        customText = customText.replace(countryRegex, '').trim();
      } else if (customText.toLowerCase() === group.country.toLowerCase()) {
        customText = '';
      }
      return {
        country: group.country,
        cityValue: customCityVal,
        customText
      };
    }
  }

  // 4. Fallback to Other Country
  return {
    country: 'Other Country',
    cityValue: 'custom_other',
    customText: clean
  };
}
