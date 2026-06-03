import { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { 
  Play, Pause, FastForward, Activity,
  ShieldAlert, ShieldCheck, Info,
  Atom, Flag, Swords, Hexagon, Zap, Skull, Map as MapIcon,
  ChevronsRight, Globe
} from "lucide-react";
import { fetchInitialGameState, fetchRandomEvents, fetchTechTree, fetchCountryStats } from "./database/mockAPI";
import type { Habilidad } from "./database/mockAPI";
import Login from "./components/Login";
import StartMenu from "./components/StartMenu";
import SaveFilesMenu from "./components/SaveFilesMenu";
import SelectHQ from "./components/SelectHQ";
// Geometría del mapa del mundo (TopoJSON)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Pais = {
  id: string;
  nombre: string;
  economia: number;
  poblacion: number;
  ejercito_ia: number;
  conquistado: boolean;
};

type Tropas = {
  infanteria: number;
  caballeria: number;
  artilleria: number;
};

type AtaqueEnCola = {
  id: string;
  pais_destino_id: string;
  fecha_impacto: Date;
  tropas_enviadas: number;
};

type Evento = {
  id: string;
  fecha: Date;
  titulo: string;
  mensaje: string;
  tipo: "success" | "alert" | "info";
};

const normalizeName = (name: string): string => {
  const norm = name.toLowerCase();
  if (norm.includes("united states") || norm === "usa") return "united states of america";
  if (norm.includes("congo") && (norm.includes("dem") || norm.includes("d.r."))) return "dr congo";
  if (norm.includes("central african")) return "central african rep.";
  if (norm.includes("dominican")) return "dominican rep.";
  if (norm.includes("falkland")) return "argentina";
  return norm;
};

const getRealPopulation = (name: string, seed: number, populations: Record<string, number>): number => {
  const norm = normalizeName(name);
  for (const [key, value] of Object.entries(populations)) {
    const keyLower = key.toLowerCase();
    if (norm === keyLower || norm.includes(keyLower) || keyLower.includes(norm)) {
      const growthFactor = 1.05 + ((seed % 15) / 100);
      return Math.floor(value * growthFactor);
    }
  }
  return Math.floor((2000000 + (seed * 150000) % 43000000) * 1.1);
};

const getRealEconomy = (name: string, population: number, seed: number): number => {
  const norm = normalizeName(name);
  let baseGdpPerCapita = 5000;
  if (["united states of america", "germany", "united kingdom", "france", "japan", "singapore", "switzerland", "canada", "australia"].some(c => norm.includes(c))) {
    baseGdpPerCapita = 60000 + (seed % 20) * 1000;
  } else if (["china", "russia", "brazil", "mexico", "turkey", "saudi arabia", "south korea", "spain", "italy", "poland"].some(c => norm.includes(c))) {
    baseGdpPerCapita = 25000 + (seed % 15) * 800;
  } else {
    baseGdpPerCapita = 3000 + (seed % 10) * 500;
  }
  return Math.floor((population * baseGdpPerCapita) / 1000000);
};

