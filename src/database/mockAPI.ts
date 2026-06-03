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
  // ===================== INFRAESTRUCTURA (DESARROLLO) =====================
  // Origen (X=200, Y=2000): 1 nodo raíz principal
  { id: "D_ROOT", nombre: "Protocolo de Despertar", costo: 150, desbloqueada: false, prerrequisitos: [], tipo_bono: "Activación del Núcleo Táctico", categoria: "desarrollo", rama: "Origen", nivel: 1, x: 200, y: 2000 },

  // Primera Bifurcación (X=600): 3 nodos
  { id: "D_B1_1", nombre: "Extracción Profunda", costo: 300, desbloqueada: false, prerrequisitos: ["D_ROOT"], tipo_bono: "+5% Ingresos Oro", categoria: "desarrollo", rama: "Bifurcacion", nivel: 2, x: 600, y: 1500 },
  { id: "D_B1_2", nombre: "Redes Neuronales Básicas", costo: 400, desbloqueada: false, prerrequisitos: ["D_ROOT"], tipo_bono: "+5% Eficiencia Global", categoria: "desarrollo", rama: "Bifurcacion", nivel: 2, x: 600, y: 2000 },
  { id: "D_B1_3", nombre: "Gestión de Flotas Auto", costo: 350, desbloqueada: false, prerrequisitos: ["D_ROOT"], tipo_bono: "-5% Costo Despliegue", categoria: "desarrollo", rama: "Bifurcacion", nivel: 2, x: 600, y: 2500 },

  // Expansión (X=1100): 5 nodos
  { id: "D_EXP_1", nombre: "Minería Suboceánica", costo: 700, desbloqueada: false, prerrequisitos: ["D_B1_1"], tipo_bono: "+10% Ingresos Oro", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 1000 },
  { id: "D_EXP_2", nombre: "Procesadores Cuánticos", costo: 800, desbloqueada: false, prerrequisitos: ["D_B1_1", "D_B1_2"], tipo_bono: "+10% Eficiencia Global", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 1500 },
  { id: "D_EXP_3", nombre: "Sabotaje Financiero", costo: 1000, desbloqueada: false, prerrequisitos: ["D_B1_2"], tipo_bono: "+10% Robo de Fondos", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 2000 },
  { id: "D_EXP_4", nombre: "Nodos Logísticos Subterráneos", costo: 750, desbloqueada: false, prerrequisitos: ["D_B1_2", "D_B1_3"], tipo_bono: "-10% Costo Despliegue", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 2500 },
  { id: "D_EXP_5", nombre: "Lanzamiento de Microsatélites", costo: 600, desbloqueada: false, prerrequisitos: ["D_B1_3"], tipo_bono: "+10% Visión Táctica", categoria: "desarrollo", rama: "Expansion", nivel: 3, x: 1100, y: 3000 },

  // Convergencia Parcial (X=1600): 3 nodos mayores
  { id: "D_CONV_1", nombre: "Perforación Mantélica", costo: 1500, desbloqueada: false, prerrequisitos: ["D_EXP_1", "D_EXP_2"], tipo_bono: "+20% Ingresos Oro", categoria: "desarrollo", rama: "Convergencia", nivel: 4, x: 1600, y: 1500 },
  { id: "D_CONV_2", nombre: "IA Directiva de Producción", costo: 2000, desbloqueada: false, prerrequisitos: ["D_EXP_2", "D_EXP_4"], tipo_bono: "+20% Velocidad Construcción", categoria: "desarrollo", rama: "Convergencia", nivel: 4, x: 1600, y: 2000 },
  { id: "D_CONV_3", nombre: "Trenes Maglev Transcontinentales", costo: 1600, desbloqueada: false, prerrequisitos: ["D_EXP_4", "D_EXP_5"], tipo_bono: "+15% Reserva Máxima", categoria: "desarrollo", rama: "Convergencia", nivel: 4, x: 1600, y: 2500 },

  { id: "D_SUPER_1", nombre: "Mente Enjambre de Servidores", costo: 5000, desbloqueada: false, prerrequisitos: ["D_CONV_1", "D_CONV_2"], tipo_bono: "-30% Costo Total", categoria: "desarrollo", rama: "SuperNodos", nivel: 5, x: 2200, y: 1750 },
  { id: "D_SUPER_2", nombre: "Singularidad Tecnológica", costo: 8000, desbloqueada: false, prerrequisitos: ["D_CONV_2", "D_CONV_3"], tipo_bono: "Desbloquea Todo Nivel Máximo", categoria: "desarrollo", rama: "SuperNodos", nivel: 5, x: 2200, y: 2250 },
  { id: "D_ULTIMATE", nombre: "Asimilación Planetaria Total", costo: 25000, desbloqueada: false, prerrequisitos: ["D_SUPER_1", "D_SUPER_2"], tipo_bono: "Conquista Instantánea Sutil", categoria: "desarrollo", rama: "Definitiva", nivel: 6, x: 2800, y: 2000 },

  // ===================== DOCTRINA MILITAR =====================
  { id: "M_L1_1", nombre: "Entrenamiento Básico Alterado", costo: 300, desbloqueada: false, prerrequisitos: [], tipo_bono: "+5% HP Infantería", categoria: "militar", rama: "L1", nivel: 1, x: 100, y: 200 },
  { id: "M_L1_2", nombre: "Armaduras Tácticas de Grafeno", costo: 700, desbloqueada: false, prerrequisitos: ["M_L1_1"], tipo_bono: "+10% Def Infantería", categoria: "militar", rama: "L1", nivel: 2, x: 450, y: 200 },
  { id: "M_L1_3", nombre: "Implantes Neuronales de Combate", costo: 1500, desbloqueada: false, prerrequisitos: ["M_L1_2"], tipo_bono: "+20% Ataque Infantería", categoria: "militar", rama: "L1", nivel: 3, x: 800, y: 200 },
  { id: "M_L1_4", nombre: "Exoesqueletos de Asalto", costo: 3000, desbloqueada: false, prerrequisitos: ["M_L1_3"], tipo_bono: "+35% HP Infantería", categoria: "militar", rama: "L1", nivel: 4, x: 1150, y: 200 },
  { id: "M_L1_5", nombre: "Supersoldados Quiméricos", costo: 6000, desbloqueada: false, prerrequisitos: ["M_L1_4"], tipo_bono: "+50% Ataque Infantería", categoria: "militar", rama: "L1", nivel: 5, x: 1500, y: 200 },
  { id: "M_L1_6", nombre: "Legiones de Infantería Ciborg", costo: 12000, desbloqueada: false, prerrequisitos: ["M_L1_5"], tipo_bono: "Infantería Indestructible", categoria: "militar", rama: "L1", nivel: 6, x: 1850, y: 200 },
  { id: "M_L2_1", nombre: "Motores de Combustión Óptima", costo: 400, desbloqueada: false, prerrequisitos: [], tipo_bono: "+5% Vel Vehículos", categoria: "militar", rama: "L2", nivel: 1, x: 100, y: 450 },
  { id: "M_L2_2", nombre: "Blindaje Reactivo Inteligente", costo: 800, desbloqueada: false, prerrequisitos: ["M_L2_1"], tipo_bono: "+10% Def Blindados", categoria: "militar", rama: "L2", nivel: 2, x: 450, y: 450 },
  { id: "M_L2_3", nombre: "Tanques de Asalto Automáticos", costo: 1600, desbloqueada: false, prerrequisitos: ["M_L2_2"], tipo_bono: "+20% Ataque Blindados", categoria: "militar", rama: "L2", nivel: 3, x: 800, y: 450 },
  { id: "M_L2_4", nombre: "Aerodeslizadores Magnéticos", costo: 3200, desbloqueada: false, prerrequisitos: ["M_L2_3"], tipo_bono: "+35% Evasión Vehículos", categoria: "militar", rama: "L2", nivel: 4, x: 1150, y: 450 },
  { id: "M_L2_5", nombre: "Mechas de Artillería Bípedos", costo: 7000, desbloqueada: false, prerrequisitos: ["M_L2_4"], tipo_bono: "+50% Daño Devastador", categoria: "militar", rama: "L2", nivel: 5, x: 1500, y: 450 },
  { id: "M_L2_6", nombre: "Titanes de Combate Terrestre", costo: 15000, desbloqueada: false, prerrequisitos: ["M_L2_5"], tipo_bono: "Vehículos Arrasan Todo", categoria: "militar", rama: "L2", nivel: 6, x: 1850, y: 450 },
  { id: "M_L3_1", nombre: "Radares de Focalización Temprana", costo: 500, desbloqueada: false, prerrequisitos: [], tipo_bono: "+5% Precisión", categoria: "militar", rama: "L3", nivel: 1, x: 100, y: 700 },
  { id: "M_L3_2", nombre: "Obuses de Munición Inteligente", costo: 1000, desbloqueada: false, prerrequisitos: ["M_L3_1"], tipo_bono: "+10% Daño Artillería", categoria: "militar", rama: "L3", nivel: 2, x: 450, y: 700 },
  { id: "M_L3_3", nombre: "Lanzacohetes Térmicos Múltiples", costo: 2000, desbloqueada: false, prerrequisitos: ["M_L3_2"], tipo_bono: "+20% Daño de Área", categoria: "militar", rama: "L3", nivel: 3, x: 800, y: 700 },
  { id: "M_L3_4", nombre: "Baterías de Misiles Hipersónicos", costo: 4000, desbloqueada: false, prerrequisitos: ["M_L3_3"], tipo_bono: "+35% Perforación Blindaje", categoria: "militar", rama: "L3", nivel: 4, x: 1150, y: 700 },
  { id: "M_L3_5", nombre: "Cañones de Iones Atmosféricos", costo: 8000, desbloqueada: false, prerrequisitos: ["M_L3_4"], tipo_bono: "+50% Daño de Área", categoria: "militar", rama: "L3", nivel: 5, x: 1500, y: 700 },
  { id: "M_L3_6", nombre: "Bombardeo Cinético de Tungsteno", costo: 16000, desbloqueada: false, prerrequisitos: ["M_L3_5"], tipo_bono: "Destruye Fortalezas de 1 Golpe", categoria: "militar", rama: "L3", nivel: 6, x: 1850, y: 700 },
  { id: "M_L4_1", nombre: "Campañas de Desinformación", costo: 450, desbloqueada: false, prerrequisitos: [], tipo_bono: "-5% Moral Enemiga", categoria: "militar", rama: "L4", nivel: 1, x: 100, y: 950 },
  { id: "M_L4_2", nombre: "Hackeo de Transmisiones", costo: 900, desbloqueada: false, prerrequisitos: ["M_L4_1"], tipo_bono: "Causa Deserción Ligera", categoria: "militar", rama: "L4", nivel: 2, x: 450, y: 950 },
  { id: "M_L4_3", nombre: "Sondas Holo-Terror", costo: 1800, desbloqueada: false, prerrequisitos: ["M_L4_2"], tipo_bono: "-15% Moral Enemiga", categoria: "militar", rama: "L4", nivel: 3, x: 800, y: 950 },
  { id: "M_L4_4", nombre: "Drones de Frecuencia Pánica", costo: 3600, desbloqueada: false, prerrequisitos: ["M_L4_3"], tipo_bono: "Retirada Forzosa Probable", categoria: "militar", rama: "L4", nivel: 4, x: 1150, y: 950 },
  { id: "M_L4_5", nombre: "Neuro-Virus Auditivos", costo: 7500, desbloqueada: false, prerrequisitos: ["M_L4_4"], tipo_bono: "Tropas Enemigas se Atacan", categoria: "militar", rama: "L4", nivel: 5, x: 1500, y: 950 },
  { id: "M_L4_6", nombre: "Proyección de Falso Dios", costo: 18000, desbloqueada: false, prerrequisitos: ["M_L4_5"], tipo_bono: "Sumisión Automática", categoria: "militar", rama: "L4", nivel: 6, x: 1850, y: 950 },
  { id: "M_L5_1", nombre: "Fuerzas de Infiltración", costo: 600, desbloqueada: false, prerrequisitos: [], tipo_bono: "+5% Ataque Sorpresa", categoria: "militar", rama: "L5", nivel: 1, x: 100, y: 1200 },
  { id: "M_L5_2", nombre: "Camuflaje Óptico Activo", costo: 1200, desbloqueada: false, prerrequisitos: ["M_L5_1"], tipo_bono: "+10% Evasión Global", categoria: "militar", rama: "L5", nivel: 2, x: 450, y: 1200 },
  { id: "M_L5_3", nombre: "Escuadrones de Asesinato Auto", costo: 2500, desbloqueada: false, prerrequisitos: ["M_L5_2"], tipo_bono: "Eliminar Oficiales Enemigos", categoria: "militar", rama: "L5", nivel: 3, x: 800, y: 1200 },
  { id: "M_L5_4", nombre: "Sabotaje de Instalaciones Nivel 4", costo: 5000, desbloqueada: false, prerrequisitos: ["M_L5_3"], tipo_bono: "-30% Prod. Enemiga", categoria: "militar", rama: "L5", nivel: 4, x: 1150, y: 1200 },
  { id: "M_L5_5", nombre: "Red de Topos Durmientes", costo: 10000, desbloqueada: false, prerrequisitos: ["M_L5_4"], tipo_bono: "Revelar Tácticas Ocultas", categoria: "militar", rama: "L5", nivel: 5, x: 1500, y: 1200 },
  { id: "M_L5_6", nombre: "Comando Espectro Fantasma", costo: 22000, desbloqueada: false, prerrequisitos: ["M_L5_5"], tipo_bono: "Ataque Silencioso Mortal", categoria: "militar", rama: "L5", nivel: 6, x: 1850, y: 1200 },
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
