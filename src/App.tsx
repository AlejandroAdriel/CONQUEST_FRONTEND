import { useState, useEffect } from "react";

type Pais = {
  id: string;
  nombre: string;
  economia: number;
  poblacion: number;
  ejercito_ia: number;
  conquistado: boolean;
  coordenadas_svg: string;
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
  x?: number; // Para el árbol
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
  mensaje: string;
  tipo: "success" | "alert" | "info";
};

// Datos iniciales mockeados
const initialPaises: Pais[] = [
  { id: "NA", nombre: "Norteamérica", economia: 1000, poblacion: 500, ejercito_ia: 1500, conquistado: true, coordenadas_svg: "M 100 50 L 300 50 L 250 200 L 80 180 Z" },
  { id: "SA", nombre: "Sudamérica", economia: 600, poblacion: 400, ejercito_ia: 800, conquistado: false, coordenadas_svg: "M 180 200 L 280 200 L 250 450 L 150 400 Z" },
  { id: "EU", nombre: "Europa", economia: 1200, poblacion: 600, ejercito_ia: 1800, conquistado: false, coordenadas_svg: "M 350 40 L 450 40 L 420 150 L 320 120 Z" },
  { id: "AF", nombre: "África", economia: 500, poblacion: 700, ejercito_ia: 1200, conquistado: false, coordenadas_svg: "M 330 160 L 430 160 L 480 350 L 360 400 L 300 300 Z" },
  { id: "AS", nombre: "Asia", economia: 1500, poblacion: 1000, ejercito_ia: 2500, conquistado: false, coordenadas_svg: "M 460 30 L 750 50 L 700 250 L 460 170 Z" },
  { id: "OC", nombre: "Oceanía", economia: 400, poblacion: 200, ejercito_ia: 500, conquistado: false, coordenadas_svg: "M 650 300 L 780 320 L 750 450 L 600 420 Z" }
];

const initialHabilidades: Habilidad[] = [
  { id: "H1", nombre: "Tácticas de Infantería", costo: 500, desbloqueada: false, prerrequisito_id: null, tipo_bono: "+10% Defensa Infantería", x: 100, y: 100 },
  { id: "H2", nombre: "Caballería Pesada", costo: 800, desbloqueada: false, prerrequisito_id: "H1", tipo_bono: "+15% Ataque Caballería", x: 250, y: 50 },
  { id: "H3", nombre: "Artillería de Asedio", costo: 1200, desbloqueada: false, prerrequisito_id: "H1", tipo_bono: "+20% Daño Artillería", x: 250, y: 150 },
  { id: "H4", nombre: "Logística Avanzada", costo: 2000, desbloqueada: false, prerrequisito_id: "H2", tipo_bono: "+50% Velocidad de Movimiento", x: 450, y: 100 }
];

const eventosAleatorios = [
  { mensaje: "Tormenta de Arena en Medio Oriente: -500 Oro", tipo: "alert", efecto: (oro: number, tropas: Tropas) => ({ oro: Math.max(0, oro - 500), tropas }) },
  { mensaje: "Discurso Inspirador: +200 Infantería", tipo: "success", efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, infanteria: tropas.infanteria + 200 } }) },
  { mensaje: "Descubrimiento de Minas de Oro: +1000 Oro", tipo: "success", efecto: (oro: number, tropas: Tropas) => ({ oro: oro + 1000, tropas }) },
  { mensaje: "Deserción Menor: -100 Caballería", tipo: "alert", efecto: (oro: number, tropas: Tropas) => ({ oro, tropas: { ...tropas, caballeria: Math.max(0, tropas.caballeria - 100) } }) },
  { mensaje: "Tregua Temporal: Sin cambios", tipo: "info", efecto: (oro: number, tropas: Tropas) => ({ oro, tropas }) }
];