const getRealEjercito = (isAliado: boolean, population: number, seed: number): number => {
  if (isAliado) return 0;
  const baseSize = Math.floor(Math.sqrt(population) * (5 + (seed % 5)));
  return Math.max(100, baseSize);
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'start' | 'login' | 'select_hq' | 'game'>('start');
  const [playerHQ, setPlayerHQ] = useState<{id: string, nombre: string} | null>(null);
  const [showSaves, setShowSaves] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [fechaVirtual, setFechaVirtual] = useState(new Date(2027, 4, 1));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedLevel, setSpeedLevel] = useState<1 | 2 | 3>(1);
  const [paises, setPaises] = useState<Record<string, Pais>>({});
  const [tropas, setTropas] = useState<Tropas>({ infanteria: 0, caballeria: 0, artilleria: 0 });
  const [presupuesto, setPresupuesto] = useState(0);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [ataquesEnCola, setAtaquesEnCola] = useState<AtaqueEnCola[]>([]);
  const [diarioGuerra, setDiarioGuerra] = useState<Evento[]>([
    { id: "inicio", fecha: new Date(2027, 4, 1), titulo: "SISTEMA TÁCTICO INICIADO", mensaje: "Núcleo de inteligencia y comunicaciones satelitales en línea. Iniciando simulación y mapeo geopolítico...", tipo: "info" }
  ]);

  const [isDbLoading, setIsDbLoading] = useState(true);
  const eventosAleatoriosRef = useRef<any[]>([]);
  const countryStatsRef = useRef<Record<string, number>>({});

  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [hoveredPais, setHoveredPais] = useState<Pais | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<any>(null);
  const [tropasAEnviar, setTropasAEnviar] = useState(0);
  const [mostrarArbol, setMostrarArbol] = useState(false);
  const [tabIyd, setTabIyd] = useState<"desarrollo" | "militar">("desarrollo");
  const [, setDiasParaEvento] = useState(10 + Math.floor(Math.random() * 6));
  const isPanningRef = useRef(false);

  const generarStatsPais = (geo: any): Pais => {
    const id = geo.id || "000";
    const name = geo.properties.name || "Unknown";
    const seed = id.charCodeAt(0) + (id.length > 1 ? id.charCodeAt(1) : 0);
    
    const inicialesAliados = ["USA", "840", "United States of America", "MEX", "484", "Mexico"];
    const isAliado = inicialesAliados.includes(name) || inicialesAliados.includes(id);

    const poblacion = getRealPopulation(name, seed, countryStatsRef.current);
    const economia = getRealEconomy(name, poblacion, seed);
    const ejercito_ia = getRealEjercito(isAliado, poblacion, seed);

    return {
      id: id,
      nombre: name,
      economia: economia,
      poblacion: poblacion,
      ejercito_ia: ejercito_ia,
      conquistado: isAliado
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
        const [gameState, events, techTree, countryData] = await Promise.all([
          fetchInitialGameState(),
          fetchRandomEvents(),
          fetchTechTree(),
          fetchCountryStats()
        ]);
        setPresupuesto(gameState.presupuesto);
        setTropas(gameState.tropas);
        eventosAleatoriosRef.current = events;
        countryStatsRef.current = countryData;
        setHabilidades(techTree);
      } finally {
        setIsDbLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = speedLevel === 1 ? 1000 : speedLevel === 2 ? 250 : 80;
    const interval = setInterval(() => {
      setFechaVirtual(prev => {
        const nextDate = new Date(prev);
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate;
      });
    }, intervalTime);
    return () => clearInterval(interval);
  }, [isPlaying, speedLevel]);

  useEffect(() => {
    setDiasParaEvento(prev => {
      if (prev <= 1) {
        const evts = eventosAleatoriosRef.current;
        if (evts.length === 0) return prev;
        const eventoAzar = evts[Math.floor(Math.random() * evts.length)];
        const nuevoEstado = eventoAzar.efecto(presupuesto, tropas);
        setPresupuesto(nuevoEstado.oro);
        setTropas(nuevoEstado.tropas);
        
        setDiarioGuerra(prevDiario => [{
          id: Math.random().toString(),
          fecha: fechaVirtual,
          titulo: eventoAzar.titulo,
          mensaje: eventoAzar.mensaje,
          tipo: eventoAzar.tipo as "success" | "alert" | "info"
        }, ...prevDiario]);
        return 10 + Math.floor(Math.random() * 6);
      }
      return prev - 1;
    });

    setAtaquesEnCola(prevAtaques => {
      const ataquesPendientes: AtaqueEnCola[] = [];
      prevAtaques.forEach(ataque => {
        if (fechaVirtual >= ataque.fecha_impacto) {
          const paisDestino = paises[ataque.pais_destino_id];
          if (!paisDestino) return;

          let fuerzaJugador = ataque.tropas_enviadas;
          let fuerzaIA = paisDestino.ejercito_ia;
          const bajasJugador = Math.floor(fuerzaJugador * (0.1 + Math.random() * 0.3));
          const bajasIA = Math.floor(fuerzaIA * (0.2 + Math.random() * 0.4));
          fuerzaJugador -= bajasJugador;
          fuerzaIA -= bajasIA;

          const victoria = fuerzaJugador > fuerzaIA;

          setDiarioGuerra(prevDiario => [{
            id: Math.random().toString(),
            fecha: fechaVirtual,
            titulo: victoria ? "VICTORIA EN CAMPAÑA" : "DERROTA OPERACIONAL",
            mensaje: victoria 
              ? `Victoria en ${paisDestino.nombre}! Las defensas de la IA enemiga colapsaron tras una ofensiva implacable de infantería. Bajas: ${bajasJugador}. Sobreviven: ${Math.floor(fuerzaJugador)} tropas que retornan a la reserva militar.`
              : `Falla táctica en ${paisDestino.nombre}. Nuestras fuerzas desplegadas fueron neutralizadas por contramedidas enemigas de alta frecuencia.`,
            tipo: victoria ? "success" : "alert"
          }, ...prevDiario]);

          if (victoria) {
            setPaises(p => ({ ...p, [paisDestino.id]: { ...paisDestino, conquistado: true, ejercito_ia: 0 } }));
            setTropas(t => ({ ...t, infanteria: t.infanteria + Math.floor(fuerzaJugador) }));
          } else {
            setPaises(p => ({ ...p, [paisDestino.id]: { ...paisDestino, ejercito_ia: Math.max(0, Math.floor(fuerzaIA)) } }));
          }
        } else {
          ataquesPendientes.push(ataque);
        }
      });
      return ataquesPendientes;
    });
  }, [fechaVirtual]);

  const handleDeclararGuerra = () => {
    if (!paisSeleccionado || paisSeleccionado.conquistado) return;
    if (tropasAEnviar <= 0 || tropasAEnviar > tropas.infanteria) {
      alert("Cantidad de tropas inválida o insuficiente.");
      return;
    }

    const fechaImpacto = new Date(fechaVirtual);
    fechaImpacto.setDate(fechaImpacto.getDate() + 5);

    setAtaquesEnCola(prev => [...prev, {
      id: Math.random().toString(),
      pais_destino_id: paisSeleccionado.id,
      fecha_impacto: fechaImpacto,
      tropas_enviadas: tropasAEnviar
    }]);

    setTropas(prev => ({ ...prev, infanteria: prev.infanteria - tropasAEnviar }));
    setDiarioGuerra(prev => [{
      id: Math.random().toString(),
      fecha: fechaVirtual,
      titulo: "DESPLIEGUE DE INVASIÓN",
      mensaje: `Un convoy táctico con destino a ${paisSeleccionado.nombre} ha salido de los silos de transporte. Desplegadas ${tropasAEnviar} unidades de infantería. Impacto satelital estimado en T-5 días (${fechaImpacto.toLocaleDateString()}).`,
      tipo: "info"
    }, ...prev]);

    if (!paises[paisSeleccionado.id]) {
      setPaises(p => ({ ...p, [paisSeleccionado.id]: paisSeleccionado }));
    }

    setPaisSeleccionado(null);
    setHoveredPais(null);
    setTropasAEnviar(0);
  };

  const handleDesbloquearHabilidad = (habilidad: Habilidad) => {
    if (habilidad.desbloqueada) return;
    if (presupuesto < habilidad.costo) {
      alert("No hay suficiente presupuesto.");
      return;
    }
    if (habilidad.id === "M_SEC") {
      const finalesMilitares = habilidades.filter(h => ["M_13", "M_23", "M_33"].includes(h.id) && h.desbloqueada);
      if (finalesMilitares.length < 2) {
        alert("Cibernética de Vanguardia requiere al menos DOS tecnologías militares finales (Nivel 3).");
        return;
      }
    } else if (habilidad.prerrequisito_id && !habilidades.find(h => h.id === habilidad.prerrequisito_id)?.desbloqueada) {
      alert("Prerrequisito no desbloqueado.");
      return;
    }

    setPresupuesto(prev => prev - habilidad.costo);
    setHabilidades(prev => prev.map(h => h.id === habilidad.id ? { ...h, desbloqueada: true } : h));
    setDiarioGuerra(prev => [{
      id: Math.random().toString(),
      fecha: fechaVirtual,
      titulo: "INTEGRACIÓN I+D EXITOSA",
      mensaje: `La red de investigación ha descifrado y asimilado la patente táctica: ${habilidad.nombre}. Atributos actualizados en la base de datos del teatro de operaciones global.`,
      tipo: "success"
    }, ...prev]);
  };

  if (isDbLoading) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#030712] font-mono text-slate-300 uppercase tracking-widest select-none">
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
          isLoggedIn={isAuthenticated} 
        />
        {showSaves && (
          <SaveFilesMenu 
            onClose={() => setShowSaves(false)} 
            onLoadSave={(saveId) => {
              setCurrentScreen('game');
              setShowSaves(false);
            }}
            onNewGame={() => {
              setCurrentScreen('game');
              setShowSaves(false);
            }}
          />
        )}
      </>
    );
  }

  if (currentScreen === 'login') {
    return (
      <Login 
        onLoginSuccess={() => {
          setIsAuthenticated(true);
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
          setCurrentScreen('game');
        }}
        onCancel={() => setCurrentScreen('start')}
      />
    );
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-[#030712] text-slate-200 overflow-hidden select-none" onMouseMove={handleMouseMove}>
      {/* TOPBAR TÁCTICO - Con shrink-0 para evitar deformaciones */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between px-6 shrink-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <Hexagon className="absolute w-8 h-8 text-cyan-400/30 animate-[spin_12s_linear_infinite]" strokeWidth={1.5} />
            <Globe className="absolute w-4 h-4 text-cyan-400 animate-pulse" strokeWidth={2} />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-black tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
              CONQUEST
            </h1>
            <span className="text-[9px] font-mono font-bold text-cyan-500 tracking-[0.25em] -mt-1">
              [ CORE EN LÍNEA ]
            </span>
          </div>

          <div className="text-xs font-mono tracking-widest text-slate-400 border-l border-slate-800 pl-4 ml-2">
            OPERARIO: [ <span className="text-cyan-400 font-bold">{isAuthenticated ? "ALEJANDRO" : "INVITADO"}</span> ]
          </div>
          <div className="ml-4 pl-4 border-l border-slate-800 text-xs font-mono text-slate-400">
            SEDE: [ <span className="text-emerald-400 font-bold">{playerHQ ? playerHQ.nombre.toUpperCase() : "DESCONOCIDA"}</span> ]
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-xs font-bold tracking-widest text-slate-400 flex items-center gap-2">
            STATUS: 
            <span className={isPlaying ? (speedLevel === 1 ? "text-emerald-500" : speedLevel === 2 ? "text-amber-500" : "text-cyan-400") : "text-rose-500"}>
              {isPlaying ? (speedLevel === 1 ? "SIMULATING [>]" : speedLevel === 2 ? "SIMULATING [>>]" : "SIMULATING [>>>]") : "PAUSED [||]"}
            </span>
          </div>

          <div className="bg-slate-900 px-5 py-2 rounded-sm border border-slate-700/80 shadow-inner flex items-center justify-center min-w-[160px]">
            <span className="text-digital text-amber-500 text-lg font-bold tracking-wider">
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
      <div className="flex-1 flex min-h-0 overflow-hidden z-10">
        {/* PANEL IZQUIERDO: Diario de Guerra */}
        <div className="w-[35%] shrink-0 border-r border-slate-800/80 bg-slate-950/60 flex flex-col overflow-hidden relative backdrop-blur-sm">
          <div className="p-4 border-b border-slate-800/50 bg-slate-900/90 shadow-md shrink-0">
            <h2 className="text-sm font-bold text-slate-300 tracking-[0.2em] uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Diario de Guerra
            </h2>
          </div>
          {/* Scrollable Alerts Container */}
          <div className="flex-1 p-5 overflow-y-auto min-h-0 space-y-4 pb-8 custom-scrollbar relative">
            {diarioGuerra.map(ev => {
              const isAlert = ev.tipo === 'alert';
              const isSuccess = ev.tipo === 'success';
              return (
                <div 
                  key={ev.id} 
                  className={`relative p-4 rounded-sm border-t border-r border-b backdrop-blur-md overflow-hidden transition-all hover:scale-[1.01] border-l-4 ${
                    isSuccess ? 'bg-emerald-950/40 border-t-emerald-900/50 border-r-emerald-900/50 border-b-emerald-900/50 border-l-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 
                    isAlert ? 'bg-red-950/40 border-t-red-900/50 border-r-red-900/50 border-b-red-900/50 border-l-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.05)]' : 
                    'bg-slate-900/50 border-t-slate-800/80 border-r-slate-800/80 border-b-slate-800/80 border-l-blue-600'
                  }`}
                >
                  {isSuccess && (
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                  )}
                  {isAlert && (
                    <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                  )}

                  <div className="relative z-10 font-mono">
                    <div className="flex items-center justify-between gap-2 mb-1.5 text-[10px]">
                      <div className={`flex items-center gap-1.5 font-bold uppercase tracking-wider ${isAlert ? 'text-rose-400' : isSuccess ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {isAlert ? <ShieldAlert className="w-3.5 h-3.5" /> : isSuccess ? <ShieldCheck className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                        {ev.titulo}
                      </div>
                      <span className="text-amber-500/90 font-semibold">[{ev.fecha.toLocaleDateString('es-ES')}]</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">{ev.mensaje}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL DERECHO: Mapa Global - Eliminación del h-[calc(100vh-154px)] problemático */}
        <div className="flex-1 relative min-h-0 overflow-hidden flex items-center justify-center bg-transparent map-container">
          <TransformWrapper
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
                  <ComposableMap projection="geoMercator" projectionConfig={{ scale: 155, center: [0, 0] }} className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] block" style={{ width: "100%", height: "100%" }}>
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
            const isNearBottom = window.innerHeight - tooltipPos.y < 280;
            const isNearRight = window.innerWidth - tooltipPos.x < 240;
            const topStyle = isNearBottom ? tooltipPos.y - 190 : tooltipPos.y + 20;
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
                <div className="font-bold text-slate-100 text-sm mb-1 truncate">{hoveredPais.nombre}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                  <span className="text-slate-500">Población:</span>
                  <span className="text-slate-300 text-right font-mono">{hoveredPais.poblacion.toLocaleString()}</span>
                  <span className="text-slate-500">Economía:</span>
                  <span className="text-emerald-400 text-right font-mono">${hoveredPais.economia.toLocaleString()}</span>
                  <span className="text-slate-500">Fuerza:</span>
                  <span className="text-rose-400 text-right font-mono">{hoveredPais.conquistado ? '-' : hoveredPais.ejercito_ia.toLocaleString()}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPaisSeleccionado(hoveredPais);
                  }}
                  className={`w-full mt-3 text-[10px] font-bold text-center py-1 uppercase tracking-widest ${
                    hoveredPais.conquistado
                      ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-700 hover:text-white cursor-pointer'
                      : 'bg-rose-900/30 text-rose-400 hover:bg-rose-700 hover:text-white cursor-pointer transition-all active:scale-95'
                  }`}
                >
                  {hoveredPais.conquistado ? 'ALIADO' : 'HOSTIL'}
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
      {paisSeleccionado && (
        <div className="absolute right-6 top-24 w-80 bg-slate-950/95 border border-slate-700 shadow-2xl rounded-sm backdrop-blur-xl overflow-hidden z-30">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-950">
            <h3 className="font-bold text-sm tracking-widest text-slate-100 uppercase flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-blue-500" />
              {paisSeleccionado.nombre}
            </h3>
            <button onClick={() => setPaisSeleccionado(null)} className="text-slate-500 hover:text-rose-400 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-900/80 p-3 rounded-sm border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Población</div>
                <div className="font-mono text-slate-300">{paisSeleccionado.poblacion.toLocaleString()}</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-sm border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Economía</div>
                <div className="font-mono text-emerald-400">${paisSeleccionado.economia.toLocaleString()}</div>
              </div>
              
              <div className="bg-slate-900/80 p-3 rounded-sm border border-slate-800 col-span-2 flex justify-between items-center">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Estatus Táctico</div>
                  <div className={`font-bold tracking-wider text-xs ${paisSeleccionado.conquistado ? 'text-blue-500' : 'text-rose-600'}`}>
                    {paisSeleccionado.conquistado ? 'TERRITORIO ALIADO' : 'CONTROL HOSTIL'}
                  </div>
                </div>
                {paisSeleccionado.conquistado ? <ShieldCheck className="w-6 h-6 text-blue-500 opacity-50" /> : <ShieldAlert className="w-6 h-6 text-rose-600 opacity-50" />}
              </div>
              
              {!paisSeleccionado.conquistado && (
                <div className="bg-rose-950/20 p-3 rounded-sm border border-rose-900/30 col-span-2 flex justify-between items-center">
                  <div className="text-rose-400 text-[10px] uppercase tracking-widest">Fuerza Militar (IA)</div>
                  <div className="font-mono text-rose-500 font-bold">{paisSeleccionado.ejercito_ia.toLocaleString()}</div>
                </div>
              )}
            </div>

            {!paisSeleccionado.conquistado && (
              <div className="pt-5 border-t border-slate-800 mt-2">
                <label className="flex justify-between text-[10px] text-slate-400 mb-2 uppercase tracking-widest">
                  <span>Desplegar Tropas</span>
                  <span className="text-slate-500">Disp: {tropas.infanteria}</span>
                </label>
                <div className="flex gap-2 mb-4">
                  <input type="number" min="0" max={tropas.infanteria} value={tropasAEnviar} onChange={(e) => setTropasAEnviar(Number(e.target.value))} className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-sm" placeholder="Ej. 1000"/>
                  <button onClick={() => setTropasAEnviar(tropas.infanteria)} className="bg-slate-800 hover:bg-slate-700 text-xs px-2 rounded-sm border border-slate-700 text-slate-300">MAX</button>
                </div>
                <button onClick={handleDeclararGuerra} disabled={tropasAEnviar <= 0 || tropasAEnviar > tropas.infanteria} className="w-full bg-rose-700 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-white font-bold py-3 px-4 rounded-sm border border-rose-500 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2">
                  <Swords className="w-4 h-4" />
                  Iniciar Ofensiva
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER (BARRA INFERIOR) - Con h-[90px] y shrink-0 fijado */}
      <footer className="h-[90px] border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between px-6 shrink-0 z-20 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex gap-4 h-14">
          <div className="bg-slate-900 border border-slate-700/80 rounded-sm px-5 flex flex-col justify-center shadow-inner relative overflow-hidden group">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Presupuesto Global</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-black">€</span>
              <span className="text-xl font-mono text-emerald-400 font-bold tracking-tight">{presupuesto.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent my-1"></div>
          
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

          <div className="w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent my-1"></div>
          
          <div className="bg-slate-900 border border-slate-700/80 rounded-sm px-5 flex flex-col justify-center shadow-inner">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Dominio Global</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono text-cyan-400 font-bold tracking-tight">
                {((Object.values(paises).filter(p => p.conquistado).length / 177) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <button onClick={() => setMostrarArbol(true)} className="group relative bg-slate-900 hover:bg-slate-800 border border-purple-900/50 hover:border-purple-500 text-purple-100 h-14 px-8 rounded-sm shadow-md transition-all flex items-center gap-3">
          <Atom className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
          <span className="font-bold uppercase tracking-[0.2em] text-xs">Árbol Tecnológico</span>
        </button>
      </footer>

      {/* MODAL ÁRBOL DE HABILIDADES */}
      {mostrarArbol && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col backdrop-blur-xl p-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 shrink-0">
            <div>
              <h2 className="text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center gap-4">
                <Atom className="w-8 h-8 text-purple-500" />
                DEPARTAMENTO DE I+D
              </h2>
              <p className="text-slate-400 mt-2 text-sm tracking-widest uppercase">
                Presupuesto Asignable: <span className="text-emerald-400 font-mono font-bold">${presupuesto.toLocaleString()}</span>
              </p>
            </div>
            <button onClick={() => setMostrarArbol(false)} className="p-3 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-800 rounded-sm text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="flex gap-4 mb-4 shrink-0">
            <button onClick={() => setTabIyd("desarrollo")} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest border rounded-sm transition-all ${tabIyd === "desarrollo" ? "bg-purple-900/50 border-purple-500 text-purple-200" : "bg-slate-900/50 border-slate-800 text-slate-500"}`}>[ ⚙ DESARROLLO INDUSTRIAL Y CIBERNÉTICO ]</button>
            <button onClick={() => setTabIyd("militar")} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest border rounded-sm transition-all ${tabIyd === "militar" ? "bg-rose-900/50 border-rose-500 text-rose-200" : "bg-slate-900/50 border-slate-800 text-slate-500"}`}>[ ⚔ DOCTRINA MILITAR GLOBAL ]</button>
          </div>

          <div className="flex-1 w-full relative border border-slate-800/80 rounded-lg bg-slate-950/90 overflow-auto shadow-inner p-12 custom-scrollbar">
            <div className="relative min-w-[1500px] min-h-[600px]">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {habilidades.filter(h => h.categoria === tabIyd).map(hab => {
                  let pre: Habilidad | undefined;
                  if (hab.id === "M_SEC") {
                     const m13 = habilidades.find(h => h.id === "M_13");
                     const m23 = habilidades.find(h => h.id === "M_23");
                     const m33 = habilidades.find(h => h.id === "M_33");
                     return [m13, m23, m33].map((p, i) => {
                       if (!p) return null;
                       const isActive = p.desbloqueada;
                       return (
                        <line key={`line-sec-${i}`} x1={p.x + 208} y1={p.y + 45} x2={hab.x} y2={hab.y + 45} stroke={hab.desbloqueada ? "#10b981" : isActive ? "#06b6d4" : "#1e293b"} strokeWidth="2" strokeDasharray={hab.desbloqueada ? "none" : "4,4"} style={hab.desbloqueada ? { filter: "drop-shadow(0 0 5px #10b981)" } : {}}/>
                       );
                     });
                  } else {
                    if (!hab.prerrequisito_id) return null;
                    pre = habilidades.find(h => h.id === hab.prerrequisito_id);
                    if (!pre) return null;
                    const isAvailable = pre.desbloqueada;
                    return (
                      <line key={`line-${hab.id}`} x1={pre.x + 208} y1={pre.y + 45} x2={hab.x} y2={hab.y + 45} stroke={hab.desbloqueada ? "#10b981" : isAvailable ? "#06b6d4" : "#1e293b"} strokeWidth="2" strokeDasharray={hab.desbloqueada ? "none" : "4,4"} style={hab.desbloqueada ? { filter: "drop-shadow(0 0 5px #10b981)" } : {}}/>
                    );
                  }
                })}
              </svg>

              {habilidades.filter(h => h.categoria === tabIyd).map(hab => {
                let canUnlock = false;
                if (hab.id === "M_SEC") {
                  const finalesMilitares = habilidades.filter(h => ["M_13", "M_23", "M_33"].includes(h.id) && h.desbloqueada);
                  canUnlock = !hab.desbloqueada && finalesMilitares.length >= 2;
                } else {
                  canUnlock = !hab.desbloqueada && (!hab.prerrequisito_id || habilidades.find(h => h.id === hab.prerrequisito_id)?.desbloqueada === true);
                }

                return (
                  <div key={hab.id} className={`absolute p-3 w-52 rounded border backdrop-blur-sm transition-all text-xs font-mono z-10 ${hab.desbloqueada ? 'bg-emerald-950/40 border-emerald-500' : canUnlock ? 'bg-slate-800/80 border-cyan-500 hover:border-cyan-300 cursor-pointer' : 'bg-slate-950/80 border-slate-800 opacity-60 grayscale pointer-events-none'}`} style={{ left: hab.x, top: hab.y }} onClick={() => canUnlock && handleDesbloquearHabilidad(hab)}>
                    <div className="font-bold mb-1 text-slate-100 truncate" title={hab.nombre}>{hab.nombre}</div>
                    <div className="text-[10px] text-cyan-300 mb-3">{hab.tipo_bono}</div>
                    <div className="flex justify-between items-center text-[10px] border-t border-slate-700/50 pt-2">
                      {hab.desbloqueada ? <span className="text-emerald-400 font-bold uppercase tracking-wider">Investigado</span> : <><span className="text-amber-400/80 font-mono">${hab.costo}</span>{canUnlock ? <span className="text-cyan-400 font-bold uppercase tracking-wider">Investigar</span> : <span className="text-slate-600 uppercase tracking-wider">Bloqueado</span>}</>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showSaves && (
        <SaveFilesMenu 
          onClose={() => setShowSaves(false)} 
          onLoadSave={(saveId) => {
            setCurrentScreen('game');
            setShowSaves(false);
          }}
          onNewGame={() => {
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
                  onClick={() => {
                    console.log("Guardado táctico completado en la terminal conquest.");
                    alert("SISTEMA: ESTADO DE LA SIMULACIÓN COPIADO AL SILO SEGURO.");
                  }}
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
                  onClick={() => {
                    setIsSystemMenuOpen(false);
                    setIsAuthenticated(false);
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
    </div>
  );
}