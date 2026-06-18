// ============================================================
// CONQUEST — CAPA DE ACCESO A DATOS (MOCK API)
// Archivo centralizado de datos y endpoints asíncronos.
// Ningún dato se exporta directamente. Solo funciones async.
// ============================================================
import { supabase } from './supabaseClient';
import type { Tropas, TroopBaseCosts, CombatPowerMultipliers } from './troops';
import type { TropasDetalle } from '../types/tropas';

// Los tipos de tropa viven en troops.ts y types/tropas.ts — se re-exportan aquí
// para no romper importaciones existentes.
export type { Tropas, TroopBaseCosts, CombatPowerMultipliers, TropasDetalle };

// ─── TIPOS ───────────────────────────────────────────────────

/** Alias de EventoAleatorio para imports que usen DBRandomEvent */
export type DBRandomEvent = EventoAleatorio;

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

// COUNTRY_NAMES_ES eliminado — ahora en tabla paises_base
// realPopulations eliminado — ahora en tabla paises_base
// COUNTRY_PRESETS eliminado — ahora en tabla paises_base

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


const MAINTENANCE_TIERS: MaintenanceTier[] = [
  { minTroops: 100001, costInf: 0.018, costCab: 0.045, costArt: 0.10,  desertionRate: 0.012 },
  { minTroops: 50001,  costInf: 0.012, costCab: 0.032, costArt: 0.08,  desertionRate: 0.008 },
  { minTroops: 15001,  costInf: 0.008, costCab: 0.020, costArt: 0.055, desertionRate: 0.004 },
  { minTroops: 0,      costInf: 0.004, costCab: 0.012, costArt: 0.032, desertionRate: 0.001 }
];

const SIMULATION_CONSTANTS: SimulationConstants = {
  dailyEconomicGrowthRate:    0.00005,  // crecimiento orgánico diario de la economía de cada país
  incomeFormulaEcoFactor:     0.1,      // peso del GDP en la fórmula de ingresos
  incomeFormulaPopFactor:     0.001,    // peso de la población en la fórmula de ingresos
  incomeDivisor:              800,      // divisor global (↓ = más ingresos); era 2000 → muy bajo
  conquestBonusPerCountry:    0.02,     // bonus por país conquistado (era 0.05 → snowball fuerte)
  iaRecruitmentCost:          150,      // oro que gasta la IA por ronda de reclutamiento (era 100)
  iaRecruitMinReclutas:       5,
  iaRecruitMaxReclutas:       15,
  eventIntervalMin:           10,
  eventIntervalRandom:        6,
  specialEventIntervalMin:    30,
  specialEventIntervalRandom: 20,
  mobilizationPopLimit:       0.05,
  massiveMobilizationThreshold: 0.01,
  aggressiveRecruitmentPenaltyDays: 90,
  attackTransitDays:          8         // era 17 → muy lento; 8 días es más ágil
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





export const fetchHQStartingPresets = async (): Promise<HQStartingPreset[]> => {
  return HQ_STARTING_PRESETS;
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





