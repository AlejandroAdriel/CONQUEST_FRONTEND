# 🌐 CONQUEST // GLOBAL TACTICAL SIMULATOR

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62B)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Un simulador estratégico e interactivo de geopolítica global en tiempo real ambientado en un entorno estético **Cyberpunk Dark**. Integra mecánicas de gestión macroeconómica, despliegues militares dinámicos sobre un planisferio de alta resolución y un árbol de desarrollo científico-militar de múltiples ramas interactivo.

---

## 🖥️ Arquitectura & Stack Tecnológico

El proyecto está diseñado bajo un paradigma modular enfocado en la responsividad táctil y la inmersión del usuario.

*   **Framework Principal:** [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/) para tipado estricto y robustez del estado.
*   **Gestión del Build:** [Vite 8](https://vitejs.dev/) para empaquetado ultra-rápido HMR (Hot Module Replacement).
*   **Estilos y Temática:** [Tailwind CSS 4](https://tailwindcss.com/) complementado con animaciones personalizadas de pulso electromagnético, scanlines CRT analógicas y layouts adaptables (*Bulletproof Flexbox*).
*   **Motor Geográfico (GIS):** [react-simple-maps](https://www.react-simple-maps.io/) + TopoJSON con proyección customizada de Miller (`d3-geo-projection`) para corregir la deformación polar.
*   **Controlador de Cámara:** [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch) para zooms cinemáticos dinámicos y seguimiento automatizado del centro táctico (Satelital).
*   **Iconografía:** [Lucide React](https://lucide.dev/) para el set de indicadores tácticos y corporativos.

---

## 🎮 Mecánicas del Simulador

1.  **Protocolo de Despliegue Satelital:** Al iniciar una simulación desde la sede central (HQ) seleccionada, la cámara realiza un zoom automático calibrado y centrado sobre el polígono geográfico del país inicial.
2.  **Gestión Presupuestaria y de Fuerzas:** Operación simultánea sobre créditos globales de oro y 3 divisiones tácticas:
    *   🛡️ **Infantería de Asalto** (Fuerza base)
    *   🏎️ **Caballería Blindada** (Especialistas rápidos)
    *   💥 **Artillería de Plasma** (Poder de demolición de defensas)
3.  **Algoritmo de Combate e Impacto:** El lanzamiento de ofensivas calcula una ventana de trayectoria de 5 días en tiempo real. Al impactar, se procesan las variables aleatorias de defensa IA, bajas mutuas y la anexión del nodo al territorio aliado.
4.  **SYS.LOG // Registro de Sucesos:** Un pool de 20 eventos probabilísticos (económicos, de sabotaje militar, corporativos y de inteligencia de redes) alteran el curso de la campaña en cada día virtual.
5.  **Árbol de Patentes I+D:** Interfaz holográfica con trazador dinámico SVG para desbloquear mejoras pasivas en la rama militar y de desarrollo.

---

## 📂 Estructura del Proyecto

```bash
CONQUEST_FRONTEND/
├── src/
│   ├── components/
│   │   ├── Login.tsx            # Autenticación de Operario con interfaz de seguridad
│   │   ├── StartMenu.tsx        # Menú principal con efectos de matriz holográfica
│   │   ├── SaveFilesMenu.tsx    # Gestor responsivo de cargas de perfil
│   │   ├── SelectHQ.tsx         # Selector de Sede Central con analizador de variables geográficas
│   │   └── ...
│   ├── database/
│   │   └── mockAPI.ts           # Capa de datos privados, endpoints simulados y eventos globales
│   ├── App.tsx                  # Núcleo del juego: bucle de simulación, estados y layout HUD
│   ├── index.css                # Sistema de tokens CSS, custom scrollbars y efectos CRT
│   └── d3-geo-projection.d.ts   # Definición de tipos para la proyección Miller
├── package.json
└── README.md
```

---

## ⚡ Guía de Instalación y Ejecución

### Requisitos previos
*   [Node.js](https://nodejs.org/) (Versión 18 o superior)
*   npm o yarn

### Pasos
1.  **Instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Iniciar entorno de desarrollo local:**
    ```bash
    npm run dev
    ```
3.  **Validar y compilar para producción (producción bundle):**
    ```bash
    npm run build
    ```

---

## 📦 Versiones de Dependencias

> Última actualización: **4 de junio de 2026**

### Dependencias de Producción

| Paquete | Versión |
|---------|---------|
| react | 19.2.7 |
| react-dom | 19.2.7 |
| lucide-react | 1.17.0 |
| react-simple-maps | 3.0.0 |
| react-zoom-pan-pinch | 4.0.3 |
| d3-geo-projection | 4.0.0 |
| prop-types | 15.8.1 |

### Dependencias de Desarrollo

| Paquete | Versión |
|---------|---------|
| vite | 8.0.16 |
| typescript | 6.0.3 |
| tailwindcss | 4.3.0 |
| @tailwindcss/vite | 4.3.0 |
| eslint | 10.4.1 |
| @vitejs/plugin-react | 6.0.2 |
| @types/node | 25.9.1 |
| @types/react | 19.2.16 |
| @types/react-dom | 19.2.3 |
| @types/react-simple-maps | 3.0.6 |
| @eslint/js | 10.0.1 |
| typescript-eslint | 8.60.1 |
| eslint-plugin-react-hooks | 7.1.1 |
| eslint-plugin-react-refresh | 0.5.2 |
| globals | 17.6.0 |


