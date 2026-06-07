import React from 'react';
import {
  Hexagon, Globe, Mail, Terminal, Shield, ShieldCheck,
  Calendar, LogOut, X, Cpu, Activity, Users, DollarSign
} from 'lucide-react';
import type { OperarioUser } from '../database/mockAPI';

interface UserProfileProps {
  user: OperarioUser;
  onClose: () => void;
  onLogout: () => void;
  // Estadísticas de la partida actual (opcionales — solo si está en juego)
  gameStats?: {
    paisesConquistados: number;
    totalPaises: number;
    presupuesto: number;
    tropas: number;
    diasCampana: number;
  };
}

const mascarEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
};

const getRangoColor = (rango: string) => {
  if (rango.includes('SUPREMO'))  return 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]';
  if (rango.includes('ÉLITE'))    return 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]';
  if (rango.includes('NOVATO'))   return 'text-slate-400';
  return 'text-indigo-400';
};

const formatFecha = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  } catch {
    return 'DESCONOCIDA';
  }
};

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onLogout, gameStats }) => {
  const initials = user.nombre
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  const dominioGlobal = gameStats
    ? ((gameStats.paisesConquistados / gameStats.totalPaises) * 100).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-[70] bg-[#030712]/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}>

      {/* Modal card */}
      <div
        className="relative w-full max-w-sm bg-[#050915]/95 border border-cyan-900/50
          shadow-[0_0_60px_rgba(6,182,212,0.12)] rounded-sm overflow-hidden font-mono"
        onClick={e => e.stopPropagation()}
      >
        {/* HUD corner brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60" />

        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-cyan-950/20 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-cyan-400 tracking-[0.25em]">
              PERFIL DE OPERARIO // NET.ID
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Avatar + nombre + rango */}
          <div className="flex items-center gap-4">
            {/* Avatar hexagonal */}
            <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
              <Hexagon
                className="absolute inset-0 w-full h-full text-cyan-500/30 animate-[spin_20s_linear_infinite]"
                strokeWidth={1}
              />
              <Hexagon
                className="absolute inset-0 w-[85%] h-[85%] m-auto text-cyan-400/20"
                strokeWidth={1.5}
              />
              <span className="relative text-lg font-black text-cyan-300 tracking-wider z-10">
                {initials}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-slate-100 font-bold text-sm tracking-wider truncate">
                {user.nombre.toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-500 tracking-widest mt-0.5">
                @{user.username}
              </div>
              <div className={`text-[10px] font-bold tracking-[0.15em] mt-1.5 flex items-center gap-1.5 ${getRangoColor(user.rango)}`}>
                <Shield className="w-3 h-3" />
                {user.rango}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

          {/* Info grid */}
          <div className="space-y-3">

            <div className="flex items-start gap-3 group">
              <Mail className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-slate-600 tracking-widest mb-0.5">CORREO ELECTRÓNICO</div>
                <div className="text-xs text-slate-300 font-mono tracking-wider truncate">
                  {mascarEmail(user.email)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-[9px] text-slate-600 tracking-widest mb-0.5">NACIÓN DE ORIGEN</div>
                <div className="text-xs text-slate-300 font-mono tracking-wider">
                  {user.pais.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-[9px] text-slate-600 tracking-widest mb-0.5">FECHA DE ACTIVACIÓN</div>
                <div className="text-xs text-slate-300 font-mono tracking-wider">
                  {formatFecha(user.fechaRegistro)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Cpu className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-[9px] text-slate-600 tracking-widest mb-0.5">ID DE RED</div>
                <div className="text-xs text-cyan-500/80 font-mono tracking-wider">
                  {user.id}
                </div>
              </div>
            </div>
          </div>

          {/* Game stats — solo si hay partida activa */}
          {gameStats && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
              <div>
                <div className="text-[9px] text-slate-600 tracking-[0.25em] mb-3 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> ESTADÍSTICAS DE CAMPAÑA ACTIVA
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-sm">
                    <div className="text-[9px] text-slate-600 tracking-widest mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> DOMINIO
                    </div>
                    <div className="text-sm font-bold text-cyan-400 font-mono">
                      {dominioGlobal}%
                    </div>
                    <div className="text-[9px] text-slate-600">
                      {gameStats.paisesConquistados}/{gameStats.totalPaises} naciones
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-sm">
                    <div className="text-[9px] text-slate-600 tracking-widest mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> PRESUPUESTO
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">
                      {gameStats.presupuesto.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-sm">
                    <div className="text-[9px] text-slate-600 tracking-widest mb-1">TROPAS</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">
                      {gameStats.tropas.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-sm">
                    <div className="text-[9px] text-slate-600 tracking-widest mb-1">DÍAS</div>
                    <div className="text-sm font-bold text-slate-300 font-mono">
                      {gameStats.diasCampana}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-[9px] text-slate-600 tracking-widest">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            SESIÓN ACTIVA // ENLACE SEGURO ESTABLECIDO
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="w-full group flex items-center justify-center gap-2 py-3 border border-slate-800
              hover:border-rose-500/60 bg-slate-950/50 hover:bg-rose-950/20
              text-slate-500 hover:text-rose-400 text-[10px] font-bold tracking-[0.2em]
              transition-all duration-300 rounded-sm"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            [ CERRAR SESIÓN ]
          </button>
        </div>

        {/* HUD decorative text */}
        <div className="px-5 pb-3 text-[8px] text-slate-700 tracking-widest flex justify-between">
          <span>CONQUEST // AUTH.MODULE</span>
          <span>v2.7.4</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
