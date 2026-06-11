// ============================================================
// CONQUEST — CAPA DE ACCESO A DATOS (MOCK API)
// Archivo centralizado de datos y endpoints asíncronos.
// Ningún dato se exporta directamente. Solo funciones async.
// ============================================================

// ─── TIPOS ───────────────────────────────────────────────────

export type Habilidad = {
  id: string;
  nombre: string;
  costo: number;
  desbloqueada: boolean;
  prerrequisitos: string[];
  tipo_bono: string;
  categoria: "desarrollo" | "militar";
  rama: string;
  nivel: number;
  x: number;
  y: number;
  tiempo_investigacion_dias?: number;
  enDesarrollo?: boolean;
  tiempoRestante?: number;
};



export type Tropas = {
  infanteria: number;
  caballeria: number;
  artilleria: number;
};

export type Pais = {
  id: string;
  nombre: string;
  economia: number;
  poblacion: number;
  ejercito_ia: number;
  conquistado: boolean;
  oro_ia: number;
  ejercito_ia_detalle: Tropas;
  tasa_natalidad: number;
  tasa_mortalidad: number;
  dias_reclutamiento_agresivo?: number;
};

export interface EventoAleatorio {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: "success" | "alert" | "info";
  efecto_oro?: number;
  efecto_infanteria?: number;
  efecto_caballeria?: number;
  efecto_artilleria?: number;
}

export interface DBCriticalChoice {
  id: string;
  label: string;
  consequence: string;
  efecto_oro?: number;
  efecto_infanteria?: number;
  efecto_caballeria?: number;
  efecto_artilleria?: number;
  hq_economia_multiplier?: number;
  hq_poblacion_multiplier?: number;
  target_ejercito_ia_multiplier?: number;
  colony_economia_multiplier?: number;
}

export interface DBCriticalEvent {
  code: string;
  title: string;
  description: string;
  choices: DBCriticalChoice[];
}

export interface DBDecayingOption {
  id: string;
  label: string;
  consequence: string;
  style?: 'positive' | 'tradeoff' | 'negative';
  costProportionalPercent?: number;
  benefitProportionalPercent?: number;
  efecto_oro?: number;
  efecto_infanteria?: number;
  efecto_caballeria?: number;
  efecto_artilleria?: number;
  hq_economia_multiplier?: number;
  hq_poblacion_multiplier?: number;
  target_ejercito_ia_multiplier?: number;
  colony_economia_multiplier?: number;
  colony_poblacion_multiplier?: number;
  logActionMsg: string;
}

export interface DBDecayingNotification {
  code: string;
  title: string;
  description: string;
  duration: number;
  type: 'info' | 'warning' | 'alert' | 'benefit';
  costDescriptionTemplate?: string;
  benefitDescriptionTemplate?: string;
  costProportionalPercent?: number;
  benefitProportionalPercent?: number;
  options: DBDecayingOption[];
  onExpire_hq_economia_multiplier?: number;
  onExpire_colony_poblacion_multiplier?: number;
}

export interface HQStartingPreset {
  tier: number;
  countries: string[];          // nombres normalizados (minúsculas)
  presupuesto: number;
  tropas: Tropas;
}

export interface TroopBaseCosts {
  infanteria: number;
  caballeria: number;
  artilleria: number;
}

export interface CombatPowerMultipliers {
  infanteria: number;
  caballeria: number;
  artilleria: number;
}

export interface MaintenanceTier {
  minTroops: number;
  costInf: number;
  costCab: number;
  costArt: number;
  desertionRate: number;
}

export interface SimulationConstants {
  dailyEconomicGrowthRate: number;
  incomeFormulaEcoFactor: number;
  incomeFormulaPopFactor: number;
  incomeDivisor: number;
  conquestBonusPerCountry: number;
  iaRecruitmentCost: number;
  iaRecruitMinReclutas: number;
  iaRecruitMaxReclutas: number;
  eventIntervalMin: number;
  eventIntervalRandom: number;
  specialEventIntervalMin: number;
  specialEventIntervalRandom: number;
  mobilizationPopLimit: number;
  massiveMobilizationThreshold: number;
  aggressiveRecruitmentPenaltyDays: number;
  attackTransitDays: number;
}

// ─── DATOS PRIVADOS (NO EXPORTADOS) ─────────────────────────

const INITIAL_GAME_STATE = {
  presupuesto: 5000,
  tropas: { infanteria: 5000, caballeria: 2000, artilleria: 500 }
};



// ─── DICCIONARIO DE TRADUCCIÓN DE PAÍSES (ES) ───────────────
// Clave: nombre nativo en inglés (tal cual viene del GeoJSON/TopoJSON)
// Valor: nombre oficial en español
export const COUNTRY_NAMES_ES: Record<string, string> = {
  // América del Norte
  "United States of America": "Estados Unidos",
  "Canada": "Canadá",
  "Mexico": "México",
  // América Central
  "Guatemala": "Guatemala",
  "Belize": "Belice",
  "Honduras": "Honduras",
  "El Salvador": "El Salvador",
  "Nicaragua": "Nicaragua",
  "Costa Rica": "Costa Rica",
  "Panama": "Panamá",
  // Caribe
  "Cuba": "Cuba",
  "Haiti": "Haití",
  "Dominican Rep.": "Rep. Dominicana",
  "Jamaica": "Jamaica",
  "Puerto Rico": "Puerto Rico",
  "Trinidad and Tobago": "Trinidad y Tobago",
  "Bahamas": "Bahamas",
  "Barbados": "Barbados",
  // América del Sur
  "Colombia": "Colombia",
  "Venezuela": "Venezuela",
  "Guyana": "Guyana",
  "Suriname": "Surinam",
  "Brazil": "Brasil",
  "Ecuador": "Ecuador",
  "Peru": "Perú",
  "Bolivia": "Bolivia",
  "Paraguay": "Paraguay",
  "Chile": "Chile",
  "Argentina": "Argentina",
  "Uruguay": "Uruguay",
  // Europa Occidental
  "United Kingdom": "Reino Unido",
  "Ireland": "Irlanda",
  "Iceland": "Islandia",
  "Norway": "Noruega",
  "Sweden": "Suecia",
  "Finland": "Finlandia",
  "Denmark": "Dinamarca",
  "Netherlands": "Países Bajos",
  "Belgium": "Bélgica",
  "Luxembourg": "Luxemburgo",
  "France": "Francia",
  "Germany": "Alemania",
  "Switzerland": "Suiza",
  "Austria": "Austria",
  "Portugal": "Portugal",
  "Spain": "España",
  "Italy": "Italia",
  "Malta": "Malta",
  "Greece": "Grecia",
  // Europa del Este y Central
  "Poland": "Polonia",
  "Czechia": "República Checa",
  "Slovakia": "Eslovaquia",
  "Hungary": "Hungría",
  "Romania": "Rumania",
  "Bulgaria": "Bulgaria",
  "Serbia": "Serbia",
  "Croatia": "Croacia",
  "Slovenia": "Eslovenia",
  "Bosnia and Herz.": "Bosnia y Herzegovina",
  "Montenegro": "Montenegro",
  "North Macedonia": "Macedonia del Norte",
  "Albania": "Albania",
  "Kosovo": "Kosovo",
  "Moldova": "Moldavia",
  "Ukraine": "Ucrania",
  "Belarus": "Bielorrusia",
  "Lithuania": "Lituania",
  "Latvia": "Letonia",
  "Estonia": "Estonia",
  // Ex-URSS / Asia Central
  "Russia": "Rusia",
  "Georgia": "Georgia",
  "Armenia": "Armenia",
  "Azerbaijan": "Azerbaiyán",
  "Kazakhstan": "Kazajistán",
  "Uzbekistan": "Uzbekistán",
  "Turkmenistan": "Turkmenistán",
  "Tajikistan": "Tayikistán",
  "Kyrgyzstan": "Kirguistán",
  // Oriente Medio
  "Turkey": "Turquía",
  "Syria": "Siria",
  "Lebanon": "Líbano",
  "Israel": "Israel",
  "Palestine": "Palestina",
  "Jordan": "Jordania",
  "Saudi Arabia": "Arabia Saudita",
  "Yemen": "Yemen",
  "Oman": "Omán",
  "United Arab Emirates": "Emiratos Árabes Unidos",
  "Qatar": "Catar",
  "Bahrain": "Baréin",
  "Kuwait": "Kuwait",
  "Iraq": "Irak",
  "Iran": "Irán",
  // Asia del Sur
  "Afghanistan": "Afganistán",
  "Pakistan": "Pakistán",
  "India": "India",
  "Nepal": "Nepal",
  "Bhutan": "Bután",
  "Bangladesh": "Bangladés",
  "Sri Lanka": "Sri Lanka",
  "Maldives": "Maldivas",
  // Asia Oriental
  "China": "China",
  "Mongolia": "Mongolia",
  "North Korea": "Corea del Norte",
  "South Korea": "Corea del Sur",
  "Japan": "Japón",
  "Taiwan": "Taiwán",
  // Sudeste Asiático
  "Myanmar": "Myanmar",
  "Thailand": "Tailandia",
  "Laos": "Laos",
  "Vietnam": "Vietnam",
  "Cambodia": "Camboya",
  "Malaysia": "Malasia",
  "Singapore": "Singapur",
  "Indonesia": "Indonesia",
  "Brunei": "Brunéi",
  "Philippines": "Filipinas",
  "Timor-Leste": "Timor Oriental",
  // África del Norte
  "Morocco": "Marruecos",
  "Algeria": "Argelia",
  "Tunisia": "Túnez",
  "Libya": "Libia",
  "Egypt": "Egipto",
  "Sudan": "Sudán",
  "South Sudan": "Sudán del Sur",
  // África Occidental
  "Mauritania": "Mauritania",
  "Mali": "Malí",
  "Senegal": "Senegal",
  "Gambia": "Gambia",
  "Guinea-Bissau": "Guinea-Bisáu",
  "Guinea": "Guinea",
  "Sierra Leone": "Sierra Leona",
  "Liberia": "Liberia",
  "Ivory Coast": "Costa de Marfil",
  "Ghana": "Ghana",
  "Togo": "Togo",
  "Benin": "Benín",
  "Nigeria": "Nigeria",
  "Burkina Faso": "Burkina Faso",
  "Niger": "Níger",
  "Cape Verde": "Cabo Verde",
  // África Central
  "Cameroon": "Camerún",
  "Chad": "Chad",
  "Central African Rep.": "Rep. Centroafricana",
  "Eq. Guinea": "Guinea Ecuatorial",
  "Gabon": "Gabón",
  "Congo": "Congo",
  "DR Congo": "Rep. Dem. del Congo",
  "São Tomé and Príncipe": "Santo Tomé y Príncipe",
  // África Oriental
  "Ethiopia": "Etiopía",
  "Eritrea": "Eritrea",
  "Djibouti": "Yibuti",
  "Somalia": "Somalia",
  "Kenya": "Kenia",
  "Uganda": "Uganda",
  "Rwanda": "Ruanda",
  "Burundi": "Burundi",
  "Tanzania": "Tanzania",
  "Mozambique": "Mozambique",
  "Malawi": "Malaui",
  "Zambia": "Zambia",
  "Zimbabwe": "Zimbabue",
  // África Austral
  "Angola": "Angola",
  "Namibia": "Namibia",
  "Botswana": "Botsuana",
  "South Africa": "Sudáfrica",
  "Lesotho": "Lesoto",
  "Swaziland": "Suazilandia",
  "Eswatini": "Suazilandia",
  "Madagascar": "Madagascar",
  "Comoros": "Comoras",
  "Mauritius": "Mauricio",
  "Seychelles": "Seychelles",
  // Oceanía
  "Australia": "Australia",
  "New Zealand": "Nueva Zelanda",
  "Papua New Guinea": "Papúa Nueva Guinea",
  "Fiji": "Fiyi",
  "Solomon Is.": "Islas Salomón",
  "Vanuatu": "Vanuatu",
  "Samoa": "Samoa",
  "Kiribati": "Kiribati",
  "Tonga": "Tonga",
  "Micronesia": "Micronesia",
  "Palau": "Palaos",
  "Marshall Is.": "Islas Marshall",
  "Nauru": "Nauru",
};

