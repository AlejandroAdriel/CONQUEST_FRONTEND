import React from 'react';
import { useGame } from '../context/GameContext';

export const CriticalEventModal: React.FC = () => {
  const gameState = useGame();
  const { activeCriticalEvent, resolveCriticalEvent } = gameState;

  if (!activeCriticalEvent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-mono">
      <div className="w-full max-w-xl bg-slate-950 border border-red-900/60 shadow-[0_0_40px_rgba(220,38,38,0.1)] overflow-hidden">
        
        {/* Encabezado HUD Militar Operativo */}
        <div className="bg-red-950/40 border-b border-red-900/50 p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-bold tracking-widest text-xs uppercase">ALERTA MACRO-ESTRATÉGICA CRÍTICA</span>
          </div>
          <span className="text-[9px] bg-red-500 text-black px-1.5 py-0.5 font-bold tracking-tighter">SISTEMA CONGELADO</span>
        </div>

        {/* Contenedor del Reporte Ejecutivo */}
        <div className="p-6 space-y-5">
          <div>
            <div className="text-slate-600 text-[10px] font-bold">REGISTRO DE INFRACCION // {activeCriticalEvent.code}</div>
            <h2 className="text-slate-200 font-bold text-sm tracking-wide mt-0.5 uppercase">{activeCriticalEvent.title}</h2>
          </div>

          <div className="text-slate-400 text-xs leading-relaxed bg-slate-900/40 p-4 border border-slate-800/80 relative">
            <div className="absolute top-1 right-2 text-[8px] text-slate-600">IN_TRANSIT_DATA_LOG</div>
            {activeCriticalEvent.description}
          </div>

          {/* Opciones Forzadas de Toma de Decisiones */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[10px] text-slate-500 tracking-wider font-bold">// SE RECOMIENDA EMISIÓN DE DIRECTIVA IMMEDIATA</div>
            {activeCriticalEvent.choices.map(choice => (
              <button
                key={choice.id}
                onClick={() => {
                  choice.action(gameState); // Modifica Oro, Tropas o Libera Países del mapa
                  resolveCriticalEvent();   // Quita el modal y reanuda el tiempo de fondo
                }}
                className="w-full text-left bg-slate-900/50 border border-slate-800 hover:border-slate-500 p-3.5 transition-all group flex flex-col cursor-pointer relative hover:bg-slate-900"
              >
                <span className="text-slate-300 font-bold text-xs group-hover:text-slate-100 transition-colors">
                  {choice.label}
                </span>
                <span className="text-slate-500 text-[10px] mt-1 tracking-tight group-hover:text-slate-400">
                  <span className="text-slate-600 font-bold">CONSECUENCIA HUD:</span> {choice.consequence}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Decoración estática inferior de telemetría */}
        <div className="bg-slate-900/20 px-6 py-2 border-t border-slate-900/80 flex justify-between text-[9px] text-slate-600">
          <span>SEC_SYS_NET // AUTH_REQUIRED</span>
          <span>GRID ALPHA-01 // CONQUEST_CORE</span>
        </div>
        
      </div>
    </div>
  );
};