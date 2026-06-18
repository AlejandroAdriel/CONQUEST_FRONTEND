# 🌐 CONQUEST — Interface de Mando Táctico (FRONTEND)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62B)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

Un simulador estratégico interactivo de geopolítica global en tiempo real ambientado en un entorno estético **Cyberpunk Dark**. Integra mecánicas de gestión macroeconómica, despliegues militares dinámicos sobre un planisferio de alta resolución y un árbol de desarrollo científico‑militar holográfico de múltiples ramas.

---

## 🖥️ Arquitectura & Stack Tecnológico

- **Framework Principal:** React 19 (`^19.2.7`) + TypeScript 6 (`~6.0.3`) con tipado estricto.
- **Gestión del Build y Servidor Dev:** Vite 8 (`^8.0.16`) para un Hot Module Replacement (HMR) ultra‑rápido.
- **Estilos y Temática:** Tailwind CSS 4 (`^4.3.0`) con variables personalizadas en `index.css` que proveen scanlines CRT, parpadeos de interferencia, tipografía moderna y layouts adaptables basados en Flexbox/Grid.
- **Base de Datos & Autenticación:** Supabase (`@supabase/supabase-js` `^2.108.1`) para sincronización remota de perfiles de operario, gestión de sesiones y persistencia segura en la nube.
- **Motor Geográfico (GIS):** `react-simple-maps` (`^3.0.0`) + TopoJSON con proyección Miller (`d3-geo-projection`) para renderizar el planisferio político de alta fidelidad.
- **Controlador de Cámara:** `react-zoom-pan-pinch` (`^4.0.3`) para zoom cinemático, desplazamientos libres y centrado automático en objetivos tácticos.
- **Iconografía:** Lucide React (`^1.17.0`) para los indicadores del HUD.
- **Gestión de Dependencias Estricta:** Configuración de `.npmrc` con soporte por defecto para `legacy-peer-deps=true` para asegurar un `npm install` limpio y libre de conflictos de dependencias entre React 19 y React Simple Maps.

---

## 🎮 Mecánicas del Simulador

1. **Protocolo de Acceso y Operarios:** Interfaz de login holográfica que permite inicio de sesión seguro mediante base de datos remota en Supabase o modo de simulación local offline.
2. **Terminal de Sede Central (HQ):** Selección táctica de inicio con análisis de variables geo-políticas y geográficas de cada país disponible.
3. **Gestión Presupuestaria y de Fuerzas:** Control de recursos (créditos dorados) y reclutamiento dinámico de tropas con un catálogo relacional de 15 unidades de combate divididas en tres categorías tácticas (Infantería Ligera, Caballería Motorizada, Artillería de Precisión).
4. **Planisferio de Operaciones:** Mapa táctico interactivo con hover detallado de países, representación visual del estado (aliado, neutral, enemigo) y simulación en tiempo real de convoyes militares de invasión.
5. **SYS.LOG — Registro de Sucesos:** Consola dinámica de eventos probabilísticos y de desgaste que afectan el transcurso diario de la simulación.
6. **Árbol de Patentes I+D Dinámico:** Árbol tecnológico SVG sincronizado en tiempo real con Supabase. Permite el desarrollo modular de habilidades con costos burocráticos exponenciales y prerrequisitos en cadena.

---

## 📂 Estructura del Proyecto