/**
 * Traduce el nombre de un país del inglés (GeoJSON) al español.
 * Si no hay traducción, devuelve el nombre original.
 */
export const translateCountry = (nameEN: string): string => {
  return COUNTRY_NAMES_ES[nameEN] ?? nameEN;
};

const realPopulations: Record<string, number> = {
  "China": 1420000000,
  "India": 1440000000,
  "Indonesia": 278000000,
  "Pakistan": 242000000,
  "Bangladesh": 173000000,
  "Japan": 123000000,
  "Philippines": 117000000,
  "Vietnam": 99000000,
  "Turkey": 86000000,
  "Iran": 89000000,
  "Thailand": 71000000,
  "South Korea": 51000000,
  "Saudi Arabia": 37000000,
  "Iraq": 45000000,
  "Afghanistan": 42000000,
  "Yemen": 34000000,
  "Nepal": 31000000,
  "North Korea": 26000000,
  "Taiwan": 24000000,
  "Sri Lanka": 22000000,
  "Kazakhstan": 20000000,
  "Syria": 23000000,
  "Cambodia": 17000000,
  "Jordan": 11000000,
  "Azerbaijan": 10000000,
  "United Arab Emirates": 10000000,
  "Israel": 9500000,
  "Singapore": 6000000,
  "United States of America": 341000000,
  "Brazil": 216000000,
  "Mexico": 129000000,
  "Colombia": 52000000,
  "Argentina": 46000000,
  "Peru": 34000000,
  "Venezuela": 29000000,
  "Chile": 20000000,
  "Ecuador": 18000000,
  "Guatemala": 18000000,
  "Cuba": 11000000,
  "Haiti": 11500000,
  "Dominican Rep.": 11300000,
  "Bolivia": 12000000,
  "Honduras": 10500000,
  "Paraguay": 7000000,
  "El Salvador": 6500000,
  "Nicaragua": 7000000,
  "Costa Rica": 5200000,
  "Panama": 4500000,
  "Uruguay": 3400000,
  "Jamaica": 2800000,
  "Puerto Rico": 3200000,
  "Canada": 39000000,
  "Russia": 144000000,
  "Germany": 84000000,
  "United Kingdom": 68000000,
  "France": 65000000,
  "Italy": 59000000,
  "Spain": 48000000,
  "Ukraine": 38000000,
  "Poland": 38000000,
  "Romania": 19000000,
  "Netherlands": 18000000,
  "Belgium": 12000000,
  "Sweden": 10500000,
  "Czechia": 10500000,
  "Greece": 10300000,
  "Portugal": 10300000,
  "Hungary": 9600000,
  "Belarus": 9500000,
  "Austria": 9000000,
  "Switzerland": 8900000,
  "Bulgaria": 6800000,
  "Serbia": 6700000,
  "Denmark": 5900000,
  "Finland": 5600000,
  "Slovakia": 5400000,
  "Norway": 5500000,
  "Ireland": 5100000,
  "Croatia": 4000000,
  "Nigeria": 224000000,
  "Ethiopia": 126000000,
  "Egypt": 113000000,
  "DR Congo": 102000000,
  "Tanzania": 67000000,
  "South Africa": 60000000,
  "Kenya": 55000000,
  "Uganda": 48000000,
  "Sudan": 48000000,
  "Algeria": 45000000,
  "Morocco": 38000000,
  "Angola": 36000000,
  "Ghana": 34000000,
  "Madagascar": 30000000,
  "Mozambique": 33000000,
  "Ivory Coast": 29000000,
  "Cameroon": 28000000,
  "Niger": 27000000,
  "Mali": 23000000,
  "Burkina Faso": 23000000,
  "Malawi": 21000000,
  "Zambia": 20000000,
  "Somalia": 18000000,
  "Senegal": 17500000,
  "Zimbabwe": 16000000,
  "Guinea": 14000000,
  "Rwanda": 14000000,
  "Benin": 13500000,
  "Tunisia": 12500000,
  "Burundi": 13000000,
  "South Sudan": 11000000,
  "Togo": 9000000,
  "Libya": 7000000,
  "Congo": 6000000,
  "Central African Rep.": 5700000,
  "Mauritania": 4800000,
  "Eritrea": 3700000,
  "Namibia": 2600000,
  "Gambia": 2700000,
  "Botswana": 2600000,
  "Gabon": 2400000,
  "Lesotho": 2300000,
  "Australia": 26000000,
  "New Zealand": 5200000,
  "Papua New Guinea": 10000000
};

export interface PaisPreset {
  gdpPerCapita: number;
  ejercitoMultiplicador: number;
  composicion: {
    infanteria: number;
    caballeria: number;
    artilleria: number;
  };
  multiplicadorReclutamiento?: number;
  multiplicadorPesadas?: number;
  tasa_natalidad?: number;
  tasa_mortalidad?: number;
}

