import { useState, useEffect } from "react";
import { 
  Database, Trash2, Shield, Calendar, DollarSign, Users, Award, Plus, X 
} from "lucide-react";
import { fetchSavedGames, initializeNewGame, deleteGame } from "../database/saves";
import type { DBGameSave } from "../database/saves";
import { getPersistedOperator } from "../database/auth";
import { fetchArmyReports } from "../database/reports";
import type { ArmyReport } from "../database/reports";

interface SaveFilesMenuProps {
  onClose: () => void;
  onLoadSave?: (save: DBGameSave) => void;
  onNewGame?: (save: DBGameSave) => void;
}

export default function SaveFilesMenu({ onClose, onLoadSave, onNewGame }: SaveFilesMenuProps) {
  const [saves, setSaves] = useState<(DBGameSave | null)[]>([null]);
  const [armyReports, setArmyReports] = useState<ArmyReport[]>([]);

  useEffect(() => {
    const loadSaves = async () => {
      try {
        const user = getPersistedOperator();
        if (user && user.dbId) {
          const [data, reports] = await Promise.all([
            fetchSavedGames(user.dbId),
            fetchArmyReports()
          ]);
          setSaves([...data, null]);
          setArmyReports(reports);
        } else if (user && !user.dbId) {
          // usuario sin dbId (sesión antigua) — solo mostramos slot vacío
          setSaves([null]);
        } else {
          setSaves([null]);
        }
      } catch (err) {
        console.error("Error al cargar partidas:", err);
      }
    };
    loadSaves();
  }, []);

  const handlePurge = async (id: number) => {
    const success = await deleteGame(id);
    if (success) {
      setSaves(prev => prev.filter(save => save === null || save.id !== id));
    } else {
      alert("ERROR AL ELIMINAR LA PARTIDA DE LA BASE DE DATOS.");
    }
  };

  const handleInitialize = async (index: number) => {
    const user = getPersistedOperator();
    if (!user || !user.dbId) {
      alert("SISTEMA: REQUIERE OPERARIO AUTENTICADO PARA INICIALIZAR.");
      return;
    }

    const randomNode = `SECURE-NODE-${Math.floor(100 + Math.random() * 950)}`;
    const newSave = await initializeNewGame({
      usuario_id: user.dbId,
      commander_id: randomNode,
      hq_pais_id: "México",
      oro: 5000,
      tropas_infanteria: 5000,
      tropas_caballeria: 2000,
      tropas_artilleria: 500
    });

    if (newSave) {
      setSaves(prev => {
        const updated = [...prev];
        updated[index] = newSave;
        return updated;
      });
      if (onNewGame) {
        onNewGame(newSave);
      }
    } else {
      alert("ERROR AL CREAR PARTIDA EN LA BASE DE DATOS.");
    }
  };

  const handleLoad = (save: DBGameSave) => {
    if (onLoadSave) {
      onLoadSave(save);
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
                    <div className="md:col-span-3 flex items-start gap-3">
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

                    {/* CENTRO: Estadísticas */}
                    {(() => {
                      const gameStats = armyReports.find(r => r.partida_id === save.partida_id);
                      return (
                        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 border-t border-b md:border-t-0 md:border-b-0 border-slate-800/50 py-3 md:py-0">
                          <div>
                            <div className="text-[8px] text-slate-500 font-bold">DÍAS CAMPAÑA</div>
                            <div className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {save.campaignDays}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] text-slate-500 font-bold font-sans">DOMINIO</div>
                            <div className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                              <Award className="w-3.5 h-3.5 text-slate-500" />
                              {save.dominionPercent}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] text-slate-500 font-bold">PRESUPUESTO</div>
                            <div className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                              {save.budget.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] text-slate-500 font-bold">FUERZAS PROPIAS</div>
                            <div className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              {save.troops.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] text-slate-500 font-bold">CONTENDIENTES</div>
                            <div className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <Users className="w-3.5 h-3.5 text-cyan-500/80" />
                              {gameStats?.total_jugadores ?? 1}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] text-slate-500 font-bold">FUERZAS MUNDIALES</div>
                            <div className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <Users className="w-3.5 h-3.5 text-cyan-500/80 animate-pulse" />
                              {gameStats?.gran_total_tropas?.toLocaleString() ?? save.troops.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* DERECHA: Fechas */}
                    <div className="md:col-span-2 text-left md:text-right text-[9px] text-slate-500 space-y-1">
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
                      onClick={() => handleLoad(save)}
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
