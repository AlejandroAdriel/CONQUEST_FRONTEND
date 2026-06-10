import { useState, useEffect, useMemo } from "react";
import {
  Globe, Shield, Users, DollarSign, Swords, Crosshair,
  ChevronRight, X, Hexagon, MapPin, Zap, Search
} from "lucide-react";
import { fetchCountryStats, translateCountry, getRealEconomy, getRealEjercitoDetalle } from "../database/mockAPI";

interface CountryData {
  id: string;
  nombre: string;
  poblacion: number;
  economia: number;
  ejercito: number;
}

interface SelectHQProps {
  onDeploy: (pais: { id: string; nombre: string }) => void;
  onCancel: () => void;
}

// Genera stats derivados para el panel de análisis
const computeStats = (country: CountryData, maxPop: number, maxEco: number) => {
  const militar = Math.min(100, Math.max(5, Math.round((country.ejercito / 200000) * 100)));
  const economia = Math.min(100, Math.max(5, Math.round((country.economia / maxEco) * 100)));
  const tecnologia = Math.min(100, Math.max(5, Math.round((country.economia / country.poblacion) * 1200)));
  const influencia = Math.min(100, Math.max(5, Math.round((country.poblacion / maxPop) * 100)));
  return { militar, economia, tecnologia, influencia };
};

const getVentaja = (stats: { militar: number; economia: number; tecnologia: number; influencia: number }): string => {
  const max = Math.max(stats.militar, stats.economia, stats.tecnologia, stats.influencia);
  if (max === stats.militar) return "Doctrina Militar Dominante";
  if (max === stats.tecnologia) return "Supremacía Tecnológica";
  if (max === stats.economia) return "Potencia Económica Industrial";
  return "Influencia Geopolítica Expansiva";
};

const formatPopulation = (n: number): string => n.toLocaleString("es-ES");
const formatEconomy = (n: number): string => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}T`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}B`;
  return `$${Math.floor(n).toLocaleString("es-ES")}M`;
};