export const COUNTRY_PRESETS: Record<string, PaisPreset> = {
  "united states of america": {
    gdpPerCapita: 65000,
    ejercitoMultiplicador: 2.5,
    composicion: { infanteria: 0.50, caballeria: 0.30, artilleria: 0.20 },
    multiplicadorPesadas: 0.85,
    tasa_natalidad: 0.0030,
    tasa_mortalidad: 0.0023
  },
  "india": {
    gdpPerCapita: 15000,
    ejercitoMultiplicador: 1.8,
    composicion: { infanteria: 0.85, caballeria: 0.10, artilleria: 0.05 },
    multiplicadorReclutamiento: 0.8,
    tasa_natalidad: 0.0045,
    tasa_mortalidad: 0.0019
  },
  "russia": {
    gdpPerCapita: 12000,
    ejercitoMultiplicador: 2.2,
    composicion: { infanteria: 0.40, caballeria: 0.20, artilleria: 0.40 },
    multiplicadorPesadas: 0.85,
    tasa_natalidad: 0.0024,
    tasa_mortalidad: 0.0035
  },
  "china": {
    gdpPerCapita: 25000,
    ejercitoMultiplicador: 2.8,
    composicion: { infanteria: 0.70, caballeria: 0.20, artilleria: 0.10 },
    multiplicadorReclutamiento: 0.8,
    tasa_natalidad: 0.0017,
    tasa_mortalidad: 0.0020
  },
  "brazil": {
    gdpPerCapita: 10000,
    ejercitoMultiplicador: 0.9,
    composicion: { infanteria: 0.60, caballeria: 0.30, artilleria: 0.10 },
    tasa_natalidad: 0.0038,
    tasa_mortalidad: 0.0016
  },
  "mexico": {
    gdpPerCapita: 10000,
    ejercitoMultiplicador: 0.9,
    composicion: { infanteria: 0.60, caballeria: 0.30, artilleria: 0.10 },
    tasa_natalidad: 0.0038,
    tasa_mortalidad: 0.0016
  }
};

export const getPresetForCountry = (name: string): PaisPreset => {
  const norm = name.toLowerCase();
  
  if (norm.includes("estados unidos") || norm.includes("usa") || norm.includes("united states")) {
    return COUNTRY_PRESETS["united states of america"];
  }
  if (norm.includes("india") || norm.includes("ind")) {
    return COUNTRY_PRESETS["india"];
  }
  if (norm.includes("rusia") || norm.includes("russia") || norm.includes("rus")) {
    return COUNTRY_PRESETS["russia"];
  }
  if (norm.includes("china") || norm.includes("chn")) {
    return COUNTRY_PRESETS["china"];
  }
  if (norm.includes("brasil") || norm.includes("brazil") || norm.includes("bra")) {
    return COUNTRY_PRESETS["brazil"];
  }
  if (norm.includes("méxico") || norm.includes("mexico") || norm.includes("mex")) {
    return COUNTRY_PRESETS["mexico"];
  }

  for (const [key, preset] of Object.entries(COUNTRY_PRESETS)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      return preset;
    }
  }

  // Default values
  let gdpPerCapita = 5000;
  if (["germany", "united kingdom", "france", "japan", "singapore", "switzerland", "canada", "australia", "alemania", "reino unido", "francia", "japón", "singapur", "suiza", "canadá"].some(c => norm.includes(c))) {
    gdpPerCapita = 60000;
  } else if (["china", "turkey", "saudi arabia", "south korea", "spain", "italy", "poland", "turquía", "arabia saudita", "corea del sur", "españa", "italia", "polonia"].some(c => norm.includes(c))) {
    gdpPerCapita = 25000;
  } else {
    gdpPerCapita = 3000;
  }

  // Generador Demográfico Geopolítico Realista por región y desarrollo
  let baseNatalidad = 12.0; // por cada 1000 al año (base global promedio)
  let baseMortalidad = 8.0;  // por cada 1000 al año (base global promedio)

  const isAfrica = ["nigeria", "congo", "ethiopia", "uganda", "angola", "mali", "niger", "chad", "somalia", "sudan", "kenya", "tanzania", "mozambique", "ghana", "madagascar", "cameroon", "cote", "ivory", "burkina", "zambia", "malawi", "senegal", "zimbabwe", "guinea", "rwanda", "benin", "burundi", "togo", "eritrea", "namibia", "gambia", "botswana", "gabon", "lesotho", "liberia", "sierra", "mauritania", "central african", "libya", "tunisia", "algeria", "morocco", "egipto", "egypt", "sudáfrica", "south africa"].some(c => norm.includes(c));
  
  const isEuropeEastAsia = ["germany", "france", "united kingdom", "italy", "spain", "poland", "japan", "south korea", "ukraine", "romania", "netherlands", "belgium", "switzerland", "sweden", "austria", "belarus", "bulgaria", "hungary", "portugal", "greece", "czech", "denmark", "finland", "norway", "ireland", "croatia", "slovakia", "lithuania", "latvia", "estonia", "taiwan", "singapore", "alemania", "francia", "reino unido", "italia", "españa", "polonia", "japón", "corea del sur", "ucrania", "rumania", "países bajos", "bélgica", "suiza", "suecia", "austria", "bielorrusia", "bulgaria", "hungría", "portugal", "grecia", "república checa", "dinamarca", "finlandia", "noruega", "irlanda", "croacia", "eslovaquia", "lituania", "letonia", "estonia", "taiwán", "singapur", "australia", "canada", "canadá", "new zealand", "nueva zelanda"].some(c => norm.includes(c));

  const isLatinAmerica = ["mexico", "brazil", "colombia", "argentina", "peru", "venezuela", "chile", "ecuador", "guatemala", "cuba", "bolivia", "dominican", "honduras", "paraguay", "el salvador", "nicaragua", "costa rica", "panama", "uruguay", "puerto rico", "méxico", "brasil", "república dominicana", "panamá"].some(c => norm.includes(c));

  const isMiddleEastSouthAsia = ["pakistan", "bangladesh", "indonesia", "philippines", "vietnam", "turkey", "iran", "thailand", "saudi", "iraq", "afghanistan", "yemen", "nepal", "sri lanka", "kazakhstan", "syria", "cambodia", "jordan", "azerbaijan", "uae", "united arab", "israel", "pakistán", "turquía", "irán", "tailandia", "arabia", "afganistán", "siria", "camboya", "jordania", "azerbaiyán", "emiratos"].some(c => norm.includes(c));

  if (isAfrica) {
    // Tasas altas de natalidad, mortalidad moderada a baja (poblaciones jóvenes)
    baseNatalidad = 25.0 + (gdpPerCapita < 5000 ? 10.0 : 0.0);
    baseMortalidad = 6.5 + (gdpPerCapita < 5000 ? 2.5 : 0.0);
  } else if (isEuropeEastAsia) {
    // Tasas muy bajas de natalidad, mortalidad moderada-alta (poblaciones envejecidas)
    baseNatalidad = 7.5;
    baseMortalidad = 9.5;
  } else if (isLatinAmerica) {
    // Transición demográfica: natalidad moderada, mortalidad baja (bono demográfico)
    baseNatalidad = 13.5;
    baseMortalidad = 6.0;
  } else if (isMiddleEastSouthAsia) {
    // Crecimiento sostenido moderado-alto
    baseNatalidad = 17.5;
    baseMortalidad = 6.5;
  } else {
    // Fallback general basado en GDP per capita
    if (gdpPerCapita >= 60000) {
      baseNatalidad = 9.0;
      baseMortalidad = 8.5;
    } else if (gdpPerCapita >= 25000) {
      baseNatalidad = 11.5;
      baseMortalidad = 7.5;
    } else {
      baseNatalidad = 15.0;
      baseMortalidad = 7.0;
    }
  }

  // Introducir variaciones estocásticas únicas y deterministas usando un simple hash del nombre
  let nameHash = 0;
  for (let i = 0; i < norm.length; i++) {
    nameHash += norm.charCodeAt(i) * (i + 1);
  }
  
  // Variación natalidad: +/- 15%
  const varNatalidad = 0.85 + ((nameHash % 30) / 100);
  // Variación mortalidad: +/- 15%
  const varMortalidad = 0.85 + (((nameHash * 7) % 30) / 100);

  const finalNatalidadAnual = baseNatalidad * varNatalidad;
  const finalMortalidadAnual = baseMortalidad * varMortalidad;

  // Convertir tasa anualizada por cada 1,000 habitantes a porcentaje diario (%)
  const tasa_natalidad = Number((finalNatalidadAnual / 3650).toFixed(6));
  const tasa_mortalidad = Number((finalMortalidadAnual / 3650).toFixed(6));

  return {
    gdpPerCapita,
    ejercitoMultiplicador: 1.0,
    composicion: { infanteria: 0.70, caballeria: 0.20, artilleria: 0.10 },
    tasa_natalidad,
    tasa_mortalidad
  };
};

