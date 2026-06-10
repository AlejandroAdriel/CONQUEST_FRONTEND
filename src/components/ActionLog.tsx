import React from 'react';
import { useGame } from '../context/GameContext';
import { X } from 'lucide-react';

interface ActionLogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActionLog: React.FC<ActionLogProps> = ({ isOpen, onClose }) => {
  const { actionLog } = useGame();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] bg-slate-950 border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900/80 border-b border-slate-700 p-4 flex items-center justify-between shrink-0">
          <h2 className="text-slate-200 font-bold text-lg tracking-widest uppercase">REGISTRO DE ACCIONES</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-200"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto">
          {actionLog.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <p className="text-sm">No hay acciones registradas aún.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {[...actionLog].reverse().map((entry, idx) => (
                <div key={entry.id} className="border-b border-slate-800/40 p-4 hover:bg-slate-900/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-cyan-400 font-bold text-sm tracking-wider uppercase">
                          {entry.action}
                        </span>
                        <span className="text-slate-600 text-xs">
                          #{actionLog.length - idx}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm break-words">{entry.details}</p>
                    </div>
                    <span className="text-slate-500 text-xs whitespace-nowrap flex-shrink-0 ml-4">
                      {entry.timestamp.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