export default function SelectHQ({ onDeploy, onCancel }: SelectHQProps) {
  const [selected, setSelected] = useState<CountryData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allCountries, setAllCountries] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const populations = await fetchCountryStats();
        const countries: CountryData[] = Object.entries(populations).map(([name, pop]) => {
          const seed = name.charCodeAt(0) + (name.length > 1 ? name.charCodeAt(1) : 0);

          // Economía unificada de base de datos
          const economia = getRealEconomy(name, pop, seed);

          // Ejército unificado de base de datos
          const detalleEjercito = getRealEjercitoDetalle(false, pop, seed, name);
          const ejercito = detalleEjercito.infanteria + detalleEjercito.caballeria + detalleEjercito.artilleria;

          return {
            id: name,
            nombre: translateCountry(name),
            poblacion: pop,
            economia,
            ejercito
          };
        });

        countries.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        setAllCountries(countries);
      } finally {
        setIsLoading(false);
      }
    };
    loadCountries();
  }, []);

  const filteredCountries = useMemo(() =>
    allCountries.filter(c => c.nombre.toLowerCase().includes(searchQuery.toLowerCase())),
    [allCountries, searchQuery]
  );

  const maxPop = useMemo(() => Math.max(...allCountries.map(c => c.poblacion), 1), [allCountries]);
  const maxEco = useMemo(() => Math.max(...allCountries.map(c => c.economia), 1), [allCountries]);

  const selectedStats = selected ? computeStats(selected, maxPop, maxEco) : null;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#030712] font-mono text-slate-300 uppercase tracking-widest select-none overflow-hidden">

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
      <div className="relative z-10 flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

        {/* IZQUIERDA — Lista de países con buscador */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800/60 flex flex-col min-h-0 flex-1 md:flex-none">

          {/* Buscador pegajoso */}
          <div className="shrink-0 p-4 pb-2 border-b border-slate-800/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="[ BUSCAR OBJETIVO... ]"
                className="w-full bg-slate-900/50 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-none pl-10 pr-4 py-2.5 text-xs text-cyan-100 uppercase tracking-wider placeholder:text-slate-600 focus:outline-none transition-all"
              />
            </div>
            <div className="text-[9px] text-slate-500 mt-2 px-1 flex items-center gap-2">
              <Globe className="w-3 h-3" />
              {isLoading ? "CARGANDO NODOS..." : `${filteredCountries.length} DE ${allCountries.length} NODOS`}
            </div>
          </div>

          {/* Lista scrolleable */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 pt-2 pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full opacity-40">
                <Hexagon className="w-10 h-10 text-cyan-500/40 animate-[spin_3s_linear_infinite] mb-3" strokeWidth={1.5} />
                <p className="text-[10px] text-slate-500 tracking-wider">ESCANEANDO BASE DE DATOS...</p>
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-40">
                <Search className="w-8 h-8 text-slate-700 mb-3" />
                <p className="text-[10px] text-slate-500 tracking-wider text-center leading-relaxed">
                  [ NINGÚN REGISTRO ENCONTRADO EN LA BASE DE DATOS ]
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredCountries.map((pais) => {
                  const isSelected = selected?.id === pais.id;
                  return (
                    <button
                      key={pais.id}
                      onClick={() => setSelected(pais)}
                      className={`shrink-0 group relative text-left p-3 border transition-all duration-200 ${
                        isSelected
                          ? "border-cyan-500/60 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "border-slate-800/40 bg-slate-950/20 hover:border-cyan-500/30 hover:bg-cyan-950/10"
                      }`}
                    >
                      {/* Indicador de selección */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Shield className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-400"} transition-colors`} />
                          <span className={`text-[11px] font-black tracking-wider ${isSelected ? "text-cyan-400" : "text-slate-300 group-hover:text-slate-100"} transition-colors`}>
                            {pais.nombre.toUpperCase()}
                          </span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400" : "text-slate-700 group-hover:text-slate-500"} transition-colors`} />
                      </div>

                      <div className="mt-1.5 text-[8px] text-slate-500 flex items-center gap-3 ml-6">
                        <span className="flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          {formatPopulation(pais.poblacion)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-2.5 h-2.5" />
                          {formatEconomy(pais.economia)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* DERECHA — Panel de análisis */}
        <div className="w-full md:w-2/3 flex flex-col p-4 md:p-6 min-h-0 overflow-y-auto flex-1">
          {!selected || !selectedStats ? (
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
              <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="border border-slate-800/60 bg-slate-950/40 p-4">
                  <div className="text-[8px] text-slate-500 mb-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    POBLACIÓN REGISTRADA
                  </div>
                  <div className="text-xl font-black text-slate-100 tracking-wider">{formatPopulation(selected.poblacion)}</div>
                </div>
                <div className="border border-slate-800/60 bg-slate-950/40 p-4">
                  <div className="text-[8px] text-slate-500 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" />
                    PIB CORPORATIVO
                  </div>
                  <div className="text-xl font-black text-emerald-400 tracking-wider">{formatEconomy(selected.economia)}</div>
                </div>
                <div className="border border-slate-800/60 bg-slate-950/40 p-4">
                  <div className="text-[8px] text-slate-500 mb-1 flex items-center gap-1.5">
                    <Swords className="w-3 h-3" />
                    FUERZAS MILITARES ESTIMADAS
                  </div>
                  <div className="text-xl font-black text-rose-400 tracking-wider">{formatPopulation(selected.ejercito)}</div>
                </div>
                <div className="border border-slate-800/60 bg-slate-950/40 p-4">
                  <div className="text-[8px] text-slate-500 mb-1 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-500" />
                    VENTAJA TÁCTICA DOMINANTE
                  </div>
                  <div className="text-sm font-black text-amber-400 tracking-wider">{getVentaja(selectedStats).toUpperCase()}</div>
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
                    { label: "POTENCIAL MILITAR", value: selectedStats.militar, color: "bg-rose-500" },
                    { label: "CAPACIDAD ECONÓMICA", value: selectedStats.economia, color: "bg-emerald-500" },
                    { label: "NIVEL TECNOLÓGICO", value: selectedStats.tecnologia, color: "bg-cyan-500" },
                    { label: "INFLUENCIA GLOBAL", value: selectedStats.influencia, color: "bg-amber-500" },
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

              {/* Spacer */}
              <div className="flex-1" />

              {/* Botón de acción */}
              <div className="shrink-0 flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between pt-4 border-t border-slate-800/40">
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