const eventosAleatorios: EventoAleatorio[] = [
  // ── ALERTAS (Pérdidas) ──────────────────────────────────────
  { 
    id: "random-01",
    titulo: "SABOTAJE EN LA RED CLIMÁTICA",
    mensaje: "Una tormenta de arena ionizada inducida por hackeo interrumpe los canales de extracción en los yacimientos de Medio Oriente. La infraestructura táctica reporta daños severos en los nodos. Impacto: -500 Créditos de Oro.", 
    tipo: "alert", 
    efecto_oro: -500
  },
  { 
    id: "random-02",
    titulo: "DESERCIÓN MASIVA EN FRONTERA",
    mensaje: "Un ciberataque de pulso electromagnético del enemigo desactiva los chips neurales de obediencia de un regimiento fronterizo, provocando su desconexión y retirada. Impacto: -100 Unidades de Caballería.", 
    tipo: "alert", 
    efecto_caballeria: -100
  },
  { 
    id: "random-03",
    titulo: "VIRUS EN EL SISTEMA LOGÍSTICO",
    mensaje: "Un ransomware cuántico de origen desconocido ha cifrado los manifiestos de suministro del sector norte, paralizando la distribución de armamento pesado. Impacto: -50 Artillería.", 
    tipo: "alert", 
    efecto_artilleria: -50
  },
  { 
    id: "random-04",
    titulo: "COLAPSO DE NODO FINANCIERO",
    mensaje: "El nodo bancario descentralizado de Nueva Shanghái ha sufrido un exploit de día cero. Los fondos de contingencia fueron drenados antes de que los cortafuegos reaccionaran. Impacto: -800 Créditos de Oro.", 
    tipo: "alert", 
    efecto_oro: -800
  },
  { 
    id: "random-05",
    titulo: "MOTÍN EN GUARNICIÓN REMOTA",
    mensaje: "Las tropas estacionadas en el complejo ártico Vostok-7 se han rebelado tras un fallo en los sistemas de calefacción neural. El destacamento se ha dispersado en la tundra. Impacto: -150 Infantería.", 
    tipo: "alert", 
    efecto_infanteria: -150
  },
  { 
    id: "random-06",
    titulo: "SABOTAJE EN CONVOY BLINDADO",
    mensaje: "Un convoy de suministros blindados fue emboscado en el corredor de los Balcanes por células insurgentes equipadas con EMP tácticos. Vehículos irrecuperables. Impacto: -75 Caballería.", 
    tipo: "alert", 
    efecto_caballeria: -75
  },
  { 
    id: "random-07",
    titulo: "ATAQUE A CADENA DE SUMINISTRO",
    mensaje: "Agentes hostiles infiltraron nuestra cadena de producción de municiones inteligentes, insertando firmware defectuoso. Lote completo inutilizado. Impacto: -300 Créditos de Oro.", 
    tipo: "alert", 
    efecto_oro: -300
  },

  // ── ÉXITOS (Ganancias) ──────────────────────────────────────
  { 
    id: "random-08",
    titulo: "CAMPAÑA DE CONSCRIPCIÓN SATELITAL",
    mensaje: "Nuestra señal de propaganda de alta frecuencia ha sorteado los cortafuegos del hemisferio sur, motivando a reservistas locales. Se reporta un flujo de refuerzo táctico. Impacto: +200 Infantería.", 
    tipo: "success", 
    efecto_infanteria: 200
  },
  { 
    id: "random-09",
    titulo: "EXTRACCIÓN DE CRIPTOMINAS SIBERIANAS",
    mensaje: "Nuestras sondas autónomas reactivaron una granja de servidores de la ex-megacorporación siberiana en desuso, liquidando activos protegidos. Impacto: +1000 Créditos de Oro.", 
    tipo: "success", 
    efecto_oro: 1000
  },
  { 
    id: "random-10",
    titulo: "RECLUTAMIENTO DE MERCENARIOS NÓMADAS",
    mensaje: "Un clan de mercenarios cibernéticos del desierto del Sahel ha aceptado nuestro contrato. Unidades blindadas experimentadas se integran al contingente. Impacto: +120 Caballería.", 
    tipo: "success", 
    efecto_caballeria: 120
  },
  { 
    id: "random-11",
    titulo: "DECOMISO DE ARSENAL ENEMIGO",
    mensaje: "Operaciones especiales asaltaron un depósito subterráneo enemigo en los montes Urales. Se recuperaron piezas de artillería de plasma intactas. Impacto: +80 Artillería.", 
    tipo: "success", 
    efecto_artilleria: 80
  },
  { 
    id: "random-12",
    titulo: "CONTRATO CORPORATIVO SELLADO",
    mensaje: "La megacorporación Nexus-Dynamics ha firmado un acuerdo de suministro exclusivo con nuestro comando. Transferencia inmediata de fondos al tesoro central. Impacto: +1500 Créditos de Oro.", 
    tipo: "success", 
    efecto_oro: 1500
  },
  { 
    id: "random-13",
    titulo: "COSECHA DE DATOS EXITOSA",
    mensaje: "Nuestros bots de scraping cuántico infiltraron la base de datos fiscal de tres naciones-estado rivales. Información monetizada en el mercado negro digital. Impacto: +700 Créditos de Oro.", 
    tipo: "success", 
    efecto_oro: 700
  },
  { 
    id: "random-14",
    titulo: "REACTIVACIÓN DE AUTÓMATAS BÉLICOS",
    mensaje: "Un almacén olvidado de la era pre-colapso fue descubierto en las catacumbas de Neo-Berlín. Autómatas de combate reactivados y asignados al frente. Impacto: +300 Infantería.", 
    tipo: "success", 
    efecto_infanteria: 300
  },

  // ── INFORMATIVOS (Sin efecto mecánico) ──────────────────────
  { 
    id: "random-15",
    titulo: "TREGUA DIGITAL ESTABLECIDA",
    mensaje: "Los sistemas de cifrado de la megacorporación rival detectaron nuestras sondas de escaneo en los frentes fronterizos. Se firma una tregua digital temporal automática mientras se reconfiguran los firewalls. Sin cambios reportados.", 
    tipo: "info"
  },
  { 
    id: "random-16",
    titulo: "ANOMALÍA ELECTROMAGNÉTICA DETECTADA",
    mensaje: "Los sensores orbitales registraron una fluctuación magnética masiva sobre el Triángulo de las Bermudas. Los analistas no logran determinar si es fenómeno natural o arma experimental enemiga. Monitoreo activo.", 
    tipo: "info"
  },
  { 
    id: "random-17",
    titulo: "TRANSMISIÓN INTERCEPTADA",
    mensaje: "Inteligencia descifró una comunicación encriptada entre dos facciones rivales. Aparentemente planean una alianza temporal contra nuestro sector. El Alto Mando evalúa contramedidas diplomáticas.", 
    tipo: "info"
  },
  { 
    id: "random-18",
    titulo: "MIGRACIÓN MASIVA EN FRONTERA SUR",
    mensaje: "Oleadas de civiles desplazados por los conflictos en el corredor centroamericano se agolpan en los puntos de control. Los recursos humanitarios están siendo redistribuidos. Sin impacto militar directo.", 
    tipo: "info"
  },
  { 
    id: "random-19",
    titulo: "ACTUALIZACIÓN DE FIRMWARE GLOBAL",
    mensaje: "El Comando Central ha desplegado el parche v7.41 en todos los exoesqueletos de combate. Tiempo de inactividad temporal de 6 horas en el hemisferio occidental. Operaciones restauradas con éxito.", 
    tipo: "info"
  },
  { 
    id: "random-20",
    titulo: "ECLIPSE SOLAR TÁCTICO",
    mensaje: "Un eclipse solar ha interferido temporalmente con los paneles solares de los satélites de reconnaissance. Las comunicaciones de largo alcance operan al 40% de capacidad durante las próximas horas.", 
    tipo: "info"
  }
];

