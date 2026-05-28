import type { Habilidad } from "./App";

export const initialHabilidades: Habilidad[] = [
  // ===================== DESARROLLO =====================
  { id: "D_ROOT", nombre: "Protocolo de Enlace Neuronal", costo: 300, desbloqueada: false, prerrequisito_id: null, tipo_bono: "+5% Eficiencia Global", categoria: "desarrollo", rama: "raiz", nivel: 0, x: 50, y: 200 },
  
  // Rama A: Economía
  { id: "D_A1", nombre: "Algoritmos Financieros", costo: 500, desbloqueada: false, prerrequisito_id: "D_ROOT", tipo_bono: "+10% Ingresos Oro", categoria: "desarrollo", rama: "A", nivel: 1, x: 350, y: 50 },
  { id: "D_A2", nombre: "Cripto-Minería Geotérmica", costo: 900, desbloqueada: false, prerrequisito_id: "D_A1", tipo_bono: "+20% Ingresos Oro", categoria: "desarrollo", rama: "A", nivel: 2, x: 650, y: 50 },
  { id: "D_A3", nombre: "Monopolio de Red de Datos", costo: 2000, desbloqueada: false, prerrequisito_id: "D_A2", tipo_bono: "+50% Ingresos Oro", categoria: "desarrollo", rama: "A", nivel: 3, x: 950, y: 50 },
  
  // Rama B: Infraestructura
  { id: "D_B1", nombre: "Líneas de Ensamblaje Auto", costo: 550, desbloqueada: false, prerrequisito_id: "D_ROOT", tipo_bono: "-5% Costo Construcción", categoria: "desarrollo", rama: "B", nivel: 1, x: 350, y: 200 },
  { id: "D_B2", nombre: "Impresión Molecular", costo: 1000, desbloqueada: false, prerrequisito_id: "D_B1", tipo_bono: "-15% Costo Construcción", categoria: "desarrollo", rama: "B", nivel: 2, x: 650, y: 200 },
  { id: "D_B3", nombre: "Fábricas Orbitales", costo: 2200, desbloqueada: false, prerrequisito_id: "D_B2", tipo_bono: "-30% Costo Construcción", categoria: "desarrollo", rama: "B", nivel: 3, x: 950, y: 200 },
  
  // Rama C: Ciberdefensa
  { id: "D_C1", nombre: "Firewalls Cuánticos", costo: 600, desbloqueada: false, prerrequisito_id: "D_ROOT", tipo_bono: "+10% Defensa Ciber", categoria: "desarrollo", rama: "C", nivel: 1, x: 350, y: 350 },
  { id: "D_C2", nombre: "Virus de Desinformación", costo: 1100, desbloqueada: false, prerrequisito_id: "D_C1", tipo_bono: "+20% Sabotaje", categoria: "desarrollo", rama: "C", nivel: 2, x: 650, y: 350 },
  { id: "D_C3", nombre: "Control Satelital", costo: 2500, desbloqueada: false, prerrequisito_id: "D_C2", tipo_bono: "Revelar Mapa Completo", categoria: "desarrollo", rama: "C", nivel: 3, x: 950, y: 350 },

  // ===================== DOCTRINA MILITAR =====================
  { id: "M_ROOT", nombre: "Protocolo de Movilización Global", costo: 400, desbloqueada: false, prerrequisito_id: null, tipo_bono: "+5% Ataque Global", categoria: "militar", rama: "raiz", nivel: 0, x: 50, y: 200 },
  
  // Rama 1: Infantería
  { id: "M_11", nombre: "Entrenamiento en Gravedad Cero", costo: 600, desbloqueada: false, prerrequisito_id: "M_ROOT", tipo_bono: "+10% HP Infantería", categoria: "militar", rama: "1", nivel: 1, x: 350, y: 50 },
  { id: "M_12", nombre: "Armaduras Tácticas de Grafeno", costo: 1200, desbloqueada: false, prerrequisito_id: "M_11", tipo_bono: "+20% Def Infantería", categoria: "militar", rama: "1", nivel: 2, x: 650, y: 50 },
  { id: "M_13", nombre: "Exoesqueletos de Combate Autónomos", costo: 2500, desbloqueada: false, prerrequisito_id: "M_12", tipo_bono: "+40% Ataque Infantería", categoria: "militar", rama: "1", nivel: 3, x: 950, y: 50 },
  
  // Rama 2: Caballería / Movilidad
  { id: "M_21", nombre: "Vehículos de Asalto Todo Terreno", costo: 700, desbloqueada: false, prerrequisito_id: "M_ROOT", tipo_bono: "+10% Vel Movimiento", categoria: "militar", rama: "2", nivel: 1, x: 350, y: 200 },
  { id: "M_22", nombre: "Tanques Aerodeslizadores", costo: 1400, desbloqueada: false, prerrequisito_id: "M_21", tipo_bono: "+20% Vel Movimiento", categoria: "militar", rama: "2", nivel: 2, x: 650, y: 200 },
  { id: "M_23", nombre: "Caballería de Propulsión Iónica", costo: 2800, desbloqueada: false, prerrequisito_id: "M_22", tipo_bono: "+50% Ataque Sorpresa", categoria: "militar", rama: "2", nivel: 3, x: 950, y: 200 },
  
  // Rama 3: Artillería
  { id: "M_31", nombre: "Artillería de Asedio de Precisión", costo: 800, desbloqueada: false, prerrequisito_id: "M_ROOT", tipo_bono: "+15% Daño Área", categoria: "militar", rama: "3", nivel: 1, x: 350, y: 350 },
  { id: "M_32", nombre: "Munición Inteligente Guiada por IA", costo: 1600, desbloqueada: false, prerrequisito_id: "M_31", tipo_bono: "+25% Precisión", categoria: "militar", rama: "3", nivel: 2, x: 650, y: 350 },
  { id: "M_33", nombre: "Cañones de Riel Electromagnéticos", costo: 3000, desbloqueada: false, prerrequisito_id: "M_32", tipo_bono: "+60% Daño a Fortalezas", categoria: "militar", rama: "3", nivel: 3, x: 950, y: 350 },
  
  // Rama 4: Secreto
  { id: "M_SEC", nombre: "Cibernética de Vanguardia", costo: 4000, desbloqueada: false, prerrequisito_id: null, tipo_bono: "+100% Eficiencia Táctica", categoria: "militar", rama: "sec", nivel: 4, x: 1250, y: 200 },
];