```bash
CONQUEST_FRONTEND/
├── src/
│   ├── components/
│   │   ├── ActionLog.tsx             # Panel de registro de sucesos históricos (SYS.LOG)
│   │   ├── CriticalEventModal.tsx    # Interrupción táctica para decisiones críticas
│   │   ├── CriticalEventWarning.tsx  # Alertas flotantes en pantalla de simulación
│   │   ├── Login.tsx                 # Autenticación de Operarios (Supabase + Offline local)
│   │   ├── SaveFilesMenu.tsx         # Gestor responsivo de partidas y perfiles de operario
│   │   ├── SelectHQ.tsx              # Selector geográfico de Sede Central (HQ)
│   │   ├── StartMenu.tsx             # Menú de inicio holográfico con efectos matriciales
│   │   ├── TacticalNotifications.tsx # Sistema de notificaciones rápidas del sistema
│   │   └── UserProfile.tsx           # Hoja de servicio del operario con estadísticas
│   │
│   ├── database/
│   │   ├── auth.ts                   # Lógica interna y flujos de autenticación
│   │   ├── authService.ts            # Gestor de llamadas y sesiones de Supabase
│   │   ├── countries.ts              # Servicios y lógica de consulta de datos de países (Supabase / local)
│   │   ├── game.ts                   # Servicio del árbol tecnológico y transacciones de habilidades
│   │   ├── gameService.ts            # Servicio de guardado y carga de campañas
│   │   ├── mockAPI.ts                # Configuración de constantes y templates de simulación locales
│   │   ├── saves.ts                  # Persistencia remota e inicialización de partidas guardadas
│   │   ├── troops.ts                 # Lógica relacional de tropas y cálculo de poder de combate
│   │   └── supabaseClient.ts         # Cliente singleton inicializado para Supabase
│   │
│   ├── types/
│   │   ├── habilidades.ts            # Definiciones de tipo para el árbol de habilidades de Supabase
│   │   ├── paises.ts                 # Definiciones de tipo para países, presets y estadísticas
│   │   ├── tacticalEvents.ts         # Definiciones de tipo para eventos críticos y recurrentes
│   │   ├── tropas.ts                 # Definiciones de tipo para el catálogo relacional de unidades
│   │   └── user.ts                   # Definición de tipos para operarios y perfiles de usuario
│   │
│   ├── App.tsx                       # Núcleo del juego: bucle principal, HUD e hilos de simulación
│   ├── index.css                     # Sistema de tokens CSS, custom scrollbars y efectos CRT
│   └── d3-geo-projection.d.ts        # Declaración de tipos TypeScript para la proyección Miller
│
├── .env.example                      # Ejemplo de configuración de variables de entorno
├── .npmrc                            # Configuración global para compatibilidad de dependencias de React
├── package.json                      # Configuración de dependencias, scripts y overrides del proyecto
└── README.md                         # Este archivo de documentación técnica
```

---

## ⚡ Guía de Instalación y Ejecución

### Requisitos Previos
- **Node.js** v18 o superior
- **npm** (recomendado) o **yarn**

### Pasos para el Despliegue Local

1. **Configuración de Variables de Entorno:**
   Copia el archivo de ejemplo `.env.example` como `.env` en la raíz del proyecto:
   ```bash
   cp .env.example .env
   ```
   Abre el archivo `.env` y define tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
   ```

2. **Instalación de Dependencias:**
   Gracias al archivo `.npmrc`, las dependencias de React 19 y React Simple Maps se resolverán automáticamente sin conflictos de peer dependency:
   ```bash
   npm install
   ```

3. **Iniciar Servidor de Desarrollo:**
   Arranca el simulador en tu entorno local con soporte de Hot Module Replacement (HMR):
   ```bash
   npm run dev
   ```

4. **Compilar para Producción:**
   Para generar el bundle optimizado y minificado de producción en el directorio `/dist`:
   ```bash
   npm run build
   ```

---

## 📦 Versiones de Dependencias y Overrides

### Dependencias de Producción
| Paquete | Versión instalada | Propósito |
| :--- | :--- | :--- |
| `react` | `^19.2.7` | Framework de renderizado |
| `react-dom` | `^19.2.7` | Enlace al DOM del navegador |
| `@supabase/supabase-js` | `^2.108.1` | SDK oficial para la persistencia e inicio de sesión |
| `react-simple-maps` | `^3.0.0` | Renderizador dinámico de mapas TopoJSON |
| `react-zoom-pan-pinch` | `^4.0.3` | Controles de cámara tácticos (zoom/paneo) |
| `d3-geo-projection` | `^4.0.0` | Proyección Miller para planisferio GIS |
| `lucide-react` | `^1.17.0` | Paquete de iconos vectoriales |
| `prop-types` | `^15.8.1` | Validación de tipos en componentes heredados |
| `tslib` | `^2.8.1` | Dependencia auxiliar de tiempo de ejecución para TypeScript |

### Dependencias de Desarrollo
| Paquete | Versión instalada |
| :--- | :--- |
| `vite` | `^8.0.16` |
| `typescript` | `~6.0.3` |
| `tailwindcss` | `^4.3.0` |
| `@tailwindcss/vite` | `^4.3.0` |
| `@types/react` | `^19.2.17` |
| `@types/react-dom` | `^19.2.3` |
| `@types/react-simple-maps` | `^3.0.6` |
| `@types/node` | `^25.9.2` |
| `eslint` | `^10.4.1` |
| `eslint-plugin-react-hooks` | `^7.1.1` |
| `eslint-plugin-react-refresh` | `^0.5.2` |
| `@eslint/js` | `^10.0.1` |
| `typescript-eslint` | `^8.60.1` |
| `globals` | `^17.6.0` |
| `@vitejs/plugin-react` | `^6.0.2` |

### Resolución de Seguridad (Overrides)
Para corregir vulnerabilidades heredadas de dependencias internas, se ha forzado el uso de la versión segura del paquete de color en `package.json`:
- **Override:** `"d3-color": "^3.1.0"` (Corrige la vulnerabilidad de denegación de servicio de Expresión Regular en `d3-color`).