const CRITICAL_EVENT_TEMPLATES: DBCriticalEvent[] = [
  {
    code: "CORP_MERGER_OFFER",
    title: "PROPUESTA DE FUSIÓN DE CORP. BIOMÉDICA",
    description: "La corporación Arasaka ofrece una inyección inmediata de capital a cambio de adquirir la exclusividad de tus laboratorios del cuartel general en {hq}.",
    choices: [
      {
        id: "choice1_1",
        label: "Firmar acuerdo corporativo",
        consequence: "+5,000€, +200 Infantería, Economía HQ -15%",
        efecto_oro: 5000,
        efecto_infanteria: 200,
        hq_economia_multiplier: 0.85
      },
      {
        id: "choice1_2",
        label: "Rechazar interferencia externa",
        consequence: "-800€ por aranceles punitivos corporativos",
        efecto_oro: -800
      }
    ]
  },
  {
    code: "NANOBOT_OUTBREAK",
    title: "BROTE DE NANOBOTS DESCONTROLADOS",
    description: "Se detecta una replicación descontrolada de nanobots médicos obsoletos en la red de abastecimiento del Cuartel General. Se requiere desinfección inmediata.",
    choices: [
      {
        id: "choice2_1",
        label: "Desplegar contención armada",
        consequence: "-150 Infantería (cuarentena estricta), Población a salvo",
        efecto_infanteria: -150
      },
      {
        id: "choice2_2",
        label: "Emitir pulso EMP de alta potencia",
        consequence: "-1,200€ en coste operativo del pulso",
        efecto_oro: -1200
      },
      {
        id: "choice2_3",
        label: "Ignorar brote temporalmente",
        consequence: "Población HQ -20%, Economía HQ -10%",
        hq_poblacion_multiplier: 0.80,
        hq_economia_multiplier: 0.90
      }
    ]
  },
  {
    code: "UNION_SABOTAGE",
    title: "SABOTAJE SINDICAL EN MATRIZ ENERGÉTICA",
    description: "Un sindicato de operarios cibernéticos ha bloqueado la red de enfriamiento de reactores demandando subsidios salariales.",
    choices: [
      {
        id: "choice3_1",
        label: "Subsanar demandas del sindicato",
        consequence: "-1,000€ de presupuesto, Economía HQ +5% por optimización",
        efecto_oro: -1000,
        hq_economia_multiplier: 1.05
      },
      {
        id: "choice3_2",
        label: "Autorizar disolución táctica armada",
        consequence: "-80 Infantería por bajas civiles, Economía HQ -5%",
        efecto_infanteria: -80,
        hq_economia_multiplier: 0.95
      }
    ]
  },
  {
    code: "TACTICAL_ALLIANCE_OFFER",
    title: "OFERTA TÁCTICA DE ACCESO SEGURO: {target}",
    description: "Diplomáticos de {target} ofrecen compartir tecnología de defensa a cambio de un acuerdo de no agresión. No se propone conquista inmediata.",
    choices: [
      {
        id: "choice4_1",
        label: "Negociar acuerdo tecnológico con {target}",
        consequence: "-2,500€, Ejército enemigo -20%, economía propia +5%",
        efecto_oro: -2500,
        target_ejercito_ia_multiplier: 0.80,
        hq_economia_multiplier: 1.05
      },
      {
        id: "choice4_2",
        label: "Rechazar la oferta y conservar distancia tácticamente",
        consequence: "No hay concesiones, pero la tensión aumenta +15%",
        target_ejercito_ia_multiplier: 1.15
      }
    ]
  },
  {
    code: "SPY_NETWORK_LEAK",
    title: "INFILTRACIÓN RED DE DATOS: {target}",
    description: "Agentes encubiertos detectan una brecha crítica en el mainframe defensivo de {target}. Podemos ejecutar un hackeo masivo o monetizar la información.",
    choices: [
      {
        id: "choice5_1",
        label: "Infiltrar virus desestabilizador",
        consequence: "-1,200€, Fuerza defensiva enemiga se reduce un 60%",
        efecto_oro: -1200,
        target_ejercito_ia_multiplier: 0.40
      },
      {
        id: "choice5_2",
        label: "Vender coordenadas en el mercado negro",
        consequence: "+2,000€, Defensa enemiga aumenta +20% por parches",
        efecto_oro: 2000,
        target_ejercito_ia_multiplier: 1.20
      }
    ]
  },
  {
    code: "BORDER_MOBILIZATION",
    title: "MOVILIZACIÓN HOSTIL DETECTADA",
    description: "Sensores satelitales revelan que {target} está acumulando blindados en la frontera con tu territorio de {colony}.",
    choices: [
      {
        id: "choice6_1",
        label: "Lanzar ataque preventivo rápido",
        consequence: "-250 Infantería de reserva, Ejército de IA hostil -50%",
        efecto_infanteria: -250,
        target_ejercito_ia_multiplier: 0.50
      },
      {
        id: "choice6_2",
        label: "Comprar pacto de no agresión",
        consequence: "-1,500€ de soborno diplomático directo",
        efecto_oro: -1500
      },
      {
        id: "choice6_3",
        label: "Fortificar fronteras de {colony}",
        consequence: "-800€, Economía de {colony} -5%",
        efecto_oro: -800,
        colony_economia_multiplier: 0.95
      }
    ]
  },
  {
    code: "BORDER_SMUGGLING_RAID",
    title: "REDADA DE CONTRABANDO EN {colony}",
    description: "Tus patrullas de frontera en {colony} han interceptado un contrabando masivo de implantes militares con destino al gobierno hostil de {target}.",
    choices: [
      {
        id: "choice7_1",
        label: "Confiscar y rearmar reservas",
        consequence: "+150 Infanterías, +5 Caballerías, Economía de {colony} -5% por represalias",
        efecto_infanteria: 150,
        efecto_caballeria: 5,
        colony_economia_multiplier: 0.95
      },
      {
        id: "choice7_2",
        label: "Dejar pasar por soborno diplomático",
        consequence: "+2,000€ de soborno, Ejército de IA de enemigo +25%",
        efecto_oro: 2000,
        target_ejercito_ia_multiplier: 1.25
      },
      {
        id: "choice7_3",
        label: "Destruir el cargamento públicamente",
        consequence: "Economía de {colony} +5% por prestigio civil",
        colony_economia_multiplier: 1.05
      }
    ]
  },
  {
    code: "DISSIDENT_TREATY",
    title: "PACTO CON LA DISIDENCIA GEOPOLÍTICA",
    description: "Líderes insurgentes perseguidos por el régimen de {target} solicitan asilo político y financiamiento secreto en tu territorio aliado de {colony}.",
    choices: [
      {
        id: "choice8_1",
        label: "Patrocinar la insurgencia armada",
        consequence: "-1,500€, Ejército enemigo -50% (Guerra Civil), Pierdes 50 Infanterías por escaramuzas",
        efecto_oro: -1500,
        efecto_infanteria: -50,
        target_ejercito_ia_multiplier: 0.50
      },
      {
        id: "choice8_2",
        label: "Extraditar disidentes por ventajas comerciales",
        consequence: "+2,500€ de fondos comerciales, Ejército enemigo +10%",
        efecto_oro: 2500,
        target_ejercito_ia_multiplier: 1.10
      },
      {
        id: "choice8_3",
        label: "Rechazar asilo (Declarar neutralidad)",
        consequence: "Sin alteraciones operativas"
      }
    ]
  }
];

