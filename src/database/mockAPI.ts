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
  prerrequisito_id: string | null;
  tipo_bono: string;
  categoria: "desarrollo" | "militar";
  rama: string;
  nivel: number;
  x: number;
  y: number;
};

export interface SaveFile {
  id: string;
  commanderID: string;
  hq: string;
  creationDate: string;
  lastSaveDate: string;
  campaignDays: number;
  dominionPercent: number;
  budget: number;
  troops: number;
}

type Tropas = {
  infanteria: number;
  caballeria: number;
  artilleria: number;
};

// ─── DATOS PRIVADOS (NO EXPORTADOS) ─────────────────────────

const INITIAL_GAME_STATE = {
  presupuesto: 5000,
  tropas: { infanteria: 5000, caballeria: 2000, artilleria: 500 }
};

const OPERARIOS_DB = [
  { id: "ALEJANDRO", password: "123" },
  { id: "NEXUS-09", password: "admin" }
];

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

const eventosAleatorios = [
  { 
    titulo: "SABOTAJE EN LA RED CLIMÁTICA",
    mensaje: "Una tormenta de arena ionizada inducida por hackeo interrumpe los canales de extracción en los yacimientos de Medio Oriente. La infraestructura táctica reporta daños severos en los nodos. Impacto: -500 Créditos de Oro globales.", 
    tipo: "alert" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro: Math.max(0, oro - 500), tropas }) 
  },
  { 
    titulo: "CAMPAÑA DE CONCRIPCIÓN SATELITAL",
    mensaje: "Nuestra señal de propaganda de alta frecuencia ha sorteado los cortafuegos del hemisferio sur, motivando a reservistas locales. Se reporta un flujo de refuerzo táctico. Impacto: +200 Infantería en la reserva.", 
    tipo: "success" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, infanteria: tropas.infanteria + 200 } }) 
  },
  { 
    titulo: "EXTRACCIÓN DE CRIPTOMINAS SIBERIANAS",
    mensaje: "Nuestras sondas autónomas reactivaron una granja de servidores de la ex-megacorporación siberiana en desuso, liquidando activos protegidos. Impacto: +1000 Créditos de Oro globales transferidos a tesorería.", 
    tipo: "success" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro: oro + 1000, tropas }) 
  },
  { 
    titulo: "DESERCIÓN MASIVA EN FRONTERA",
    mensaje: "Un ciberataque de pulso electromagnético del enemigo desactiva los chips neurales de obediencia de un regimiento fronterizo, provocando su desconexión y retirada. Impacto: -100 Unidades de Caballería táctica.", 
    tipo: "alert" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, caballeria: Math.max(0, tropas.caballeria - 100) } }) 
  },
  { 
    titulo: "TREGUA DIGITAL ESTABLECIDA",
    mensaje: "Los sistemas de cifrado de la megacorporación rival detectaron nuestras sondas de escaneo en los frentes fronterizos. Se firma una tregua digital temporal automática mientras se reconfiguran los firewalls. Sin cambios militares reportados.", 
    tipo: "info" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas }) 
  }
];

