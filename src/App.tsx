import { useGame } from "./context/GameContext";
import { TacticalNotifications } from "./components/TacticalNotifications";
import { CriticalEventModal } from "./components/CriticalEventModal";
import { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  Play, Pause, FastForward, Terminal,
  ShieldAlert, ShieldCheck, Info,
  Flag, Swords, Hexagon, Zap, Skull, Map as MapIcon,
  ChevronsRight, Globe, Cpu
} from "lucide-react";
import {
  fetchInitialGameState, fetchRandomEvents, fetchCountryStats,
  fetchHQStartingPresets, fetchTroopBaseCosts, fetchCombatMultipliers,
  fetchMaintenanceTiers, fetchSimulationConstants,
  fetchCriticalEventTemplates, fetchDecayEventTemplates,
  translateCountry, getPresetForCountry,
  normalizeName, getRealPopulation, getRealEconomy, getRealEjercitoDetalle,
} from "./database/mockAPI";
import type { OperarioUser } from "./types/user";
import { logoutOperator, refreshAuthSession } from "./database/auth";
import { saveGame, initializeNewGame } from "./database/saves";
import { unlockHabilidad, fetchTechTree } from "./database/game";
import type { DBGameSave } from "./database/saves";
import type { Habilidad } from "./types/habilidades";
import type {
  Tropas,
  HQStartingPreset, TroopBaseCosts, CombatPowerMultipliers,
  MaintenanceTier, SimulationConstants, Pais,
  DBCriticalEvent, DBDecayingNotification, PaisBase
} from "./database/mockAPI";
import Login from "./components/Login";
import StartMenu from "./components/StartMenu";
import SaveFilesMenu from "./components/SaveFilesMenu";
import SelectHQ from "./components/SelectHQ";
import UserProfile from "./components/UserProfile";
import { ActionLog } from "./components/ActionLog";
import { geoMiller } from "d3-geo-projection";
// Geometría del mapa del mundo (TopoJSON)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type AtaqueEnCola = {
  id: string;
  pais_destino_id: string;
  fecha_impacto: Date;
  tropas_enviadas: Tropas;
};

type Evento = {
  id: string;
  fecha: Date;
  titulo: string;
  mensaje: string;
  tipo: "success" | "alert" | "info";
};

const getDomId = (name: string): string => {
  return "pais-" + normalizeName(name)
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const formatEconomy = (n: number): string => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}T`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}B`;
  return `$${Math.floor(n).toLocaleString("es-ES")}M`;
};

const getDemographicsInfo = (
  pais: Pais,
  currentPresupuesto: number,
  ataquesEnCola: AtaqueEnCola[],
  habilidades: Habilidad[]
) => {
  let tasaNatalidadEfectiva = pais.tasa_natalidad ?? 0.0033;
  let tasaMortalidadEfectiva = pais.tasa_mortalidad ?? 0.0022;

  // 1. Reclutamiento Agresivo: penalización natalidad -20%
  const tieneReclutamientoAgresivo = pais.dias_reclutamiento_agresivo !== undefined && pais.dias_reclutamiento_agresivo > 0;
  if (tieneReclutamientoAgresivo) {
    tasaNatalidadEfectiva *= 0.8;
  }

  // 5. Singularidad Tecnológica (D_SUPER_2): aumenta la natalidad en conquistados un +25%
  if (pais.conquistado && habilidades.some(h => h.id === "D_SUPER_2" && h.desbloqueada)) {
    tasaNatalidadEfectiva *= 1.25;
  }

  // 2. Colapso por Invasión: mortalidad 4.0x
  const isUnderAttack = ataquesEnCola.some(a => a.pais_destino_id === pais.id);
  if (isUnderAttack) {
    tasaMortalidadEfectiva *= 4.0;
  }

  // 3. Hambruna / Bancarrota Global: si presupuesto global es 0 y es conquistado, mortalidad +50%
  const tieneBancarrota = currentPresupuesto <= 0 && pais.conquistado;
  if (tieneBancarrota) {
    tasaMortalidadEfectiva *= 1.5;
  }

  // 4. Sinergias de I+D: -15% de mortalidad permanente
  const tieneMedicos = habilidades.some(h => (h.id === "M_EXP_3" || h.nombre === "Inyecciones de Nanobots Médicos") && h.desbloqueada);
  if (tieneMedicos && pais.conquistado) {
    tasaMortalidadEfectiva *= 0.85;
  }

  // Crecimiento Neto Diario
  const netRate = tasaNatalidadEfectiva - tasaMortalidadEfectiva;
  
  let tendencia = "Estable / Lineal";
  let tendenciaColor = "text-cyan-400";

  if (isUnderAttack) {
    tendencia = "Colapso (Guerra)";
    tendenciaColor = "text-rose-500 font-bold animate-pulse";
  } else if (tieneBancarrota) {
    tendencia = "Crisis (Bancarrota)";
    tendenciaColor = "text-rose-500 font-bold animate-pulse";
  } else {
    if (netRate > 0.002) {
      tendencia = "Crecimiento Agresivo";
      tendenciaColor = "text-emerald-400 font-bold";
    } else if (netRate > 0.0005) {
      tendencia = "Crecimiento Saludable";
      tendenciaColor = "text-emerald-500";
    } else if (netRate > -0.0002 && netRate <= 0.0005) {
      tendencia = "Estable / Lineal";
      tendenciaColor = "text-cyan-400";
    } else if (netRate > -0.001 && netRate <= -0.0002) {
      tendencia = "Estancamiento / Decreciente";
      tendenciaColor = "text-amber-500";
    } else {
      tendencia = "Crecimiento Negativo / Crisis";
      tendenciaColor = "text-rose-500 font-bold";
    }
  }

  return {
    tasaNatalidad: tasaNatalidadEfectiva,
    tasaMortalidad: tasaMortalidadEfectiva,
    tendencia,
    tendenciaColor,
    tieneReclutamientoAgresivo,
    isUnderAttack,
    tieneBancarrota,
    tieneMedicos
  };
};