const DECAY_EVENT_TEMPLATES: DBDecayingNotification[] = [
  {
    code: "NET_MINING_OVERLOAD",
    title: "SOBRECARGA DE NODOS CRIPTO",
    description: "Los servidores de criptominería están sobrecalentados. Debes enfriarlos instalando disipadores criogénicos, o arriesgar daños estructurales permanentes.",
    duration: 35000,
    type: 'warning',
    costDescriptionTemplate: "{cost}€ de refrigerante líquido",
    benefitDescriptionTemplate: "+{benefit}€ netos",
    costProportionalPercent: 0.05,
    benefitProportionalPercent: 0.15,
    options: [
      {
        id: "net_choice1",
        label: "Instalar disipadores criogénicos",
        consequence: "{cost}€ invertidos, ganancia neta de {gain}€",
        style: 'positive',
        costProportionalPercent: 0.05,
        benefitProportionalPercent: 0.15,
        logActionMsg: "Instalación de disipadores criogénicos: -{cost}€, +{benefit}€"
      },
      {
        id: "net_choice2",
        label: "Reducir cargas y enfriar progresivamente",
        consequence: "-10% de economía HQ, evita daños inmediatos",
        style: 'tradeoff',
        hq_economia_multiplier: 0.9,
        logActionMsg: "Reducción de cargas de criptominería"
      }
    ],
    onExpire_hq_economia_multiplier: 0.95
  },
  {
    code: "BLACK_MARKET_PLASMA",
    title: "CONTRABANDO DE PLASMA DISPONIBLE",
    description: "Contrabandistas independientes ofrecen un cargamento rápido de artillería de plasma a bajo costo para tus fuerzas tácticas.",
    duration: 40000,
    type: 'info',
    costDescriptionTemplate: "{cost}€ en créditos",
    benefitDescriptionTemplate: "+15 divisiones de Artillería pesada",
    costProportionalPercent: 0.06,
    options: [
      {
        id: "black_choice1",
        label: "Abastecer artillería completa",
        consequence: "{cost}€ invertidos, +15 artillería",
        style: 'positive',
        costProportionalPercent: 0.06,
        efecto_artilleria: 15,
        logActionMsg: "Compra de artillería de plasma: -{cost}€"
      },
      {
        id: "black_choice2",
        label: "Negociar un cargamento más pequeño",
        consequence: "{cost}€ invertidos, +8 artillería",
        style: 'tradeoff',
        costProportionalPercent: 0.03,
        efecto_artilleria: 8,
        logActionMsg: "Compra pequeña de plasma: -{cost}€"
      }
    ]
  },
  {
    code: "MIL_NANO_INJECTION",
    title: "PRUEBAS CLÍNICAS DE COMBATE NANO",
    description: "TraumaCorp solicita permiso para probar nanobots de reflejos en tus reclutas locales. Generará bajas poblacionales, pero creará combatientes implacables.",
    duration: 45000,
    type: 'benefit',
    costDescriptionTemplate: "15% de Población de tu Cuartel General",
    benefitDescriptionTemplate: "+350 Infanterías y +5 Caballerías blindadas",
    options: [
      {
        id: "nano_choice1",
        label: "Permitir las pruebas de combate",
        consequence: "+350 infantería, +5 caballería, -15% población",
        style: 'tradeoff',
        efecto_infanteria: 350,
        efecto_caballeria: 5,
        hq_poblacion_multiplier: 0.85,
        logActionMsg: "Experimento nano autorizado: +350 infantería, -15% población"
      },
      {
        id: "nano_choice2",
        label: "Rechazar el experimento",
        consequence: "Preservas población, sin ganancia de tropas",
        style: 'negative',
        logActionMsg: "Rechazado experimento nano"
      }
    ]
  },
  {
    code: "TERRITORIAL_RATIONING",
    title: "RACIONAMIENTO DE ENERGÍA: {colony}",
    description: "Problemas de suministro en {colony}. Puedes desviar su producción civil al complejo militar o dejar que lo resuelvan, arriesgando disturbios civiles.",
    duration: 35000,
    type: 'alert',
    costDescriptionTemplate: "Economía de {colony} -8%",
    benefitDescriptionTemplate: "+600 Infantería reclutada de emergencia",
    options: [
      {
        id: "ration_choice1",
        label: "Desviar energía al frente militar",
        consequence: "-8% economía, +600 infantería",
        style: 'tradeoff',
        efecto_infanteria: 600,
        colony_economia_multiplier: 0.92,
        logActionMsg: "Racionamiento energético - Desviación militar: +600 infantería en {colony}"
      },
      {
        id: "ration_choice2",
        label: "Mantener servicios civiles intactos",
        consequence: "Sin tropas adicionales, riesgo de disturbios",
        style: 'negative',
        logActionMsg: "Racionamiento energético rechazado en {colony}"
      }
    ],
    onExpire_colony_poblacion_multiplier: 0.97
  },
  {
    code: "SATELLITE_REDIRECT",
    title: "MONITORIZACIÓN TÁCTICA DE {target}",
    description: "Se detecta tráfico inusual en {target}. Puedes redireccionar satélites desde tu territorio aliado en {colony} para espiarlos, o arriesgar fallas defensivas.",
    duration: 40000,
    type: 'info',
    costDescriptionTemplate: "{cost}€ en coste de redirección",
    benefitDescriptionTemplate: "Ejército defensivo de {target} -20% (Mainframe vulnerable)",
    costProportionalPercent: 0.02,
    options: [
      {
        id: "sat_choice1",
        label: "Redirigir satélites sobre el objetivo",
        consequence: "{cost}€, ejército enemigo -20%",
        style: 'positive',
        costProportionalPercent: 0.02,
        target_ejercito_ia_multiplier: 0.80,
        logActionMsg: "Redirección satelital: -{cost}€, -20% ejército de {target}"
      },
      {
        id: "sat_choice2",
        label: "Mantener satélites en patrulla defensiva",
        consequence: "Sin coste inmediato, riesgo de perder ventaja táctica",
        style: 'negative',
        logActionMsg: "Patrulla defensiva de satélites mantenida"
      }
    ],
    onExpire_hq_economia_multiplier: 0.98
  }
];

