import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { DecayingNotification, CriticalEvent } from '../types/tacticalEvents';

export interface ActionLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
}

interface GameContextType {
  oro: number;
  tropas: any;
  paises: any;
  notifications: DecayingNotification[];
  activeCriticalEvent: CriticalEvent | null;
  isPaused: boolean;
  actionLog: ActionLogEntry[];
  setOro: (val: number | ((prev: number) => number)) => void;
  setTropas: (val: any | ((prev: any) => any)) => void;
  setPaises: (val: any | ((prev: any) => any)) => void;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  addNotification: (notification: DecayingNotification) => void;
  removeNotification: (id: string) => void;
  triggerCriticalEvent: (event: CriticalEvent) => void;
  resolveCriticalEvent: () => void;
  registerBridge: (bridge: any) => void;
  pendingCriticalEvent: CriticalEvent | null;
  criticalCountdown: number | null;
  triggerCriticalEventModal: (event: CriticalEvent) => void;
  logAction: (action: string, details: string) => void;
  resetContext: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<DecayingNotification[]>([]);
  const [activeCriticalEvent, setActiveCriticalEvent] = useState<CriticalEvent | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  
  const bridgeRef = useRef<{
    presupuesto: number;
    setPresupuesto: any;
    tropas: any;
    setTropas: any;
    paises: any;
    setPaises: any;
    pendingCriticalEvent: any;
    setPendingCriticalEvent: any;
    criticalCountdown: any;
    setCriticalCountdown: any;
  } | null>(null);

  const registerBridge = (bridge: any) => {
    bridgeRef.current = bridge;
  };

  // Bucle global para decay de notificaciones temporales (1 segundo real)
  useEffect(() => {
    if (isPaused) return; 

    const interval = setInterval(() => {
      setNotifications(prev => {
        prev.forEach(n => {
          if (n.timeLeft - 1000 <= 0 && n.onExpire) {
            const dynamicState = {
              setOro: (val: any) => bridgeRef.current?.setPresupuesto(val),
              setTropas: (val: any) => bridgeRef.current?.setTropas(val),
              setPaises: (val: any) => bridgeRef.current?.setPaises(val),
              oro: bridgeRef.current?.presupuesto ?? 0,
              tropas: bridgeRef.current?.tropas ?? { infanteria: 0, caballeria: 0, artilleria: 0 },
              paises: bridgeRef.current?.paises ?? {}
            };
            try {
              n.onExpire(dynamicState);
            } catch (err) {
              console.error("Error al ejecutar onExpire de notificación:", err);
            }
          }
        });

        return prev
          .map(n => ({ ...n, timeLeft: n.timeLeft - 1000 }))
          .filter(n => n.timeLeft > 0);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const addNotification = (n: DecayingNotification) => setNotifications(prev => [...prev, n]);
  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const logAction = (action: string, details: string) => {
    setActionLog(prev => [...prev, {
      id: Math.random().toString(),
      timestamp: new Date(),
      action,
      details
    }]);
  };

  const triggerCriticalEvent = (event: CriticalEvent) => {
    setIsPaused(true); 
    setActiveCriticalEvent(event);
  };

  const resolveCriticalEvent = () => {
    setActiveCriticalEvent(null);
    setIsPaused(false); 
  };

  const resetContext = () => {
    setIsPaused(false);
    setNotifications([]);
    setActiveCriticalEvent(null);
    setActionLog([]);
  };

  const contextValue = {
    get oro() { return bridgeRef.current?.presupuesto ?? 0; },
    get tropas() { return bridgeRef.current?.tropas ?? { infanteria: 0, caballeria: 0, artilleria: 0 }; },
    get paises() { return bridgeRef.current?.paises ?? {}; },
    get pendingCriticalEvent() { return bridgeRef.current?.pendingCriticalEvent ?? null; },
    get criticalCountdown() { return bridgeRef.current?.criticalCountdown ?? null; },
    notifications,
    activeCriticalEvent,
    isPaused,
    actionLog,
    setOro: (val: any) => bridgeRef.current?.setPresupuesto(val),
    setTropas: (val: any) => bridgeRef.current?.setTropas(val),
    setPaises: (val: any) => bridgeRef.current?.setPaises(val),
    setIsPaused,
    addNotification,
    removeNotification,
    triggerCriticalEvent,
    resolveCriticalEvent,
    registerBridge,
    logAction,
    triggerCriticalEventModal: (event: CriticalEvent) => {
      triggerCriticalEvent(event);
      if (bridgeRef.current?.setCriticalCountdown) {
        bridgeRef.current.setCriticalCountdown(null);
      }
      if (bridgeRef.current?.setPendingCriticalEvent) {
        bridgeRef.current.setPendingCriticalEvent(null);
      }
    },
    resetContext
  };

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame debe usarse dentro de un GameProvider');
  return context;
};