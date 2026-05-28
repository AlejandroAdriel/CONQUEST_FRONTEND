# Conquest

Un simulador interactivo de estrategia y conquista geopolítica en tiempo real desarrollado con React, TypeScript y Vite. El juego combina mecánicas de gestión de recursos, conquista territorial sobre un mapamundi y un árbol tecnológico masivo en un entorno visual táctico.

---

## 🎮 ¿Cómo se juega? (Mecánicas de Juego)

1. **Gestión de Recursos:** Comienzas con un **Presupuesto** (€) y **Fuerzas de Reserva** (Infantería, Caballería y Artillería) en la barra inferior.
2. **Exploración:** Pasa el cursor por el mapamundi interactivo para ver los datos de cada país.
   - 🔵 **Países Aliados:** Tonalidades azules. Tienen tu estatus.
   - 🔴 **Países Hostiles:** Tonalidades rojizas. Tienen ejército propio controlado por la IA.
3. **Ofensivas:** Haz clic en un país hostil, escribe el número de tropas a desplegar desde tu reserva y presiona `Iniciar Ofensiva`. El ataque tardará 5 días virtuales en llegar (puedes ver la alerta arriba a la derecha). Al impactar, el simulador calcula las bajas de ambos bandos y decide si conquistas el territorio.
4. **Árbol Tecnológico (I+D):** Usa tus ingresos de oro para desbloquear patentes (económicas o militares) en el botón `Árbol Tecnológico`. Esto te otorgará mejoras pasivas.
5. **Control de Tiempo:** Puedes pausar la simulación o correrla a 3 velocidades diferentes para acelerar el paso de los días y la resolución de las guerras.

---

## 🛠️ Guía del Desarrollador (¿Cómo está construido?)

Si quieres modificar o expandir el código, aquí tienes un resumen sencillo de cómo funciona por dentro:

### 1. Estructura de Archivos
* **[src/App.tsx](file:///d:/CONQUEST/CONQUEST_FRONTEND/src/App.tsx):** Contiene toda la lógica del juego, los estados principales, el bucle de tiempo y los componentes visuales de la interfaz.
* **[src/TechTreeData.ts](file:///d:/CONQUEST/CONQUEST_FRONTEND/src/TechTreeData.ts):** Almacena la base de datos de las tecnologías. Cada nodo tiene un ID, nombre, coste, prerrequisitos, categoría, coordenadas `x`/`y` para dibujarse en la rejilla, y el tipo de beneficio.
* **[src/index.css](file:///d:/CONQUEST/CONQUEST_FRONTEND/src/index.css):** Define fuentes digitales personalizadas y scrollbars estilizadas.

### 2. Variables de Estado Principales (`App.tsx`)
* `fechaVirtual`: El reloj digital del juego (avanza día a día).
* `isPlaying` y `speedLevel`: Controlan si la simulación corre y a qué velocidad (`1` = 1s/día, `2` = 250ms/día, `3` = 80ms/día).
* `paises`: Un diccionario que almacena los estados de los países conquistados o modificados (para no sobrecargar el render).
* `presupuesto` y `tropas`: Recursos del jugador.
* `habilidades`: La lista de tecnologías del árbol y su estado (`desbloqueada: true/false`).
* `ataquesEnCola`: Lista de ofensivas militares que viajan en tiempo real hacia sus destinos.

### 3. El Bucle del Tiempo (`useEffect` principal)
Toda la lógica de avance ocurre en dos `useEffect` principales:
* El primero gestiona el **reloj cronológico**, creando un intervalo que suma un día a la `fechaVirtual` según la velocidad elegida.
* El segundo reacciona a cada cambio de `fechaVirtual` (cada nuevo día) para:
  1. Reducir la cuenta de días para eventos aleatorios.
  2. Comprobar si los ataques en cola han llegado a su fecha de impacto para resolver la batalla (calculando bajas aleatorias basadas en las fuerzas desplegadas y la defensa de la IA).

### 4. El Mapamundi SVG
* Utiliza `react-simple-maps` bajo una proyección `geoMercator` limpia que centra el mapa de forma proporcional.
* Se envuelve en `TransformWrapper` para permitir que el jugador arrastre el mapa libremente o use los botones de **Zoom (+, -, Reset)** sin que el lienzo se deforme.
* Los colores de los países cambian dinámicamente según si son conquistados, hostiles, seleccionados o si tienen un ataque en camino (`stroke` rojo parpadeante).

### 5. Renderizado del Árbol de Tecnologías (I+D)
* El modal dibuja en el fondo un lienzo `<svg>` que traza líneas discontinuas conectando las tecnologías basándose en las coordenadas `x` e `y` de `TechTreeData.ts`.
* Si una tecnología prerrequisito se desbloquea, la línea cambia a un color azul activo; si la tecnología se desbloquea del todo, la línea se ilumina en verde con efecto de brillo.

---

## 🚀 Instalación y Configuración Local

1. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Generar la compilación para producción (comprueba errores de TypeScript):
   ```bash
   npm run build
   ```
