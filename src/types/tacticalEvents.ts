export interface BaseEvent {
  id: string;
  code: string;       // Ej: 'EVT_OVERTIME_BOOST', 'CRIT_NATIONALIZATION'
  title: string;
  description: string;
}

// Evento periférico con barra de degradación de señal (Auto-decay con mutación activa)
export interface NotificationOption {
  id: string;
  label: string;
  consequence: string;
  action: (gameState: any) => void;
  style?: 'positive' | 'tradeoff' | 'negative';
}

export interface DecayingNotification extends BaseEvent {
  duration: number;        // Tiempo de vida inicial en ms (ej: 30000 para 30s)
  timeLeft: number;        // Tiempo restante en ms
  type: 'info' | 'warning' | 'alert' | 'benefit';
  costDescription?: string;
  benefitDescription?: string;
  options: NotificationOption[];
  // Acción desencadenada cuando el tiempo llega a 0 sin haber sido aceptado
  onExpire?: (gameState: any) => void;
}

// Opciones interactivas de los Eventos Críticos (Pausa global)
export interface EventChoice {
  id: string;
  label: string;           // Directiva ejecutiva en el botón
  consequence: string;     // Telemetría de efectos en el HUD
  action: (gameState: any) => void; // Afecta Oro, Tropas o Países Conquistados
}

export interface CriticalEvent extends BaseEvent {
  choices: EventChoice[];
}

// Interfaz para el mock de países que maneja react-simple-maps
export interface TacticalCountry {
  id: string;              // Código ISO (ej: 'BRA', 'CAN')
  name: string;
  estaConquistado: boolean;
  color: string;           // Código hexadecimal de pintura táctica en el mapa
}