# 🌐 CONQUEST

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62B)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Un simulador estratégico e interactivo de geopolítica global en tiempo real ambientado en un entorno estético **Cyberpunk Dark**. Integra mecánicas de gestión macroeconómica, despliegues militares dinámicos sobre un planisferio de alta resolución y un árbol de desarrollo científico‑militar de múltiples ramas interactivo.

---

## 🖥️ Arquitectura & Stack Tecnológico

- **Framework Principal:** React 19 + TypeScript 6 (tipado estricto).
- **Gestión del Build:** Vite 8 (Hot Module Replacement ultra‑rápido).
- **Estilos y Temática:** Tailwind CSS 4 con animaciones personalizadas de pulso, scanlines CRT y layouts **Bullet‑proof Flexbox**.
- **Motor Geográfico (GIS):** `react‑simple‑maps` + TopoJSON con proyección Miller (`d3‑geo‑projection`).
- **Controlador de Cámara:** `react‑zoom‑pan‑pinch` para zoomes cinemáticos y seguimiento automático del centro táctico.
- **Iconografía:** Lucide React.

---

## 🎮 Mecánicas del Simulador

1. **Protocolo de Despliegue Satelital** – Al iniciar la simulación desde la sede central (HQ) la cámara hace zoom automático y se centra en el país inicial.
2. **Gestión Presupuestaria y de Fuerzas** – Créditos de oro y tres divisiones tácticas (Infantería, Caballería Blindada, Artillería de Plasma).
3. **Algoritmo de Combate e Impacto** – Calcula una ventana de 5 días; al impactar se procesan variables de defensa IA, bajas y anexión del territorio.
4. **SYS.LOG – Registro de Sucesos** – 20 eventos probabilísticos (económicos, sabotaje, corporativos, intel) alteran la campaña cada día virtual.
5. **Árbol de Patentes I+D** – Interfaz holográfica con SVG dinámico para desbloquear mejoras pasivas en ramas militares y de desarrollo.

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
│   │   └── mockAPI.ts           # Datos simulados, eventos globales y diccionario de traducción de países
│   ├── App.tsx                  # Núcleo del juego: bucle de simulación, estados y layout HUD
│   ├── index.css                # Sistema de tokens CSS, custom scrollbars y efectos CRT
│   └── d3-geo-projection.d.ts   # Definición de tipos para la proyección Miller
├── package.json
└── README.md
```

---

## ⚡ Guía de Instalación y Ejecución

### Requisitos previos
- **Node.js** ≥ 18
- npm o yarn

### Pasos
1. **Instalar dependencias**
   ```bash
   npm install
   ```
2. **Iniciar entorno de desarrollo local**
   ```bash
   npm run dev
   ```
3. **Compilar para producción**
   ```bash
   npm run build
   ```

---

## 📦 Versiones de Dependencias

> Última actualización: **4 de junio de 2026**

### Dependencias de producción
| Paquete              | Versión |
|----------------------|---------|
| react                | 19.2.7 |
| react-dom            | 19.2.7 |
| lucide-react         | 1.17.0 |
| react-simple-maps    | 3.0.0 |
| react-zoom-pan-pinch | 4.0.3 |
| d3-geo-projection    | 4.0.0 |
| prop-types           | 15.8.1 |

### Dependencias de desarrollo
| Paquete                     | Versión |
|-----------------------------|---------|
| vite                        | 8.0.16 |
| typescript                  | 6.0.3 |
| tailwindcss                 | 4.3.0 |
| @tailwindcss/vite           | 4.3.0 |
| eslint                      | 10.4.1 |
| @vitejs/plugin-react        | 6.0.2 |
| @types/node                 | 25.9.1 |
| @types/react                | 19.2.16 |
| @types/react-dom            | 19.2.3 |
| @types/react-simple-maps    | 3.0.6 |
| @eslint/js                  | 10.0.1 |
| typescript-eslint           | 8.60.1 |
| eslint-plugin-react-hooks   | 7.1.1 |
| eslint-plugin-react-refresh | 0.5.2 |
| globals                     | 17.6.0 |
```
