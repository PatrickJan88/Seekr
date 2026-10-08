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
    country: 'Albania',
    cities: [
      { label: 'Durrës', value: 'Durrës, Albania' },
      { label: 'Shkodër', value: 'Shkodër, Albania' },
      { label: 'Tirana', value: 'Tirana, Albania' },
      { label: 'Vlorë', value: 'Vlorë, Albania' },
      { label: 'Custom / Other Albanian City', value: 'custom_al' }
    ]
  },
  {
    country: 'Andorra',
    cities: [
      { label: 'Andorra la Vella', value: 'Andorra la Vella, Andorra' },
      { label: 'Encamp', value: 'Encamp, Andorra' },
      { label: 'Escaldes-Engordany', value: 'Escaldes-Engordany, Andorra' },
      { label: 'Custom / Other Andorran City', value: 'custom_ad' }
    ]
  },
  {
    country: 'Australia',
    cities: [
      { label: 'Adelaide, SA', value: 'Adelaide, Australia' },
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
      { label: 'Innsbruck, Tyrol', value: 'Innsbruck, Austria' },
      { label: 'Linz, Upper Austria', value: 'Linz, Austria' },
      { label: 'Salzburg', value: 'Salzburg, Austria' },
      { label: 'Vienna', value: 'Vienna, Austria' },
      { label: 'Custom / Other Austrian City', value: 'custom_at' }
    ]
  },
  {
    country: 'Belarus',
    cities: [
      { label: 'Brest', value: 'Brest, Belarus' },
      { label: 'Gomel', value: 'Gomel, Belarus' },
      { label: 'Grodno', value: 'Grodno, Belarus' },
      { label: 'Minsk', value: 'Minsk, Belarus' },
      { label: 'Custom / Other Belarusian City', value: 'custom_by' }
    ]
  },
  {
    country: 'Belgium',
    cities: [
      { label: 'Antwerp, Flanders', value: 'Antwerp, Belgium' },
      { label: 'Bruges, Flanders', value: 'Bruges, Belgium' },
      { label: 'Brussels', value: 'Brussels, Belgium' },
      { label: 'Ghent, Flanders', value: 'Ghent, Belgium' },
      { label: 'Leuven, Flemish Brabant', value: 'Leuven, Belgium' },
      { label: 'Liège, Wallonia', value: 'Liège, Belgium' },
      { label: 'Namur, Wallonia', value: 'Namur, Belgium' },
      { label: 'Custom / Other Belgian City', value: 'custom_be' }
    ]
  },
  {
    country: 'Bosnia and Herzegovina',
    cities: [
      { label: 'Banja Luka', value: 'Banja Luka, Bosnia and Herzegovina' },
      { label: 'Mostar', value: 'Mostar, Bosnia and Herzegovina' },
      { label: 'Sarajevo', value: 'Sarajevo, Bosnia and Herzegovina' },
      { label: 'Tuzla', value: 'Tuzla, Bosnia and Herzegovina' },
      { label: 'Custom / Other Bosnian City', value: 'custom_ba' }
    ]
  },
  {
    country: 'Bulgaria',
    cities: [
      { label: 'Burgas', value: 'Burgas, Bulgaria' },
      { label: 'Plovdiv', value: 'Plovdiv, Bulgaria' },
      { label: 'Ruse', value: 'Ruse, Bulgaria' },
      { label: 'Sofia', value: 'Sofia, Bulgaria' },
      { label: 'Varna', value: 'Varna, Bulgaria' },
      { label: 'Custom / Other Bulgarian City', value: 'custom_bg' }
    ]
  },
  {
    country: 'Canada',
    cities: [
      { label: 'Calgary, AB', value: 'Calgary, AB, Canada' },
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
      { label: 'Hong Kong', value: 'Hong Kong, China' },
      { label: 'Shanghai', value: 'Shanghai, China' },
      { label: 'Shenzhen, Guangdong', value: 'Shenzhen, China' },
      { label: 'Taipei, Taiwan', value: 'Taipei, Taiwan' },
      { label: 'Custom / Other Chinese City', value: 'custom_cn' }
    ]
  },
  {
    country: 'Croatia',
    cities: [
      { label: 'Dubrovnik', value: 'Dubrovnik, Croatia' },
      { label: 'Osijek', value: 'Osijek, Croatia' },
      { label: 'Rijeka', value: 'Rijeka, Croatia' },
      { label: 'Split', value: 'Split, Croatia' },
      { label: 'Zadar', value: 'Zadar, Croatia' },
      { label: 'Zagreb', value: 'Zagreb, Croatia' },
      { label: 'Custom / Other Croatian City', value: 'custom_hr' }
    ]
  },
  {
    country: 'Cyprus',
    cities: [
      { label: 'Larnaca', value: 'Larnaca, Cyprus' },
      { label: 'Limassol', value: 'Limassol, Cyprus' },
      { label: 'Nicosia', value: 'Nicosia, Cyprus' },
      { label: 'Paphos', value: 'Paphos, Cyprus' },
      { label: 'Custom / Other Cypriot City', value: 'custom_cy' }
    ]
  },
  {
    country: 'Czechia',
    cities: [
      { label: 'Brno, South Moravian', value: 'Brno, Czechia' },
      { label: 'Ostrava, Moravian-Silesian', value: 'Ostrava, Czechia' },
      { label: 'Plzeň, Plzeň Region', value: 'Plzeň, Czechia' },
      { label: 'Prague', value: 'Prague, Czechia' },
      { label: 'Custom / Other Czech City', value: 'custom_cz' }
    ]
  },
  {
    country: 'Denmark',
    cities: [
      { label: 'Aalborg, North Denmark', value: 'Aalborg, Denmark' },
      { label: 'Aarhus, Central Denmark', value: 'Aarhus, Denmark' },
      { label: 'Copenhagen', value: 'Copenhagen, Denmark' },
      { label: 'Odense, Funen', value: 'Odense, Denmark' },
      { label: 'Custom / Other Danish City', value: 'custom_dk' }
    ]
  },
  {
    country: 'Estonia',
    cities: [
      { label: 'Narva, Ida-Viru', value: 'Narva, Estonia' },
      { label: 'Pärnu', value: 'Pärnu, Estonia' },
      { label: 'Tallinn, Harju', value: 'Tallinn, Estonia' },
      { label: 'Tartu', value: 'Tartu, Estonia' },
      { label: 'Custom / Other Estonian City', value: 'custom_ee' }
    ]
  },
  {
    country: 'Finland',
    cities: [
      { label: 'Espoo, Uusimaa', value: 'Espoo, Finland' },
      { label: 'Helsinki, Uusimaa', value: 'Helsinki, Finland' },
      { label: 'Oulu, North Ostrobothnia', value: 'Oulu, Finland' },
      { label: 'Tampere, Pirkanmaa', value: 'Tampere, Finland' },
      { label: 'Turku, Southwest Finland', value: 'Turku, Finland' },
      { label: 'Custom / Other Finnish City', value: 'custom_fi' }
    ]
  },
  {
    country: 'France',
    cities: [
      { label: 'Bordeaux, Nouvelle-Aquitaine', value: 'Bordeaux, France' },
      { label: 'Lille, Hauts-de-France', value: 'Lille, France' },
      { label: 'Lyon, Auvergne-Rhône-Alpes', value: 'Lyon, France' },
      { label: 'Marseille, Provence-Alpes-Côte d\'Azur', value: 'Marseille, France' },
      { label: 'Nantes, Pays de la Loire', value: 'Nantes, France' },
      { label: 'Nice, Provence-Alpes-Côte d\'Azur', value: 'Nice, France' },
      { label: 'Paris, Île-de-France', value: 'Paris, France' },
      { label: 'Strasbourg, Grand Est', value: 'Strasbourg, France' },
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
      { label: 'Hamburg', value: 'Hamburg, Germany' },
      { label: 'Munich, Bavaria', value: 'Munich, Germany' },
      { label: 'Stuttgart, Baden-Württemberg', value: 'Stuttgart, Germany' },
      { label: 'Custom / Other German City', value: 'custom_de' }
    ]
  },
  {
    country: 'Greece',
    cities: [
      { label: 'Athens, Attica', value: 'Athens, Greece' },
      { label: 'Heraklion, Crete', value: 'Heraklion, Greece' },
      { label: 'Patras, Western Greece', value: 'Patras, Greece' },
      { label: 'Thessaloniki, Central Macedonia', value: 'Thessaloniki, Greece' },
      { label: 'Custom / Other Greek City', value: 'custom_gr' }
    ]
  },
  {
    country: 'Hungary',
    cities: [
      { label: 'Budapest', value: 'Budapest, Hungary' },
      { label: 'Debrecen, Hajdú-Bihar', value: 'Debrecen, Hungary' },
      { label: 'Győr, Győr-Moson-Sopron', value: 'Győr, Hungary' },
      { label: 'Pécs, Baranya', value: 'Pécs, Hungary' },
      { label: 'Szeged, Csongrád-Csanád', value: 'Szeged, Hungary' },
      { label: 'Custom / Other Hungarian City', value: 'custom_hu' }
    ]
  },
  {
    country: 'Iceland',
    cities: [
      { label: 'Akureyri', value: 'Akureyri, Iceland' },
      { label: 'Hafnarfjörður', value: 'Hafnarfjörður, Iceland' },
      { label: 'Kópavogur', value: 'Kópavogur, Iceland' },
      { label: 'Reykjavik', value: 'Reykjavik, Iceland' },
      { label: 'Custom / Other Icelandic City', value: 'custom_is' }
    ]
  },
  {
    country: 'India',
    cities: [
      { label: 'Bangalore / Bengaluru, KA', value: 'Bangalore, India' },
      { label: 'Chennai, TN', value: 'Chennai, India' },
      { label: 'Delhi / NCR', value: 'Delhi, India' },
      { label: 'Hyderabad, TS', value: 'Hyderabad, India' },
      { label: 'Mumbai / Pune, MH', value: 'Mumbai, India' },
      { label: 'Custom / Other Indian City', value: 'custom_in' }
    ]
  },
  {
    country: 'Ireland',
    cities: [
      { label: 'Cork, Munster', value: 'Cork, Ireland' },
      { label: 'Dublin, Leinster', value: 'Dublin, Ireland' },
      { label: 'Galway, Connacht', value: 'Galway, Ireland' },
      { label: 'Limerick, Munster', value: 'Limerick, Ireland' },
      { label: 'Custom / Other Irish City', value: 'custom_ie' }
    ]
  },
  {
    country: 'Italy',
    cities: [
      { label: 'Bologna, Emilia-Romagna', value: 'Bologna, Italy' },
      { label: 'Florence, Tuscany', value: 'Florence, Italy' },
      { label: 'Milan, Lombardy', value: 'Milan, Italy' },
      { label: 'Naples, Campania', value: 'Naples, Italy' },
      { label: 'Rome, Lazio', value: 'Rome, Italy' },
      { label: 'Turin, Piedmont', value: 'Turin, Italy' },
      { label: 'Venice, Veneto', value: 'Venice, Italy' },
      { label: 'Custom / Other Italian City', value: 'custom_it' }
    ]
  },
  {
    country: 'Japan',
    cities: [
      { label: 'Fukuoka, Kyushu', value: 'Fukuoka, Japan' },
      { label: 'Kyoto, Kansai', value: 'Kyoto, Japan' },
      { label: 'Nagoya, Aichi', value: 'Nagoya, Japan' },
      { label: 'Osaka, Kansai', value: 'Osaka, Japan' },
      { label: 'Tokyo, Kanto', value: 'Tokyo, Japan' },
      { label: 'Custom / Other Japanese City', value: 'custom_jp' }
    ]
  },
  {
    country: 'Kosovo',
    cities: [
      { label: 'Mitrovica', value: 'Mitrovica, Kosovo' },
      { label: 'Peja', value: 'Peja, Kosovo' },
      { label: 'Pristina', value: 'Pristina, Kosovo' },
      { label: 'Prizren', value: 'Prizren, Kosovo' },
      { label: 'Custom / Other Kosovar City', value: 'custom_xk' }
    ]
  },
  {
    country: 'Latvia',
    cities: [
      { label: 'Daugavpils', value: 'Daugavpils, Latvia' },
      { label: 'Jelgava', value: 'Jelgava, Latvia' },
      { label: 'Jūrmala', value: 'Jūrmala, Latvia' },
      { label: 'Liepāja', value: 'Liepāja, Latvia' },
      { label: 'Riga', value: 'Riga, Latvia' },
      { label: 'Custom / Other Latvian City', value: 'custom_lv' }
    ]
  },
  {
    country: 'Liechtenstein',
    cities: [
      { label: 'Balzers', value: 'Balzers, Liechtenstein' },
      { label: 'Schaan', value: 'Schaan, Liechtenstein' },
      { label: 'Vaduz', value: 'Vaduz, Liechtenstein' },
      { label: 'Custom / Other Liechtenstein City', value: 'custom_li' }
    ]
  },
  {
    country: 'Lithuania',
    cities: [
      { label: 'Kaunas', value: 'Kaunas, Lithuania' },
      { label: 'Klaipėda', value: 'Klaipėda, Lithuania' },
      { label: 'Panevėžys', value: 'Panevėžys, Lithuania' },
      { label: 'Šiauliai', value: 'Šiauliai, Lithuania' },
      { label: 'Vilnius', value: 'Vilnius, Lithuania' },
      { label: 'Custom / Other Lithuanian City', value: 'custom_lt' }
    ]
  },
  {
    country: 'Luxembourg',
    cities: [
      { label: 'Differdange', value: 'Differdange, Luxembourg' },
      { label: 'Dudelange', value: 'Dudelange, Luxembourg' },
      { label: 'Esch-sur-Alzette', value: 'Esch-sur-Alzette, Luxembourg' },
      { label: 'Luxembourg City', value: 'Luxembourg City, Luxembourg' },
      { label: 'Custom / Other Luxembourgish City', value: 'custom_lu' }
    ]
  },
  {
    country: 'Malta',
    cities: [
      { label: 'Birkirkara', value: 'Birkirkara, Malta' },
      { label: 'Sliema', value: 'Sliema, Malta' },
      { label: 'St. Julian\'s', value: 'St. Julian\'s, Malta' },
      { label: 'Valletta', value: 'Valletta, Malta' },
      { label: 'Custom / Other Maltese City', value: 'custom_mt' }
    ]
  },
  {
    country: 'Moldova',
    cities: [
      { label: 'Bălți', value: 'Bălți, Moldova' },
      { label: 'Chisinau', value: 'Chisinau, Moldova' },
      { label: 'Tiraspol', value: 'Tiraspol, Moldova' },
      { label: 'Custom / Other Moldovan City', value: 'custom_md' }
    ]
  },
  {
    country: 'Monaco',
    cities: [
      { label: 'Fontvieille', value: 'Fontvieille, Monaco' },
      { label: 'La Condamine', value: 'La Condamine, Monaco' },
      { label: 'Monaco-Ville', value: 'Monaco-Ville, Monaco' },
      { label: 'Monte Carlo', value: 'Monte Carlo, Monaco' },
      { label: 'Custom / Other Monegasque City', value: 'custom_mc' }
    ]
  },
  {
    country: 'Montenegro',
    cities: [
      { label: 'Budva', value: 'Budva, Montenegro' },
      { label: 'Kotor', value: 'Kotor, Montenegro' },
      { label: 'Nikšić', value: 'Nikšić, Montenegro' },
      { label: 'Podgorica', value: 'Podgorica, Montenegro' },
      { label: 'Custom / Other Montenegrin City', value: 'custom_me' }
    ]
  },
  {
    country: 'Netherlands',
    cities: [
      { label: 'Amsterdam, North Holland', value: 'Amsterdam, Netherlands' },
      { label: 'Eindhoven, North Brabant', value: 'Eindhoven, Netherlands' },
      { label: 'Groningen', value: 'Groningen, Netherlands' },
      { label: 'Rotterdam, South Holland', value: 'Rotterdam, Netherlands' },
      { label: 'The Hague, South Holland', value: 'The Hague, Netherlands' },
      { label: 'Utrecht', value: 'Utrecht, Netherlands' },
      { label: 'Custom / Other Dutch City', value: 'custom_nl' }
    ]
  },
  {
    country: 'North Macedonia',
    cities: [
      { label: 'Bitola', value: 'Bitola, North Macedonia' },
      { label: 'Kumanovo', value: 'Kumanovo, North Macedonia' },
      { label: 'Ohrid', value: 'Ohrid, North Macedonia' },
      { label: 'Skopje', value: 'Skopje, North Macedonia' },
      { label: 'Custom / Other Macedonian City', value: 'custom_mk' }
    ]
  },
  {
    country: 'Norway',
    cities: [
      { label: 'Bergen, Vestland', value: 'Bergen, Norway' },
      { label: 'Oslo', value: 'Oslo, Norway' },
      { label: 'Stavanger, Rogaland', value: 'Stavanger, Norway' },
      { label: 'Tromsø, Troms', value: 'Tromsø, Norway' },
      { label: 'Trondheim, Trøndelag', value: 'Trondheim, Norway' },
      { label: 'Custom / Other Norwegian City', value: 'custom_no' }
    ]
  },
  {
    country: 'Poland',
    cities: [
      { label: 'Gdańsk, Pomeranian', value: 'Gdańsk, Poland' },
      { label: 'Katowice, Silesian', value: 'Katowice, Poland' },
      { label: 'Krakow, Lesser Poland', value: 'Krakow, Poland' },
      { label: 'Poznań, Greater Poland', value: 'Poznań, Poland' },
      { label: 'Warsaw, Masovian', value: 'Warsaw, Poland' },
      { label: 'Wrocław, Lower Silesian', value: 'Wrocław, Poland' },
      { label: 'Custom / Other Polish City', value: 'custom_pl' }
    ]
  },
  {
    country: 'Portugal',
    cities: [
      { label: 'Braga', value: 'Braga, Portugal' },
      { label: 'Coimbra', value: 'Coimbra, Portugal' },
      { label: 'Faro, Algarve', value: 'Faro, Portugal' },
      { label: 'Lisbon', value: 'Lisbon, Portugal' },
      { label: 'Porto', value: 'Porto, Portugal' },
      { label: 'Custom / Other Portuguese City', value: 'custom_pt' }
    ]
  },
  {
    country: 'Romania',
    cities: [
      { label: 'Brașov, Transylvania', value: 'Brașov, Romania' },
      { label: 'Bucharest', value: 'Bucharest, Romania' },
      { label: 'Cluj-Napoca, Transylvania', value: 'Cluj-Napoca, Romania' },
      { label: 'Constanța, Dobrogea', value: 'Constanța, Romania' },
      { label: 'Iași, Moldavia', value: 'Iași, Romania' },
      { label: 'Timișoara, Banat', value: 'Timișoara, Romania' },
      { label: 'Custom / Other Romanian City', value: 'custom_ro' }
    ]
  },
  {
    country: 'Russia',
    cities: [
      { label: 'Kazan, Tatarstan', value: 'Kazan, Russia' },
      { label: 'Moscow', value: 'Moscow, Russia' },
      { label: 'Nizhny Novgorod', value: 'Nizhny Novgorod, Russia' },
      { label: 'Novosibirsk, Siberia', value: 'Novosibirsk, Russia' },
      { label: 'Saint Petersburg', value: 'Saint Petersburg, Russia' },
      { label: 'Yekaterinburg, Urals', value: 'Yekaterinburg, Russia' },
      { label: 'Custom / Other Russian City', value: 'custom_ru' }
    ]
  },
  {
    country: 'San Marino',
    cities: [
      { label: 'Borgo Maggiore', value: 'Borgo Maggiore, San Marino' },
      { label: 'San Marino', value: 'San Marino, San Marino' },
      { label: 'Serravalle', value: 'Serravalle, San Marino' },
      { label: 'Custom / Other Sammarinese City', value: 'custom_sm' }
    ]
  },
  {
    country: 'Serbia',
    cities: [
      { label: 'Belgrade', value: 'Belgrade, Serbia' },
      { label: 'Kragujevac', value: 'Kragujevac, Serbia' },
      { label: 'Niš', value: 'Niš, Serbia' },
      { label: 'Novi Sad, Vojvodina', value: 'Novi Sad, Serbia' },
      { label: 'Subotica, Vojvodina', value: 'Subotica, Serbia' },
      { label: 'Custom / Other Serbian City', value: 'custom_rs' }
    ]
  },
  {
    country: 'Singapore',
    cities: [
      { label: 'Singapore', value: 'Singapore' }
    ]
  },
  {
    country: 'Slovakia',
    cities: [
      { label: 'Banská Bystrica', value: 'Banská Bystrica, Slovakia' },
      { label: 'Bratislava', value: 'Bratislava, Slovakia' },
      { label: 'Košice', value: 'Košice, Slovakia' },
      { label: 'Prešov', value: 'Prešov, Slovakia' },
      { label: 'Žilina', value: 'Žilina, Slovakia' },
      { label: 'Custom / Other Slovak City', value: 'custom_sk' }
    ]
  },
  {
    country: 'Slovenia',
    cities: [
      { label: 'Celje', value: 'Celje, Slovenia' },
      { label: 'Koper', value: 'Koper, Slovenia' },
      { label: 'Kranj', value: 'Kranj, Slovenia' },
      { label: 'Ljubljana', value: 'Ljubljana, Slovenia' },
      { label: 'Maribor', value: 'Maribor, Slovenia' },
      { label: 'Custom / Other Slovenian City', value: 'custom_si' }
    ]
  },
  {
    country: 'Spain',
    cities: [
      { label: 'Barcelona, Catalonia', value: 'Barcelona, Spain' },
      { label: 'Bilbao, Basque Country', value: 'Bilbao, Spain' },
      { label: 'Madrid', value: 'Madrid, Spain' },
      { label: 'Malaga, Andalusia', value: 'Malaga, Spain' },
      { label: 'Seville, Andalusia', value: 'Seville, Spain' },
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
      { label: 'Lucerne', value: 'Lucerne, Switzerland' },
      { label: 'Zurich', value: 'Zurich, Switzerland' },
      { label: 'Custom / Other Swiss City', value: 'custom_ch' }
    ]
  },
  {
    country: 'Ukraine',
    cities: [
      { label: 'Dnipro', value: 'Dnipro, Ukraine' },
      { label: 'Kharkiv', value: 'Kharkiv, Ukraine' },
      { label: 'Kyiv', value: 'Kyiv, Ukraine' },
      { label: 'Lviv', value: 'Lviv, Ukraine' },
      { label: 'Odesa', value: 'Odesa, Ukraine' },
      { label: 'Custom / Other Ukrainian City', value: 'custom_ua' }
    ]
  },
  {
    country: 'United Arab Emirates',
    cities: [
      { label: 'Abu Dhabi', value: 'Abu Dhabi, UAE' },
      { label: 'Dubai', value: 'Dubai, UAE' }
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
      { label: 'Washington, D.C.', value: 'Washington D.C., United States' },
      { label: 'Custom / Other US City', value: 'custom_us' }
    ]
  },
  {
    country: 'Vatican City',
    cities: [
      { label: 'Vatican City', value: 'Vatican City' }
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