export default function App() {
  const [currentUser, setCurrentUser] = useState<OperarioUser | null>(null);
  const [activePartida, setActivePartida] = useState<DBGameSave | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      // refreshAuthSession: verifica Supabase Auth y actualiza localStorage
      const user = await refreshAuthSession();
      if (user) {
        setCurrentUser(user);
      }
    };
    restoreSession();
  }, []);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'start' | 'login' | 'select_hq' | 'game'>('start');
  const [playerHQ, setPlayerHQ] = useState<{ id: string, nombre: string } | null>(null);
  const [showSaves, setShowSaves] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [showActionLog, setShowActionLog] = useState(false);
  const [fechaVirtual, setFechaVirtual] = useState(new Date(2099, 10, 12));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedLevel, setSpeedLevel] = useState<1 | 2 | 3>(1);
  const [paises, setPaises] = useState<Record<string, Pais>>({});
  const [tropas, setTropas] = useState<Tropas>({ infanteria: 0, caballeria: 0, artilleria: 0 });
  const [presupuesto, setPresupuesto] = useState(0);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [ataquesEnCola, setAtaquesEnCola] = useState<AtaqueEnCola[]>([]);
  const [paisesInicializados, setPaisesInicializados] = useState(false);

  const gameState = useGame();
  const { addNotification, triggerCriticalEvent, isPaused, logAction } = gameState;

  const [criticalCountdown, setCriticalCountdown] = useState<number | null>(null);
  const [pendingCriticalEvent, setPendingCriticalEvent] = useState<any | null>(null);

  useEffect(() => {
    gameState.registerBridge({
      presupuesto,
      setPresupuesto,
      tropas,
      setTropas,
      paises,
      setPaises,
      pendingCriticalEvent,
      setPendingCriticalEvent,
      criticalCountdown,
      setCriticalCountdown
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Referencias para evitar cierres obsoletos en la simulación
  const presupuestoRef = useRef(presupuesto);
  const tropasRef = useRef(tropas);
  const paisesRef = useRef(paises);
  const habilidadesRef = useRef(habilidades);

  useEffect(() => { presupuestoRef.current = presupuesto; }, [presupuesto]);
  useEffect(() => { tropasRef.current = tropas; }, [tropas]);
  useEffect(() => { paisesRef.current = paises; }, [paises]);
  useEffect(() => { habilidadesRef.current = habilidades; }, [habilidades]);
  const [diarioGuerra, setDiarioGuerra] = useState<Evento[]>([
    { id: "inicio", fecha: new Date(2099, 10, 12), titulo: "SISTEMA TÁCTICO INICIADO", mensaje: "Núcleo de inteligencia y comunicaciones satelitales en línea. Iniciando simulación y mapeo geopolítico...", tipo: "info" }
  ]);

  const [isDbLoading, setIsDbLoading] = useState(true);
  const eventosAleatoriosRef = useRef<any[]>([]);
  const criticalTemplatesRef = useRef<DBCriticalEvent[]>([]);
  const decayTemplatesRef = useRef<DBDecayingNotification[]>([]);
  const countryStatsRef = useRef<PaisBase[]>([]);
  const hqPresetsRef = useRef<HQStartingPreset[]>([]);
  const troopCostsRef = useRef<TroopBaseCosts>({ infanteria: 10, caballeria: 25, artilleria: 60 });
  const combatMultipliersRef = useRef<CombatPowerMultipliers>({ infanteria: 1, caballeria: 1.5, artilleria: 3 });
  const maintenanceTiersRef = useRef<MaintenanceTier[]>([]);
  const simConstantsRef = useRef<SimulationConstants>({
    dailyEconomicGrowthRate: 0.00005, incomeFormulaEcoFactor: 0.1,
    incomeFormulaPopFactor: 0.001, incomeDivisor: 2000, conquestBonusPerCountry: 0.05,
    iaRecruitmentCost: 100, iaRecruitMinReclutas: 5, iaRecruitMaxReclutas: 15,
    eventIntervalMin: 10, eventIntervalRandom: 6,
    specialEventIntervalMin: 30, specialEventIntervalRandom: 20,
    mobilizationPopLimit: 0.05, massiveMobilizationThreshold: 0.01,
    aggressiveRecruitmentPenaltyDays: 90, attackTransitDays: 5
  });

  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [hoveredPais, setHoveredPais] = useState<Pais | null>(null);
  const [, setMousePos] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<any>(null);
  const [infanteriaAEnviar, setInfanteriaAEnviar] = useState(0);
  const [caballeriaAEnviar, setCaballeriaAEnviar] = useState(0);
  const [artilleriaAEnviar, setArtilleriaAEnviar] = useState(0);
  const [infanteriaAMovilizar, setInfanteriaAMovilizar] = useState(0);
  const [caballeriaAMovilizar, setCaballeriaAMovilizar] = useState(0);
  const [artilleriaAMovilizar, setArtilleriaAMovilizar] = useState(0);
  const [mostrarArbol, setMostrarArbol] = useState(false);
  const [tabIyd, setTabIyd] = useState<"desarrollo" | "militar">("desarrollo");
  const diasParaEventoRef = useRef(10 + Math.floor(Math.random() * 6));
  const diasParaEventoEspecialRef = useRef(30 + Math.floor(Math.random() * 20)); // Cada 30 a 50 días (mitad de frecuencia)
  const isPanningRef = useRef(false);
  const transformComponentRef = useRef<any>(null);
  const techTreeTransformRef = useRef<any>(null);

  // Alinear el Árbol de Habilidades al extremo izquierdo al abrir o cambiar de pestaña
  useEffect(() => {
    if (mostrarArbol) {
      const timer = setTimeout(() => {
        if (techTreeTransformRef.current) {
          techTreeTransformRef.current.setTransform(50, -950, 0.6);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mostrarArbol, tabIyd]);

  const generarStatsPais = (geo: any): Pais => {
    const id = geo.id || "000";
    const nameEN = geo.properties.name || "Unknown";
    const nombre = translateCountry(nameEN);
    const seed = id.charCodeAt(0) + (id.length > 1 ? id.charCodeAt(1) : 0);

    const isAliado = playerHQ !== null && (id === playerHQ.id || nameEN === playerHQ.nombre || nombre === playerHQ.nombre);

    const poblacion = getRealPopulation(nameEN, seed, countryStatsRef.current);
    const economia = getRealEconomy(nameEN, poblacion, seed);
    const ejercito_ia_detalle = getRealEjercitoDetalle(isAliado, poblacion, seed, nameEN);
    const ejercito_ia = isAliado ? 0 : (ejercito_ia_detalle.infanteria + ejercito_ia_detalle.caballeria + ejercito_ia_detalle.artilleria);

    const preset = getPresetForCountry(nameEN);
    const tasa_natalidad = preset.tasa_natalidad ?? 0.0033;
    const tasa_mortalidad = preset.tasa_mortalidad ?? 0.0022;

    return {
      id: id,
      nombre: nombre,
      economia: economia,
      poblacion: poblacion,
      ejercito_ia: ejercito_ia,
      conquistado: isAliado,
      oro_ia: 0,
      ejercito_ia_detalle: ejercito_ia_detalle,
      tasa_natalidad: tasa_natalidad,
      tasa_mortalidad: tasa_mortalidad,
      dias_reclutamiento_agresivo: 0
    };
  };

  const getPais = (geo: any): Pais => {
    return paises[geo.id] || generarStatsPais(geo);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Bootstrap: Carga inicial de datos desde la capa de acceso
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [gameState, events, techTree, countryData, hqPresets, troopCosts, combatMults, mntTiers, simConsts, critTemplates, decayTemplates] = await Promise.all([
          fetchInitialGameState(),
          fetchRandomEvents(),
          fetchTechTree(),
          fetchCountryStats(),
          fetchHQStartingPresets(),
          fetchTroopBaseCosts(),
          fetchCombatMultipliers(),
          fetchMaintenanceTiers(),
          fetchSimulationConstants(),
          fetchCriticalEventTemplates(),
          fetchDecayEventTemplates()
        ]);
        setPresupuesto(gameState.presupuesto);
        setTropas(gameState.tropas);
        eventosAleatoriosRef.current = events;
        criticalTemplatesRef.current = critTemplates;
        decayTemplatesRef.current = decayTemplates;
        countryStatsRef.current = countryData;
        setHabilidades(techTree);
        hqPresetsRef.current = hqPresets;
        troopCostsRef.current = troopCosts;
        combatMultipliersRef.current = combatMults;
        maintenanceTiersRef.current = mntTiers;
        simConstantsRef.current = simConsts;
        // Actualizar intervalos de eventos con constantes cargadas
        diasParaEventoRef.current = simConsts.eventIntervalMin + Math.floor(Math.random() * simConsts.eventIntervalRandom);
        diasParaEventoEspecialRef.current = simConsts.specialEventIntervalMin + Math.floor(Math.random() * simConsts.specialEventIntervalRandom);
      } finally {
        setIsDbLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (currentScreen === 'game' && playerHQ) {
      // Timeout táctico para asegurar que el SVG del mapa ya se dibujó en el DOM
      const timer = setTimeout(() => {
        if (transformComponentRef.current) {
          // API: zoomToElement(nodeId, scale, animationTime, animationType)
          // Usamos escala 8 para enfocar bien países pequeños
          transformComponentRef.current.zoomToElement(getDomId(playerHQ.nombre), 8, 1800, "easeOutQuart");
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, playerHQ]);

  // Cargar geometrías e inicializar todos los países al iniciar el juego
  useEffect(() => {
    if (Object.keys(paises).length > 0) return;
    if (currentScreen === 'game' && playerHQ && countryStatsRef.current.length > 0 && !paisesInicializados) {
      const initPaises = async () => {
        try {
          const res = await fetch(geoUrl);
          const worldData = await res.json();
          const geometries = worldData.objects.countries.geometries;
          const initialCountries: Record<string, Pais> = {};

          geometries.forEach((geo: any) => {
            const id = geo.id || "000";
            const nameEN = geo.properties ? geo.properties.name : "Unknown";
            const nombre = translateCountry(nameEN);
            const seed = id.charCodeAt(0) + (id.length > 1 ? id.charCodeAt(1) : 0);
            const isAliado = id === playerHQ.id || nameEN === playerHQ.nombre || nombre === playerHQ.nombre;

            const poblacion = getRealPopulation(nameEN, seed, countryStatsRef.current);
            const economia = getRealEconomy(nameEN, poblacion, seed);
            const ejercito_ia_detalle = getRealEjercitoDetalle(isAliado, poblacion, seed, nameEN);
            const ejercito_ia = isAliado ? 0 : (ejercito_ia_detalle.infanteria + ejercito_ia_detalle.caballeria + ejercito_ia_detalle.artilleria);
            const preset = getPresetForCountry(nameEN);
            const tasa_natalidad = preset.tasa_natalidad ?? 0.0033;
            const tasa_mortalidad = preset.tasa_mortalidad ?? 0.0022;

            initialCountries[id] = {
              id: id,
              nombre: nombre,
              economia: economia,
              poblacion: poblacion,
              ejercito_ia: ejercito_ia,
              conquistado: isAliado,
              oro_ia: 0,
              ejercito_ia_detalle: ejercito_ia_detalle,
              tasa_natalidad: tasa_natalidad,
              tasa_mortalidad: tasa_mortalidad,
              dias_reclutamiento_agresivo: 0
            };
          });

          setPaises(initialCountries);
          setPaisesInicializados(true);
        } catch (err) {
          console.error("Error cargando geometrías para inicialización:", err);
        }
      };
      initPaises();
    }
  }, [currentScreen, playerHQ, paisesInicializados]);

  const isSimulationPaused = isPaused;

  useEffect(() => {
    if (criticalCountdown === null) return;

    if (criticalCountdown === 0) {
      if (pendingCriticalEvent) {
        triggerCriticalEvent(pendingCriticalEvent);
      }
      setCriticalCountdown(null);
      setPendingCriticalEvent(null);
      return;
    }

    const timer = setTimeout(() => {
      setCriticalCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [criticalCountdown, pendingCriticalEvent]);

  // Helper para valores proporcionales al presupuesto
  const getProportionalValue = (basePercent: number = 0.1, minValue: number = 1000): number => {
    const value = Math.floor(presupuestoRef.current * basePercent);
    return Math.max(value, minValue);
  };

  const lanzarEventoEspecial = () => {
    const isCritical = Math.random() < 0.125; // Críticos un cuarto de frecuentes que antes

    // Obtener listas de países dinámicamente
    const currentPaises = { ...paisesRef.current };
    const allied = Object.values(currentPaises).filter(p => p.conquistado);
    const hostile = Object.values(currentPaises).filter(p => !p.conquistado);
    const hqId = playerHQ?.id;

    if (isCritical) {
      if (criticalTemplatesRef.current.length === 0) return;
      // Elegir una plantilla aleatoria
      const template = criticalTemplatesRef.current[Math.floor(Math.random() * criticalTemplatesRef.current.length)];
      
      // Validar requisitos de plantilla
      if ((template.code === "BORDER_MOBILIZATION" || template.code === "BORDER_SMUGGLING_RAID" || template.code === "DISSIDENT_TREATY") && (allied.length === 0 || hostile.length === 0)) return;
      if (template.code === "TACTICAL_ALLIANCE_OFFER" || template.code === "SPY_NETWORK_LEAK") {
        if (hostile.length === 0) return;
      }

      // Elegir objetivos aleatorios
      const targetCountry = hostile.length > 0 ? hostile[Math.floor(Math.random() * hostile.length)] : null;
      const targetAllied = allied.length > 0 ? allied[Math.floor(Math.random() * allied.length)] : null;

      // Parsear placeholders
      const formatString = (str: string): string => {
        if (!str) return "";
        return str
          .replace(/{hq}/g, playerHQ?.nombre || "tu sede")
          .replace(/{target}/g, targetCountry?.nombre || "objetivo")
          .replace(/{colony}/g, targetAllied?.nombre || "territorio aliado");
      };

      const title = formatString(template.title);
      const description = formatString(template.description);

      const choices = template.choices.map(choice => {
        const choiceLabel = formatString(choice.label);
        const action = (gState: any) => {
          if (choice.efecto_oro) {
            gState.setOro((o: number) => Math.max(0, o + choice.efecto_oro!));
          }
          if (choice.efecto_infanteria || choice.efecto_caballeria || choice.efecto_artilleria) {
            gState.setTropas((t: any) => ({
              infanteria: Math.max(0, t.infanteria + (choice.efecto_infanteria || 0)),
              caballeria: Math.max(0, t.caballeria + (choice.efecto_caballeria || 0)),
              artilleria: Math.max(0, t.artilleria + (choice.efecto_artilleria || 0))
            }));
          }
          if (choice.hq_economia_multiplier && hqId) {
            gState.setPaises((prev: any) => {
              const copy = { ...prev };
              if (copy[hqId]) {
                copy[hqId] = { ...copy[hqId], economia: Math.floor(copy[hqId].economia * choice.hq_economia_multiplier!) };
              }
              return copy;
            });
          }
          if (choice.hq_poblacion_multiplier && hqId) {
            gState.setPaises((prev: any) => {
              const copy = { ...prev };
              if (copy[hqId]) {
                copy[hqId] = { ...copy[hqId], poblacion: Math.floor(copy[hqId].poblacion * choice.hq_poblacion_multiplier!) };
              }
              return copy;
            });
          }
          if (choice.target_ejercito_ia_multiplier && targetCountry) {
            gState.setPaises((prev: any) => {
              const copy = { ...prev };
              if (copy[targetCountry.id]) {
                copy[targetCountry.id] = { ...copy[targetCountry.id], ejercito_ia: Math.floor(copy[targetCountry.id].ejercito_ia * choice.target_ejercito_ia_multiplier!) };
              }
              return copy;
            });
          }
          if (choice.colony_economia_multiplier && targetAllied) {
            gState.setPaises((prev: any) => {
              const copy = { ...prev };
              if (copy[targetAllied.id]) {
                copy[targetAllied.id] = { ...copy[targetAllied.id], economia: Math.floor(copy[targetAllied.id].economia * choice.colony_economia_multiplier!) };
              }
              return copy;
            });
          }
        };

        return {
          id: choice.id,
          label: choiceLabel,
          consequence: choice.consequence,
          action
        };
      });

      const picked = {
        id: Math.random().toString(),
        code: template.code,
        title,
        description,
        choices
      };

      setPendingCriticalEvent(picked);
      setCriticalCountdown(3);
    } else {
      // Lanzar un DecayingNotification (Eventos temporales con balances de recursos profundos y expiraciones)
      if (decayTemplatesRef.current.length === 0) return;
      const template = decayTemplatesRef.current[Math.floor(Math.random() * decayTemplatesRef.current.length)];

      if (template.code === "TERRITORIAL_RATIONING" && allied.length === 0) return;
      if (template.code === "SATELLITE_REDIRECT" && (allied.length === 0 || hostile.length === 0)) return;

      const targetCountry = hostile.length > 0 ? hostile[Math.floor(Math.random() * hostile.length)] : null;
      const targetAllied = allied.length > 0 ? allied[Math.floor(Math.random() * allied.length)] : null;

      // Calcular valores proporcionales
      const costVal = template.costProportionalPercent ? getProportionalValue(template.costProportionalPercent) : 0;
      const benefitVal = template.benefitProportionalPercent ? getProportionalValue(template.benefitProportionalPercent) : 0;

      const formatString = (str: string, choiceCost?: number, choiceBenefit?: number): string => {
        if (!str) return "";
        let res = str
          .replace(/{target}/g, targetCountry?.nombre || "objetivo")
          .replace(/{colony}/g, targetAllied?.nombre || "territorio aliado");

        const activeCost = choiceCost !== undefined ? choiceCost : costVal;
        const activeBenefit = choiceBenefit !== undefined ? choiceBenefit : benefitVal;

        res = res.replace(/{cost}/g, Math.floor(activeCost).toString());
        res = res.replace(/{benefit}/g, Math.floor(activeBenefit).toString());
        res = res.replace(/{gain}/g, Math.floor(activeBenefit - activeCost).toString());

        return res;
      };

      const title = formatString(template.title);
      const description = formatString(template.description);
      const costDescription = template.costDescriptionTemplate ? formatString(template.costDescriptionTemplate) : undefined;
      const benefitDescription = template.benefitDescriptionTemplate ? formatString(template.benefitDescriptionTemplate) : undefined;

      const options = template.options.map(option => {
        const optCostVal = option.costProportionalPercent ? getProportionalValue(option.costProportionalPercent) : 0;
        const optBenefitVal = option.benefitProportionalPercent ? getProportionalValue(option.benefitProportionalPercent) : 0;

        const label = formatString(option.label, optCostVal, optBenefitVal);
        const consequence = formatString(option.consequence, optCostVal, optBenefitVal);

        const action = (gState: any) => {
          let computedOroChange = 0;
          if (option.efecto_oro) computedOroChange += option.efecto_oro;
          if (optBenefitVal) computedOroChange += optBenefitVal;
          if (optCostVal) computedOroChange -= optCostVal;

          if (computedOroChange !== 0) {
            gState.setOro((o: number) => Math.max(0, o + computedOroChange));
          }

          if (option.efecto_infanteria || option.efecto_caballeria || option.efecto_artilleria) {
            gState.setTropas((t: any) => ({
              infanteria: Math.max(0, t.infanteria + (option.efecto_infanteria || 0)),
              caballeria: Math.max(0, t.caballeria + (option.efecto_caballeria || 0)),
              artilleria: Math.max(0, t.artilleria + (option.efecto_artilleria || 0))
            }));
          }

          if (option.hq_economia_multiplier && hqId) {
            gState.setPaises((prev: any) => {
              const copy = { ...prev };
              if (copy[hqId]) {
                copy[hqId] = { ...copy[hqId], economia: Math.floor(copy[hqId].economia * option.hq_economia_multiplier!) };
              }
              return copy;
            });
          }

          if (option.hq_poblacion_multiplier && hqId) {
            gState.setPaises((prev: any) => {
              const copy = { ...prev };
              if (copy[hqId]) {
                copy[hqId] = { ...copy[hqId], poblacion: Math.floor(copy[hqId].poblacion * option.hq_poblacion_multiplier!) };
              }
              return copy;
            });
          }

          if (option.target_ejercito_ia_multiplier && targetCountry) {
            gState.setPaises((prev: any) => {
              const copy = { ...prev };
              if (copy[targetCountry.id]) {
                copy[targetCountry.id] = { ...copy[targetCountry.id], ejercito_ia: Math.floor(copy[targetCountry.id].ejercito_ia * option.target_ejercito_ia_multiplier!) };
              }
              return copy;
            });
          }

          if (option.colony_economia_multiplier && targetAllied) {
            gState.setPaises((prev: any) => {
              const copy = { ...prev };
              if (copy[targetAllied.id]) {
                copy[targetAllied.id] = { ...copy[targetAllied.id], economia: Math.floor(copy[targetAllied.id].economia * option.colony_economia_multiplier!) };
              }
              return copy;
            });
          }

          if (option.colony_poblacion_multiplier && targetAllied) {
            gState.setPaises((prev: any) => {
              const copy = { ...prev };
              if (copy[targetAllied.id]) {
                copy[targetAllied.id] = { ...copy[targetAllied.id], poblacion: Math.floor(copy[targetAllied.id].poblacion * option.colony_poblacion_multiplier!) };
              }
              return copy;
            });
          }

          const logMsg = formatString(option.logActionMsg, optCostVal, optBenefitVal);
          logAction('Evento Importante', logMsg);
        };

        return {
          id: option.id,
          label,
          consequence,
          style: option.style,
          action
        };
      });

      const onExpire = (gState: any) => {
        if (template.onExpire_hq_economia_multiplier && hqId) {
          gState.setPaises((prev: any) => {
            const copy = { ...prev };
            if (copy[hqId]) {
              copy[hqId] = { ...copy[hqId], economia: Math.floor(copy[hqId].economia * template.onExpire_hq_economia_multiplier!) };
            }
            return copy;
          });
        }
        if (template.onExpire_colony_poblacion_multiplier && targetAllied) {
          gState.setPaises((prev: any) => {
            const copy = { ...prev };
            if (copy[targetAllied.id]) {
              copy[targetAllied.id] = { ...copy[targetAllied.id], poblacion: Math.floor(copy[targetAllied.id].poblacion * template.onExpire_colony_poblacion_multiplier!) };
            }
            return copy;
          });
        }
      };

      const picked = {
        id: Math.random().toString(),
        code: template.code,
        title,
        description,
        duration: template.duration,
        timeLeft: template.duration,
        type: template.type,
        costDescription,
        benefitDescription,
        options,
        onExpire
      };

      addNotification(picked);
    }
  };

  useEffect(() => {
    if (!isPlaying || isSimulationPaused) return;
    const intervalTime = speedLevel === 1 ? 1000 : speedLevel === 2 ? 250 : 80;
    const interval = setInterval(() => {
      setFechaVirtual(prev => {
        const nextDate = new Date(prev);
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate;
      });
    }, intervalTime);
    return () => clearInterval(interval);
  }, [isPlaying, speedLevel, isSimulationPaused]);

  useEffect(() => {
    if (currentScreen !== 'game' || !isPlaying || isSimulationPaused) return;

    // 1. Obtener valores actuales desde las referencias para evitar stale closures
    const currentPaises = { ...paisesRef.current };
    const currentTropas = { ...tropasRef.current };
    let currentPresupuesto = presupuestoRef.current;
    const currentHabilidades = habilidadesRef.current;

    // Si los países aún no están inicializados, no simulamos este día
    if (Object.keys(currentPaises).length === 0) return;

    let totalIngresoJugador = 0;
    
    // Dynamic modifiers from unlocked skills
    let goldMultiplier = 1.0;
    if (currentHabilidades.some(h => h.id === "D_B1_1" && h.desbloqueada)) goldMultiplier += 0.10;
    if (currentHabilidades.some(h => h.id === "D_EXP_1" && h.desbloqueada)) goldMultiplier += 0.15;
    if (currentHabilidades.some(h => h.id === "D_EXP_3" && h.desbloqueada)) goldMultiplier += 0.20;
    if (currentHabilidades.some(h => h.id === "D_CONV_1" && h.desbloqueada)) goldMultiplier += 0.25;
    if (currentHabilidades.some(h => h.id === "D_EXP_5" && h.desbloqueada)) goldMultiplier += 0.05;

    let growthRateMultiplier = 1.0;
    if (currentHabilidades.some(h => h.id === "D_B1_2" && h.desbloqueada)) growthRateMultiplier += 0.25;
    if (currentHabilidades.some(h => h.id === "D_CONV_3" && h.desbloqueada)) growthRateMultiplier += 0.50;

    const sc = simConstantsRef.current;
    const currentGrowthRate = sc.dailyEconomicGrowthRate * growthRateMultiplier;

    const nuevosMensajes: Evento[] = [];

    // 2. Simulación para cada país
    Object.keys(currentPaises).forEach(id => {
      const pais = { ...currentPaises[id] };
      // A. Población dinámica (Cálculo demográfico realista y asimétrico con modificadores dinámicos)
      let tasaNatalidadEfectiva = pais.tasa_natalidad ?? 0.0033;
      let tasaMortalidadEfectiva = pais.tasa_mortalidad ?? 0.0022;

      // 1. Reclutamiento Agresivo: penalización natalidad -20%
      if (pais.dias_reclutamiento_agresivo && pais.dias_reclutamiento_agresivo > 0) {
        tasaNatalidadEfectiva *= 0.8;
        pais.dias_reclutamiento_agresivo -= 1;
      }

      // 2. Colapso por Invasión: mortalidad 4.0x
      const isUnderAttack = ataquesEnCola.some(a => a.pais_destino_id === pais.id);
      if (isUnderAttack) {
        tasaMortalidadEfectiva *= 4.0;
      }

      // 3. Hambruna / Bancarrota Global: si presupuesto <= 0 en conquistado, mortalidad +50%
      if (currentPresupuesto <= 0 && pais.conquistado) {
        tasaMortalidadEfectiva *= 1.5;
      }

      // 4. Sinergias de I+D: investigación médica M_EXP_3 reduce -15% mortalidad en conquistados
      const tieneMedicos = currentHabilidades.some(h => (h.id === "M_EXP_3" || h.nombre === "Inyecciones de Nanobots Médicos") && h.desbloqueada);
      if (tieneMedicos && pais.conquistado) {
        tasaMortalidadEfectiva *= 0.85;
      }

      // 5. Singularidad Tecnológica (D_SUPER_2): aumenta la natalidad en conquistados un +25%
      if (pais.conquistado && currentHabilidades.some(h => h.id === "D_SUPER_2" && h.desbloqueada)) {
        tasaNatalidadEfectiva *= 1.25;
      }

      // Ecuación demográfica neta diaria
      const nacimientosDia = pais.poblacion * (tasaNatalidadEfectiva / 100);
      const defuncionesDia = pais.poblacion * (tasaMortalidadEfectiva / 100);
      pais.poblacion = Math.round(pais.poblacion + nacimientosDia - defuncionesDia);

      // B. Economía dinámica (Crecimiento orgánico diario)
      pais.economia = pais.economia * (1 + currentGrowthRate);

      // C. Generación de Oro balanceada (Fórmula base con factores configurables)
      const ingreso = ((pais.economia * sc.incomeFormulaEcoFactor) + (pais.poblacion * sc.incomeFormulaPopFactor)) / sc.incomeDivisor;

      if (pais.conquistado) {
        // Si pertenece al jugador, sumamos a sus ingresos con multiplicador tech
        totalIngresoJugador += ingreso * goldMultiplier;
      } else {
        // Si pertenece a la IA, se acumula en su tesoro interno
        pais.oro_ia = (pais.oro_ia || 0) + ingreso;

        // D. Fuerza Militar Dinámica (Reclutamiento IA)
        const seed = id.charCodeAt(0) + (id.length > 1 ? id.charCodeAt(1) : 0);
        const targetEjercito = Math.max(100, Math.floor(Math.sqrt(pais.poblacion) * (5 + (seed % 5))));
        if (pais.ejercito_ia < targetEjercito && pais.oro_ia >= sc.iaRecruitmentCost) {
          pais.oro_ia -= sc.iaRecruitmentCost;

          // Modificaciones de reclutamiento IA (cibersabotajes)
          let recruitmentMultiplier = 1.0;
          if (currentHabilidades.some(h => h.id === "M_EXP_6" && h.desbloqueada)) {
            recruitmentMultiplier *= 0.75;
          }
          if (currentHabilidades.some(h => h.id === "M_ULTIMATE" && h.desbloqueada)) {
            recruitmentMultiplier *= 0.15;
          }
          if (isUnderAttack && currentHabilidades.some(h => h.id === "M_CONV_4" && h.desbloqueada)) {
            recruitmentMultiplier *= 0.50;
          }

          const baseReclutas = Math.floor(Math.random() * (sc.iaRecruitMaxReclutas - sc.iaRecruitMinReclutas + 1)) + sc.iaRecruitMinReclutas;
          const reclutas = Math.max(0, Math.round(baseReclutas * recruitmentMultiplier));
          pais.ejercito_ia += reclutas;

          if (!pais.ejercito_ia_detalle) {
            pais.ejercito_ia_detalle = { infanteria: 0, caballeria: 0, artilleria: 0 };
          }
          const preset = getPresetForCountry(pais.nombre);
          const addInf = Math.floor(reclutas * preset.composicion.infanteria);
          const addCab = Math.floor(reclutas * preset.composicion.caballeria);
          const addArt = reclutas - addInf - addCab;

          pais.ejercito_ia_detalle.infanteria += addInf;
          pais.ejercito_ia_detalle.caballeria += addCab;
          pais.ejercito_ia_detalle.artilleria += addArt;
        }
      }

      currentPaises[id] = pais;
    });

    // Redondear el ingreso del jugador aplicando el multiplicador por expansión por país conquistado
    const numConquistados = Object.values(currentPaises).filter(p => p.conquistado).length;
    totalIngresoJugador = Math.floor(totalIngresoJugador * (1 + numConquistados * sc.conquestBonusPerCountry));

    // D_ULTIMATE: 2% de probabilidad diaria de anexar pacíficamente un país enemigo al azar
    const tieneUltimateDesarrollo = currentHabilidades.some(h => h.id === "D_ULTIMATE" && h.desbloqueada);
    if (tieneUltimateDesarrollo && Math.random() < 0.02) {
      const unconqueredCountries = Object.values(currentPaises).filter(p => !p.conquistado);
      if (unconqueredCountries.length > 0) {
        const randomCountry = unconqueredCountries[Math.floor(Math.random() * unconqueredCountries.length)];
        randomCountry.conquistado = true;
        randomCountry.ejercito_ia = 0;
        randomCountry.ejercito_ia_detalle = { infanteria: 0, caballeria: 0, artilleria: 0 };
        currentPaises[randomCountry.id] = randomCountry;

        nuevosMensajes.push({
          id: Math.random().toString(),
          fecha: fechaVirtual,
          titulo: `ASIMILACIÓN COMPLETADA: ${randomCountry.nombre.toUpperCase()}`,
          mensaje: `El Protocolo de Asimilación Planetaria Total (D_ULTIMATE) ha integrado pacíficamente la infraestructura y gobierno de ${randomCountry.nombre} a nuestra red neuronal global.`,
          tipo: "success"
        });
      }
    }

    // 3. Mantenimiento del Jugador y Crisis de Suministros escalonada (Economía sustentable)
    const totalTropasJugador = currentTropas.infanteria + currentTropas.caballeria + currentTropas.artilleria;

    // Buscar el tier de mantenimiento aplicable según el tamaño del ejército
    const mntTier = maintenanceTiersRef.current.find(t => totalTropasJugador >= t.minTroops)
      || { costInf: 0.005, costCab: 0.015, costArt: 0.04, desertionRate: 0.001, minTroops: 0 };
    const mntInf = mntTier.costInf;
    const mntCab = mntTier.costCab;
    const mntArt = mntTier.costArt;
    const desRate = mntTier.desertionRate;

    // Modificadores de mantenimiento de habilidades
    let maintenanceMultiplier = 1.0;
    if (currentHabilidades.some(h => h.id === "D_EXP_2" && h.desbloqueada)) maintenanceMultiplier -= 0.15;
    if (currentHabilidades.some(h => h.id === "D_CONV_2" && h.desbloqueada)) maintenanceMultiplier -= 0.25;

    const costoMantenimiento = Math.floor(
      ((currentTropas.infanteria * mntInf) +
       (currentTropas.caballeria * mntCab) +
       (currentTropas.artilleria * mntArt)) * maintenanceMultiplier
    );

    let desertoresMsg = "";
    let huboDesercion = false;
    let nuevasTropas = { ...currentTropas };

    // Restar mantenimiento
    currentPresupuesto -= costoMantenimiento;

    if (currentPresupuesto <= 0 && totalTropasJugador > 0) {
      currentPresupuesto = 0;
      huboDesercion = true;

      // Deserción escalonada con penalización mínima de 1 unidad si existe ese tipo
      const desInfanteria = Math.max(nuevasTropas.infanteria > 0 ? 1 : 0, Math.floor(nuevasTropas.infanteria * desRate));
      const desCaballeria = Math.max(nuevasTropas.caballeria > 0 ? 1 : 0, Math.floor(nuevasTropas.caballeria * desRate));
      const desArtilleria = Math.max(nuevasTropas.artilleria > 0 ? 1 : 0, Math.floor(nuevasTropas.artilleria * desRate));

      nuevasTropas.infanteria = Math.max(0, nuevasTropas.infanteria - desInfanteria);
      nuevasTropas.caballeria = Math.max(0, nuevasTropas.caballeria - desCaballeria);
      nuevasTropas.artilleria = Math.max(0, nuevasTropas.artilleria - desArtilleria);

      desertoresMsg = `Tasa de deserción logística activa (${(desRate * 100).toFixed(1)}%). Bajas: -${desInfanteria} Inf, -${desCaballeria} Cab, -${desArtilleria} Art.`;
    }

    // Sumar el ingreso diario
    currentPresupuesto += totalIngresoJugador;

    // 4. Diario de Guerra - Eventos de simulación diaria
    if (huboDesercion) {
      nuevosMensajes.push({
        id: Math.random().toString(),
        fecha: fechaVirtual,
        titulo: "CRISIS DE SUMINISTROS: Deserción por falta de pago",
        mensaje: `El tesoro militar se ha agotado. Las tropas no han recibido su paga de mantenimiento (Costo: €${costoMantenimiento}). Se reportan deserciones en masa. ${desertoresMsg}`,
        tipo: "alert"
      });
    }

    // 5. Procesamiento de Eventos Aleatorios
    diasParaEventoRef.current -= 1;
    if (diasParaEventoRef.current <= 0) {
      diasParaEventoRef.current = sc.eventIntervalMin + Math.floor(Math.random() * sc.eventIntervalRandom);
      const evts = eventosAleatoriosRef.current;
      if (evts.length > 0) {
        const eventoAzar = evts[Math.floor(Math.random() * evts.length)];

        // Aplicamos el efecto del evento sobre el presupuesto y tropas del momento
        let nuevoOro = currentPresupuesto;
        if (eventoAzar.efecto_oro !== undefined) {
          nuevoOro = Math.max(0, nuevoOro + eventoAzar.efecto_oro);
        }
        let nuevaInf = nuevasTropas.infanteria;
        if (eventoAzar.efecto_infanteria !== undefined) {
          nuevaInf = Math.max(0, nuevaInf + eventoAzar.efecto_infanteria);
        }
        let nuevaCab = nuevasTropas.caballeria;
        if (eventoAzar.efecto_caballeria !== undefined) {
          nuevaCab = Math.max(0, nuevaCab + eventoAzar.efecto_caballeria);
        }
        let nuevaArt = nuevasTropas.artilleria;
        if (eventoAzar.efecto_artilleria !== undefined) {
          nuevaArt = Math.max(0, nuevaArt + eventoAzar.efecto_artilleria);
        }
        currentPresupuesto = nuevoOro;
        nuevasTropas = {
          infanteria: nuevaInf,
          caballeria: nuevaCab,
          artilleria: nuevaArt
        };

        nuevosMensajes.push({
          id: Math.random().toString(),
          fecha: fechaVirtual,
          titulo: eventoAzar.titulo,
          mensaje: eventoAzar.mensaje,
          tipo: eventoAzar.tipo
        });
      }
    }

    // 5b. Procesamiento de Eventos Especiales (Interactivos o Críticos)
    diasParaEventoEspecialRef.current -= 1;
    if (diasParaEventoEspecialRef.current <= 0) {
      diasParaEventoEspecialRef.current = sc.specialEventIntervalMin + Math.floor(Math.random() * sc.specialEventIntervalRandom);
      lanzarEventoEspecial();
    }

    // 6. Procesar ataques en cola (impactos de combate)
    const ataquesPendientes: AtaqueEnCola[] = [];
    const copiaAtaques = [...ataquesEnCola];

    copiaAtaques.forEach(ataque => {
      if (fechaVirtual >= ataque.fecha_impacto) {
        const paisDestino = currentPaises[ataque.pais_destino_id];
        if (!paisDestino) return;

        const infEnviada = ataque.tropas_enviadas.infanteria;
        const cabEnviada = ataque.tropas_enviadas.caballeria;
        const artEnviada = ataque.tropas_enviadas.artilleria;
        const totalTropasEnviadas = infEnviada + cabEnviada + artEnviada;

        if (totalTropasEnviadas <= 0) return;

        // Poder del Jugador (multiplicadores desde config y habilidades)
        const cm = combatMultipliersRef.current;
        
        let multInf = 1.0;
        if (currentHabilidades.some(h => h.id === "M_B1_1" && h.desbloqueada)) multInf += 0.15;
        if (currentHabilidades.some(h => h.id === "M_EXP_1" && h.desbloqueada)) multInf += 0.25;
        if (currentHabilidades.some(h => h.id === "M_CONV_1" && h.desbloqueada)) multInf += 0.35;
        if (currentHabilidades.some(h => h.id === "M_ORB_1" && h.desbloqueada)) multInf += 0.40;
        if (currentHabilidades.some(h => h.id === "M_PROTO_1" && h.desbloqueada)) multInf += 0.40;

        let multCab = 1.0;
        if (currentHabilidades.some(h => h.id === "M_B1_2" && h.desbloqueada)) multCab += 0.15;
        if (currentHabilidades.some(h => h.id === "M_EXP_5" && h.desbloqueada)) multCab += 0.25;
        if (currentHabilidades.some(h => h.id === "M_ORB_3" && h.desbloqueada)) multCab += 0.35;
        if (currentHabilidades.some(h => h.id === "M_PROTO_1" && h.desbloqueada)) multCab += 0.40;

        let multArt = 1.0;
        if (currentHabilidades.some(h => h.id === "M_B1_3" && h.desbloqueada)) multArt += 0.15;
        if (currentHabilidades.some(h => h.id === "M_EXP_4" && h.desbloqueada)) multArt += 0.25;
        if (currentHabilidades.some(h => h.id === "M_CONV_3" && h.desbloqueada)) multArt += 0.35;
        if (currentHabilidades.some(h => h.id === "M_ORB_3" && h.desbloqueada)) multArt += 0.35;
        if (currentHabilidades.some(h => h.id === "M_PROTO_1" && h.desbloqueada)) multArt += 0.40;

        const poderJugador = (infEnviada * cm.infanteria * multInf) +
                             (cabEnviada * cm.caballeria * multCab) +
                             (artEnviada * cm.artilleria * multArt);

        // Poder de la IA defensora (debuffs de defensa enemiga)
        let iaDefenseMultiplier = 1.0;
        if (currentHabilidades.some(h => h.id === "M_EXP_2" && h.desbloqueada)) iaDefenseMultiplier -= 0.15;
        if (currentHabilidades.some(h => h.id === "M_PROTO_2" && h.desbloqueada)) iaDefenseMultiplier -= 0.50;
        if (currentHabilidades.some(h => h.id === "M_ULTIMATE" && h.desbloqueada)) iaDefenseMultiplier -= 0.40;
        iaDefenseMultiplier = Math.max(0.10, iaDefenseMultiplier);

        const detailIA = paisDestino.ejercito_ia_detalle || { infanteria: paisDestino.ejercito_ia, caballeria: 0, artilleria: 0 };
        const basePoderIA = detailIA.infanteria * cm.infanteria + detailIA.caballeria * cm.caballeria + detailIA.artilleria * cm.artilleria;
        const poderIA = basePoderIA * iaDefenseMultiplier;

        // Tasa de bajas (basada en el ratio de poder con margen aleatorio y reducciones del jugador)
        const ratioIA = poderIA / (poderJugador || 1);
        const ratioJugador = poderJugador / (poderIA || 1);

        let casualtyMultiplier = 1.0;
        if (currentHabilidades.some(h => h.id === "M_B1_4" && h.desbloqueada)) casualtyMultiplier *= 0.90;
        if (currentHabilidades.some(h => h.id === "M_CONV_2" && h.desbloqueada)) casualtyMultiplier *= 0.80;
        if (currentHabilidades.some(h => h.id === "M_ORB_1" && h.desbloqueada)) casualtyMultiplier *= 0.85;
        if (currentHabilidades.some(h => h.id === "M_ORB_2" && h.desbloqueada)) casualtyMultiplier *= 0.70;

        const rateJugador = Math.min(0.95, (0.1 + Math.random() * 0.3) * ratioIA * casualtyMultiplier);
        const rateIA = Math.min(0.95, (0.2 + Math.random() * 0.4) * ratioJugador);

        // Bajas
        const bajasInfJugador = Math.min(infEnviada, Math.floor(infEnviada * rateJugador));
        const bajasCabJugador = Math.min(cabEnviada, Math.floor(cabEnviada * rateJugador));
        const bajasArtJugador = Math.min(artEnviada, Math.floor(artEnviada * rateJugador));
        const totalBajasJugador = bajasInfJugador + bajasCabJugador + bajasArtJugador;

        const bajasInfIA = Math.min(detailIA.infanteria, Math.floor(detailIA.infanteria * rateIA));
        const bajasCabIA = Math.min(detailIA.caballeria, Math.floor(detailIA.caballeria * rateIA));
        const bajasArtIA = Math.min(detailIA.artilleria, Math.floor(detailIA.artilleria * rateIA));

        // Sobrevivientes del jugador
        const survInfJugador = infEnviada - bajasInfJugador;
        const survCabJugador = cabEnviada - bajasCabJugador;
        const survArtJugador = artEnviada - bajasArtJugador;

        // Sobrevivientes de la IA
        const survInfIA = detailIA.infanteria - bajasInfIA;
        const survCabIA = detailIA.caballeria - bajasCabIA;
        const survArtIA = detailIA.artilleria - bajasArtIA;

        const victoria = poderJugador > poderIA;

        let msg = "";
        if (victoria) {
          msg = `¡Victoria en ${paisDestino.nombre}! Las defensas de la IA enemiga colapsaron. ` +
            `Bajas del jugador: 👤${bajasInfJugador} Infantería, ⚡${bajasCabJugador} Caballería, 💀${bajasArtJugador} Artillería (Total: ${totalBajasJugador}). ` +
            `Sobreviven y retornan a la reserva: 👤${survInfJugador} Inf, ⚡${survCabJugador} Cab, 💀${survArtJugador} Art.`;
        } else {
          msg = `Falla táctica en ${paisDestino.nombre}. Nuestras fuerzas desplegadas fueron neutralizadas. ` +
            `Pérdidas totales: 👤${infEnviada} Infantería, ⚡${cabEnviada} Caballería, 💀${artEnviada} Artillería. ` +
            `Bajas enemigas causadas: 👤${bajasInfIA} Inf, ⚡${bajasCabIA} Cab, 💀${bajasArtIA} Art.`;
        }

        nuevosMensajes.push({
          id: Math.random().toString(),
          fecha: fechaVirtual,
          titulo: victoria ? "VICTORIA EN CAMPAÑA" : "DERROTA OPERACIONAL",
          mensaje: msg,
          tipo: victoria ? "success" : "alert"
        });

        if (victoria) {
          currentPaises[paisDestino.id] = {
            ...paisDestino,
            conquistado: true,
            ejercito_ia: 0,
            ejercito_ia_detalle: { infanteria: 0, caballeria: 0, artilleria: 0 }
          };
          nuevasTropas.infanteria += survInfJugador;
          nuevasTropas.caballeria += survCabJugador;
          nuevasTropas.artilleria += survArtJugador;
        } else {
          const nuevoDetalle = {
            infanteria: survInfIA,
            caballeria: survCabIA,
            artilleria: survArtIA
          };
          currentPaises[paisDestino.id] = {
            ...paisDestino,
            ejercito_ia_detalle: nuevoDetalle,
            ejercito_ia: nuevoDetalle.infanteria + nuevoDetalle.caballeria + nuevoDetalle.artilleria
          };
        }
      } else {
        ataquesPendientes.push(ataque);
      }
    });

    // 6b. Procesar cola de investigación (I+D)
    let habilidadesCambiadas = false;
    const updatedHabilidades = currentHabilidades.map(hab => {
      if (hab.enDesarrollo) {
        const nextTiempo = (hab.tiempoRestante ?? 1) - 1;
        habilidadesCambiadas = true;
        if (nextTiempo <= 0) {
          nuevosMensajes.push({
            id: Math.random().toString(),
            fecha: fechaVirtual,
            titulo: `I+D COMPLETO: ${hab.nombre.toUpperCase()}`,
            mensaje: `La red de investigación ha descifrado e integrado la patente: ${hab.nombre}. Atributos tácticos y bonificaciones globales activados.`,
            tipo: "info"
          });
          return {
            ...hab,
            desbloqueada: true,
            enDesarrollo: false,
            tiempoRestante: 0
          };
        } else {
          return {
            ...hab,
            tiempoRestante: nextTiempo
          };
        }
      }
      return hab;
    });

    // Si hay nuevos mensajes, agregarlos al Diario de Guerra
    if (nuevosMensajes.length > 0) {
      setDiarioGuerra(prevDiario => [...nuevosMensajes, ...prevDiario]);
    }

    // 7. Guardar todos los estados actualizados
    setPaises(currentPaises);
    setTropas(nuevasTropas);
    setPresupuesto(currentPresupuesto);
    setAtaquesEnCola(ataquesPendientes);
    if (habilidadesCambiadas) {
      setHabilidades(updatedHabilidades);
    }

  }, [fechaVirtual, isSimulationPaused]);

  const handleDeclararGuerra = () => {
    if (!paisSeleccionado || paisSeleccionado.conquistado) return;

    if (infanteriaAEnviar < 0 || infanteriaAEnviar > tropas.infanteria ||
      caballeriaAEnviar < 0 || caballeriaAEnviar > tropas.caballeria ||
      artilleriaAEnviar < 0 || artilleriaAEnviar > tropas.artilleria) {
      alert("Cantidad de tropas a desplegar excede las reservas disponibles o es inválida.");
      return;
    }

    const totalAEnviar = infanteriaAEnviar + caballeriaAEnviar + artilleriaAEnviar;
    if (totalAEnviar <= 0) {
      alert("Debe seleccionar al menos una unidad para la invasión.");
      return;
    }

    const transitDays = habilidades.some(h => h.id === "D_EXP_5" && h.desbloqueada) ? 12 : 17;
    const fechaImpacto = new Date(fechaVirtual);
    fechaImpacto.setDate(fechaImpacto.getDate() + transitDays);

    setAtaquesEnCola(prev => [...prev, {
      id: Math.random().toString(),
      pais_destino_id: paisSeleccionado.id,
      fecha_impacto: fechaImpacto,
      tropas_enviadas: {
        infanteria: infanteriaAEnviar,
        caballeria: caballeriaAEnviar,
        artilleria: artilleriaAEnviar
      }
    }]);

    setTropas(prev => ({
      infanteria: prev.infanteria - infanteriaAEnviar,
      caballeria: prev.caballeria - caballeriaAEnviar,
      artilleria: prev.artilleria - artilleriaAEnviar
    }));

    setDiarioGuerra(prev => [{
      id: Math.random().toString(),
      fecha: fechaVirtual,
      titulo: "DESPLIEGUE DE INVASIÓN MÚLTIPLE",
      mensaje: `Un convoy táctico con destino a ${paisSeleccionado.nombre} ha salido de los silos de transporte. Desplegadas: 👤${infanteriaAEnviar} Infantería, ⚡${caballeriaAEnviar} Caballería, 💀${artilleriaAEnviar} Artallería (Total: ${totalAEnviar} fuerzas). Impacto satelital estimado en T-${transitDays} días (${fechaImpacto.toLocaleDateString()}).`,
      tipo: "info"
    }, ...prev]);

    if (!paises[paisSeleccionado.id]) {
      setPaises(p => ({ ...p, [paisSeleccionado.id]: paisSeleccionado }));
    }

    setPaisSeleccionado(null);
    setHoveredPais(null);
    setInfanteriaAEnviar(0);
    setCaballeriaAEnviar(0);
    setArtilleriaAEnviar(0);
  };

  const handleMovilizarFuerzas = () => {
    if (!paisSeleccionado || !paisSeleccionado.conquistado) return;
    const livePais = paises[paisSeleccionado.id] || paisSeleccionado;

    if (infanteriaAMovilizar < 0 || caballeriaAMovilizar < 0 || artilleriaAMovilizar < 0) {
      alert("Cantidad de tropas inválida.");
      return;
    }

    const totalMovilizado = infanteriaAMovilizar + caballeriaAMovilizar + artilleriaAMovilizar;
    if (totalMovilizado <= 0) {
      alert("Debe seleccionar al menos una unidad para movilizar.");
      return;
    }

    const preset = getPresetForCountry(livePais.nombre);
    const multGral = preset.multiplicadorReclutamiento ?? 1.0;
    const multPesadas = preset.multiplicadorPesadas ?? 1.0;

    const tc = troopCostsRef.current;
    const costoInfUnit = Math.floor(tc.infanteria * multGral);
    const costoCabUnit = Math.floor(tc.caballeria * multGral * multPesadas);
    const costoArtUnit = Math.floor(tc.artilleria * multGral * multPesadas);

    let mobilizationCostMultiplier = 1.0;
    if (habilidades.some(h => h.id === "D_B1_3" && h.desbloqueada)) mobilizationCostMultiplier -= 0.10;
    if (habilidades.some(h => h.id === "D_EXP_4" && h.desbloqueada)) mobilizationCostMultiplier -= 0.20;
    if (habilidades.some(h => h.id === "D_SUPER_1" && h.desbloqueada)) mobilizationCostMultiplier -= 0.35;

    const baseCostoTotal = infanteriaAMovilizar * costoInfUnit + caballeriaAMovilizar * costoCabUnit + artilleriaAMovilizar * costoArtUnit;
    const costoTotal = Math.floor(baseCostoTotal * mobilizationCostMultiplier);

    if (presupuesto < costoTotal) {
      alert("Presupuesto global insuficiente.");
      return;
    }

    const scm = simConstantsRef.current;
    let mobilizationPopLimit = scm.mobilizationPopLimit;
    if (habilidades.some(h => h.id === "D_CONV_3" && h.desbloqueada)) {
      mobilizationPopLimit = 0.10;
    }
    const maxMovilizable = Math.floor(livePais.poblacion * mobilizationPopLimit);
    if (totalMovilizado > maxMovilizable) {
      alert(`La movilización excede el límite crítico del ${(mobilizationPopLimit * 100).toFixed(0)}% de la población actual (Máximo: ${maxMovilizable} habitantes).`);
      return;
    }

    // Aplicar los cambios
    const esMasiva = totalMovilizado >= livePais.poblacion * scm.massiveMobilizationThreshold;
    setPaises(prev => {
      const updated = { ...prev };
      if (updated[livePais.id]) {
        updated[livePais.id] = {
          ...updated[livePais.id],
          poblacion: updated[livePais.id].poblacion - totalMovilizado,
          dias_reclutamiento_agresivo: esMasiva ? scm.aggressiveRecruitmentPenaltyDays : (updated[livePais.id].dias_reclutamiento_agresivo || 0)
        };
      }
      return updated;
    });

    setPresupuesto(prev => prev - costoTotal);
    setTropas(prev => ({
      infanteria: prev.infanteria + infanteriaAMovilizar,
      caballeria: prev.caballeria + caballeriaAMovilizar,
      artilleria: prev.artilleria + artilleriaAMovilizar
    }));

    setDiarioGuerra(prev => [{
      id: Math.random().toString(),
      fecha: fechaVirtual,
      titulo: `MOVILIZACIÓN DE RESERVAS: ${livePais.nombre.toUpperCase()}`,
      mensaje: `Movilización exitosa en ${livePais.nombre}. Se convirtieron ${totalMovilizado} ciudadanos en tropas de reserva: 👤+${infanteriaAMovilizar} Inf, ⚡+${caballeriaAMovilizar} Cab, 💀+${artilleriaAMovilizar} Art.${esMasiva ? " ADVERTENCIA: La movilización masiva de personal reduce temporalmente la natalidad local en un -20% durante los siguientes 90 días virtuales por sustracción de mano de obra civil." : ""} Costo total deducido: €${costoTotal.toLocaleString()}.`,
      tipo: "success"
    }, ...prev]);

    setInfanteriaAMovilizar(0);
    setCaballeriaAMovilizar(0);
    setArtilleriaAMovilizar(0);
    setPaisSeleccionado(null);
  };

  const handleDesbloquearHabilidad = async (habilidad: Habilidad) => {
    if (habilidad.desbloqueada || habilidad.enDesarrollo) return;

    // Multiplicador de burocracia: +5% por cada país conquistado
    const conqueredCount = Object.values(paises).filter(p => p.conquistado).length;
    const multiplicadorBurocracia = 1 + 0.05 * conqueredCount;
    const costoFinal = Math.floor(habilidad.costo * multiplicadorBurocracia);
    const tiempoFinal = Math.max(1, Math.floor((habilidad.tiempo_investigacion_dias || 30) * multiplicadorBurocracia));

    // Validación de presupuesto (client-side fast-fail)
    if (presupuesto < costoFinal) {
      alert("No hay suficiente presupuesto.");
      return;
    }

    // Regla especial de UI: M_SEC requiere al menos 2 de los 3 finales militares
    if (habilidad.id === "M_SEC") {
      const finalesMilitares = habilidades.filter(
        h => ["M_13", "M_23", "M_33"].includes(h.id) && h.desbloqueada
      );
      if (finalesMilitares.length < 2) {
        alert("Cibernética de Vanguardia requiere al menos DOS tecnologías militares finales (Nivel 3).");
        return;
      }
    }

    const PARTIDA_ACTUAL_ID = activePartida?.partida_id;

    if (PARTIDA_ACTUAL_ID) {
      const resultado = await unlockHabilidad(PARTIDA_ACTUAL_ID, habilidad.id);

      if (!resultado.success) {
        alert(`No se puede investigar: ${resultado.error}`);
        return;
      }
    }

    // Descontar presupuesto y activar el temporizador de investigación (estado de UI local)
    setPresupuesto(prev => prev - costoFinal);
    setHabilidades(prev =>
      prev.map(h =>
        h.id === habilidad.id
          ? { ...h, enDesarrollo: true, tiempoRestante: tiempoFinal }
          : h
      )
    );
    setDiarioGuerra(prev => [{
      id: Math.random().toString(),
      fecha: fechaVirtual,
      titulo: `I+D INICIADO: ${habilidad.nombre.toUpperCase()}`,
      mensaje: `Se ha asignado presupuesto y comenzado el desarrollo de: ${habilidad.nombre}. Tiempo estimado de integración: T-${tiempoFinal} días. Costo deducido: $${costoFinal.toLocaleString()}.`,
      tipo: "info"
    }, ...prev]);
  };

  if (isDbLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden bg-[#030712] font-mono text-slate-300 uppercase tracking-widest select-none">
        <Hexagon className="w-16 h-16 text-cyan-500/40 animate-[spin_3s_linear_infinite] mb-6" strokeWidth={1.5} />
        <p className="text-sm text-cyan-400 animate-pulse tracking-[0.3em]">CARGANDO SISTEMA TÁCTICO...</p>
        <p className="text-[10px] text-slate-600 mt-2">ESTABLECIENDO ENLACE CON BASE DE DATOS</p>
      </div>
    );
  }

  if (currentScreen === 'start') {
    return (
      <>
        <StartMenu
          onStartGame={() => setCurrentScreen('select_hq')}
          onOpenLogin={() => setCurrentScreen('login')}
          onOpenSaves={() => setShowSaves(true)}
          onOpenProfile={() => setShowUserProfile(true)}
          currentUser={currentUser}
        />
        {showSaves && (
          <SaveFilesMenu
            onClose={() => setShowSaves(false)}
            onLoadSave={async (save) => {
              setActivePartida(save);
              setPresupuesto(save.budget);
              setTropas({ infanteria: save.tropas_infanteria, caballeria: save.tropas_caballeria, artilleria: save.tropas_artilleria });
              setPlayerHQ({ id: save.hq, nombre: translateCountry(save.hq) });
              setFechaVirtual(new Date(new Date(2099, 10, 12).getTime() + (save.campaignDays - 1) * 24 * 3600 * 1000));
              setSpeedLevel(save.velocidad as 1 | 2 | 3 || 1);
              setIsPlaying(!save.pausado);
              const techTree = await fetchTechTree(save.partida_id);
              setHabilidades(techTree);
              setCurrentScreen('game');
              setShowSaves(false);
            }}
            onNewGame={async (save) => {
              setActivePartida(save);
              setPresupuesto(save.budget);
              setTropas({ infanteria: save.tropas_infanteria, caballeria: save.tropas_caballeria, artilleria: save.tropas_artilleria });
              setPlayerHQ({ id: save.hq, nombre: translateCountry(save.hq) });
              setFechaVirtual(new Date(new Date(2099, 10, 12).getTime() + (save.campaignDays - 1) * 24 * 3600 * 1000));
              setSpeedLevel(save.velocidad as 1 | 2 | 3 || 1);
              setIsPlaying(!save.pausado);
              const techTree = await fetchTechTree(save.partida_id);
              setHabilidades(techTree);
              setCurrentScreen('game');
              setShowSaves(false);
            }}
          />
        )}
        {showUserProfile && currentUser && (
          <UserProfile
            user={currentUser}
            onClose={() => setShowUserProfile(false)}
            onLogout={async () => {
              await logoutOperator();
              setCurrentUser(null);
              setActivePartida(null);
              const techTree = await fetchTechTree();
              setHabilidades(techTree);
              setShowUserProfile(false);
            }}
          />
        )}
      </>
    );
  }

  if (currentScreen === 'login') {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentScreen('start');
        }}
        onCancel={() => setCurrentScreen('start')}
      />
    );
  }

  if (currentScreen === 'select_hq') {
    return (
      <SelectHQ
        onDeploy={(pais) => {
          setPlayerHQ(pais);

          // Buscar tier del HQ desde la tabla de presets cargada
          const norm = pais.nombre.toLowerCase();
          const presets = hqPresetsRef.current;
          const matched = presets.find(p => p.countries.some(c => norm.includes(c)));
          const fallback = presets.find(p => p.countries.length === 0) || presets[presets.length - 1];
          const preset = matched || fallback;

          if (preset) {
            setTropas({ ...preset.tropas });
            setPresupuesto(preset.presupuesto);
          } else {
            // Safety fallback (should never happen if DB is loaded)
            setTropas({ infanteria: 3000, caballeria: 500, artilleria: 100 });
            setPresupuesto(5000);
          }

          setCurrentScreen('game');
        }}
        onCancel={() => setCurrentScreen('start')}
      />
    );
  }

  const handleSaveCurrentState = async () => {
    if (!currentUser) {
      alert("SISTEMA: SE REQUIERE OPERARIO AUTENTICADO PARA GUARDAR LA PARTIDA.");
      return;
    }
    if (!currentUser.dbId) {
      alert("SISTEMA: SESIÓN SIN PERFIL VÁLIDO. CERRÁ SESIÓN Y VOLVÉ A INGRESAR.");
      return;
    }

    const days = Math.floor((fechaVirtual.getTime() - new Date(2099, 10, 12).getTime()) / (1000 * 3600 * 24)) + 1;

    let partida = activePartida;
    if (!partida) {
      const randomNode = `SECURE-NODE-${Math.floor(100 + Math.random() * 950)}`;
      const newSave = await initializeNewGame({
        usuario_id: currentUser.dbId,
        commander_id: randomNode,
        hq_pais_id: playerHQ?.id || "México",
        oro: presupuesto,
        tropas_infanteria: tropas.infanteria,
        tropas_caballeria: tropas.caballeria,
        tropas_artilleria: tropas.artilleria,
        velocidad: speedLevel,
        pausado: !isPlaying
      });
      if (newSave) {
        partida = newSave;
        setActivePartida(newSave);
      } else {
        alert("ERROR: NO SE PUDO CREAR EL SLOT DE GUARDADO EN LA BASE DE DATOS.");
        return;
      }
    }

    const success = await saveGame(partida.partida_id, {
      dias_campana: days,
      porcentaje_dominio: 2.1,
      oro: presupuesto,
      tropas_infanteria: tropas.infanteria,
      tropas_caballeria: tropas.caballeria,
      tropas_artilleria: tropas.artilleria,
      habilidad_puntos: 0,
      velocidad: speedLevel,
      pausado: !isPlaying
    });

    if (success) {
      setActivePartida({
        ...partida,
        campaignDays: days,
        budget: presupuesto,
        tropas_infanteria: tropas.infanteria,
        tropas_caballeria: tropas.caballeria,
        tropas_artilleria: tropas.artilleria,
        velocidad: speedLevel,
        pausado: !isPlaying
      });
      alert("SISTEMA: ESTADO DE LA SIMULACIÓN COPIADO AL SILO SEGURO.");
    } else {
      alert("ERROR: NO SE PUDO GUARDAR EL ESTADO EN LA BASE DE DATOS.");
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#030712] text-slate-200 overflow-hidden select-none" onMouseMove={handleMouseMove}>
      {/* HUD preaviso parpadeante */}
      {criticalCountdown !== null && (
        <div className="fixed right-4 top-20 z-[100] w-[320px] bg-red-950/85 border border-red-700 shadow-[0_0_40px_rgba(220,38,38,0.25)] backdrop-blur-sm animate-fade-in pointer-events-none select-none font-mono">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold text-xs uppercase tracking-[0.3em]">CRITICAL EVENT WARNING</span>
            </div>
            <div className="text-slate-200 text-sm font-black tracking-[0.2em]">T - {criticalCountdown}</div>
            <p className="text-slate-400 text-[11px] leading-snug">Evento crítico inminente. El sistema continúa ejecutando simulación hasta que la ventana emergente se abra.</p>
            <div className="text-[10px] text-red-500 uppercase tracking-[0.25em] font-bold">ALERTA RÁPIDA</div>
          </div>
        </div>
      )}
      {/* TOPBAR TÁCTICO - Con shrink-0 para evitar deformaciones */}
      <header className="min-h-16 md:h-16 border-b border-slate-800/80 bg-slate-950/80 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 py-4 md:py-0 px-6 shrink-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <Hexagon className="absolute w-8 h-8 text-cyan-400/30 animate-[spin_12s_linear_infinite]" strokeWidth={1.5} />
            <Globe className="absolute w-4 h-4 text-cyan-400 animate-pulse" strokeWidth={2} />
          </div>

          <div className="flex flex-col justify-center shrink-0">
            <h1 className="text-2xl font-black tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
              CONQUEST
            </h1>
            <span className="text-[9px] font-mono font-bold text-cyan-500 tracking-[0.25em] -mt-1">
              [ CORE EN LÍNEA ]
            </span>
          </div>

          {currentUser ? (
            <button
              onClick={() => setShowUserProfile(true)}
              className="group flex items-center text-xs font-mono tracking-widest text-slate-400
                border-l border-slate-800 pl-2 ml-1 md:pl-3 md:ml-2 hover:text-cyan-400 transition-colors whitespace-nowrap gap-1"
              title="Ver perfil de operario"
            >
              OPERARIO: [ <span className="text-cyan-400 font-bold group-hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.6)] transition-all max-w-[80px] md:max-w-[100px] truncate">{currentUser.username}</span> ]
            </button>
          ) : (
            <div className="text-xs font-mono tracking-widest text-slate-400 border-l border-slate-800 pl-2 ml-1 md:pl-3 md:ml-2 whitespace-nowrap">
              OPERARIO: [ <span className="text-slate-500 font-bold">INVITADO</span> ]
            </div>
          )}
          <div className="ml-2 pl-2 md:ml-3 md:pl-3 border-l border-slate-800 text-xs font-mono text-slate-400 whitespace-nowrap flex items-center">
            SEDE: [&nbsp;<span className="text-emerald-400 font-bold max-w-[70px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[150px] xl:max-w-[220px] truncate" title={playerHQ ? playerHQ.nombre.toUpperCase() : "DESCONOCIDA"}>{playerHQ ? playerHQ.nombre.toUpperCase() : "DESCONOCIDA"}</span>&nbsp;]
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 md:gap-4 shrink-0">
          <div className="text-xs font-bold tracking-widest text-slate-400 flex items-center gap-1.5 shrink-0">
            STATUS:
            <span className={isPlaying ? (speedLevel === 1 ? "text-emerald-500" : speedLevel === 2 ? "text-amber-500" : "text-cyan-400") : "text-rose-500"}>
              {isPlaying ? (speedLevel === 1 ? "SIMULATING [>]" : speedLevel === 2 ? "SIMULATING [>>]" : "SIMULATING [>>>]") : "PAUSED [||]"}
            </span>
          </div>

          <div className="bg-slate-900 px-3 md:px-4 py-1.5 rounded-sm border border-slate-700/80 shadow-inner flex items-center justify-center min-w-[110px] md:min-w-[140px] shrink-0">
            <span className="text-digital text-amber-500 text-base md:text-lg font-bold tracking-wider">
              {fechaVirtual.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')}
            </span>
          </div>

          <div className="flex bg-slate-900 rounded-sm p-0.5 border border-slate-700/80 shadow-inner">
            <button onClick={() => setIsPlaying(false)} className={`p-2 transition-all ${!isPlaying ? 'bg-slate-800 text-amber-500 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]' : 'text-slate-500 hover:text-slate-300'}`} title="Pausar">
              <Pause className="w-4 h-4 fill-current" />
            </button>
            <button onClick={() => { setIsPlaying(true); setSpeedLevel(1); }} className={`p-2 transition-all ${isPlaying && speedLevel === 1 ? 'bg-slate-800 text-emerald-500 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]' : 'text-slate-500 hover:text-slate-300'}`} title="Velocidad normal x1">
              <Play className="w-4 h-4 fill-current" />
            </button>
            <button onClick={() => { setIsPlaying(true); setSpeedLevel(2); }} className={`p-2 transition-all ${isPlaying && speedLevel === 2 ? 'bg-slate-800 text-amber-500 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]' : 'text-slate-500 hover:text-slate-300'}`} title="Velocidad rápida x2">
              <FastForward className="w-4 h-4 fill-current" />
            </button>
            <button onClick={() => { setIsPlaying(true); setSpeedLevel(3); }} className={`p-2 transition-all ${isPlaying && speedLevel === 3 ? 'bg-slate-800 text-cyan-400 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]' : 'text-slate-500 hover:text-slate-300'}`} title="Velocidad hiper x3">
              <ChevronsRight className="w-4.5 h-4.5 fill-current" />
            </button>
          </div>

          <button
            onClick={() => setShowActionLog(true)}
            className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors py-2 px-4 border border-slate-700 hover:border-amber-500 bg-slate-900/80 rounded-sm"
            title="Abrir registro de acciones"
          >
            [ LOG ]
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setIsSystemMenuOpen(true);
            }}
            className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors py-2 px-4 border border-slate-700 hover:border-cyan-500 bg-slate-900/80 rounded-sm"
          >
            [ SISTEMA ]
          </button>
        </div>
      </header>

      {/* SECCIÓN CENTRAL FLEXIBLE (Diario + Mapa) - Uso de flex-1 y min-h-0 */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden z-10">
        {/* PANEL IZQUIERDO: Diario de Guerra */}
        <div className="w-full md:w-[35%] flex-1 md:flex-initial shrink-0 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/60 flex flex-col overflow-hidden relative backdrop-blur-sm">
          <div className="p-4 border-b border-cyan-900/30 bg-[#02040a] shadow-lg shadow-cyan-950/20 shrink-0">
            <h2 className="text-xs font-bold text-cyan-500 tracking-[0.25em] uppercase flex items-center gap-2.5 font-mono">
              <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
              REGISTRO DE SUCESOS GLOBALES // SYS.LOG
            </h2>
          </div>
          {/* Scrollable Alerts Container */}
          <div className="flex-1 p-4 overflow-y-auto min-h-0 space-y-3 pb-8 custom-scrollbar relative">
            <TacticalNotifications />
            {diarioGuerra.map(ev => {
              const isAlert = ev.tipo === 'alert';
              const isSuccess = ev.tipo === 'success';
              return (
                <div
                  key={ev.id}
                  className={`group relative p-3.5 rounded border overflow-hidden transition-all duration-300 hover:translate-x-0.5 ${isAlert
                    ? 'bg-gradient-to-r from-red-950/50 via-slate-950/80 to-slate-950/60 border-rose-800/40 hover:border-rose-600/60 shadow-[inset_0_0_30px_rgba(225,29,72,0.04)]'
                    : isSuccess
                      ? 'bg-gradient-to-r from-emerald-950/50 via-slate-950/80 to-slate-950/60 border-emerald-800/40 hover:border-emerald-600/60 shadow-[inset_0_0_30px_rgba(16,185,129,0.04)]'
                      : 'bg-gradient-to-r from-cyan-950/30 via-slate-950/80 to-slate-950/60 border-cyan-800/30 hover:border-cyan-600/50 shadow-[inset_0_0_30px_rgba(6,182,212,0.03)]'
                    }`}
                >
                  {/* Scanline overlay */}
                  <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)', backgroundSize: '100% 4px' }} />

                  {/* Accent glow stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isAlert ? 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-500/30'
                    : isSuccess ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-400/30'
                      : 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-400/30'
                    }`} />
                  <div className={`absolute left-0 top-0 bottom-0 w-8 ${isAlert ? 'bg-rose-500/5' : isSuccess ? 'bg-emerald-500/5' : 'bg-cyan-500/5'
                    } blur-xl pointer-events-none`} />

                  {isAlert && (
                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-600/8 rounded-full blur-3xl pointer-events-none" />
                  )}

                  <div className="relative z-10 font-mono pl-2">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] leading-tight ${isAlert ? 'text-rose-400' : isSuccess ? 'text-emerald-400' : 'text-cyan-400'
                        }`}>
                        <span className={`flex items-center justify-center w-5 h-5 rounded-sm ${isAlert ? 'bg-rose-500/15 ring-1 ring-rose-500/30'
                          : isSuccess ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30'
                            : 'bg-cyan-500/15 ring-1 ring-cyan-500/30'
                          }`}>
                          {isAlert ? <ShieldAlert className="w-3 h-3" /> : isSuccess ? <ShieldCheck className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                        </span>
                        <span className="truncate">{ev.titulo}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-semibold shrink-0 tabular-nums tracking-wider">{ev.fecha.toLocaleDateString('es-ES')}</span>
                    </div>
                    {/* Body */}
                    <p className="text-[11px] leading-[1.6] text-slate-400 group-hover:text-slate-300 transition-colors">{ev.mensaje}</p>
                    {/* Separator line */}
                    <div className={`mt-2.5 h-px w-full ${isAlert ? 'bg-gradient-to-r from-rose-800/30 via-rose-800/10 to-transparent'
                      : isSuccess ? 'bg-gradient-to-r from-emerald-800/30 via-emerald-800/10 to-transparent'
                        : 'bg-gradient-to-r from-cyan-800/20 via-cyan-800/10 to-transparent'
                      }`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL DERECHO: Mapa Global - Eliminación del h-[calc(100vh-154px)] problemático */}
        <div className="flex-1 relative min-h-0 overflow-hidden flex items-center justify-center bg-transparent map-container">
          <TransformWrapper
            ref={transformComponentRef}
            initialScale={1}
            minScale={1}
            maxScale={8}
            centerOnInit
            doubleClick={{ disabled: true }}
            limitToBounds={false}
            onPanningStart={() => { isPanningRef.current = true; }}
            onPanning={() => { isPanningRef.current = true; }}
            onPanningStop={() => { setTimeout(() => { isPanningRef.current = false; }, 50); }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
                  <button onClick={() => zoomIn()} className="w-10 h-10 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/50 hover:border-slate-500 text-slate-300 hover:text-white font-bold flex items-center justify-center rounded-sm transition backdrop-blur-md shadow-lg text-lg select-none" title="Acercar">+</button>
                  <button onClick={() => zoomOut()} className="w-10 h-10 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/50 hover:border-slate-500 text-slate-300 hover:text-white font-bold flex items-center justify-center rounded-sm transition backdrop-blur-md shadow-lg text-lg select-none" title="Alejar">-</button>
                  <button onClick={() => resetTransform()} className="w-10 h-10 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/50 hover:border-slate-500 text-slate-300 hover:text-white font-bold flex items-center justify-center rounded-sm transition backdrop-blur-md shadow-lg text-lg select-none" title="Resetear vista">⟲</button>
                </div>

                <TransformComponent wrapperStyle={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} contentStyle={{ width: "100%", height: "100%" }} wrapperClass="bg-transparent cursor-grab active:cursor-grabbing" contentClass="flex items-center justify-center w-full h-full">
                  <ComposableMap projection={geoMiller()} projectionConfig={{ scale: 130, center: [0, 10] }} className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] block" style={{ width: "100%", height: "100%" }}>
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const pais = getPais(geo);
                          const isHovered = hoveredPais?.id === pais.id;
                          const isSelected = paisSeleccionado?.id === pais.id;
                          const isAttacked = ataquesEnCola.some(a => a.pais_destino_id === pais.id);

                          let fill = "#3f1a28";
                          if (pais.conquistado) fill = "#1e3a8a";
                          if (isHovered && !pais.conquistado) fill = "#701a2e";
                          if (isHovered && pais.conquistado) fill = "#1d4ed8";
                          if (isSelected) fill = pais.conquistado ? "#2563eb" : "#9f1239";

                          return (
                            <Geography
                              key={geo.rsmKey}
                              id={getDomId(pais.nombre)}
                              geography={geo}
                              onClick={() => { if (!isPanningRef.current) setPaisSeleccionado(pais); }}
                              onMouseEnter={(e) => {
                                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                                setHoveredPais(pais);
                                setTooltipPos({ x: e.clientX, y: e.clientY });
                              }}
                              onMouseMove={(e) => {
                                setTooltipPos({ x: e.clientX, y: e.clientY });
                              }}
                              onMouseLeave={() => {
                                timeoutRef.current = setTimeout(() => {
                                  setHoveredPais(null);
                                }, 300);
                              }}
                              style={{
                                default: { fill: fill, stroke: isAttacked ? "#ef4444" : "#1e293b", strokeWidth: isAttacked ? 1.5 : 0.5, outline: "none", transition: "all 250ms" },
                                hover: { fill: fill, stroke: pais.conquistado ? "#60a5fa" : "#fb7185", strokeWidth: 1, outline: "none", cursor: "crosshair" },
                                pressed: { fill: fill, stroke: "#fff", strokeWidth: 1.5, outline: "none" }
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>

          {/* TOOLTIP FLOTANTE */}
          {hoveredPais && !paisSeleccionado && (() => {
            const livePais = paises[hoveredPais.id] || hoveredPais;
            const demo = getDemographicsInfo(livePais, presupuesto, ataquesEnCola, habilidades);
            const isNearBottom = window.innerHeight - tooltipPos.y < 320;
            const isNearRight = window.innerWidth - tooltipPos.x < 240;
            const topStyle = isNearBottom ? tooltipPos.y - 280 : tooltipPos.y + 20;
            const leftStyle = isNearRight ? tooltipPos.x - 220 : tooltipPos.x + 20;
            return (
              <div
                className="fixed z-50 pointer-events-auto bg-slate-900/95 border border-slate-700/80 p-3 rounded-sm shadow-2xl backdrop-blur-md min-w-[200px]"
                style={{ left: leftStyle, top: topStyle }}
                onMouseEnter={() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                }}
                onMouseLeave={() => {
                  setHoveredPais(null);
                }}
              >
                <div className="text-slate-400 text-xs font-mono mb-2 uppercase tracking-widest border-b border-slate-800 pb-1">Datos Geométricos</div>
                <div className="font-bold text-slate-100 text-sm mb-1 truncate">{livePais.nombre}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                  <span className="text-slate-500">Población:</span>
                  <span className="text-slate-300 text-right font-mono">{livePais.poblacion.toLocaleString()}</span>
                  <span className="text-slate-500">Economía:</span>
                  <span className="text-emerald-400 text-right font-mono">{formatEconomy(livePais.economia)}</span>
                  <span className="text-slate-500">Fuerza:</span>
                  <span className="text-rose-400 text-right font-mono">
                    {livePais.conquistado 
                      ? '-' 
                      : (habilidades.some(h => (h.id === "D_EXP_5" || h.id === "M_ORB_4") && h.desbloqueada)
                          ? livePais.ejercito_ia.toLocaleString()
                          : `~${(Math.max(100, Math.round(livePais.ejercito_ia / 250) * 250)).toLocaleString()} (EST.)`
                        )
                    }
                  </span>
                </div>

                {/* Reporte Demográfico en Tooltip */}
                <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono space-y-1 text-slate-400">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">// REPORTE DEMOGRÁFICO</div>
                  <div className="flex justify-between">
                    <span>Natalidad:</span>
                    <span className="text-cyan-400 font-bold">
                      {(demo.tasaNatalidad * 100).toFixed(4)}% {demo.tieneReclutamientoAgresivo && <span className="text-rose-500 text-[8px] animate-pulse">(-20%)</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mortalidad:</span>
                    <span className="text-rose-400 font-bold">
                      {(demo.tasaMortalidad * 100).toFixed(4)}% {demo.isUnderAttack && <span className="text-rose-600 text-[8px] animate-pulse">(4x)</span>} {demo.tieneBancarrota && <span className="text-rose-600 text-[8px]">(+50%)</span>} {demo.tieneMedicos && <span className="text-emerald-500 text-[8px]">(-15%)</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] pt-1">
                    <span className="text-slate-500">TENDENCIA:</span>
                    <span className={demo.tendenciaColor}>{demo.tendencia.toUpperCase()}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPaisSeleccionado(livePais);
                  }}
                  className={`w-full mt-3 text-[10px] font-bold text-center py-1 uppercase tracking-widest ${livePais.conquistado
                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-700 hover:text-white cursor-pointer'
                    : 'bg-rose-900/30 text-rose-400 hover:bg-rose-700 hover:text-white cursor-pointer transition-all active:scale-95'
                    }`}
                >
                  {livePais.conquistado ? 'ALIADO' : 'HOSTIL'}
                </button>
              </div>
            );
          })()}

          {/* ATAQUES EN CAMINO OVERLAY */}
          <div className="absolute top-6 right-6 pointer-events-none flex flex-col gap-3">
            {ataquesEnCola.map(atk => {
              const p = paises[atk.pais_destino_id];
              const nombre = p ? p.nombre : "Desconocido";
              const diasLeft = Math.ceil((atk.fecha_impacto.getTime() - fechaVirtual.getTime()) / (1000 * 3600 * 24));
              return (
                <div key={atk.id} className="bg-slate-950/90 border border-amber-900/50 text-amber-500 text-xs px-4 py-2 rounded-sm flex items-center gap-3 backdrop-blur-md shadow-md">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </div>
                  <span className="font-mono">OFENSIVA A {nombre.toUpperCase()} <span className="text-amber-200">T-{Math.max(0, diasLeft)} DÍAS</span></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DRAWER LATERAL */}
      {paisSeleccionado && (() => {
        const livePais = paises[paisSeleccionado.id] || paisSeleccionado;
        const demo = getDemographicsInfo(livePais, presupuesto, ataquesEnCola, habilidades);
        const preset = getPresetForCountry(livePais.nombre);
        const multGral = preset.multiplicadorReclutamiento ?? 1.0;
        const multPesadas = preset.multiplicadorPesadas ?? 1.0;

        const tc = troopCostsRef.current;
        const costoInfUnit = Math.floor(tc.infanteria * multGral);
        const costoCabUnit = Math.floor(tc.caballeria * multGral * multPesadas);
        const costoArtUnit = Math.floor(tc.artilleria * multGral * multPesadas);

        const costoTotal = infanteriaAMovilizar * costoInfUnit + caballeriaAMovilizar * costoCabUnit + artilleriaAMovilizar * costoArtUnit;
        return (
          <div className="absolute right-4 md:right-6 top-20 w-[calc(100%-2rem)] sm:w-80 bg-slate-950/95 border border-slate-700 shadow-2xl rounded-sm backdrop-blur-xl overflow-hidden z-30 flex flex-col max-h-[70dvh] md:max-h-[calc(100dvh-186px)]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-950">
              <h3 className="font-bold text-sm tracking-widest text-slate-100 uppercase flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-500" />
                {livePais.nombre}
              </h3>
              <button onClick={() => setPaisSeleccionado(null)} className="text-slate-500 hover:text-rose-400 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-900/80 p-3 rounded-sm border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Población</div>
                  <div className="font-mono text-slate-300">{livePais.poblacion.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-sm border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Economía</div>
                  <div className="font-mono text-emerald-400">{formatEconomy(livePais.economia)}</div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-sm border border-slate-800 col-span-2 flex justify-between items-center">
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Estatus Táctico</div>
                    <div className={`font-bold tracking-wider text-xs ${livePais.conquistado ? 'text-blue-500' : 'text-rose-600'}`}>
                      {livePais.conquistado ? 'TERRITORIO ALIADO' : 'CONTROL HOSTIL'}
                    </div>
                  </div>
                  {livePais.conquistado ? <ShieldCheck className="w-6 h-6 text-blue-500 opacity-50" /> : <ShieldAlert className="w-6 h-6 text-rose-600 opacity-50" />}
                </div>

                {/* Tarjeta de Demografía Detallada */}
                <div className="bg-slate-900/80 p-3.5 rounded-sm border border-slate-800 col-span-2 space-y-2 font-mono text-xs">
                  <div className="text-slate-500 text-[9px] uppercase tracking-widest font-bold border-b border-slate-800 pb-1 flex justify-between items-center">
                    <span>SITUACIÓN DEMOGRÁFICA</span>
                    {livePais.dias_reclutamiento_agresivo && livePais.dias_reclutamiento_agresivo > 0 ? (
                      <span className="text-rose-500 animate-pulse text-[8px]">PENALIZACIÓN ACTIVA ({livePais.dias_reclutamiento_agresivo}d)</span>
                    ) : null}
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Tasa de Natalidad:</span>
                    <span className="text-cyan-400 font-bold">
                      {(demo.tasaNatalidad * 100).toFixed(4)}% {demo.tieneReclutamientoAgresivo && <span className="text-rose-500 text-[8px] animate-pulse">(-20%)</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Tasa de Mortalidad:</span>
                    <span className="text-rose-400 font-bold">
                      {(demo.tasaMortalidad * 100).toFixed(4)}% {demo.isUnderAttack && <span className="text-rose-600 text-[8px] animate-pulse">(4x)</span>} {demo.tieneBancarrota && <span className="text-rose-600 text-[8px]">(+50%)</span>} {demo.tieneMedicos && <span className="text-emerald-500 text-[8px]">(-15%)</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 border-t border-slate-900/60 pt-1.5 mt-1">
                    <span className="text-[9px] text-slate-500 uppercase">Tendencia Táctica:</span>
                    <span className={`${demo.tendenciaColor} font-bold text-[10px]`}>{demo.tendencia.toUpperCase()}</span>
                  </div>
                </div>
                {!livePais.conquistado && (() => {
                  const tieneIntelSat = habilidades.some(h => (h.id === "D_EXP_5" || h.id === "M_ORB_4") && h.desbloqueada);
                  return (
                    <div className="bg-rose-950/20 p-3 rounded-sm border border-rose-900/30 col-span-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="text-rose-400 text-[10px] uppercase tracking-widest font-bold">Fuerza Militar (IA)</div>
                        <div className="font-mono text-rose-500 font-bold">
                          {tieneIntelSat 
                            ? livePais.ejercito_ia.toLocaleString() 
                            : `~${(Math.max(100, Math.round(livePais.ejercito_ia / 250) * 250)).toLocaleString()} (ESTIMADO)`}
                        </div>
                      </div>
                      {livePais.ejercito_ia_detalle && (
                        <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono text-slate-400 pt-1.5 border-t border-rose-900/20">
                          <div className="flex flex-col items-center bg-slate-950/40 py-1 rounded border border-rose-950/30">
                            <span className="text-slate-500 text-[8px]">👤 INF (1x)</span>
                            <span className="text-rose-400 font-bold">
                              {tieneIntelSat ? livePais.ejercito_ia_detalle.infanteria.toLocaleString() : "???"}
                            </span>
                          </div>
                          <div className="flex flex-col items-center bg-slate-950/40 py-1 rounded border border-rose-950/30">
                            <span className="text-slate-500 text-[8px]">⚡ CAB (1.5x)</span>
                            <span className="text-rose-400 font-bold">
                              {tieneIntelSat ? livePais.ejercito_ia_detalle.caballeria.toLocaleString() : "???"}
                            </span>
                          </div>
                          <div className="flex flex-col items-center bg-slate-950/40 py-1 rounded border border-rose-950/30">
                            <span className="text-slate-500 text-[8px]">💀 ART (3x)</span>
                            <span className="text-rose-400 font-bold">
                              {tieneIntelSat ? livePais.ejercito_ia_detalle.artilleria.toLocaleString() : "???"}
                            </span>
                          </div>
                        </div>
                      )}
                      {!tieneIntelSat && (
                        <div className="text-[7.5px] text-slate-500 font-mono text-center pt-1 italic uppercase tracking-wider animate-pulse">
                          [ REQUERIDO: REGISTRO SATELITAL D_EXP_5 O M_ORB_4 ]
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {!livePais.conquistado && (
                <div className="pt-5 border-t border-slate-800 mt-2 space-y-4">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Distribución de la Ofensiva</div>

                  {/* Selector de Infantería */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">👤 Infantería (1.0x)</span>
                      <span className="text-slate-500">Disp: {tropas.infanteria.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max={tropas.infanteria}
                        value={infanteriaAEnviar || ""}
                        onChange={(e) => setInfanteriaAEnviar(Math.max(0, Math.min(tropas.infanteria, Number(e.target.value))))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-xs"
                        placeholder="0"
                      />
                      <button
                        onClick={() => setInfanteriaAEnviar(tropas.infanteria)}
                        className="bg-slate-800 hover:bg-slate-700 text-[10px] px-2.5 rounded-sm border border-slate-700 text-slate-300 font-mono active:scale-95 transition-all"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Selector de Caballería */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">⚡ Caballería (1.5x)</span>
                      <span className="text-slate-500">Disp: {tropas.caballeria.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max={tropas.caballeria}
                        value={caballeriaAEnviar || ""}
                        onChange={(e) => setCaballeriaAEnviar(Math.max(0, Math.min(tropas.caballeria, Number(e.target.value))))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-xs"
                        placeholder="0"
                      />
                      <button
                        onClick={() => setCaballeriaAEnviar(tropas.caballeria)}
                        className="bg-slate-800 hover:bg-slate-700 text-[10px] px-2.5 rounded-sm border border-slate-700 text-slate-300 font-mono active:scale-95 transition-all"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Selector de Artillería */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">💀 Artillería (3.0x)</span>
                      <span className="text-slate-500">Disp: {tropas.artilleria.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max={tropas.artilleria}
                        value={artilleriaAEnviar || ""}
                        onChange={(e) => setArtilleriaAEnviar(Math.max(0, Math.min(tropas.artilleria, Number(e.target.value))))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-xs"
                        placeholder="0"
                      />
                      <button
                        onClick={() => setArtilleriaAEnviar(tropas.artilleria)}
                        className="bg-slate-800 hover:bg-slate-700 text-[10px] px-2.5 rounded-sm border border-slate-700 text-slate-300 font-mono active:scale-95 transition-all"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Resumen del Poder y Botón de Ataque */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Poder de Ataque Total:</span>
                      <span className="text-rose-400 font-bold font-mono">
                        {(infanteriaAEnviar * 1.0 + caballeriaAEnviar * 1.5 + artilleriaAEnviar * 3.0).toFixed(1)}
                      </span>
                    </div>

                    <button
                      onClick={handleDeclararGuerra}
                      disabled={(infanteriaAEnviar + caballeriaAEnviar + artilleriaAEnviar) <= 0}
                      className="w-full bg-rose-700 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-white font-bold py-3 px-4 rounded-sm border border-rose-500 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Swords className="w-4 h-4" />
                      Iniciar Ofensiva
                    </button>
                  </div>
                </div>
              )}

              {livePais.conquistado && (
                <div className="pt-5 border-t border-slate-800 mt-2 space-y-4">
                  <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    Movilización Militar
                  </div>

                  {presupuesto <= 0 ? (
                    <div className="bg-red-950/20 border border-red-900/40 p-3 rounded text-[10px] font-mono text-rose-400 text-center uppercase tracking-wider">
                      PRESUPUESTO AGOTADO: RECLUTAMIENTO SUSPENDIDO
                    </div>
                  ) : (
                    <>
                      <div className="text-[9px] text-slate-500 normal-case mb-2 font-mono">
                        Convierta población local en fuerzas de reserva. Costo deducido de su oro global.
                      </div>

                      {/* Movilizar Infantería */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span>👤 Reclutar Infantería (€{costoInfUnit})</span>
                          <span className="text-slate-500">Costo: €{(infanteriaAMovilizar * costoInfUnit).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            value={infanteriaAMovilizar || ""}
                            onChange={(e) => setInfanteriaAMovilizar(Math.max(0, Number(e.target.value)))}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                            placeholder="Cantidad"
                          />
                          <button
                            onClick={() => {
                              const maxAffordable = Math.floor(presupuesto / costoInfUnit);
                              const maxByPop = Math.max(0, Math.floor(livePais.poblacion * 0.05) - caballeriaAMovilizar - artilleriaAMovilizar);
                              setInfanteriaAMovilizar(Math.min(maxAffordable, maxByPop));
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-[10px] px-2.5 rounded-sm border border-slate-700 text-slate-300 font-mono active:scale-95 transition-all"
                            title="Máxima infantería reclutable según presupuesto y límite de población"
                          >
                            MAX
                          </button>
                        </div>
                      </div>

                      {/* Movilizar Caballería */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span>⚡ Reclutar Caballería (€{costoCabUnit})</span>
                          <span className="text-slate-500">Costo: €{(caballeriaAMovilizar * costoCabUnit).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            value={caballeriaAMovilizar || ""}
                            onChange={(e) => setCaballeriaAMovilizar(Math.max(0, Number(e.target.value)))}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                            placeholder="Cantidad"
                          />
                          <button
                            onClick={() => {
                              const maxAffordable = Math.floor(presupuesto / costoCabUnit);
                              const maxByPop = Math.max(0, Math.floor(livePais.poblacion * 0.05) - infanteriaAMovilizar - artilleriaAMovilizar);
                              setCaballeriaAMovilizar(Math.min(maxAffordable, maxByPop));
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-[10px] px-2.5 rounded-sm border border-slate-700 text-slate-300 font-mono active:scale-95 transition-all"
                            title="Máxima caballería reclutable según presupuesto y límite de población"
                          >
                            MAX
                          </button>
                        </div>
                      </div>

                      {/* Movilizar Artillería */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span>💀 Reclutar Artillería (€{costoArtUnit})</span>
                          <span className="text-slate-500">Costo: €{(artilleriaAMovilizar * costoArtUnit).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            value={artilleriaAMovilizar || ""}
                            onChange={(e) => setArtilleriaAMovilizar(Math.max(0, Number(e.target.value)))}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                            placeholder="Cantidad"
                          />
                          <button
                            onClick={() => {
                              const maxAffordable = Math.floor(presupuesto / costoArtUnit);
                              const maxByPop = Math.max(0, Math.floor(livePais.poblacion * 0.05) - infanteriaAMovilizar - caballeriaAMovilizar);
                              setArtilleriaAMovilizar(Math.min(maxAffordable, maxByPop));
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-[10px] px-2.5 rounded-sm border border-slate-700 text-slate-300 font-mono active:scale-95 transition-all"
                            title="Máxima artillería reclutable según presupuesto y límite de población"
                          >
                            MAX
                          </button>
                        </div>
                      </div>

                      {/* Resumen de Movilización y Botón */}
                      <div className="pt-3 border-t border-slate-800 space-y-3">
                        <div className="space-y-1 text-[10px] font-mono">
                          <div className="flex justify-between text-slate-400">
                            <span>Ciudadanos a movilizar:</span>
                            <span className={infanteriaAMovilizar + caballeriaAMovilizar + artilleriaAMovilizar > Math.floor(livePais.poblacion * 0.05) ? "text-rose-500 font-bold" : "text-slate-200"}>
                              {infanteriaAMovilizar + caballeriaAMovilizar + artilleriaAMovilizar} / {Math.floor(livePais.poblacion * 0.05)} (Máx 5%)
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Costo de operaciones:</span>
                            <span className={costoTotal > presupuesto ? "text-rose-500 font-bold" : "text-emerald-400 font-bold"}>
                              €{costoTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleMovilizarFuerzas}
                          disabled={
                            (infanteriaAMovilizar + caballeriaAMovilizar + artilleriaAMovilizar) <= 0 ||
                            (infanteriaAMovilizar + caballeriaAMovilizar + artilleriaAMovilizar) > Math.floor(livePais.poblacion * 0.05) ||
                            costoTotal > presupuesto
                          }
                          className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-white font-bold py-3 px-4 rounded-sm border border-cyan-500 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Zap className="w-4 h-4" />
                          Movilizar Fuerzas
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* FOOTER (BARRA INFERIOR) - Con h-[90px] y shrink-0 fijado */}
      <footer className="min-h-[90px] md:h-[90px] py-4 md:py-0 border-t border-slate-800/80 bg-slate-950/90 flex flex-col md:flex-row gap-4 md:gap-0 items-center justify-between px-6 shrink-0 z-20 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row gap-4 h-auto md:h-14 w-full md:w-auto items-center">
          <div className="bg-slate-900 border border-slate-700/80 rounded-sm px-5 flex flex-col justify-center shadow-inner relative overflow-hidden group">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Presupuesto Global</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-black">€</span>
              <span className="text-xl font-mono text-emerald-400 font-bold tracking-tight">{presupuesto.toLocaleString()}</span>
            </div>
          </div>

          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent my-1"></div>

          <div className="bg-slate-900 border border-slate-700/80 rounded-sm px-5 flex flex-col justify-center shadow-inner">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Fuerzas de Reserva</span>
            <div className="flex gap-6 font-mono text-sm">
              <div className="flex items-center gap-2" title="Infantería">
                <Flag className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{tropas.infanteria.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2" title="Caballería">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-slate-300">{tropas.caballeria.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2" title="Artillería">
                <Skull className="w-4 h-4 text-rose-700" />
                <span className="text-slate-300">{tropas.artilleria.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent my-1"></div>

          <div className="bg-slate-900 border border-slate-700/80 rounded-sm px-5 flex flex-col justify-center shadow-inner">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Población Aliada</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono text-blue-400 font-bold tracking-tight">
                {Object.values(paises)
                  .filter(p => p.conquistado)
                  .reduce((sum, p) => sum + p.poblacion, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>

          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent my-1"></div>

          <div className="bg-slate-900 border border-slate-700/80 rounded-sm px-5 flex flex-col justify-center shadow-inner">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Dominio Global</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono text-cyan-400 font-bold tracking-tight">
                {((Object.values(paises).filter(p => p.conquistado).length / 177) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <button onClick={() => setMostrarArbol(true)} className="w-full md:w-auto justify-center group relative bg-slate-900 hover:bg-slate-800 border border-cyan-900/50 hover:border-cyan-500 text-cyan-100 h-14 px-8 rounded-sm shadow-md transition-all flex items-center gap-3">
          <Cpu className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
          <span className="font-bold uppercase tracking-[0.2em] text-xs">[ MATRIZ DE PROTOCOLOS ]</span>
        </button>
      </footer>

      {/* MODAL ÁRBOL DE HABILIDADES */}
      {mostrarArbol && (() => {
        const conqueredCount = Object.values(paises).filter(p => p.conquistado).length;
        const multiplicadorBurocracia = 1 + 0.05 * conqueredCount;
        return (
          <div className="fixed inset-0 z-50 flex flex-col p-4 md:p-8 overflow-hidden bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center mb-6 border-b border-slate-800 pb-4 shrink-0">
              <div>
                <h2 className="text-xl md:text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 flex items-center gap-4">
                  <Cpu className="w-8 h-8 text-cyan-500" />
                  MAINFRAME DE ASIMILACIÓN TÁCTICA
                </h2>
                <p className="text-slate-400 mt-2 text-sm tracking-widest uppercase flex flex-wrap gap-x-6 gap-y-1">
                  <span>Presupuesto Asignable: <span className="text-emerald-400 font-mono font-bold">${presupuesto.toLocaleString()}</span></span>
                  <span className="text-purple-400 font-mono">Multiplicador por Expansión: <span className="font-bold">x{multiplicadorBurocracia.toFixed(2)}</span></span>
                </p>
              </div>
              <button onClick={() => setMostrarArbol(false)} className="p-3 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-800 rounded-sm text-slate-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4 shrink-0">
              <button onClick={() => setTabIyd("desarrollo")} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest border rounded-sm transition-all ${tabIyd === "desarrollo" ? "bg-cyan-900/50 border-cyan-500 text-cyan-200" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300"}`}>[ ⚙ REDES DE INFRAESTRUCTURA ]</button>
              <button onClick={() => setTabIyd("militar")} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest border rounded-sm transition-all ${tabIyd === "militar" ? "bg-rose-900/50 border-rose-500 text-rose-200" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300"}`}>[ ⚔ DOCTRINA DE ANIQUILACIÓN ]</button>
            </div>

            <div className="flex-1 w-full relative overflow-hidden bg-[#02040a] rounded-lg border border-cyan-900/30 shadow-inner min-h-0">
              <TransformWrapper
                ref={techTreeTransformRef}
                minScale={0.2}
                maxScale={2}
                initialScale={0.6}
                centerOnInit={false}
                limitToBounds={false}
                wheel={{ step: 0.01, wheelDisabled: false }}
                doubleClick={{ disabled: true }}
                panning={{ disabled: false }}
              >
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                  <div className="relative w-[6000px] h-[4000px] bg-transparent">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      {habilidades.filter(h => h.categoria === tabIyd).flatMap(hab => {
                        return (hab.prerrequisitos || []).map(preId => {
                          const pre = habilidades.find(h => h.id === preId);
                          if (!pre) return null;
                          const isAvailable = pre.desbloqueada;
                          const isTargetEnDesarrollo = hab.enDesarrollo;
                          let strokeColor = "#1e293b";
                          if (hab.desbloqueada) {
                            strokeColor = "#06b6d4";
                          } else if (isTargetEnDesarrollo) {
                            strokeColor = "#a855f7";
                          } else if (isAvailable) {
                            strokeColor = "#0891b2";
                          }
                          return (
                            <line
                              key={`line-${pre.id}-${hab.id}`}
                              x1={pre.x + 208}
                              y1={pre.y + 45}
                              x2={hab.x}
                              y2={hab.y + 45}
                              stroke={strokeColor}
                              strokeWidth={hab.desbloqueada ? "3" : isTargetEnDesarrollo ? "2.5" : "2"}
                              strokeDasharray={hab.desbloqueada ? "none" : isTargetEnDesarrollo ? "4,4" : isAvailable ? "none" : "8,8"}
                              style={hab.desbloqueada ? { filter: "drop-shadow(0 0 8px #06b6d4)", transition: "all 0.5s ease" } : isTargetEnDesarrollo ? { filter: "drop-shadow(0 0 6px #a855f7)", transition: "all 0.5s ease" } : { transition: "all 0.5s ease" }}
                            />
                          );
                        });
                      })}
                    </svg>

                    {habilidades.filter(h => h.categoria === tabIyd).map(hab => {
                      const canUnlock = !hab.desbloqueada && !hab.enDesarrollo &&
                        (hab.prerrequisitos.length === 0 ||
                          hab.prerrequisitos.every(preId => habilidades.find(h => h.id === preId)?.desbloqueada === true));

                      const costoFinal = Math.floor(hab.costo * multiplicadorBurocracia);
                      const totalCalculatedTime = Math.max(1, Math.floor((hab.tiempo_investigacion_dias || 30) * multiplicadorBurocracia));
                      const progressPercent = hab.enDesarrollo
                        ? Math.min(100, Math.max(0, ((totalCalculatedTime - (hab.tiempoRestante || 0)) / totalCalculatedTime) * 100))
                        : 0;

                      let cardClass = "";
                      if (hab.desbloqueada) {
                        cardClass = "bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
                      } else if (hab.enDesarrollo) {
                        cardClass = "bg-purple-950/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]";
                      } else if (canUnlock) {
                        cardClass = "bg-slate-900 border-cyan-500 animate-pulse hover:animate-none hover:bg-slate-800 cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.2)]";
                      } else {
                        cardClass = "bg-slate-950 border-slate-800/50 opacity-40 grayscale pointer-events-none";
                      }

                      return (
                        <div
                          key={hab.id}
                          className={`absolute p-3 w-52 rounded-sm border transition-all duration-300 text-xs font-mono z-10 ${cardClass}`}
                          style={{ left: hab.x, top: hab.y }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canUnlock) handleDesbloquearHabilidad(hab);
                          }}
                        >
                          <div className={`font-bold mb-1 truncate ${hab.desbloqueada
                            ? 'text-cyan-50'
                            : hab.enDesarrollo
                              ? 'text-purple-300 font-bold'
                              : canUnlock
                                ? 'text-slate-100'
                                : 'text-slate-600'
                            }`} title={hab.nombre}>{hab.nombre}</div>
                          <div className={`text-[10px] mb-3 font-semibold ${hab.desbloqueada
                            ? 'text-cyan-500/80'
                            : hab.enDesarrollo
                              ? 'text-purple-400/80'
                              : 'text-cyan-500/80'
                            }`}>{hab.tipo_bono}</div>

                          {/* Progress Bar inside card if enDesarrollo */}
                          {hab.enDesarrollo && (
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-2 border border-slate-800/50">
                              <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[10px] border-t border-slate-800/80 pt-2 mt-2">
                            {hab.desbloqueada
                              ? <span className="text-cyan-400 font-bold uppercase tracking-wider">Investigado</span>
                              : hab.enDesarrollo
                                ? <>
                                  <span className="text-purple-400 font-bold uppercase tracking-wider font-mono">T-{hab.tiempoRestante} días</span>
                                  <span className="text-purple-500/80 font-mono">{Math.round(progressPercent)}%</span>
                                </>
                                : <>
                                  <span className="text-amber-500/80 font-mono">${costoFinal.toLocaleString()}</span>
                                  {canUnlock
                                    ? <span className="text-cyan-400 font-bold uppercase tracking-wider">Investigar</span>
                                    : <span className="text-slate-700 uppercase tracking-wider">Bloqueado</span>
                                  }
                                </>
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TransformComponent>
              </TransformWrapper>
            </div>
          </div>
        );
      })()}

      {showSaves && (
        <SaveFilesMenu
          onClose={() => setShowSaves(false)}
          onLoadSave={async (save) => {
            setActivePartida(save);
            setPresupuesto(save.budget);
            setTropas({ infanteria: save.tropas_infanteria, caballeria: save.tropas_caballeria, artilleria: save.tropas_artilleria });
            setPlayerHQ({ id: save.hq, nombre: translateCountry(save.hq) });
            setFechaVirtual(new Date(new Date(2099, 10, 12).getTime() + (save.campaignDays - 1) * 24 * 3600 * 1000));
            setSpeedLevel(save.velocidad as 1 | 2 | 3 || 1);
            setIsPlaying(!save.pausado);
            const techTree = await fetchTechTree(save.partida_id);
            setHabilidades(techTree);
            setCurrentScreen('game');
            setShowSaves(false);
          }}
          onNewGame={async (save) => {
            setActivePartida(save);
            setPresupuesto(save.budget);
            setTropas({ infanteria: save.tropas_infanteria, caballeria: save.tropas_caballeria, artilleria: save.tropas_artilleria });
            setPlayerHQ({ id: save.hq, nombre: translateCountry(save.hq) });
            setFechaVirtual(new Date(new Date(2099, 10, 12).getTime() + (save.campaignDays - 1) * 24 * 3600 * 1000));
            setSpeedLevel(save.velocidad as 1 | 2 | 3 || 1);
            setIsPlaying(!save.pausado);
            const techTree = await fetchTechTree(save.partida_id);
            setHabilidades(techTree);
            setCurrentScreen('game');
            setShowSaves(false);
          }}
        />
      )}

      {isSystemMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-[#050915]/95 border border-cyan-500/30 p-6 rounded-sm shadow-2xl">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

            <div className="font-mono text-slate-300 uppercase tracking-widest text-center">
              <h2 className="text-sm font-black text-rose-500 mb-6 tracking-[0.2em] animate-pulse">
                OVERRIDE DE SISTEMA // PAUSADO
              </h2>

              <div className="flex flex-col gap-4 text-xs">
                <button
                  onClick={() => setIsSystemMenuOpen(false)}
                  className="w-full border border-slate-800 hover:border-cyan-500 bg-slate-950/50 hover:bg-cyan-950/20 text-slate-400 hover:text-cyan-400 py-3 px-4 transition-all duration-300 rounded-sm font-bold"
                >
                  [ REANUDAR SIMULACIÓN ]
                </button>
                <button
                  onClick={handleSaveCurrentState}
                  className="w-full border border-slate-800 hover:border-cyan-500 bg-slate-950/50 hover:bg-cyan-950/20 text-slate-400 hover:text-cyan-400 py-3 px-4 transition-all duration-300 rounded-sm font-bold"
                >
                  [ GUARDAR ESTADO ACTUAL ]
                </button>
                <button
                  onClick={() => {
                    setIsSystemMenuOpen(false);
                    setShowSaves(true);
                  }}
                  className="w-full border border-slate-800 hover:border-cyan-500 bg-slate-950/50 hover:bg-cyan-950/20 text-slate-400 hover:text-cyan-400 py-3 px-4 transition-all duration-300 rounded-sm font-bold"
                >
                  [ GESTOR DE ARCHIVOS ]
                </button>
                <button
                  onClick={async () => {
                    await logoutOperator();
                    setIsSystemMenuOpen(false);
                    setCurrentUser(null);
                    setCurrentScreen('start');
                  }}
                  className="w-full border border-slate-800 hover:border-rose-500 bg-slate-950/50 hover:bg-rose-950/20 text-slate-500 hover:text-rose-500 py-3 px-4 transition-all duration-300 rounded-sm font-bold"
                >
                  [ DESCONECTAR ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showUserProfile && currentUser && (
        <UserProfile
          user={currentUser}
          onClose={() => setShowUserProfile(false)}
          onLogout={async () => {
            await logoutOperator();
            setCurrentUser(null);
            setShowUserProfile(false);
            setIsSystemMenuOpen(false);
            setCurrentScreen('start');
          }}
          gameStats={{
            paisesConquistados: Object.values(paises).filter(p => p.conquistado).length,
            totalPaises: 177,
            presupuesto,
            tropas: tropas.infanteria + tropas.caballeria + tropas.artilleria,
            diasCampana: Math.floor(
              (fechaVirtual.getTime() - new Date(2099, 10, 12).getTime()) / (1000 * 3600 * 24)
            )
          }}
        />
      )}
      <CriticalEventModal />
      <ActionLog isOpen={showActionLog} onClose={() => setShowActionLog(false)} />
    </div>
  );
}