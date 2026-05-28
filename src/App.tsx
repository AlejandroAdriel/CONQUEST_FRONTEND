import { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { 
  Play, Pause, FastForward, Activity,
  ShieldAlert, ShieldCheck, Info,
  Atom, Flag, Swords, Hexagon, Zap, Skull, Map as MapIcon
} from "lucide-react";

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

type Habilidad = {
  id: string;
  nombre: string;
  costo: number;
  desbloqueada: boolean;
  prerrequisito_id: string | null;
  tipo_bono: string;
  x?: number;
  y?: number;
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

// Generador determinista de stats para países que no están en el estado
const generarStatsPais = (geo: any): Pais => {
  const id = geo.id || "000";
  const name = geo.properties.name || "Unknown";
  // Seed determinista simple
  const seed = id.charCodeAt(0) + (id.length > 1 ? id.charCodeAt(1) : 0);
  
  // Países iniciales aliados por defecto
  const inicialesAliados = ["USA", "840", "United States of America", "MEX", "484", "Mexico"];
  const isAliado = inicialesAliados.includes(name) || inicialesAliados.includes(id);

  return {
    id: id,
    nombre: name,
    economia: 50 * seed,
    poblacion: 1000 * seed,
    ejercito_ia: isAliado ? 0 : 40 * seed,
    conquistado: isAliado
  };
};

const initialHabilidades: Habilidad[] = [
  { id: "H1", nombre: "Tácticas de Infantería", costo: 500, desbloqueada: false, prerrequisito_id: null, tipo_bono: "+10% Defensa Infantería", x: 100, y: 100 },
  { id: "H2", nombre: "Caballería Pesada", costo: 800, desbloqueada: false, prerrequisito_id: "H1", tipo_bono: "+15% Ataque Caballería", x: 250, y: 50 },
  { id: "H3", nombre: "Artillería de Asedio", costo: 1200, desbloqueada: false, prerrequisito_id: "H1", tipo_bono: "+20% Daño Artillería", x: 250, y: 150 },
  { id: "H4", nombre: "Logística Avanzada", costo: 2000, desbloqueada: false, prerrequisito_id: "H2", tipo_bono: "+50% Velocidad de Movimiento", x: 450, y: 100 }
];

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

export default function App() {
  const [fechaVirtual, setFechaVirtual] = useState(new Date(2027, 4, 1)); // 1 de Mayo de 2027
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);

  // El estado de los países es un diccionario para acceso rápido. Se hidrata de manera lazy.
  const [paises, setPaises] = useState<Record<string, Pais>>({});
  
  const [tropas, setTropas] = useState<Tropas>({ infanteria: 5000, caballeria: 2000, artilleria: 500 });
  const [presupuesto, setPresupuesto] = useState(5000);
  const [habilidades, setHabilidades] = useState<Habilidad[]>(initialHabilidades);
  const [ataquesEnCola, setAtaquesEnCola] = useState<AtaqueEnCola[]>([]);
  const [diarioGuerra, setDiarioGuerra] = useState<Evento[]>([
    { id: "inicio", fecha: new Date(2027, 4, 1), titulo: "SISTEMA TÁCTICO INICIADO", mensaje: "Núcleo de inteligencia y comunicaciones satelitales en línea. Iniciando simulación y mapeo geopolítico...", tipo: "info" }
  ]);

  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [hoveredPais, setHoveredPais] = useState<Pais | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [tropasAEnviar, setTropasAEnviar] = useState(0);
  const [mostrarArbol, setMostrarArbol] = useState(false);
  const [, setDiasParaEvento] = useState(10 + Math.floor(Math.random() * 6));
  const isPanningRef = useRef(false);

  // Función auxiliar para obtener un país (del estado o generado)
  const getPais = (geo: any): Pais => {
    return paises[geo.id] || generarStatsPais(geo);
  };

  // Tracking del mouse para el tooltip flotante
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Loop principal del tiempo
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = isFastForward ? 250 : 1000;
    
    const interval = setInterval(() => {
      setFechaVirtual(prev => {
        const nextDate = new Date(prev);
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate;
      });
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [isPlaying, isFastForward]);

  // Lógica de avance por día (Eventos, Ataques)
  useEffect(() => {
    // Eventos aleatorios
    setDiasParaEvento(prev => {
      if (prev <= 1) {
        const eventoAzar = eventosAleatorios[Math.floor(Math.random() * eventosAleatorios.length)];
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

    // Resolución de ataques
    setAtaquesEnCola(prevAtaques => {
      const ataquesPendientes: AtaqueEnCola[] = [];
      prevAtaques.forEach(ataque => {
        if (fechaVirtual >= ataque.fecha_impacto) {
          const paisDestino = paises[ataque.pais_destino_id];
          if (!paisDestino) return; // Si no existe en estado, algo salió mal

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
            setPaises(p => ({
              ...p,
              [paisDestino.id]: { ...paisDestino, conquistado: true, ejercito_ia: 0 }
            }));
            setTropas(t => ({ ...t, infanteria: t.infanteria + Math.floor(fuerzaJugador) }));
          } else {
            // Actualizar ejercito IA tras la batalla
            setPaises(p => ({
              ...p,
              [paisDestino.id]: { ...paisDestino, ejercito_ia: Math.max(0, Math.floor(fuerzaIA)) }
            }));
          }
        } else {
          ataquesPendientes.push(ataque);
        }
      });
      return ataquesPendientes;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Asegurarse de que el país atacado exista en el estado local
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
    if (habilidad.prerrequisito_id && !habilidades.find(h => h.id === habilidad.prerrequisito_id)?.desbloqueada) {
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

  return (
    <div className="h-screen flex flex-col bg-tactical text-slate-200 overflow-hidden select-none" onMouseMove={handleMouseMove}>
      {/* TOPBAR TÁCTICO */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between px-6 shrink-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Hexagon className="w-8 h-8 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" strokeWidth={1.5} />
          <h1 className="text-2xl font-black tracking-[0.3em] text-slate-100 drop-shadow-md">
            CONQUEST
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Status Indicator */}
          <div className="text-xs font-bold tracking-widest text-slate-400 flex items-center gap-2">
            STATUS: 
            <span className={isPlaying ? (isFastForward ? "text-amber-500" : "text-emerald-500") : "text-rose-500"}>
              {isPlaying ? (isFastForward ? "SIMULATING [>>]" : "SIMULATING [>]") : "PAUSED [||]"}
            </span>
          </div>

          {/* Clock Panel */}
          <div className="bg-slate-900 px-5 py-2 rounded-sm border border-slate-700/80 shadow-inner flex items-center justify-center min-w-[160px]">
            <span className="text-digital text-amber-500 text-lg font-bold tracking-wider">
              {fechaVirtual.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')}
            </span>
          </div>

          {/* Controls */}
          <div className="flex bg-slate-900 rounded-sm p-0.5 border border-slate-700/80 shadow-inner">
            <button 
              onClick={() => { setIsPlaying(false); setIsFastForward(false); }}
              className={`p-2 transition-all ${!isPlaying ? 'bg-slate-800 text-amber-500 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
            <button 
              onClick={() => { setIsPlaying(true); setIsFastForward(false); }}
              className={`p-2 transition-all ${isPlaying && !isFastForward ? 'bg-slate-800 text-emerald-500 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
            <button 
              onClick={() => { setIsPlaying(true); setIsFastForward(true); }}
              className={`p-2 transition-all ${isPlaying && isFastForward ? 'bg-slate-800 text-amber-500 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <FastForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* PANEL IZQUIERDO: Diario de Guerra */}
        <div className="w-[35%] shrink-0 border-r border-slate-800/80 bg-slate-950/60 flex flex-col relative backdrop-blur-sm">
          <div className="p-4 border-b border-slate-800/50 bg-slate-900/90 shadow-md">
            <h2 className="text-sm font-bold text-slate-300 tracking-[0.2em] uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Diario de Guerra
            </h2>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto space-y-4 pb-8 custom-scrollbar relative">
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
                  {/* Decorative Texture/Pattern */}
                  {isSuccess && (
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                         style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
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
                      <span className="text-amber-500/90 font-semibold">
                        [{ev.fecha.toLocaleDateString('es-ES')}]
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {ev.mensaje}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL DERECHO: Mapa Global (react-simple-maps) */}
        <div className="w-[65%] h-[calc(100vh-154px)] relative map-container bg-transparent flex items-center justify-center">
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={8}
            centerOnInit
            doubleClick={{ disabled: true }}
            limitToBounds={false}
            onPanningStart={() => {
              isPanningRef.current = true;
            }}
            onPanning={() => {
              isPanningRef.current = true;
            }}
            onPanningStop={() => {
              setTimeout(() => {
                isPanningRef.current = false;
              }, 50);
            }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Mini-HUD táctico (abajo a la izquierda) */}
                <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
                  <button 
                    onClick={() => zoomIn()} 
                    className="w-10 h-10 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/50 hover:border-slate-500 text-slate-300 hover:text-white font-bold flex items-center justify-center rounded-sm transition backdrop-blur-md shadow-lg text-lg select-none animate-in fade-in"
                    title="Acercar (Zoom In)"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => zoomOut()} 
                    className="w-10 h-10 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/50 hover:border-slate-500 text-slate-300 hover:text-white font-bold flex items-center justify-center rounded-sm transition backdrop-blur-md shadow-lg text-lg select-none animate-in fade-in"
                    title="Alejar (Zoom Out)"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => resetTransform()} 
                    className="w-10 h-10 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/50 hover:border-slate-500 text-slate-300 hover:text-white font-bold flex items-center justify-center rounded-sm transition backdrop-blur-md shadow-lg text-lg select-none animate-in fade-in"
                    title="Resetear vista"
                  >
                    ⟲
                  </button>
                </div>

                <TransformComponent 
                  wrapperStyle={{ width: "100%", height: "100%" }} 
                  wrapperClass="bg-transparent cursor-grab active:cursor-grabbing" 
                  contentClass="flex items-center justify-center"
                >
                  <ComposableMap 
                    projection="geoMercator"
                    width={1000}
                    height={600}
                    projectionConfig={{ scale: 155, center: [0, 0] }} 
                    className="drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] block"
                    style={{ width: "1000px", height: "600px", display: "block" }}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const pais = getPais(geo);
                          const isHovered = hoveredPais?.id === pais.id;
                          const isSelected = paisSeleccionado?.id === pais.id;
                          const isAttacked = ataquesEnCola.some(a => a.pais_destino_id === pais.id);
                          
                          // Lógica de colores Dark Tactical
                          let fill = pais.conquistado ? "#1e3a8a" : "#4c1d95"; // azul oscuro vs violeta oscuro default
                          if (!pais.conquistado) fill = "#3f1a28"; // rose-950 tone for AI
                          
                          if (isHovered && !pais.conquistado) fill = "#701a2e"; // brighter red on hover
                          if (isHovered && pais.conquistado) fill = "#1d4ed8"; // brighter blue on hover
                          if (isSelected) fill = pais.conquistado ? "#2563eb" : "#9f1239"; 

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onClick={() => {
                                if (isPanningRef.current) return;
                                setPaisSeleccionado(pais);
                              }}
                              onMouseEnter={() => {
                                setHoveredPais(pais);
                              }}
                              onMouseLeave={() => {
                                setHoveredPais(null);
                              }}
                              style={{
                                default: {
                                  fill: fill,
                                  stroke: isAttacked ? "#ef4444" : "#1e293b",
                                  strokeWidth: isAttacked ? 1.5 : 0.5,
                                  outline: "none",
                                  transition: "all 250ms"
                                },
                                hover: {
                                  fill: fill,
                                  stroke: pais.conquistado ? "#60a5fa" : "#fb7185",
                                  strokeWidth: 1,
                                  outline: "none",
                                  cursor: "crosshair"
                                },
                                pressed: {
                                  fill: fill,
                                  stroke: "#fff",
                                  strokeWidth: 1.5,
                                  outline: "none"
                                }
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

          {/* TOOLTIP FLOTANTE (Hover) */}
          {hoveredPais && !paisSeleccionado && (() => {
            const isNearBottom = window.innerHeight - mousePos.y < 280;
            const isNearRight = window.innerWidth - mousePos.x < 240;
            const topStyle = isNearBottom ? mousePos.y - 190 : mousePos.y + 20;
            const leftStyle = isNearRight ? mousePos.x - 220 : mousePos.x + 20;
            return (
              <div 
                className="fixed z-50 pointer-events-none bg-slate-900/95 border border-slate-700/80 p-3 rounded-sm shadow-2xl backdrop-blur-md min-w-[200px] transition-all duration-100 ease-out"
                style={{ left: leftStyle, top: topStyle }}
              >
                <div className="text-slate-400 text-xs font-mono mb-2 uppercase tracking-widest border-b border-slate-800 pb-1">
                  Datos Geométricos
                </div>
                <div className="font-bold text-slate-100 text-sm mb-1 truncate">{hoveredPais.nombre}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                  <span className="text-slate-500">Población:</span>
                  <span className="text-slate-300 text-right font-mono">{hoveredPais.poblacion.toLocaleString()}</span>
                  <span className="text-slate-500">Economía:</span>
                  <span className="text-emerald-400 text-right font-mono">${hoveredPais.economia.toLocaleString()}</span>
                  <span className="text-slate-500">Fuerza:</span>
                  <span className="text-rose-400 text-right font-mono">{hoveredPais.conquistado ? '-' : hoveredPais.ejercito_ia.toLocaleString()}</span>
                </div>
                <div className={`mt-3 text-[10px] font-bold text-center py-1 uppercase tracking-widest ${hoveredPais.conquistado ? 'bg-blue-900/30 text-blue-400' : 'bg-rose-900/30 text-rose-400'}`}>
                  {hoveredPais.conquistado ? 'ALIADO' : 'HOSTIL'}
                </div>
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
                <div key={atk.id} className="bg-slate-950/90 border border-amber-900/50 text-amber-500 text-xs px-4 py-2 rounded-sm flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(217,119,6,0.15)]">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </div>
                  <span className="font-mono">
                    OFENSIVA A {nombre.toUpperCase()} <span className="text-amber-200">T-{Math.max(0, diasLeft)} DÍAS</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DRAWER LATERAL (Detalle y Ataque) */}
      {paisSeleccionado && (
        <div className="absolute right-6 top-24 w-80 bg-slate-950/95 border border-slate-700 shadow-2xl rounded-sm backdrop-blur-xl overflow-hidden animate-in slide-in-from-right-8 z-30">
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
                  <input 
                    type="number" 
                    min="0" 
                    max={tropas.infanteria}
                    value={tropasAEnviar}
                    onChange={(e) => setTropasAEnviar(Number(e.target.value))}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono transition text-sm shadow-inner"
                    placeholder="Ej. 1000"
                  />
                  <button onClick={() => setTropasAEnviar(tropas.infanteria)} className="bg-slate-800 hover:bg-slate-700 text-xs px-2 rounded-sm border border-slate-700 text-slate-300">MAX</button>
                </div>
                <button 
                  onClick={handleDeclararGuerra}
                  disabled={tropasAEnviar <= 0 || tropasAEnviar > tropas.infanteria}
                  className="w-full bg-rose-700 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 disabled:shadow-none text-white font-bold py-3 px-4 rounded-sm transition shadow-[0_0_15px_rgba(225,29,72,0.3)] border border-rose-500 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2"
                >
                  <Swords className="w-4 h-4" />
                  Iniciar Ofensiva
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOMBAR */}
      <footer className="h-[90px] border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between px-6 shrink-0 z-20 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
        
        <div className="flex gap-4 h-14">
          {/* Panel Presupuesto */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-sm px-5 flex flex-col justify-center shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Presupuesto Global</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-black">€</span>
              <span className="text-xl font-mono text-emerald-400 font-bold tracking-tight">{presupuesto.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent my-1"></div>
          
          {/* Panel Reservas Militares */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-sm px-5 flex flex-col justify-center shadow-inner">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Fuerzas de Reserva</span>
            <div className="flex gap-6 font-mono text-sm">
              <div className="flex items-center gap-2 group" title="Infantería">
                <Flag className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                <span className="text-slate-300">{tropas.infanteria.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 group" title="Caballería">
                <Zap className="w-4 h-4 text-amber-600 group-hover:text-amber-500 transition-colors" />
                <span className="text-slate-300">{tropas.caballeria.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 group" title="Artillería">
                <Skull className="w-4 h-4 text-rose-700 group-hover:text-rose-500 transition-colors" />
                <span className="text-slate-300">{tropas.artilleria.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón Árbol Tecnológico */}
        <button 
          onClick={() => setMostrarArbol(true)}
          className="group relative bg-slate-900 hover:bg-slate-800 border border-purple-900/50 hover:border-purple-500 text-purple-100 h-14 px-8 rounded-sm shadow-[0_0_20px_rgba(88,28,135,0.2)] hover:shadow-[0_0_25px_rgba(147,51,234,0.3)] transition-all overflow-hidden flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent pointer-events-none"></div>
          <Atom className="w-5 h-5 text-purple-400 group-hover:text-purple-300 group-hover:animate-spin-slow" />
          <span className="font-bold uppercase tracking-[0.2em] text-xs">Árbol Tecnológico</span>
        </button>
      </footer>

      {/* MODAL ÁRBOL DE HABILIDADES */}
      {mostrarArbol && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col backdrop-blur-xl p-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
            <div>
              <h2 className="text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center gap-4">
                <Atom className="w-8 h-8 text-purple-500" />
                DEPARTAMENTO DE I+D
              </h2>
              <p className="text-slate-400 mt-2 text-sm tracking-widest uppercase">
                Presupuesto Asignable: <span className="text-emerald-400 font-mono font-bold">${presupuesto.toLocaleString()}</span>
              </p>
            </div>
            <button 
              onClick={() => setMostrarArbol(false)}
              className="p-3 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-800 hover:border-rose-900 rounded-sm transition text-slate-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 relative border border-slate-800 rounded-sm bg-slate-900/30 overflow-auto shadow-inner">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 800, minHeight: 600 }}>
              {habilidades.map(hab => {
                if (!hab.prerrequisito_id) return null;
                const pre = habilidades.find(h => h.id === hab.prerrequisito_id);
                if (!pre) return null;
                return (
                  <line 
                    key={`line-${hab.id}`}
                    x1={pre.x! + 80} 
                    y1={pre.y! + 40} 
                    x2={hab.x! - 20} 
                    y2={hab.y! + 40} 
                    stroke={hab.desbloqueada ? "#a855f7" : "#334155"} 
                    strokeWidth="2"
                    strokeDasharray={hab.desbloqueada ? "none" : "4,4"}
                  />
                );
              })}
            </svg>

            <div className="relative w-full h-full" style={{ minWidth: 800, minHeight: 600 }}>
              {habilidades.map(hab => {
                const canUnlock = !hab.desbloqueada && (!hab.prerrequisito_id || habilidades.find(h => h.id === hab.prerrequisito_id)?.desbloqueada);
                return (
                  <div 
                    key={hab.id}
                    className={`absolute p-4 w-56 rounded-sm border backdrop-blur-sm transition-all ${
                      hab.desbloqueada 
                        ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                        : canUnlock 
                          ? 'bg-slate-800/80 border-slate-500 hover:border-slate-300 hover:bg-slate-700 cursor-pointer'
                          : 'bg-slate-950/80 border-slate-800 opacity-50 grayscale'
                    }`}
                    style={{ left: hab.x, top: hab.y }}
                    onClick={() => canUnlock && handleDesbloquearHabilidad(hab)}
                  >
                    <div className="font-bold text-sm mb-1 text-slate-200">{hab.nombre}</div>
                    <div className="text-xs text-purple-300 mb-4">{hab.tipo_bono}</div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-700/50 pt-2">
                      {hab.desbloqueada ? (
                        <span className="text-emerald-400 font-bold uppercase tracking-wider">Desarrollado</span>
                      ) : (
                        <>
                          <span className="text-slate-400 font-mono">${hab.costo}</span>
                          {canUnlock ? <span className="text-blue-400 font-bold uppercase tracking-wider">Investigar</span> : <span className="text-slate-600 uppercase tracking-wider">Bloqueado</span>}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
