import { useState } from "react";
import {
  Globe, Shield, Users, DollarSign, Swords, Crosshair,
  ChevronRight, X, Hexagon, MapPin, Zap
} from "lucide-react";

interface HQOption {
  id: string;
  nombre: string;
  poblacion: string;
  economia: string;
  ventaja: string;
  descripcion: string;
  stats: { militar: number; economia: number; tecnologia: number; influencia: number };
}

interface SelectHQProps {
  onDeploy: (pais: { id: string; nombre: string }) => void;
  onCancel: () => void;
}

const HQ_OPTIONS: HQOption[] = [
  {
    id: "840",
    nombre: "Estados Unidos",
    poblacion: "341,000,000",
    economia: "$28.7T",
    ventaja: "Supremacía Tecnológica y Naval",
    descripcion: "La megacorporación federal más poderosa del hemisferio occidental. Dominio absoluto en I+D militar, redes satelitales y proyección de fuerza global. Infraestructura de drones autónomos sin rival.",
    stats: { militar: 95, economia: 90, tecnologia: 98, influencia: 85 }
  },
  {
    id: "156",
    nombre: "China",
    poblacion: "1,420,000,000",
    economia: "$21.3T",
    ventaja: "Supremacía Industrial y Cibernética",
    descripcion: "El conglomerado estatal-corporativo más grande del mundo. Capacidad de producción masiva de unidades de combate autónomas. Red de vigilancia cuántica que cubre el 98% del territorio continental.",
    stats: { militar: 88, economia: 95, tecnologia: 90, influencia: 80 }
  },
  {
    id: "643",
    nombre: "Rusia",
    poblacion: "144,000,000",
    economia: "$4.8T",
    ventaja: "Arsenal Nuclear y Guerra Electrónica",
    descripcion: "Fortaleza continental con la mayor reserva de armamento táctico-nuclear del planeta. Especialistas en guerra electrónica, ciberataques de infraestructura crítica y operaciones de desinformación masiva.",
    stats: { militar: 92, economia: 55, tecnologia: 75, influencia: 70 }
  },
  {
    id: "276",
    nombre: "Alemania",
    poblacion: "84,000,000",
    economia: "$5.1T",
    ventaja: "Ingeniería de Precisión y Logística",
    descripcion: "El nodo industrial central de la alianza europea. Líder en manufactura de exoesqueletos de combate, vehículos blindados de nueva generación y sistemas de defensa automatizados de perímetro.",
    stats: { militar: 72, economia: 88, tecnologia: 92, influencia: 78 }
  },
  {
    id: "392",
    nombre: "Japón",
    poblacion: "123,000,000",
    economia: "$5.4T",
    ventaja: "Robótica Avanzada y Defensa Autónoma",
    descripcion: "Archipiélago-fortaleza con la mayor densidad de sistemas de defensa automatizados del mundo. Pioneros en mecas tácticos, IA de combate adaptativa y escudos electromagnéticos experimentales.",
    stats: { militar: 68, economia: 85, tecnologia: 96, influencia: 65 }
  }
];

