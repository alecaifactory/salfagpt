/**
 * Sample Questions Data
 * Extracted from V1 for reusability
 */

export const AGENT_SAMPLE_QUESTIONS: Record<string, string[]> = {
  // M001 - Asistente Legal Territorial RDI
  'M001': [
    '¿Me puedes decir la diferencia entre un Loteo DFL2 y un Loteo con Construcción Simultánea?',
    '¿Cuál es la diferencia entre condominio tipo A y tipo B?',
    '¿Qué requisitos se necesitan para aprobar un permiso de edificios?',
    '¿Es posible aprobar una fusión de terrenos que no se encuentran urbanizados?',
    '¿Es posible aprobar un condominio tipo B dentro de un permiso de edificación acogido a conjunto armónico?',
    '¿Qué pasa si el PRC permite un uso de suelo y el Plan Regulador Metropolitano de Santiago lo restringe?',
    '¿Se puede edificar sobre una franja de riesgo declarada por el MINVU si se presenta un estudio geotécnico?',
    '¿Cómo se calcula la densidad bruta en un proyecto que abarca varios roles con diferentes normas urbanísticas?',
    '¿Cuál es el procedimiento para regularizar una construcción antigua en zona no edificable?',
    '¿Qué documentos necesito presentar para solicitar un permiso de edificación en un terreno afecto a declaratoria de utilidad pública?',
  ],
  
  // S001 - GESTION BODEGAS GPT
  'S001': [
    '¿Dónde busco los códigos de materiales?',
    '¿Cómo hago un pedido de convenio?',
    '¿Cómo genero el informe de consumo de petróleo?',
    '¿Cuándo debo enviar el informe de consumo de petróleo?',
    '¿Cómo genero una guía de despacho?',
    '¿Cómo hago una solicitud de transporte?',
    '¿Qué es una ST?',
    '¿Qué es una SIM?',
    '¿Cómo se realiza un traspaso de bodega?',
    '¿Cómo puedo descargar un inventario de sistema SAP?',
  ],
  
  // S002 - MAQSA Mantenimiento
  'S002': [
    '¿Cuáles son los pasos a seguir en una mantención de grúa Grove RT765E?',
    '¿Cómo cambio el filtro de aire de un motor Cummins 6bt5.9?',
    '¿Qué significa el código de falla CF103 en Camión Scania R500?',
    '¿Qué dice nuestro procedimiento de mantención respecto al margen de horas de mantenimiento?',
    '¿Qué significa que el aceite sea 15w40?',
    '¿Cada cuánto tiempo se cambia el aceite hidráulico en pluma Hiab 288xs?',
  ],
  
  // M003 - GOP GPT
  'M003': [
    '¿Qué procedimientos están asociados al plan de calidad?',
    '¿Qué planilla debo ocupar para controlar las pérdidas de hormigón?',
    '¿Qué transacción de SAP es para ver el flujo de entrada y salida de materiales?',
    '¿Qué procedimiento me sirve para el panel financiero?',
    '¿Cuáles son los pasos a seguir para iniciar una obra?',
    '¿Qué procedimiento debo seguir para controlar la portería?',
    'Dame los documentos asociados al procedimiento de entorno vecino y una breve explicación de cómo llevarlos',
  ],
};

export function getAgentCode(title: string | undefined): string | null {
  if (!title) return null;
  
  const parenthesesMatch = title.match(/\(([MS]\d{3})\)/);
  if (parenthesesMatch) return parenthesesMatch[1];
  
  const spaceMatch = title.match(/\b([MS]\d{3})\b/);
  if (spaceMatch) return spaceMatch[1];
  
  const endMatch = title.match(/([MS])\s*(\d+)$/);
  if (endMatch) {
    const num = endMatch[2].padStart(3, '0');
    return `${endMatch[1]}${num}`;
  }
  
  return null;
}

export function getSampleQuestions(code: string | null): string[] {
  if (!code) return [];
  return AGENT_SAMPLE_QUESTIONS[code] || [];
}