const initialHabilidades: Habilidad[] = [
  // ===================== INFRAESTRUCTURA (DESARROLLO) =====================
  // Origen (X=200, Y=2000): 1 nodo raíz principal
  { id: "D_ROOT", nombre: "Protocolo de Despertar", costo: 1000, desbloqueada: false, prerrequisitos: [], tipo_bono: "Activación del Núcleo Táctico", categoria: "desarrollo", rama: "Origen", nivel: 1, x: 200, y: 2000, tiempo_investigacion_dias: 30 },

  // Primera Bifurcación (X=600): 3 nodos
  { id: "D_B1_1", nombre: "Extracción Profunda", costo: 5000, desbloqueada: false, prerrequisitos: ["D_ROOT"], tipo_bono: "+5% Ingresos Oro", categoria: "desarrollo", rama: "Bifurcacion", nivel: 2, x: 600, y: 1500, tiempo_investigacion_dias: 90 },
  { id: "D_B1_2", nombre: "Redes Neuronales Básicas", costo: 5000, desbloqueada: false, prerrequisitos: ["D_ROOT"], tipo_bono: "+5% Eficiencia Global", categoria: "desarrollo", rama: "Bifurcacion", nivel: 2, x: 600, y: 2000, tiempo_investigacion_dias: 90 },
  { id: "D_B1_3", nombre: "Gestión de Flotas Auto", costo: 5000, desbloqueada: false, prerrequisitos: ["D_ROOT"], tipo_bono: "-5% Costo Despliegue", categoria: "desarrollo", rama: "Bifurcacion", nivel: 2, x: 600, y: 2500, tiempo_investigacion_dias: 90 },

  // Expansión (X=1100): 5 nodos
  { id: "D_EXP_1", nombre: "Minería Suboceánica", costo: 18000, desbloqueada: false, prerrequisitos: ["D_B1_1"], tipo_bono: "+10% Ingresos Oro", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 1000, tiempo_investigacion_dias: 180 },
  { id: "D_EXP_2", nombre: "Procesadores Cuánticos", costo: 18000, desbloqueada: false, prerrequisitos: ["D_B1_1", "D_B1_2"], tipo_bono: "+10% Eficiencia Global", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 1500, tiempo_investigacion_dias: 180 },
  { id: "D_EXP_3", nombre: "Algoritmos Financieros", costo: 18000, desbloqueada: false, prerrequisitos: ["D_B1_2"], tipo_bono: "+15% Ingresos Oro", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 2000, tiempo_investigacion_dias: 180 },
  { id: "D_EXP_4", nombre: "Nodos Logísticos Subterráneos", costo: 18000, desbloqueada: false, prerrequisitos: ["D_B1_2", "D_B1_3"], tipo_bono: "-10% Costo Despliegue", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 2500, tiempo_investigacion_dias: 180 },
  { id: "D_EXP_5", nombre: "Lanzamiento de Microsatélites", costo: 18000, desbloqueada: false, prerrequisitos: ["D_B1_3"], tipo_bono: "+10% Visión Táctica", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 3000, tiempo_investigacion_dias: 180 },

  // Convergencia Parcial (X=1600): 3 nodos mayores
  { id: "D_CONV_1", nombre: "Perforación Mantélica", costo: 50000, desbloqueada: false, prerrequisitos: ["D_EXP_1", "D_EXP_2"], tipo_bono: "+20% Ingresos Oro", categoria: "desarrollo", rama: "Convergencia", nivel: 4, x: 1600, y: 1500, tiempo_investigacion_dias: 270 },
  { id: "D_CONV_2", nombre: "IA Directiva de Producción", costo: 50000, desbloqueada: false, prerrequisitos: ["D_EXP_2", "D_EXP_4"], tipo_bono: "+20% Velocidad Construcción", categoria: "desarrollo", rama: "Convergencia", nivel: 4, x: 1600, y: 2000, tiempo_investigacion_dias: 270 },
  { id: "D_CONV_3", nombre: "Trenes Maglev Transcontinentales", costo: 50000, desbloqueada: false, prerrequisitos: ["D_EXP_4", "D_EXP_5"], tipo_bono: "+15% Reserva Máxima", categoria: "desarrollo", rama: "Convergencia", nivel: 4, x: 1600, y: 2500, tiempo_investigacion_dias: 270 },

  { id: "D_SUPER_1", nombre: "Mente Enjambre de Servidores", costo: 120000, desbloqueada: false, prerrequisitos: ["D_CONV_1", "D_CONV_2"], tipo_bono: "-30% Costo Total", categoria: "desarrollo", rama: "SuperNodos", nivel: 5, x: 2200, y: 1750, tiempo_investigacion_dias: 365 },
  { id: "D_SUPER_2", nombre: "Singularidad Tecnológica", costo: 120000, desbloqueada: false, prerrequisitos: ["D_CONV_2", "D_CONV_3"], tipo_bono: "Desbloquea Todo Nivel Máximo", categoria: "desarrollo", rama: "SuperNodos", nivel: 5, x: 2200, y: 2250, tiempo_investigacion_dias: 365 },
  { id: "D_ULTIMATE", nombre: "Asimilación Planetaria Total", costo: 300000, desbloqueada: false, prerrequisitos: ["D_SUPER_1", "D_SUPER_2"], tipo_bono: "Conquista Instantánea Sutil", categoria: "desarrollo", rama: "Definitiva", nivel: 6, x: 2800, y: 2000, tiempo_investigacion_dias: 540 },

  // ===================== DOCTRINA MILITAR =====================
  { id: "M_ROOT", nombre: "Doctrina de Guerra Total", costo: 1000, desbloqueada: false, prerrequisitos: [], tipo_bono: "Activación del Comando Supremo", categoria: "militar", rama: "Origen", nivel: 1, x: 200, y: 2000, tiempo_investigacion_dias: 30 },

  // Primera Bifurcación (X=600): 4 Nodos
  { id: "M_B1_1", nombre: "Infantería Mecanizada", costo: 5000, desbloqueada: false, prerrequisitos: ["M_ROOT"], tipo_bono: "+10% Movilidad Terrestre", categoria: "militar", rama: "Bifurcacion", nivel: 2, x: 600, y: 1250, tiempo_investigacion_dias: 90 },
  { id: "M_B1_2", nombre: "Blindaje Reactivo", costo: 5000, desbloqueada: false, prerrequisitos: ["M_ROOT"], tipo_bono: "+15% HP Vehículos", categoria: "militar", rama: "Bifurcacion", nivel: 2, x: 600, y: 1750, tiempo_investigacion_dias: 90 },
  { id: "M_B1_3", nombre: "Balística Avanzada", costo: 5000, desbloqueada: false, prerrequisitos: ["M_ROOT"], tipo_bono: "+15% Daño Artillería", categoria: "militar", rama: "Bifurcacion", nivel: 2, x: 600, y: 2250, tiempo_investigacion_dias: 90 },
  { id: "M_B1_4", nombre: "Guerra Electrónica", costo: 5000, desbloqueada: false, prerrequisitos: ["M_ROOT"], tipo_bono: "+10% Evasión Global", categoria: "militar", rama: "Bifurcacion", nivel: 2, x: 600, y: 2750, tiempo_investigacion_dias: 90 },

  // Expansión y Especialización (X=1100): 6 Nodos
  { id: "M_EXP_1", nombre: "Implantes de Reflejos Neurales", costo: 18000, desbloqueada: false, prerrequisitos: ["M_B1_1"], tipo_bono: "+20% Daño Infantería", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 1000, tiempo_investigacion_dias: 180 },
  { id: "M_EXP_2", nombre: "Chasis de Combate Exo", costo: 18000, desbloqueada: false, prerrequisitos: ["M_B1_1", "M_B1_2"], tipo_bono: "+15% HP Infantería", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 1400, tiempo_investigacion_dias: 180 },
  { id: "M_EXP_3", nombre: "Inyecciones de Nanobots Médicos", costo: 18000, desbloqueada: false, prerrequisitos: ["M_B1_2"], tipo_bono: "-15% Tasa de Mortalidad Global", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 1800, tiempo_investigacion_dias: 180 },
  { id: "M_EXP_4", nombre: "Cargas de Plasma Térmico", costo: 18000, desbloqueada: false, prerrequisitos: ["M_B1_3"], tipo_bono: "+20% Perforación Artillería", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 2200, tiempo_investigacion_dias: 180 },
  { id: "M_EXP_5", nombre: "Inhibidores de Espectro", costo: 18000, desbloqueada: false, prerrequisitos: ["M_B1_3", "M_B1_4"], tipo_bono: "-15% Precisión Enemiga", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 2600, tiempo_investigacion_dias: 180 },
  { id: "M_EXP_6", nombre: "Algoritmos de Ciberataque", costo: 18000, desbloqueada: false, prerrequisitos: ["M_B1_4"], tipo_bono: "Sabotaje de Sistemas IA", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 3000, tiempo_investigacion_dias: 180 },

  // Convergencia Táctica (X=1600): 4 Nodos Mayores
  { id: "M_CONV_1", nombre: "Exoesqueletos de Asalto", costo: 50000, desbloqueada: false, prerrequisitos: ["M_EXP_1", "M_EXP_2", "M_EXP_3"], tipo_bono: "+25% Ataque Terrestre", categoria: "militar", rama: "Convergencia", nivel: 4, x: 1600, y: 1250, tiempo_investigacion_dias: 270 },
  { id: "M_CONV_2", nombre: "Blindados de Fusión Pesada", costo: 50000, desbloqueada: false, prerrequisitos: ["M_EXP_2", "M_EXP_3", "M_EXP_4"], tipo_bono: "+30% Armadura Vehículos", categoria: "militar", rama: "Convergencia", nivel: 4, x: 1600, y: 1750, tiempo_investigacion_dias: 270 },
  { id: "M_CONV_3", nombre: "Artillería Termobárica", costo: 50000, desbloqueada: false, prerrequisitos: ["M_EXP_4", "M_EXP_5"], tipo_bono: "+35% Daño de Área", categoria: "militar", rama: "Convergencia", nivel: 4, x: 1600, y: 2250, tiempo_investigacion_dias: 270 },
  { id: "M_CONV_4", nombre: "Ciberguerra de Enjambres", costo: 50000, desbloqueada: false, prerrequisitos: ["M_EXP_5", "M_EXP_6"], tipo_bono: "Desactiva Defensas Fronterizas", categoria: "militar", rama: "Convergencia", nivel: 4, x: 1600, y: 2750, tiempo_investigacion_dias: 270 },

  // Tecnología Orbital y Super-Armas (X=2100): 4 Nodos
  { id: "M_ORB_1", nombre: "Silos de Lanzamiento Suborbital", costo: 120000, desbloqueada: false, prerrequisitos: ["M_CONV_1"], tipo_bono: "Lanzamiento Rápido de Tropas", categoria: "militar", rama: "Orbital", nivel: 5, x: 2100, y: 1250, tiempo_investigacion_dias: 365 },
  { id: "M_ORB_2", nombre: "Escudo Deflector de Energía", costo: 120000, desbloqueada: false, prerrequisitos: ["M_CONV_1", "M_CONV_2"], tipo_bono: "Inmunidad Temporal a Ofensivas", categoria: "militar", rama: "Orbital", nivel: 5, x: 2100, y: 1750, tiempo_investigacion_dias: 365 },
  { id: "M_ORB_3", nombre: "Láseres de Precisión Orbital", costo: 120000, desbloqueada: false, prerrequisitos: ["M_CONV_2", "M_CONV_3"], tipo_bono: "+40% Daño de Precisión", categoria: "militar", rama: "Orbital", nivel: 5, x: 2100, y: 2250, tiempo_investigacion_dias: 365 },
  { id: "M_ORB_4", nombre: "Drones de Reconocimiento Estratosférico", costo: 120000, desbloqueada: false, prerrequisitos: ["M_CONV_3", "M_CONV_4"], tipo_bono: "Revelado Total de Niebla", categoria: "militar", rama: "Orbital", nivel: 5, x: 2100, y: 2750, tiempo_investigacion_dias: 365 },

  // Prototipos Finales (X=2700): 2 Super-nodos
  { id: "M_PROTO_1", nombre: "Enjambres de Drones Autónomos", costo: 300000, desbloqueada: false, prerrequisitos: ["M_ORB_1", "M_ORB_2", "M_ORB_3"], tipo_bono: "Ataque Múltiple Saturado", categoria: "militar", rama: "Prototipos", nivel: 6, x: 2700, y: 1750, tiempo_investigacion_dias: 540 },
  { id: "M_PROTO_2", nombre: "Artillería Orbital de Iones", costo: 300000, desbloqueada: false, prerrequisitos: ["M_ORB_2", "M_ORB_3", "M_ORB_4"], tipo_bono: "Desintegración de Nodos Defensivos", categoria: "militar", rama: "Prototipos", nivel: 6, x: 2700, y: 2250, tiempo_investigacion_dias: 540 },

  // El Arma Definitiva (X=3300, Y=2000): 1 Nodo ultra-caro
  { id: "M_ULTIMATE", nombre: "Iniciativa de Destrucción Mutua / Proyecto Némesis", costo: 600000, desbloqueada: false, prerrequisitos: ["M_PROTO_1", "M_PROTO_2"], tipo_bono: "Aniquilación Táctica Instantánea", categoria: "militar", rama: "Definitiva", nivel: 7, x: 3300, y: 2000, tiempo_investigacion_dias: 730 },
];