export default function SelectHQ({ onDeploy, onCancel }: SelectHQProps) {
  const [selected, setSelected] = useState<HQOption | null>(null);

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-[#030712] font-mono text-slate-300 uppercase tracking-widest select-none overflow-hidden">

      {/* Fondo de rejilla táctica */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <div className="relative z-10 shrink-0 flex items-center justify-between px-8 py-5 border-b border-cyan-900/30">
        <div className="flex items-center gap-4">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <Hexagon className="absolute w-8 h-8 text-cyan-400/20 animate-[spin_10s_linear_infinite]" strokeWidth={1.5} />
            <MapPin className="absolute w-4 h-4 text-cyan-400" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-100 tracking-[0.2em]">
              [ SELECCIÓN DE SEDE CENTRAL ]
            </h1>
            <p className="text-[9px] text-cyan-500/60 mt-0.5 normal-case tracking-wider">
              PROTOCOLO DE DESPLIEGUE INICIAL // ELIJA NODO DE OPERACIONES
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-900/50 py-1.5 px-4 bg-slate-950/50"
        >
          <X className="w-4 h-4" />
          <span>[ ABORTAR ]</span>
        </button>
      </div>

      {/* Contenido principal: Grid de 2 columnas */}
      <div className="relative z-10 flex flex-1 min-h-0">

        {/* IZQUIERDA — Lista de países */}
        <div className="w-1/3 border-r border-slate-800/60 flex flex-col p-4 overflow-y-auto min-h-0">
          <div className="text-[9px] text-slate-500 mb-3 px-2 flex items-center gap-2">
            <Globe className="w-3 h-3" />
            NODOS DISPONIBLES — {HQ_OPTIONS.length} POTENCIAS
          </div>

          <div className="flex flex-col gap-2">
            {HQ_OPTIONS.map((pais) => {
              const isSelected = selected?.id === pais.id;
              return (
                <button
                  key={pais.id}
                  onClick={() => setSelected(pais)}
                  className={`group relative text-left p-4 border transition-all duration-300 ${
                    isSelected
                      ? "border-cyan-500/60 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "border-slate-800/60 bg-slate-950/30 hover:border-cyan-500/30 hover:bg-cyan-950/10"
                  }`}
                >
                  {/* Indicador de selección */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className={`w-4 h-4 shrink-0 ${isSelected ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-400"} transition-colors`} />
                      <span className={`text-sm font-black tracking-wider ${isSelected ? "text-cyan-400" : "text-slate-300 group-hover:text-slate-100"} transition-colors`}>
                        {pais.nombre.toUpperCase()}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-700 group-hover:text-slate-500"} transition-colors`} />
                  </div>

                  <div className="mt-2 text-[9px] text-slate-500 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {pais.poblacion}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {pais.economia}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* DERECHA — Panel de análisis */}
        <div className="w-2/3 flex flex-col p-6 min-h-0 overflow-y-auto">
          {!selected ? (
            // Estado vacío
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
              <Crosshair className="w-20 h-20 text-slate-700 mb-6 animate-pulse" strokeWidth={1} />
              <p className="text-sm text-slate-500 tracking-[0.2em]">SELECCIONE UN NODO EN EL PANEL IZQUIERDO</p>
              <p className="text-[9px] text-slate-600 mt-2">ESPERANDO DESIGNACIÓN DE OBJETIVO...</p>
            </div>
          ) : (
            // Análisis del país seleccionado
            <div className="flex flex-col flex-1 min-h-0">
              {/* Título del análisis */}
              <div className="shrink-0 border-b border-cyan-900/30 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <Crosshair className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-black text-slate-100 tracking-[0.15em]">
                    ANÁLISIS DE OBJETIVO — {selected.nombre.toUpperCase()}
                  </h2>
                </div>
                <p className="text-[9px] text-cyan-500/60 mt-1 ml-8 normal-case tracking-wider">
                  ESCANEO GEOPOLÍTICO COMPLETO // DATOS VERIFICADOS POR SATÉLITE
                </p>
              </div>

              {/* Grid de stats */}
              <div className="shrink-0 grid grid-cols-2 gap-4 mb-6">
                <div className="border border-slate-800/60 bg-slate-950/40 p-4">
                  <div className="text-[8px] text-slate-500 mb-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    POBLACIÓN REGISTRADA
                  </div>
                  <div className="text-xl font-black text-slate-100 tracking-wider">{selected.poblacion}</div>
                </div>
                <div className="border border-slate-800/60 bg-slate-950/40 p-4">
                  <div className="text-[8px] text-slate-500 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" />
                    PIB CORPORATIVO
                  </div>
                  <div className="text-xl font-black text-emerald-400 tracking-wider">{selected.economia}</div>
                </div>
                <div className="col-span-2 border border-slate-800/60 bg-slate-950/40 p-4">
                  <div className="text-[8px] text-slate-500 mb-1 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-500" />
                    VENTAJA TÁCTICA DOMINANTE
                  </div>
                  <div className="text-sm font-black text-amber-400 tracking-wider">{selected.ventaja.toUpperCase()}</div>
                </div>
              </div>

              {/* Barras de progreso */}
              <div className="shrink-0 border border-slate-800/60 bg-slate-950/40 p-5 mb-6">
                <div className="text-[9px] text-slate-500 mb-4 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" />
                  ÍNDICES DE CAPACIDAD ESTRATÉGICA
                </div>
                <div className="flex flex-col gap-3">
                  {([
                    { label: "POTENCIAL MILITAR", value: selected.stats.militar, color: "bg-rose-500" },
                    { label: "CAPACIDAD ECONÓMICA", value: selected.stats.economia, color: "bg-emerald-500" },
                    { label: "NIVEL TECNOLÓGICO", value: selected.stats.tecnologia, color: "bg-cyan-500" },
                    { label: "INFLUENCIA GLOBAL", value: selected.stats.influencia, color: "bg-amber-500" },
                  ]).map((stat) => (
                    <div key={stat.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-slate-400">{stat.label}</span>
                        <span className="text-[9px] text-slate-300 font-bold">{stat.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800/80 overflow-hidden">
                        <div
                          className={`h-full ${stat.color} transition-all duration-700`}
                          style={{ width: `${stat.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Briefing */}
              <div className="shrink-0 border border-slate-800/60 bg-slate-950/40 p-5 mb-6">
                <div className="text-[9px] text-slate-500 mb-2">BRIEFING DE INTELIGENCIA</div>
                <p className="text-[11px] text-slate-400 leading-relaxed normal-case tracking-normal">
                  {selected.descripcion}
                </p>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Botón de acción */}
              <div className="shrink-0 flex items-center justify-between pt-4 border-t border-slate-800/40">
                <button
                  onClick={onCancel}
                  className="text-[10px] font-bold text-slate-500 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-900/50 py-2.5 px-5 bg-slate-950/50"
                >
                  [ ABORTAR MISIÓN ]
                </button>

                <button
                  onClick={() => onDeploy({ id: selected.id, nombre: selected.nombre })}
                  className="group relative overflow-hidden border border-cyan-500/50 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-400 py-3 px-8 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]"
                >
                  <div className="absolute inset-0 w-full h-full bg-cyan-400/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                  <span className="relative flex items-center gap-3 text-sm font-black tracking-[0.15em]">
                    <Shield className="w-4 h-4" />
                    [ AUTORIZAR DESPLIEGUE ]
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
