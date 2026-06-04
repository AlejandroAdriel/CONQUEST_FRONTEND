import { useState, useEffect } from "react";
import { 
  Database, Trash2, Shield, Calendar, DollarSign, Users, Award, Plus, X 
} from "lucide-react";
import { fetchSavedGames } from "../database/mockAPI";
import type { SaveFile } from "../database/mockAPI";

interface SaveFilesMenuProps {
  onClose: () => void;
  onLoadSave?: (saveId: string) => void;
  onNewGame?: () => void;
}

export default function SaveFilesMenu({ onClose, onLoadSave, onNewGame }: SaveFilesMenuProps) {
  const [saves, setSaves] = useState<(SaveFile | null)[]>([null]);

  useEffect(() => {
    const loadSaves = async () => {
      try {
        const data = await fetchSavedGames();
        setSaves([...data, null]);
      } catch (err) {
        console.error(err);
      }
    };
    loadSaves();
  }, []);

  const handlePurge = (id: string) => {
    setSaves(prev => prev.map(save => save?.id === id ? null : save));
  };

  const handleInitialize = (index: number) => {
    const newSave: SaveFile = {
      id: `save-${Math.random().toString(36).substr(2, 9)}`,
      commanderID: `SECURE-NODE-${Math.floor(100 + Math.random() * 900)}`,
      hq: "MÉXICO",
      creationDate: new Date().toISOString().replace("T", " ").substr(0, 16),
      lastSaveDate: new Date().toISOString().replace("T", " ").substr(0, 16),
      campaignDays: 1,
      dominionPercent: 2.1,
      budget: 5000,
      troops: 7500
    };

    setSaves(prev => {
      const updated = [...prev];
      updated[index] = newSave;
      return updated;
    });

    if (onNewGame) {
      onNewGame();
    }
  };

  const handleLoad = (id: string) => {
    if (onLoadSave) {
      onLoadSave(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col p-4 md:p-8 bg-[#030712]/95 backdrop-blur-xl overflow-hidden">
      <div className="relative w-full max-w-4xl mx-auto flex flex-col bg-[#050915]/95 border-t border-b border-cyan-500/30 p-1 flex-1 min-h-0">
        {/* Adornos esquinas HUD */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        <div className="bg-[#050915] border border-slate-900 px-8 py-8 flex flex-col flex-1 min-h-0 font-mono text-slate-300 uppercase tracking-widest overflow-hidden">
          {/* CABECERA */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center mb-6 pb-4 border-b border-cyan-900/50">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-cyan-400" />
              <div>
                <h1 className="text-lg font-black text-slate-100 tracking-[0.2em]">
                  [ GESTOR DE ARCHIVOS DE SIMULACIÓN ]
                </h1>
                <p className="text-[10px] text-cyan-500/60 mt-1">
                  SECTOR DE MEMORIA CREADA // ACCESO OPERARIO AUTORIZADO
                </p>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-900/50 py-1.5 px-3 bg-slate-950/50"
            >
              <X className="w-4 h-4" />
              <span>[ VOLVER ]</span>
            </button>
          </div>

          {/* LISTA DE ARCHIVOS DE GUARDADO */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 pr-2 custom-scrollbar">
            {saves.map((save, index) => {
              if (!save) {
                return (
                  <div 
                    key={`empty-${index}`} 
                    className="shrink-0 relative group flex flex-col md:flex-row items-center justify-between p-6 border border-dashed border-slate-800 hover:border-cyan-500/30 bg-slate-950/40 opacity-60 hover:opacity-100 transition-all duration-300 min-h-[140px]"
                  >
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <div className="w-10 h-10 border border-dashed border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-cyan-500/50 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xs font-black text-slate-600 group-hover:text-slate-400 transition-colors">
                          [ ESPACIO DE MEMORIA SIN ASIGNAR // SLOT DISPONIBLE ]
                        </h2>
                        <p className="text-[9px] text-slate-700 group-hover:text-slate-500 mt-1">
                          LISTO PARA INICIALIZACIÓN PROTOCOLO CONQUEST
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleInitialize(index)}
                      className="text-xs font-black border border-slate-800 group-hover:border-cyan-500 hover:bg-cyan-950/20 text-slate-500 group-hover:text-cyan-400 py-3 px-6 transition-all duration-300"
                    >
                      [ INICIALIZAR NUEVO PROTOCOLO ]
                    </button>
                  </div>
                );
              }

              return (
                <div 
                  key={save.id}
                  className="shrink-0 flex flex-col border border-slate-800/80 bg-slate-900/10 hover:border-slate-700/80 transition-all p-5 gap-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* IZQUIERDA: Identidad Comandante */}
                    <div className="md:col-span-4 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <h2 className="text-sm font-black text-slate-100 tracking-wider">
                          {save.commanderID}
                        </h2>
                        <div className="text-[9px] text-slate-500 mt-1">
                          SEDE CENTRAL: <span className="text-slate-300 font-bold">{save.hq}</span>
                        </div>
                      </div>
                    </div>

                      <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-t border-b md:border-t-0 md:border-b-0 border-slate-800/50 py-3 md:py-0">
                      <div>
                        <div className="text-[8px] text-slate-500">DÍAS CAMPAÑA</div>
                        <div className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {save.campaignDays}
                        </div>
                      </div>
                      <div>
                        <div className="text-[8px] text-slate-500">DOMINIO GLOBAL</div>
                        <div className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                          <Award className="w-3.5 h-3.5 text-slate-500" />
                          {save.dominionPercent}%
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-[8px] text-slate-500">PRESUPUESTO</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          {save.budget.toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-[8px] text-slate-500">FUERZAS TOTALES</div>
                        <div className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {save.troops.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* DERECHA: Fechas */}
                    <div className="md:col-span-3 text-left md:text-right text-[9px] text-slate-500 space-y-1">
                      <div>CREACIÓN: <span className="text-slate-400 font-mono font-semibold">{save.creationDate}</span></div>
                      <div>ACCESO: <span className="text-cyan-400/80 font-mono font-semibold">{save.lastSaveDate}</span></div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center border-t border-slate-800/40 pt-3 mt-1">
                    <button 
                      onClick={() => handlePurge(save.id)}
                      className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-950/20 py-1.5 px-3 bg-slate-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>[ PURGAR DATOS ]</span>
                    </button>

                    <button 
                      onClick={() => handleLoad(save.id)}
                      className="text-[10px] font-black border border-slate-800 hover:border-cyan-500 bg-slate-950/50 text-slate-400 hover:text-cyan-400 py-2 px-6 transition-all duration-300"
                    >
                      [ CARGAR ENLACE ]
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