// ─── TABLAS DE CONFIGURACIÓN DE JUEGO (GAME CONFIG TABLES) ──

const HQ_STARTING_PRESETS: HQStartingPreset[] = [
  {
    tier: 1,
    countries: ["estados unidos", "usa", "united states", "rusia", "russia", "china"],
    presupuesto: 50000,
    tropas: { infanteria: 12000, caballeria: 4000, artilleria: 2000 }
  },
  {
    tier: 2,
    countries: ["alemania", "germany", "india", "francia", "france", "reino unido", "united kingdom", "brasil", "brazil", "méxico", "mexico", "japón", "japan"],
    presupuesto: 20000,
    tropas: { infanteria: 6000, caballeria: 2000, artilleria: 800 }
  },
  {
    tier: 3,
    countries: [],  // Fallback: cualquier país no listado en tiers superiores
    presupuesto: 5000,
    tropas: { infanteria: 3000, caballeria: 500, artilleria: 100 }
  }
];

const TROOP_BASE_COSTS: TroopBaseCosts = {
  infanteria: 10,
  caballeria: 25,
  artilleria: 60
};

const COMBAT_POWER_MULTIPLIERS: CombatPowerMultipliers = {
  infanteria: 1.0,
  caballeria: 1.5,
  artilleria: 3.0
};

const MAINTENANCE_TIERS: MaintenanceTier[] = [
  { minTroops: 100001, costInf: 0.02,  costCab: 0.05,  costArt: 0.15, desertionRate: 0.015 },
  { minTroops: 50001,  costInf: 0.015, costCab: 0.04,  costArt: 0.10, desertionRate: 0.01  },
  { minTroops: 15001,  costInf: 0.01,  costCab: 0.025, costArt: 0.07, desertionRate: 0.005 },
  { minTroops: 0,      costInf: 0.005, costCab: 0.015, costArt: 0.04, desertionRate: 0.001 }
];

const SIMULATION_CONSTANTS: SimulationConstants = {
  dailyEconomicGrowthRate: 0.00005,
  incomeFormulaEcoFactor: 0.1,
  incomeFormulaPopFactor: 0.001,
  incomeDivisor: 2000,
  conquestBonusPerCountry: 0.05,
  iaRecruitmentCost: 100,
  iaRecruitMinReclutas: 5,
  iaRecruitMaxReclutas: 15,
  eventIntervalMin: 10,
  eventIntervalRandom: 6,
  specialEventIntervalMin: 30,
  specialEventIntervalRandom: 20,
  mobilizationPopLimit: 0.05,
  massiveMobilizationThreshold: 0.01,
  aggressiveRecruitmentPenaltyDays: 90,
  attackTransitDays: 5
};

// ─── SIMULADOR DE DELAY DE RED ──────────────────────────────

const simulateNetworkDelay = () => new Promise(r => setTimeout(r, 500));

// ─── ENDPOINTS ASÍNCRONOS (SERVICIOS) ───────────────────────

export const fetchInitialGameState = async () => {
  await simulateNetworkDelay();
  return INITIAL_GAME_STATE;
};

export const fetchRandomEvents = async () => {
  await simulateNetworkDelay();
  return eventosAleatorios;
};

export const fetchTechTree = async () => {
  await simulateNetworkDelay();
  return initialHabilidades;
};

export const fetchCountryStats = async () => {
  await simulateNetworkDelay();
  return realPopulations;
};



export const fetchHQStartingPresets = async (): Promise<HQStartingPreset[]> => {
  return HQ_STARTING_PRESETS;
};

export const fetchTroopBaseCosts = async (): Promise<TroopBaseCosts> => {
  return TROOP_BASE_COSTS;
};

export const fetchCombatMultipliers = async (): Promise<CombatPowerMultipliers> => {
  return COMBAT_POWER_MULTIPLIERS;
};
export const fetchMaintenanceTiers = async (): Promise<MaintenanceTier[]> => {
  return MAINTENANCE_TIERS;
};

export const fetchSimulationConstants = async (): Promise<SimulationConstants> => {
  return SIMULATION_CONSTANTS;
};

export const fetchCriticalEventTemplates = async (): Promise<DBCriticalEvent[]> => {
  return CRITICAL_EVENT_TEMPLATES;
};

export const fetchDecayEventTemplates = async (): Promise<DBDecayingNotification[]> => {
  return DECAY_EVENT_TEMPLATES;
};



// ─── GENERADORES Y NORMALIZADORES DE NACIÓN (STORED PROCEDURES MOCK) ───

export const normalizeName = (name: string): string => {
  const norm = name.toLowerCase();
  if (norm.includes("united states") || norm === "usa") return "united states of america";
  if (norm.includes("congo") && (norm.includes("dem") || norm.includes("d.r."))) return "dr congo";
  if (norm.includes("central african")) return "central african rep.";
  if (norm.includes("dominican")) return "dominican rep.";
  if (norm.includes("falkland")) return "argentina";
  return norm;
};

export const getRealPopulation = (name: string, seed: number, populations?: Record<string, number>): number => {
  const norm = normalizeName(name);
  const targetPopulations = populations || realPopulations;
  for (const [key, value] of Object.entries(targetPopulations)) {
    const keyLower = key.toLowerCase();
    if (norm === keyLower || norm.includes(keyLower) || keyLower.includes(norm)) {
      const growthFactor = 1.05 + ((seed % 15) / 100);
      return Math.floor(value * growthFactor);
    }
  }
  return Math.floor((2000000 + (seed * 150000) % 43000000) * 1.1);
};

export const getRealEconomy = (name: string, population: number, seed: number): number => {
  const preset = getPresetForCountry(name);
  let gdpVar = 0;
  if (preset.gdpPerCapita >= 60000) {
    gdpVar = (seed % 20) * 1000;
  } else if (preset.gdpPerCapita >= 10000) {
    gdpVar = (seed % 15) * 800;
  } else {
    gdpVar = (seed % 10) * 500;
  }
  const finalGdpPerCapita = preset.gdpPerCapita + gdpVar;
  return Math.max(1, Math.floor((population * finalGdpPerCapita) / 1000000));
};

export const getRealEjercitoDetalle = (isAliado: boolean, population: number, seed: number, nameEN: string): Tropas => {
  if (isAliado) return { infanteria: 0, caballeria: 0, artilleria: 0 };
  const preset = getPresetForCountry(nameEN);
  const baseSize = Math.max(100, Math.floor(Math.sqrt(population) * (5 + (seed % 5)) * preset.ejercitoMultiplicador));

  return {
    infanteria: Math.floor(baseSize * preset.composicion.infanteria),
    caballeria: Math.floor(baseSize * preset.composicion.caballeria),
    artilleria: Math.floor(baseSize * preset.composicion.artilleria),
  };
};
