import React from 'react';
import { useGame } from '../context/GameContext';

export const TacticalNotifications: React.FC = () => {
  const gameState = useGame();
  const { notifications } = gameState;

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2 mb-4 font-mono text-[11px] select-none animate-fade-in">
      <div className="text-slate-500 tracking-wider font-bold mb-1">// TRANSMISIONES DE OPERACIONES ACTIVAS</div>
      {notifications.map(item => {
        const progress = (item.timeLeft / item.duration) * 100;
        
        // Estilos específicos basados en el tipo de balance
        const styleMap = {
          alert: { border: 'border-l-4 border-red-500/80', text: 'text-red-400', bg: 'bg-red-950/20' },
          warning: { border: 'border-l-4 border-amber-500/80', text: 'text-amber-400', bg: 'bg-amber-950/20' },
          benefit: { border: 'border-l-4 border-emerald-500/80', text: 'text-emerald-400', bg: 'bg-emerald-950/20' },
          info: { border: 'border-l-4 border-cyan-500/80', text: 'text-cyan-400', bg: 'bg-cyan-950/20' }
        };

        const currentStyle = styleMap[item.type] || styleMap.info;

        return (
          <div 
            key={item.id} 
            className={`bg-slate-900/40 ${currentStyle.border} border-t border-r border-b border-slate-800/60 p-2.5 relative overflow-hidden backdrop-blur-sm`}
          >
            <div className="flex justify-between items-center font-bold">
              <span className={currentStyle.text}>{item.code} // {item.title}</span>
              <span className="text-slate-500 text-[10px]">{(item.timeLeft / 1000).toFixed(0)}s</span>
            </div>
            
            <p className="text-slate-300 mt-1 leading-snug">{item.description}</p>
            
            {/* Detalles Tácticos del Coste de Oportunidad */}
            <div className="mt-2 pt-1.5 border-t border-slate-800/40 flex justify-between items-center text-[10px]">
              <div className="text-slate-400">
                <span className="text-slate-500">INVERSIÓN:</span> {item.costDescription}
              </div>
              <div className="text-slate-400 text-right">
                <span className="text-slate-500">RETORNO:</span> {item.benefitDescription}
              </div>
            </div>

            {/* Acción de Intercambio Táctico */}
            <button
              onClick={() => {
                item.onAccept(gameState);
                // Filtrar el elemento del estado local de inmediato tras interactuar
                gameState.setOro(o => o); // Gatillo de refresco seguro
              }}
              className="mt-2 w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-center py-1 text-slate-300 font-bold tracking-wide transition-colors cursor-pointer text-[10px] uppercase hover:border-slate-600"
            >
              Ejecutar Transferencia Operativa
            </button>
            
            {/* Barra de desvanecimiento visual de señal */}
            <div className="absolute bottom-0 left-0 h-[2px] bg-slate-950 w-full">
              <div 
                className="h-full transition-all duration-1000 bg-slate-700" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};