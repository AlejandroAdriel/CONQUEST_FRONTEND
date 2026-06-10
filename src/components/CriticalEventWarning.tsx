import React from 'react';
import { useGame } from '../context/GameContext';
import { AlertTriangle } from 'lucide-react';

export const CriticalEventWarning: React.FC = () => {
  const gameState = useGame();
  const { pendingCriticalEvent, criticalCountdown, resolveCriticalEvent } = gameState;

  if (!pendingCriticalEvent || criticalCountdown === null) return null;

  const handleViewEvent = () => {
    gameState.triggerCriticalEventModal(pendingCriticalEvent);
  };

  const isUrgent = criticalCountdown <= 1;

  return (
    <div className={`fixed top-20 right-6 z-40 font-mono flex flex-col gap-2 animate-in slide-in-from-right pointer-events-auto`}>
      <div className={`${
        isUrgent 
          ? 'bg-red-950/90 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
          : 'bg-amber-950/90 border-amber-500/60 shadow-[0_0_15px_rgba(217,119,6,0.3)]'
      } border p-4 rounded-sm backdrop-blur-md max-w-sm`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className={`w-5 h-5 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-bold tracking-widest uppercase ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
              ALERTA CRÍTICA INMINENTE
            </div>
            <div className="text-slate-300 text-sm font-bold mt-1 truncate">
              {pendingCriticalEvent.title}
            </div>
            <div className="text-slate-400 text-xs mt-2 line-clamp-2">
              {pendingCriticalEvent.description}
            </div>
            <div className={`mt-3 text-lg font-black tabular-nums tracking-wider ${isUrgent ? 'text-red-500' : 'text-amber-500'}`}>
              T - {criticalCountdown}s
            </div>
            <button
              onClick={handleViewEvent}
              className={`mt-3 w-full py-2 px-3 text-xs font-bold uppercase tracking-widest border transition-all ${
                isUrgent 
                  ? 'bg-red-950/40 border-red-500/50 hover:bg-red-950/60 text-red-400 hover:text-red-300' 
                  : 'bg-amber-950/40 border-amber-500/50 hover:bg-amber-950/60 text-amber-400 hover:text-amber-300'
              }`}
            >
              VER EVENTO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
