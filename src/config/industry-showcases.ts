// Industry Showcases Configuration
// Defines how features map to different industries

import type { IndustryShowcase, IndustryVertical } from '../types/changelog';

export const INDUSTRY_SHOWCASES: Record<IndustryVertical, IndustryShowcase> = {
  'construction': {
    industry: 'construction',
    displayName: 'Construcción',
    icon: 'HardHat',
    color: 'orange',
    description: 'Gestión de proyectos, seguridad, y cumplimiento normativo para la industria de construcción',
    features: []
  },
  'real-estate': {
    industry: 'real-estate',
    displayName: 'Real Estate',
    icon: 'Building2',
    color: 'blue',
    description: 'Análisis de propiedades, gestión de clientes, y automatización de ventas',
    features: []
  },
  'mobility-as-service': {
    industry: 'mobility-as-service',
    displayName: 'Movilidad como Servicio',
    icon: 'Car',
    color: 'purple',
    description: 'Optimización de flotas, análisis de rutas, y experiencia del usuario',
    features: []
  },
  'banking': {
    industry: 'banking',
    displayName: 'Banca',
    icon: 'Landmark',
    color: 'emerald',
    description: 'Cumplimiento regulatorio, análisis de riesgo, y servicio al cliente',
    features: []
  },
  'fintech': {
    industry: 'fintech',
    displayName: 'Fintech',
    icon: 'Coins',
    color: 'green',
    description: 'Procesamiento de pagos, detección de fraude, y análisis financiero',
    features: []
  },
  'health': {
    industry: 'health',
    displayName: 'Salud',
    icon: 'Heart',
    color: 'red',
    description: 'Gestión de pacientes, cumplimiento HIPAA, y análisis clínico',
    features: []
  },
  'corporate-venture-capital': {
    industry: 'corporate-venture-capital',
    displayName: 'Corporate VC',
    icon: 'TrendingUp',
    color: 'indigo',
    description: 'Due diligence, análisis de portfolio, y evaluación de inversiones',
    features: []
  },
  'agriculture': {
    industry: 'agriculture',
    displayName: 'Agricultura',
    icon: 'Sprout',
    color: 'lime',
    description: 'Optimización de cultivos, análisis de clima, y gestión de recursos',
    features: []
  },
  'multi-family-office': {
    industry: 'multi-family-office',
    displayName: 'Family Office',
    icon: 'Users',
    color: 'violet',
    description: 'Gestión patrimonial, reportes personalizados, y compliance',
    features: []
  },
  'retail': {
    industry: 'retail',
    displayName: 'Retail',
    icon: 'ShoppingBag',
    color: 'pink',
    description: 'Inventario, análisis de ventas, y experiencia del cliente',
    features: []
  },
  'ecommerce': {
    industry: 'ecommerce',
    displayName: 'eCommerce',
    icon: 'ShoppingCart',
    color: 'cyan',
    description: 'Gestión de catálogo, personalización, y optimización de conversión',
    features: []
  },
  'higher-education': {
    industry: 'higher-education',
    displayName: 'Educación Superior',
    icon: 'GraduationCap',
    color: 'yellow',
    description: 'Gestión académica, investigación, y soporte estudiantil',
    features: []
  },
  'smbs': {
    industry: 'smbs',
    displayName: 'PyMEs',
    icon: 'Store',
    color: 'amber',
    description: 'Automatización de procesos, atención al cliente, y crecimiento',
    features: []
  }
};

// Feature categories with display information
export const FEATURE_CATEGORIES = {
  'ai-agents': {
    name: 'Agentes IA',
    icon: 'Bot',
    color: 'blue',
    description: 'Asistentes inteligentes configurables'
  },
  'context-management': {
    name: 'Gestión de Contexto',
    icon: 'FileText',
    color: 'green',
    description: 'Documentos, PDFs, y fuentes de conocimiento'
  },
  'security': {
    name: 'Seguridad',
    icon: 'Shield',
    color: 'red',
    description: 'Protección de datos y acceso'
  },
  'compliance': {
    name: 'Cumplimiento',
    icon: 'CheckCircle',
    color: 'emerald',
    description: 'Normativas y regulaciones'
  },
  'integrations': {
    name: 'Integraciones',
    icon: 'Puzzle',
    color: 'purple',
    description: 'Conectores y APIs'
  },
  'analytics': {
    name: 'Analíticas',
    icon: 'BarChart3',
    color: 'indigo',
    description: 'Métricas y reportes'
  },
  'collaboration': {
    name: 'Colaboración',
    icon: 'Users',
    color: 'cyan',
    description: 'Trabajo en equipo'
  },
  'deployment': {
    name: 'Despliegue',
    icon: 'Rocket',
    color: 'orange',
    description: 'Infraestructura y DevOps'
  },
  'developer-tools': {
    name: 'Herramientas Dev',
    icon: 'Code',
    color: 'slate',
    description: 'CLI, SDK, y APIs'
  },
  'productivity': {
    name: 'Productividad',
    icon: 'Zap',
    color: 'yellow',
    description: 'Flujos de trabajo eficientes'
  },
  'communication': {
    name: 'Comunicación',
    icon: 'MessageSquare',
    color: 'pink',
    description: 'Canales omnicanal'
  }
} as const;