export default function App() {
  const [fechaVirtual, setFechaVirtual] = useState(new Date(2026, 4, 28)); // 28 de Mayo de 2026
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);

  const [paises, setPaises] = useState<Pais[]>(initialPaises);
  const [tropas, setTropas] = useState<Tropas>({ infanteria: 5000, caballeria: 2000, artilleria: 500 });
  const [presupuesto, setPresupuesto] = useState(5000);
  const [habilidades, setHabilidades] = useState<Habilidad[]>(initialHabilidades);
  const [ataquesEnCola, setAtaquesEnCola] = useState<AtaqueEnCola[]>([]);
  const [diarioGuerra, setDiarioGuerra] = useState<Evento[]>([
    { id: "inicio", fecha: new Date(2026, 4, 28), mensaje: "La Gran Guerra comienza.", tipo: "info" }
  ]);

  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [tropasAEnviar, setTropasAEnviar] = useState(0);
  const [mostrarArbol, setMostrarArbol] = useState(false);
  const [, setDiasParaEvento] = useState(10 + Math.floor(Math.random() * 6));
  // Loop principal del tiempo
  useEffect(() => {
    if (!isPlaying) return;
    
    const intervalTime = isFastForward ? 500 : 2000;
    
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
        // Ejecutar evento
        const eventoAzar = eventosAleatorios[Math.floor(Math.random() * eventosAleatorios.length)];
        const nuevoEstado = eventoAzar.efecto(presupuesto, tropas);
        setPresupuesto(nuevoEstado.oro);
        setTropas(nuevoEstado.tropas);
        
        setDiarioGuerra(prevDiario => [{
          id: Math.random().toString(),
          fecha: fechaVirtual,
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
        // Si la fecha coincide (o ya pasó)
        if (fechaVirtual >= ataque.fecha_impacto) {
          const paisDestino = paises.find(p => p.id === ataque.pais_destino_id);
          if (!paisDestino) return;

          // Fórmula de combate muy básica (bajas aleatorias)
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
            mensaje: victoria 
              ? `Victoria en ${paisDestino.nombre}! Enemigo aniquilado. Bajas: ${bajasJugador}. Sobreviven: ${fuerzaJugador} tropas que vuelven a reserva.`
              : `Derrota en ${paisDestino.nombre}. Nuestras fuerzas fueron destruidas.`,
            tipo: victoria ? "success" : "alert"
          }, ...prevDiario]);

          if (victoria) {
            setPaises(p => p.map(pa => pa.id === paisDestino.id ? { ...pa, conquistado: true, ejercito_ia: 0 } : pa));
            setTropas(t => ({ ...t, infanteria: t.infanteria + Math.floor(fuerzaJugador) })); // Devolvemos sobrevivientes (asumimos todo infantería por simplificar el prototype)
          }

        } else {
          ataquesPendientes.push(ataque);
        }
      });
      return ataquesPendientes;
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaVirtual]); // Solo depende de fechaVirtual para ejecutar 1 vez por día

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
      mensaje: `Invasión hacia ${paisSeleccionado.nombre} en progreso... Llegada estimada: ${fechaImpacto.toLocaleDateString()}`,
      tipo: "info"
    }, ...prev]);

    setPaisSeleccionado(null);
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
      mensaje: `Habilidad desbloqueada: ${habilidad.nombre}`,
      tipo: "success"
    }, ...prev]);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200 font-sans overflow-hidden select-none">
      {/* TOPBAR */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 z-10 backdrop-blur-sm">
        <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 drop-shadow-md">
          CONQUEST
        </h1>
        <div className="flex items-center gap-6">
          <div className="bg-slate-800/80 px-4 py-2 rounded font-mono text-lg border border-slate-700">
            {fechaVirtual.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700">
            <button 
              onClick={() => { setIsPlaying(false); setIsFastForward(false); }}
              className={`p-2 rounded hover:bg-slate-700 transition ${!isPlaying ? 'text-blue-400' : 'text-slate-400'}`}
              title="Pausa"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </button>
            <button 
              onClick={() => { setIsPlaying(true); setIsFastForward(false); }}
              className={`p-2 rounded hover:bg-slate-700 transition ${isPlaying && !isFastForward ? 'text-blue-400' : 'text-slate-400'}`}
              title="Play"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            </button>
            <button 
              onClick={() => { setIsPlaying(true); setIsFastForward(true); }}
              className={`p-2 rounded hover:bg-slate-700 transition ${isPlaying && isFastForward ? 'text-blue-400' : 'text-slate-400'}`}
              title="Acelerado"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3.204 5.324a1 1 0 011.414-.02l3.414 3.414-3.414 3.414a1 1 0 01-1.414-1.414L5.09 9.204H2a1 1 0 110-2h3.09L3.184 5.324zM10.204 5.324a1 1 0 011.414-.02l3.414 3.414-3.414 3.414a1 1 0 01-1.414-1.414L12.09 9.204H9a1 1 0 110-2h3.09l-1.906-1.88a1 1 0 01.02-1.414z" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL IZQUIERDO: Diario de Guerra */}
        <div className="w-1/2 border-r border-slate-800 bg-slate-900/30 flex flex-col relative">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 backdrop-blur-sm z-10 shadow-sm">
            <h2 className="text-xl font-bold text-slate-300 tracking-wide uppercase text-sm">Diario de Guerra</h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 pb-8 custom-scrollbar">
            {diarioGuerra.map(ev => (
              <div 
                key={ev.id} 
                className={`p-3 rounded-lg border-l-4 shadow-sm backdrop-blur-md ${
                  ev.tipo === 'success' ? 'bg-emerald-900/20 border-emerald-500 text-emerald-200' : 
                  ev.tipo === 'alert' ? 'bg-rose-900/20 border-rose-500 text-rose-200' : 
                  'bg-blue-900/20 border-blue-500 text-blue-200'
                }`}
              >
                <div className="text-xs opacity-70 mb-1 font-mono">
                  [{ev.fecha.toLocaleDateString('es-ES')}]
                </div>
                <div className="font-medium text-sm">
                  {ev.mensaje}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
        </div>

        {/* PANEL DERECHO: Mapa Vectorial SVG */}
        <div className="w-1/2 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-6 flex items-center justify-center">
          
          <svg viewBox="0 0 800 500" className="w-full h-full drop-shadow-2xl">
            {/* Grid de fondo estilo táctico */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.2)" strokeWidth="1"/>
            </pattern>
            <rect width="800" height="500" fill="url(#grid)" />
            
            {paises.map(pais => {
              const isSelected = paisSeleccionado?.id === pais.id;
              const isAttacked = ataquesEnCola.some(a => a.pais_destino_id === pais.id);
              
              return (
                <g key={pais.id} onClick={() => setPaisSeleccionado(pais)} className="cursor-pointer group">
                  <path 
                    d={pais.coordenadas_svg} 
                    className={`
                      transition-all duration-300
                      ${pais.conquistado ? 'fill-blue-900/40 stroke-blue-500 group-hover:fill-blue-800/60 group-hover:stroke-blue-400' : 'fill-rose-950/40 stroke-rose-800 group-hover:fill-rose-900/60 group-hover:stroke-rose-600'}
                      ${isSelected ? 'stroke-[3px] filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'stroke-2'}
                    `}
                    style={{
                      strokeDasharray: isAttacked ? "8, 4" : "none",
                      animation: isAttacked ? "dash 1s linear infinite" : "none"
                    }}
                  />
                  {/* Animación de ataque si aplica */}
                  {isAttacked && (
                    <circle cx="50%" cy="50%" r="5" fill="red" className="animate-ping" />
                    // Nota: para centrar el ping correctamente necesitaríamos parsear el SVG, aquí simplificamos.
                  )}
                </g>
              );
            })}
          </svg>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes dash {
              to {
                stroke-dashoffset: -24;
              }
            }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
          `}} />

          {/* ATAQUES EN CAMINO OVERLAY (Visual Indicators) */}
          <div className="absolute top-4 right-4 pointer-events-none flex flex-col gap-2">
            {ataquesEnCola.map(atk => (
              <div key={atk.id} className="bg-slate-900/80 border border-amber-600/50 text-amber-500 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md animate-pulse shadow-[0_0_10px_rgba(217,119,6,0.2)]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Atacando a {paises.find(p => p.id === atk.pais_destino_id)?.nombre}... ({Math.ceil((atk.fecha_impacto.getTime() - fechaVirtual.getTime()) / (1000 * 3600 * 24))}d)
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* PANEL LATERAL FLOTANTE (Drawer/Card) */}
      {paisSeleccionado && (
        <div className="absolute right-4 top-20 w-80 bg-slate-900/95 border border-slate-700 shadow-2xl rounded-xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-right-8 z-20">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
            <h3 className="font-bold text-lg text-slate-100">{paisSeleccionado.nombre}</h3>
            <button onClick={() => setPaisSeleccionado(null)} className="text-slate-500 hover:text-slate-300 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Población</div>
                <div className="font-mono">{paisSeleccionado.poblacion.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Economía</div>
                <div className="font-mono text-emerald-400">${paisSeleccionado.economia.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 col-span-2">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Estatus</div>
                <div className={`font-bold ${paisSeleccionado.conquistado ? 'text-blue-400' : 'text-rose-500'}`}>
                  {paisSeleccionado.conquistado ? 'Territorio Aliado' : 'Controlado por IA'}
                </div>
              </div>
              {!paisSeleccionado.conquistado && (
                <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 col-span-2 flex justify-between items-center">
                  <div className="text-slate-400 text-xs uppercase tracking-wider">Fuerza Militar (IA)</div>
                  <div className="font-mono text-rose-400 font-bold">{paisSeleccionado.ejercito_ia.toLocaleString()}</div>
                </div>
              )}
            </div>

            {!paisSeleccionado.conquistado && (
              <div className="pt-4 border-t border-slate-800">
                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Tropas a enviar (Infantería)</label>
                <input 
                  type="number" 
                  min="0" 
                  max={tropas.infanteria}
                  value={tropasAEnviar}
                  onChange={(e) => setTropasAEnviar(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono mb-4 transition"
                  placeholder="Ej. 1000"
                />
                <button 
                  onClick={handleDeclararGuerra}
                  disabled={tropasAEnviar <= 0 || tropasAEnviar > tropas.infanteria}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded transition shadow-lg shadow-rose-900/20 uppercase tracking-widest text-sm"
                >
                  Declarar Guerra (5 días)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOMBAR */}
      <footer className="h-20 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 z-10 backdrop-blur-sm">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Presupuesto</span>
            <span className="text-xl font-mono text-emerald-400 font-bold">${presupuesto.toLocaleString()}</span>
          </div>
          <div className="h-full w-px bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Reservas Militares</span>
            <div className="flex gap-4 font-mono text-sm">
              <div className="flex items-center gap-1.5" title="Infantería">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>{tropas.infanteria.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Caballería">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>{tropas.caballeria.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Artillería">
                <span className="w-2 h-2 rounded-full bg-rose-700"></span>
                <span>{tropas.artilleria.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setMostrarArbol(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded shadow-lg shadow-indigo-900/20 font-bold uppercase tracking-wider text-sm transition"
        >
          Árbol Tecnológico
        </button>
      </footer>

      {/* MODAL ÁRBOL DE HABILIDADES */}
      {mostrarArbol && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col backdrop-blur-md p-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Centro de Investigación</h2>
              <p className="text-slate-400 mt-1">Presupuesto Disponible: <span className="text-emerald-400 font-mono">${presupuesto.toLocaleString()}</span></p>
            </div>
            <button 
              onClick={() => setMostrarArbol(false)}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 relative border border-slate-800 rounded-xl bg-slate-900/50 overflow-auto overflow-hidden">
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
                    stroke={hab.desbloqueada ? "#4f46e5" : "#334155"} 
                    strokeWidth="3"
                    strokeDasharray={hab.desbloqueada ? "none" : "5,5"}
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
                    className={`absolute p-4 w-48 rounded-lg border-2 shadow-xl backdrop-blur-sm transition-all ${
                      hab.desbloqueada 
                        ? 'bg-indigo-900/40 border-indigo-500 shadow-indigo-900/20' 
                        : canUnlock 
                          ? 'bg-slate-800/80 border-slate-500 hover:border-slate-400 hover:bg-slate-700 cursor-pointer'
                          : 'bg-slate-900/50 border-slate-800 opacity-60'
                    }`}
                    style={{ left: hab.x, top: hab.y }}
                    onClick={() => canUnlock && handleDesbloquearHabilidad(hab)}
                  >
                    <div className="font-bold text-sm mb-1">{hab.nombre}</div>
                    <div className="text-xs text-indigo-300 mb-3">{hab.tipo_bono}</div>
                    <div className="flex justify-between items-center text-xs">
                      {hab.desbloqueada ? (
                        <span className="text-emerald-400 font-bold">Investigado</span>
                      ) : (
                        <>
                          <span className="text-slate-400 font-mono">${hab.costo}</span>
                          {canUnlock ? <span className="text-blue-400">Investigar</span> : <span className="text-slate-500">Bloqueado</span>}
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
