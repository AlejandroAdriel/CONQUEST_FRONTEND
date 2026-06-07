import { useState, useEffect } from "react";
import { 
  Terminal, ShieldAlert, ShieldCheck, Play, Key, Database, Cpu, Wifi, Activity, User
} from "lucide-react";
import type { OperarioUser } from '../database/mockAPI';

interface StartMenuProps {
  onStartGame: () => void;
  onOpenLogin: () => void;
  onOpenSaves: () => void;
  onOpenProfile: () => void;
  currentUser: OperarioUser | null;
}

export default function StartMenu({ onStartGame, onOpenLogin, onOpenSaves, onOpenProfile, currentUser }: StartMenuProps) {
  const isLoggedIn = !!currentUser;
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | null>(null);
  const [isStartHovered, setIsStartHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = e.clientX - window.innerWidth / 2;
    const y = e.clientY - window.innerHeight / 2;
    setMousePos({ x, y });
  };

  const handleLoadSaves = () => {
    if (isLoggedIn) {
      onOpenSaves();
    } else {
      setAlertMessage("ACCESO DENEGADO: Inicia sesión en la red central para recuperar o guardar simulaciones tácticas.");
      setAlertType("error");
    }
  };

  useEffect(() => {
    if (alertMessage) {
      const t = setTimeout(() => {
        setAlertMessage("");
        setAlertType(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [alertMessage]);

  return (
    <div 
      className="relative h-[100dvh] w-full bg-[#030712] overflow-hidden font-mono flex flex-col justify-between p-4 md:p-8 select-none text-slate-300"
      onMouseMove={handleMouseMove}
    >
      {/* CAPA 1: Fondo lejano (Cuadrícula táctica) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 transition-transform duration-300 ease-out"
        style={{ 
          backgroundImage: "linear-gradient(to right, rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          transform: `translate(${mousePos.x * 0.015}px, ${mousePos.y * 0.015}px)`
        }}
      />

      {/* CAPA 2: Capa intermedia (Radar militar y hexágonos desenfocados) */}
      <div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 transition-transform duration-300 ease-out"
        style={{ 
          transform: `translate(${mousePos.x * -0.03}px, ${mousePos.y * -0.03}px)`
        }}
      >
        <div className="w-[600px] h-[600px] border border-cyan-500/10 rounded-full flex items-center justify-center animate-[spin_80s_linear_infinite] relative">
          <div className="w-[580px] h-[580px] border border-dashed border-cyan-500/5 rounded-full" />
          <div className="w-[400px] h-[400px] border border-cyan-500/10 rounded-full" />
          <div className="w-[200px] h-[200px] border border-cyan-500/20 rounded-full" />
          <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-b from-cyan-500/20 to-transparent origin-bottom" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-cyan-500/10 rounded-lg blur-[2px] rotate-12" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 border border-rose-500/5 rounded-lg blur-[3px] -rotate-12" />
      </div>

      {/* CAPA 3: Capa de frente (Elementos y marcas HUD flotando más rápido) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 transition-transform duration-300 ease-out"
        style={{ 
          transform: `translate(${mousePos.x * -0.06}px, ${mousePos.y * -0.06}px)`
        }}
      >
        <div className="absolute top-16 left-16 w-6 h-6 border-t-2 border-l-2 border-cyan-500/30" />
        <div className="absolute top-16 right-16 w-6 h-6 border-t-2 border-r-2 border-cyan-500/30" />
        <div className="absolute bottom-16 left-16 w-6 h-6 border-b-2 border-l-2 border-cyan-500/30" />
        <div className="absolute bottom-16 right-16 w-6 h-6 border-b-2 border-r-2 border-cyan-500/30" />
        
        <div className="absolute top-[12%] right-[25%] text-[9px] text-cyan-500/30 tracking-[0.2em]">SAT_LINK: ONLINE</div>
        <div className="absolute bottom-[20%] left-[20%] text-[9px] text-rose-500/20 tracking-[0.2em]">CORE_SYSTEM_SECURE: ACTIVE</div>
      </div>

      {/* BARRA SUPERIOR (HEADER HUD) */}
      <header className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 border-b border-slate-800/80 pb-4 backdrop-blur-sm bg-slate-950/10 shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-sm font-black tracking-[0.3em] text-slate-100">CONQUEST // NET.TERMINAL</h1>
            <p className="text-[9px] text-cyan-400/60 uppercase tracking-widest mt-0.5">SATELLITE INTELLIGENCE NETWORK</p>
          </div>
        </div>

          <div className="flex items-center gap-6 text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-500/80 animate-pulse" />
            <span>NUCLEO: 98.4%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-cyan-500/80" />
            <span>LATENCIA: 12ms</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-500/80" />
            <span className={`font-bold uppercase ${isLoggedIn ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isLoggedIn ? currentUser?.username ?? 'CONECTADO' : 'INVITADO'}
            </span>
          </div>
        </div>
      </header>

      {/* NOTIFICACIONES Y ALERTAS TIPO HUD */}
      {alertMessage && (
        <div className={`absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 border backdrop-blur-md rounded-sm shadow-2xl flex items-center gap-4 transition-all duration-300 max-w-md w-[90%] border-l-4 ${
          alertType === "success" 
            ? "border-cyan-500/80 bg-slate-950/90 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] border-l-cyan-400" 
            : "border-rose-500/80 bg-slate-950/90 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)] border-l-rose-500"
        }`}>
          {alertType === "success" ? <ShieldCheck className="w-8 h-8 shrink-0 text-cyan-400" /> : <ShieldAlert className="w-8 h-8 shrink-0 text-rose-500 animate-pulse" />}
          <div className="flex-1 font-mono text-[10px] uppercase tracking-widest leading-relaxed">
            <span className="font-bold block mb-1 text-slate-100">{alertType === "success" ? "NOTIFICACIÓN DEL SISTEMA" : "ALERTA DE SEGURIDAD"}</span>
            {alertMessage}
          </div>
          <button 
            onClick={() => { setAlertMessage(""); setAlertType(null); }} 
            className="text-slate-500 hover:text-white transition-all text-xs font-bold px-2 py-1 bg-slate-900 border border-slate-800 rounded-sm"
          >
            CERRAR
          </button>
        </div>
      )}

      {/* ÁREA CENTRAL: BOTÓN PRINCIPAL START */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <div className="text-[10px] text-cyan-500/80 tracking-[0.4em] uppercase mb-2 animate-pulse">SISTEMA GEOESTRATÉGICO DE COMBATE</div>
          <h2 className="text-5xl font-black tracking-[0.3em] text-slate-100 drop-shadow-[0_0_25px_rgba(6,182,212,0.2)]">CONQUEST</h2>
        </div>

        <button 
          onClick={onStartGame}
          onMouseEnter={() => setIsStartHovered(true)}
          onMouseLeave={() => setIsStartHovered(false)}
          className="group relative flex items-center justify-center gap-6 px-12 py-6 bg-slate-950/80 hover:bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 rounded-sm transition-all duration-300 transform hover:scale-105 active:scale-98 shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(6,182,212,0.25)] min-w-[340px]"
        >
          {/* Corchetes cibernéticos dinámicos */}
          <span className={`text-2xl font-bold transition-all duration-300 ${
            isStartHovered ? "translate-x-2 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "-translate-x-1 text-slate-600"
          }`}>
            [
          </span>
          
          <span className="flex items-center gap-3 text-sm font-black tracking-[0.4em] text-slate-200 group-hover:text-white uppercase transition-colors">
            <Play className="w-4 h-4 text-cyan-400 group-hover:animate-ping" fill="currentColor" />
            INICIAR SIMULACIÓN
          </span>

          <span className={`text-2xl font-bold transition-all duration-300 ${
            isStartHovered ? "-translate-x-2 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "translate-x-1 text-slate-600"
          }`}>
            ]
          </span>

          {/* Adornos HUD del botón */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400/50 group-hover:border-cyan-400" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400/50 group-hover:border-cyan-400" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400/50 group-hover:border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400/50 group-hover:border-cyan-400" />
        </button>

        <div className="mt-8 flex items-center gap-3 text-[10px] text-slate-500 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>TEATRO DE OPERACIONES GLOBAL ACTUALIZADO (v2.7.4)</span>
        </div>
      </main>

      {/* BARRA INFERIOR (CONTROLES ADICIONALES) */}
      <footer className="relative z-10 w-full flex flex-col md:flex-row gap-4 md:gap-0 items-center justify-between border-t border-slate-800/80 pt-4 backdrop-blur-sm bg-slate-950/10 shrink-0">
        <button 
          onClick={handleLoadSaves}
          className="group flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 hover:text-cyan-400 transition-colors py-2 px-4 border border-transparent hover:border-slate-800 rounded-sm bg-slate-950/20"
        >
          <Database className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          [ ARCHIVOS DE GUARDADO ]
        </button>

        <div className="text-[9px] text-slate-600 tracking-widest uppercase">
          CLASIFICADO // SOLO PARA PERSONAL AUTORIZADO
        </div>

        <button 
          onClick={isLoggedIn ? onOpenProfile : onOpenLogin}
          className={`group flex items-center gap-2 text-xs font-bold tracking-widest transition-all py-2 px-4 border rounded-sm ${
            isLoggedIn 
              ? "text-emerald-400 border-emerald-500/20 bg-emerald-950/10 hover:bg-emerald-900/20 hover:border-emerald-400/40" 
              : "text-slate-400 hover:text-cyan-400 border-transparent hover:border-slate-800 bg-slate-950/20"
          }`}
        >
          {isLoggedIn 
            ? <><User className="w-4 h-4 text-emerald-400" />[ {currentUser?.username ?? 'OPERARIO'} ]</>
            : <><Key className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />[ ACCESO DE OPERARIO ]</>
          }
        </button>
      </footer>
    </div>
  );
}
