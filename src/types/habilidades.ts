export type DBHabilidad = {
  habilidad_id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  categoria: string;
  rama: string;
  eje_x: number;
  eje_y: number;
};

export type Habilidad = {
  id: string;
  nombre: string;
  costo: number;
  desbloqueada: boolean;
  prerrequisitos: string[];
  tipo_bono: string;
  categoria: "desarrollo" | "militar";
  rama: string;
  nivel: number;
  x: number;
  y: number;
  tiempo_investigacion_dias?: number;
  enDesarrollo?: boolean;
  tiempoRestante?: number;
};