const initialHabilidades: Habilidad[] = [
  // ===================== DESARROLLO =====================
  { id: "D_ROOT", nombre: "Protocolo de Enlace Neuronal", costo: 300, desbloqueada: false, prerrequisito_id: null, tipo_bono: "+5% Eficiencia Global", categoria: "desarrollo", rama: "raiz", nivel: 0, x: 50, y: 200 },
  
  // Rama A: Economía
  { id: "D_A1", nombre: "Algoritmos Financieros", costo: 500, desbloqueada: false, prerrequisito_id: "D_ROOT", tipo_bono: "+10% Ingresos Oro", categoria: "desarrollo", rama: "A", nivel: 1, x: 350, y: 50 },
  { id: "D_A2", nombre: "Cripto-Minería Geotérmica", costo: 900, desbloqueada: false, prerrequisito_id: "D_A1", tipo_bono: "+20% Ingresos Oro", categoria: "desarrollo", rama: "A", nivel: 2, x: 650, y: 50 },
  { id: "D_A3", nombre: "Monopolio de Red de Datos", costo: 2000, desbloqueada: false, prerrequisito_id: "D_A2", tipo_bono: "+50% Ingresos Oro", categoria: "desarrollo", rama: "A", nivel: 3, x: 950, y: 50 },
  
  // Rama B: Infraestructura
  { id: "D_B1", nombre: "Líneas de Ensamblaje Auto", costo: 550, desbloqueada: false, prerrequisito_id: "D_ROOT", tipo_bono: "-5% Costo Construcción", categoria: "desarrollo", rama: "B", nivel: 1, x: 350, y: 200 },
  { id: "D_B2", nombre: "Impresión Molecular", costo: 1000, desbloqueada: false, prerrequisito_id: "D_B1", tipo_bono: "-15% Costo Construcción", categoria: "desarrollo", rama: "B", nivel: 2, x: 650, y: 200 },
  { id: "D_B3", nombre: "Fábricas Orbitales", costo: 2200, desbloqueada: false, prerrequisito_id: "D_B2", tipo_bono: "-30% Costo Construcción", categoria: "desarrollo", rama: "B", nivel: 3, x: 950, y: 200 },
  
  // Rama C: Ciberdefensa
  { id: "D_C1", nombre: "Firewalls Cuánticos", costo: 600, desbloqueada: false, prerrequisito_id: "D_ROOT", tipo_bono: "+10% Defensa Ciber", categoria: "desarrollo", rama: "C", nivel: 1, x: 350, y: 350 },
  { id: "D_C2", nombre: "Virus de Desinformación", costo: 1100, desbloqueada: false, prerrequisito_id: "D_C1", tipo_bono: "+20% Sabotaje", categoria: "desarrollo", rama: "C", nivel: 2, x: 650, y: 350 },
  { id: "D_C3", nombre: "Control Satelital", costo: 2500, desbloqueada: false, prerrequisito_id: "D_C2", tipo_bono: "Revelar Mapa Completo", categoria: "desarrollo", rama: "C", nivel: 3, x: 950, y: 350 },

  // ===================== DOCTRINA MILITAR =====================
  { id: "M_ROOT", nombre: "Protocolo de Movilización Global", costo: 400, desbloqueada: false, prerrequisito_id: null, tipo_bono: "+5% Ataque Global", categoria: "militar", rama: "raiz", nivel: 0, x: 50, y: 200 },
  
  // Rama 1: Infantería
  { id: "M_11", nombre: "Entrenamiento en Gravedad Cero", costo: 600, desbloqueada: false, prerrequisito_id: "M_ROOT", tipo_bono: "+10% HP Infantería", categoria: "militar", rama: "1", nivel: 1, x: 350, y: 50 },
  { id: "M_12", nombre: "Armaduras Tácticas de Grafeno", costo: 1200, desbloqueada: false, prerrequisito_id: "M_11", tipo_bono: "+20% Def Infantería", categoria: "militar", rama: "1", nivel: 2, x: 650, y: 50 },
  { id: "M_13", nombre: "Exoesqueletos de Combate Autónomos", costo: 2500, desbloqueada: false, prerrequisito_id: "M_12", tipo_bono: "+40% Ataque Infantería", categoria: "militar", rama: "1", nivel: 3, x: 950, y: 50 },
  
  // Rama 2: Caballería / Movilidad
  { id: "M_21", nombre: "Vehículos de Asalto Todo Terreno", costo: 700, desbloqueada: false, prerrequisito_id: "M_ROOT", tipo_bono: "+10% Vel Movimiento", categoria: "militar", rama: "2", nivel: 1, x: 350, y: 200 },
  { id: "M_22", nombre: "Tanques Aerodeslizadores", costo: 1400, desbloqueada: false, prerrequisito_id: "M_21", tipo_bono: "+20% Vel Movimiento", categoria: "militar", rama: "2", nivel: 2, x: 650, y: 200 },
  { id: "M_23", nombre: "Caballería de Propulsión Iónica", costo: 2800, desbloqueada: false, prerrequisito_id: "M_22", tipo_bono: "+50% Ataque Sorpresa", categoria: "militar", rama: "2", nivel: 3, x: 950, y: 200 },
  
  // Rama 3: Artillería
  { id: "M_31", nombre: "Artillería de Asedio de Precisión", costo: 800, desbloqueada: false, prerrequisito_id: "M_ROOT", tipo_bono: "+15% Daño Área", categoria: "militar", rama: "3", nivel: 1, x: 350, y: 350 },
  { id: "M_32", nombre: "Munición Inteligente Guiada por IA", costo: 1600, desbloqueada: false, prerrequisito_id: "M_31", tipo_bono: "+25% Precisión", categoria: "militar", rama: "3", nivel: 2, x: 650, y: 350 },
  { id: "M_33", nombre: "Cañones de Riel Electromagnéticos", costo: 3000, desbloqueada: false, prerrequisito_id: "M_32", tipo_bono: "+60% Daño a Fortalezas", categoria: "militar", rama: "3", nivel: 3, x: 950, y: 350 },
  
  // Rama 4: Secreto
  { id: "M_SEC", nombre: "Cibernética de Vanguardia", costo: 4000, desbloqueada: false, prerrequisito_id: null, tipo_bono: "+100% Eficiencia Táctica", categoria: "militar", rama: "sec", nivel: 4, x: 1250, y: 200 },
];

const initialSaves: SaveFile[] = [
  {
    id: "save-01",
    commanderID: "OMEGA-PROTOCOL-01",
    hq: "ESTADOS UNIDOS",
    creationDate: "2027-05-01 08:30",
    lastSaveDate: "2027-05-15 22:45",
    campaignDays: 14,
    dominionPercent: 32.5,
    budget: 125000,
    troops: 45000
  },
  {
    id: "save-02",
    commanderID: "NEXUS-COMMANDER-09",
    hq: "ALEMANIA",
    creationDate: "2027-04-10 12:15",
    lastSaveDate: "2027-04-20 18:33",
    campaignDays: 10,
    dominionPercent: 15.2,
    budget: 84000,
    troops: 28000
  },
  {
    id: "save-03",
    commanderID: "SHADOW-OPERATOR-X",
    hq: "JAPÓN",
    creationDate: "2027-05-18 19:00",
    lastSaveDate: "2027-06-02 01:10",
    campaignDays: 25,
    dominionPercent: 68.9,
    budget: 310000,
    troops: 112000
  }
];

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

export const fetchSavedGames = async () => {
  await simulateNetworkDelay();
  return initialSaves;
};

export const authenticateOperator = async (id: string, password: string) => {
  await simulateNetworkDelay();
  return OPERARIOS_DB.some(op => op.id === id && op.password === password);
};
