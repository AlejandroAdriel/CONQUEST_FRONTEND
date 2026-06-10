import React, { createContext, useContext, useState, useEffect } from 'react';
import type { DecayingNotification, CriticalEvent, TacticalCountry } from '../types/tacticalEvents';

interface GameContextType {
  oro: number;
  tropas: number;
  paises: TacticalCountry[];
  notifications: DecayingNotification[];
  activeCriticalEvent: CriticalEvent | null;
  isPaused: boolean;
  setOro: React.Dispatch<React.SetStateAction<number>>;
  setTropas: React.Dispatch<React.SetStateAction<number>>;
  setPaises: React.Dispatch<React.SetStateAction<TacticalCountry[]>>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  addNotification: (notification: DecayingNotification) => void;
  triggerCriticalEvent: (event: CriticalEvent) => void;
  resolveCriticalEvent: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [oro, setOro] = useState<number>(10000);
  const [tropas, setTropas] = useState<number>(1200);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<DecayingNotification[]>([]);
  const [activeCriticalEvent, setActiveCriticalEvent] = useState<CriticalEvent | null>(null);
  
  // Lista de países simulados (Respetando el esquema relacional)
  const [paises, setPaises] = useState<TacticalCountry[]>([
    { id: 'CAN', name: 'Canadá', estaConquistado: true, color: '#3b82f6' }, // Azul de ocupación
    { id: 'BRA', name: 'Brasil', estaConquistado: true, color: '#3b82f6' },
    { id: 'ZAF', name: 'Sudáfrica', estaConquistado: false, color: '#1e293b' } // Gris de HUD neutral
  ]);

  // Bucle global acoplado al TimeControl
  useEffect(() => {
    if (isPaused) return; // Congela la simulación por completo si hay un evento crítico en pantalla

    const interval = setInterval(() => {
      // 1. Simulación económica pasiva base del juego
      setOro(prev => prev + 25);

      // 2. Lógica añadida: Decremento de señales periféricas en tiempo real (Auto-decay)
      setNotifications(prev => 
        prev
          .map(n => ({ ...n, timeLeft: n.timeLeft - 1000 }))
          .filter(n => n.timeLeft > 0) // Desvanece el evento limpiamente al llegar a 0 sin penalizar
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const addNotification = (n: DecayingNotification) => setNotifications(prev => [...prev, n]);

  const triggerCriticalEvent = (event: CriticalEvent) => {
    setIsPaused(true); // Fuerza la pausa inmediata de la simulación
    setActiveCriticalEvent(event);
  };

  const resolveCriticalEvent = () => {
    setActiveCriticalEvent(null);
    setIsPaused(false); // Reanuda la marcha cronológica del juego
  };

  // Objeto de estado expuesto
  const contextValue = {
    oro, tropas, paises, notifications, activeCriticalEvent, isPaused,
    setOro, setTropas, setPaises, setIsPaused,
    addNotification, triggerCriticalEvent, resolveCriticalEvent
  };

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame debe usarse dentro de un GameProvider');
  return context;
};