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
  // ── ALERTAS (Pérdidas) ──────────────────────────────────────
  { 
    titulo: "SABOTAJE EN LA RED CLIMÁTICA",
    mensaje: "Una tormenta de arena ionizada inducida por hackeo interrumpe los canales de extracción en los yacimientos de Medio Oriente. La infraestructura táctica reporta daños severos en los nodos. Impacto: -500 Créditos de Oro.", 
    tipo: "alert" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro: Math.max(0, oro - 500), tropas }) 
  },
  { 
    titulo: "DESERCIÓN MASIVA EN FRONTERA",
    mensaje: "Un ciberataque de pulso electromagnético del enemigo desactiva los chips neurales de obediencia de un regimiento fronterizo, provocando su desconexión y retirada. Impacto: -100 Unidades de Caballería.", 
    tipo: "alert" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, caballeria: Math.max(0, tropas.caballeria - 100) } }) 
  },
  { 
    titulo: "VIRUS EN EL SISTEMA LOGÍSTICO",
    mensaje: "Un ransomware cuántico de origen desconocido ha cifrado los manifiestos de suministro del sector norte, paralizando la distribución de armamento pesado. Impacto: -50 Artillería.", 
    tipo: "alert" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, artilleria: Math.max(0, tropas.artilleria - 50) } }) 
  },
  { 
    titulo: "COLAPSO DE NODO FINANCIERO",
    mensaje: "El nodo bancario descentralizado de Nueva Shanghái ha sufrido un exploit de día cero. Los fondos de contingencia fueron drenados antes de que los cortafuegos reaccionaran. Impacto: -800 Créditos de Oro.", 
    tipo: "alert" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro: Math.max(0, oro - 800), tropas }) 
  },
  { 
    titulo: "MOTÍN EN GUARNICIÓN REMOTA",
    mensaje: "Las tropas estacionadas en el complejo ártico Vostok-7 se han rebelado tras un fallo en los sistemas de calefacción neural. El destacamento se ha dispersado en la tundra. Impacto: -150 Infantería.", 
    tipo: "alert" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, infanteria: Math.max(0, tropas.infanteria - 150) } }) 
  },
  { 
    titulo: "SABOTAJE EN CONVOY BLINDADO",
    mensaje: "Un convoy de suministros blindados fue emboscado en el corredor de los Balcanes por células insurgentes equipadas con EMP tácticos. Vehículos irrecuperables. Impacto: -75 Caballería.", 
    tipo: "alert" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, caballeria: Math.max(0, tropas.caballeria - 75) } }) 
  },
  { 
    titulo: "ATAQUE A CADENA DE SUMINISTRO",
    mensaje: "Agentes hostiles infiltraron nuestra cadena de producción de municiones inteligentes, insertando firmware defectuoso. Lote completo inutilizado. Impacto: -300 Créditos de Oro.", 
    tipo: "alert" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro: Math.max(0, oro - 300), tropas }) 
  },

  // ── ÉXITOS (Ganancias) ──────────────────────────────────────
  { 
    titulo: "CAMPAÑA DE CONSCRIPCIÓN SATELITAL",
    mensaje: "Nuestra señal de propaganda de alta frecuencia ha sorteado los cortafuegos del hemisferio sur, motivando a reservistas locales. Se reporta un flujo de refuerzo táctico. Impacto: +200 Infantería.", 
    tipo: "success" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, infanteria: tropas.infanteria + 200 } }) 
  },
  { 
    titulo: "EXTRACCIÓN DE CRIPTOMINAS SIBERIANAS",
    mensaje: "Nuestras sondas autónomas reactivaron una granja de servidores de la ex-megacorporación siberiana en desuso, liquidando activos protegidos. Impacto: +1000 Créditos de Oro.", 
    tipo: "success" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro: oro + 1000, tropas }) 
  },
  { 
    titulo: "RECLUTAMIENTO DE MERCENARIOS NÓMADAS",
    mensaje: "Un clan de mercenarios cibernéticos del desierto del Sahel ha aceptado nuestro contrato. Unidades blindadas experimentadas se integran al contingente. Impacto: +120 Caballería.", 
    tipo: "success" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, caballeria: tropas.caballeria + 120 } }) 
  },
  { 
    titulo: "DECOMISO DE ARSENAL ENEMIGO",
    mensaje: "Operaciones especiales asaltaron un depósito subterráneo enemigo en los montes Urales. Se recuperaron piezas de artillería de plasma intactas. Impacto: +80 Artillería.", 
    tipo: "success" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, artilleria: tropas.artilleria + 80 } }) 
  },
  { 
    titulo: "CONTRATO CORPORATIVO SELLADO",
    mensaje: "La megacorporación Nexus-Dynamics ha firmado un acuerdo de suministro exclusivo con nuestro comando. Transferencia inmediata de fondos al tesoro central. Impacto: +1500 Créditos de Oro.", 
    tipo: "success" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro: oro + 1500, tropas }) 
  },
  { 
    titulo: "COSECHA DE DATOS EXITOSA",
    mensaje: "Nuestros bots de scraping cuántico infiltraron la base de datos fiscal de tres naciones-estado rivales. Información monetizada en el mercado negro digital. Impacto: +700 Créditos de Oro.", 
    tipo: "success" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro: oro + 700, tropas }) 
  },
  { 
    titulo: "REACTIVACIÓN DE AUTÓMATAS BÉLICOS",
    mensaje: "Un almacén olvidado de la era pre-colapso fue descubierto en las catacumbas de Neo-Berlín. Autómatas de combate reactivados y asignados al frente. Impacto: +300 Infantería.", 
    tipo: "success" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, infanteria: tropas.infanteria + 300 } }) 
  },

  // ── INFORMATIVOS (Sin efecto mecánico) ──────────────────────
  { 
    titulo: "TREGUA DIGITAL ESTABLECIDA",
    mensaje: "Los sistemas de cifrado de la megacorporación rival detectaron nuestras sondas de escaneo en los frentes fronterizos. Se firma una tregua digital temporal automática mientras se reconfiguran los firewalls. Sin cambios reportados.", 
    tipo: "info" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas }) 
  },
  { 
    titulo: "ANOMALÍA ELECTROMAGNÉTICA DETECTADA",
    mensaje: "Los sensores orbitales registraron una fluctuación magnética masiva sobre el Triángulo de las Bermudas. Los analistas no logran determinar si es fenómeno natural o arma experimental enemiga. Monitoreo activo.", 
    tipo: "info" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas }) 
  },
  { 
    titulo: "TRANSMISIÓN INTERCEPTADA",
    mensaje: "Inteligencia descifró una comunicación encriptada entre dos facciones rivales. Aparentemente planean una alianza temporal contra nuestro sector. El Alto Mando evalúa contramedidas diplomáticas.", 
    tipo: "info" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas }) 
  },
  { 
    titulo: "MIGRACIÓN MASIVA EN FRONTERA SUR",
    mensaje: "Oleadas de civiles desplazados por los conflictos en el corredor centroamericano se agolpan en los puntos de control. Los recursos humanitarios están siendo redistribuidos. Sin impacto militar directo.", 
    tipo: "info" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas }) 
  },
  { 
    titulo: "ACTUALIZACIÓN DE FIRMWARE GLOBAL",
    mensaje: "El Comando Central ha desplegado el parche v7.41 en todos los exoesqueletos de combate. Tiempo de inactividad temporal de 6 horas en el hemisferio occidental. Operaciones restauradas con éxito.", 
    tipo: "info" as const, 
    efecto: (oro: number, tropas: Tropas) => ({ oro, tropas }) 
  },
  { 
    titulo: "ECLIPSE SOLAR TÁCTICO",
    mensaje: "Un eclipse solar ha interferido temporalmente con los paneles solares de los satélites de reconocimiento. Las comunicaciones de largo alcance operan al 40% de capacidad durante las próximas horas.", 
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
  { id: "M_ROOT", nombre: "Doctrina de Guerra Total", costo: 400, desbloqueada: false, prerrequisitos: [], tipo_bono: "Activación del Comando Supremo", categoria: "militar", rama: "Origen", nivel: 1, x: 200, y: 2000 },

  // Primera Bifurcación (X=600): 4 Nodos
  { id: "M_B1_1", nombre: "Infantería Mecanizada", costo: 800, desbloqueada: false, prerrequisitos: ["M_ROOT"], tipo_bono: "+10% Movilidad Terrestre", categoria: "militar", rama: "Bifurcacion", nivel: 2, x: 600, y: 1250 },
  { id: "M_B1_2", nombre: "Blindaje Reactivo", costo: 900, desbloqueada: false, prerrequisitos: ["M_ROOT"], tipo_bono: "+15% HP Vehículos", categoria: "militar", rama: "Bifurcacion", nivel: 2, x: 600, y: 1750 },
  { id: "M_B1_3", nombre: "Balística Avanzada", costo: 850, desbloqueada: false, prerrequisitos: ["M_ROOT"], tipo_bono: "+15% Daño Artillería", categoria: "militar", rama: "Bifurcacion", nivel: 2, x: 600, y: 2250 },
  { id: "M_B1_4", nombre: "Guerra Electrónica", costo: 1000, desbloqueada: false, prerrequisitos: ["M_ROOT"], tipo_bono: "+10% Evasión Global", categoria: "militar", rama: "Bifurcacion", nivel: 2, x: 600, y: 2750 },

  // Expansión y Especialización (X=1100): 6 Nodos
  { id: "M_EXP_1", nombre: "Implantes de Reflejos Neurales", costo: 1500, desbloqueada: false, prerrequisitos: ["M_B1_1"], tipo_bono: "+20% Daño Infantería", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 1000 },
  { id: "M_EXP_2", nombre: "Chasis de Combate Exo", costo: 1800, desbloqueada: false, prerrequisitos: ["M_B1_1", "M_B1_2"], tipo_bono: "+15% HP Infantería", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 1400 },
  { id: "M_EXP_3", nombre: "Nanocapas Autoreparables", costo: 2000, desbloqueada: false, prerrequisitos: ["M_B1_2"], tipo_bono: "+20% Armadura Blindados", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 1800 },
  { id: "M_EXP_4", nombre: "Cargas de Plasma Térmico", costo: 2200, desbloqueada: false, prerrequisitos: ["M_B1_3"], tipo_bono: "+20% Perforación Artillería", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 2200 },
  { id: "M_EXP_5", nombre: "Inhibidores de Espectro", costo: 2100, desbloqueada: false, prerrequisitos: ["M_B1_3", "M_B1_4"], tipo_bono: "-15% Precisión Enemiga", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 2600 },
  { id: "M_EXP_6", nombre: "Algoritmos de Ciberataque", costo: 2500, desbloqueada: false, prerrequisitos: ["M_B1_4"], tipo_bono: "Sabotaje de Sistemas IA", categoria: "militar", rama: "Expansion", nivel: 3, x: 1100, y: 3000 },

  // Convergencia Táctica (X=1600): 4 Nodos Mayores
  { id: "M_CONV_1", nombre: "Exoesqueletos de Asalto", costo: 4000, desbloqueada: false, prerrequisitos: ["M_EXP_1", "M_EXP_2", "M_EXP_3"], tipo_bono: "+25% Ataque Terrestre", categoria: "militar", rama: "Convergencia", nivel: 4, x: 1600, y: 1250 },
  { id: "M_CONV_2", nombre: "Blindados de Fusión Pesada", costo: 4500, desbloqueada: false, prerrequisitos: ["M_EXP_2", "M_EXP_3", "M_EXP_4"], tipo_bono: "+30% Armadura Vehículos", categoria: "militar", rama: "Convergencia", nivel: 4, x: 1600, y: 1750 },
  { id: "M_CONV_3", nombre: "Artillería Termobárica", costo: 4200, desbloqueada: false, prerrequisitos: ["M_EXP_4", "M_EXP_5"], tipo_bono: "+35% Daño de Área", categoria: "militar", rama: "Convergencia", nivel: 4, x: 1600, y: 2250 },
  { id: "M_CONV_4", nombre: "Ciberguerra de Enjambres", costo: 5000, desbloqueada: false, prerrequisitos: ["M_EXP_5", "M_EXP_6"], tipo_bono: "Desactiva Defensas Fronterizas", categoria: "militar", rama: "Convergencia", nivel: 4, x: 1600, y: 2750 },

  // Tecnología Orbital y Super-Armas (X=2100): 4 Nodos
  { id: "M_ORB_1", nombre: "Silos de Lanzamiento Suborbital", costo: 7500, desbloqueada: false, prerrequisitos: ["M_CONV_1"], tipo_bono: "Lanzamiento Rápido de Tropas", categoria: "militar", rama: "Orbital", nivel: 5, x: 2100, y: 1250 },
  { id: "M_ORB_2", nombre: "Escudo Deflector de Energía", costo: 8500, desbloqueada: false, prerrequisitos: ["M_CONV_1", "M_CONV_2"], tipo_bono: "Inmunidad Temporal a Ofensivas", categoria: "militar", rama: "Orbital", nivel: 5, x: 2100, y: 1750 },
  { id: "M_ORB_3", nombre: "Láseres de Precisión Orbital", costo: 9000, desbloqueada: false, prerrequisitos: ["M_CONV_2", "M_CONV_3"], tipo_bono: "+40% Daño de Precisión", categoria: "militar", rama: "Orbital", nivel: 5, x: 2100, y: 2250 },
  { id: "M_ORB_4", nombre: "Drones de Reconocimiento Estratosférico", costo: 8000, desbloqueada: false, prerrequisitos: ["M_CONV_3", "M_CONV_4"], tipo_bono: "Revelado Total de Niebla", categoria: "militar", rama: "Orbital", nivel: 5, x: 2100, y: 2750 },

  // Prototipos Finales (X=2700): 2 Super-nodos
  { id: "M_PROTO_1", nombre: "Enjambres de Drones Autónomos", costo: 12000, desbloqueada: false, prerrequisitos: ["M_ORB_1", "M_ORB_2", "M_ORB_3"], tipo_bono: "Ataque Múltiple Saturado", categoria: "militar", rama: "Prototipos", nivel: 6, x: 2700, y: 1750 },
  { id: "M_PROTO_2", nombre: "Artillería Orbital de Iones", costo: 13000, desbloqueada: false, prerrequisitos: ["M_ORB_2", "M_ORB_3", "M_ORB_4"], tipo_bono: "Desintegración de Nodos Defensivos", categoria: "militar", rama: "Prototipos", nivel: 6, x: 2700, y: 2250 },

  // El Arma Definitiva (X=3300, Y=2000): 1 Nodo ultra-caro
  { id: "M_ULTIMATE", nombre: "Iniciativa de Destrucción Mutua / Proyecto Némesis", costo: 30000, desbloqueada: false, prerrequisitos: ["M_PROTO_1", "M_PROTO_2"], tipo_bono: "Aniquilación Táctica Instantánea", categoria: "militar", rama: "Definitiva", nivel: 7, x: 3300, y: 2000 },
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
