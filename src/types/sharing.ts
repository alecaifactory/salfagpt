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
  {
    id: 'product',
    name: 'Product Team',
    description: 'Desarrollo y estrategia de producto',
    okrs: [
      'Lanzar 3 nuevas features estratégicas',
      'Aumentar adopción de usuarios en 35%',
      'Reducir tiempo de go-to-market en 40%',
      'Alcanzar 4.5 estrellas en satisfacción',
    ],
  },
  {
    id: 'tech',
    name: 'Tech Team',
    description: 'Desarrollo técnico e infraestructura',
    okrs: [
      'Reducir deuda técnica en 30%',
      'Alcanzar 99.9% uptime en producción',
      'Implementar 5 mejoras de performance',
      'Reducir bugs críticos a <2 por mes',
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance Team',
    description: 'Cumplimiento normativo y regulatorio',
    okrs: [
      'Lograr 100% cumplimiento en auditorías',
      'Actualizar 10 políticas corporativas',
      'Completar 4 certificaciones clave',
      'Reducir riesgos regulatorios en 50%',
    ],
  },
  {
    id: 'collections',
    name: 'Collections Team',
    description: 'Gestión de cobranzas y cuentas por cobrar',
    okrs: [
      'Reducir DSO (Days Sales Outstanding) a 35 días',
      'Recuperar 90% de cuentas vencidas',
      'Disminuir incobrables a <2% de ventas',
      'Automatizar 60% de recordatorios',
    ],
  },
  {
    id: 'treasury',
    name: 'Treasury Team',
    description: 'Gestión de tesorería y liquidez',
    okrs: [
      'Optimizar flujo de caja en 20%',
      'Reducir costos financieros en 15%',
      'Mantener ratio de liquidez >1.5',
      'Mejorar forecasting de cash flow a 95%',
    ],
  },
];

