// Types for source validation and sharing

export interface JobRole {
  id: string;
  name: string;
  description: string;
  okrs: string[];
}

export interface SourceValidation {
  validated: boolean;
  validatedBy: string;
  validatedAt?: Date;
  qualityScore?: number;
  comments?: string;
}

export interface ShareTarget {
  type: 'user' | 'group';
  id: string;
  name: string;
  email?: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  summary: string;
  userComments: string;
  personalizedRequest: string;
}

export const DEFAULT_JOB_ROLES: JobRole[] = [
  {
    id: 'executive',
    name: 'Ejecutivo / C-Level',
    description: 'CEO, CFO, COO - Toma de decisiones estratégicas',
    okrs: [
      'Aumentar ingresos anuales en 20%',
      'Expandir a 3 nuevos mercados',
      'Mejorar eficiencia operativa en 15%',
      'Alcanzar 95% satisfacción del cliente',
    ],
  },
  {
    id: 'manager',
    name: 'Gerente / Manager',
    description: 'Gestión de equipos y proyectos',
    okrs: [
      'Completar 100% de proyectos a tiempo',
      'Reducir rotación de personal a <10%',
      'Aumentar productividad del equipo en 25%',
      'Implementar 5 mejoras de proceso',
    ],
  },
  {
    id: 'analyst',
    name: 'Analista / Especialista',
    description: 'Análisis de datos y generación de insights',
    okrs: [
      'Generar 20 reportes de insights mensuales',
      'Reducir tiempo de análisis en 30%',
      'Automatizar 5 procesos de reporte',
      'Mejorar precisión de pronósticos a 90%',
    ],
  },
  {
    id: 'sales',
    name: 'Ventas / Business Development',
    description: 'Generación de ingresos y relaciones con clientes',
    okrs: [
      'Cerrar $500K en nuevos contratos',
      'Aumentar pipeline en 40%',
      'Alcanzar 90% de cuota trimestral',
      'Generar 50 leads calificados/mes',
    ],
  },
  {
    id: 'operations',
    name: 'Operaciones',
    description: 'Optimización de procesos y eficiencia',
    okrs: [
      'Reducir costos operativos en 15%',
      'Mejorar tiempo de respuesta en 50%',
      'Implementar 3 automatizaciones',
      'Alcanzar 99% uptime de sistemas',
    ],
  },
  {
    id: 'hr',
    name: 'Recursos Humanos',
    description: 'Gestión de talento y cultura organizacional',
    okrs: [
      'Contratar 20 posiciones clave',
      'Aumentar engagement a 85%',
      'Reducir tiempo de contratación a 30 días',
      'Implementar 4 programas de desarrollo',
    ],
  },
];

