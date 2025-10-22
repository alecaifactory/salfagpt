#!/usr/bin/env tsx
/**
 * Bulk Create Salfacorp Users via API
 * 
 * Calls the admin API endpoint to create users.
 * Requires running dev server with admin session.
 * 
 * Usage:
 *   1. Start dev server: npm run dev
 *   2. Login as admin at http://localhost:3000/chat
 *   3. Get your session cookie from browser DevTools
 *   4. Run: SESSION_COOKIE="your-cookie" npx tsx scripts/bulk-create-via-api.ts
 */

// CSV data parsed from user request
const USERS_DATA = [
  { firstName: 'Nenett', lastName: 'Farias', fullName: 'Nenett Farias', email: 'nfarias@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Andy', lastName: 'Castillo', fullName: 'Andy Castillo', email: 'acastillo@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Marcos', lastName: 'Melin', fullName: 'Marcos Melin', email: 'mmelin@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Sebastian', lastName: 'Orellana', fullName: 'Sebastian Orellana', email: 'sorellanac@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'FRANCIS', lastName: 'TOBAR', fullName: 'FRANCIS ANAIS DIAZ TOBAR', email: 'fdiazt@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Matías', lastName: 'Jaramillo', fullName: 'Matías Jaramillo', email: 'mjaramillo@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'Paul', lastName: 'Lambert', fullName: 'Paul Lambert', email: 'plambert@fegrande.cl', domain: 'fegrande.cl' },
  { firstName: 'Alejandro', lastName: 'Valderrama', fullName: 'Alejandro Valderrama', email: 'avalderramad@geovita.cl', domain: 'geovita.cl' },
  { firstName: 'Ignacio', lastName: 'Webar', fullName: 'Ignacio Webar', email: 'iwebar@salfaustral.cl', domain: 'salfaustral.cl' },
  { firstName: 'Luis', lastName: 'Ramos', fullName: 'Luis Ramos', email: 'lramos@fegrande.cl', domain: 'fegrande.cl' },
  { firstName: 'Ariel', lastName: 'Becerra', fullName: 'Ariel Becerra', email: 'abecerrao@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'Franco', lastName: 'Pérez', fullName: 'Franco Pérez', email: 'fpereza@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'Carlos', lastName: 'Maldonado', fullName: 'Carlos Maldonado', email: 'cmaldonados@novatec.cl', domain: 'novatec.cl' },
  { firstName: 'Eduardo', lastName: 'Rioseco', fullName: 'Eduardo Rioseco', email: 'erioseco@salfamantenciones.cl', domain: 'salfamantenciones.cl' },
  { firstName: 'Gabriel', lastName: 'Herrera', fullName: 'Gabriel Herrera', email: 'gherreral@tecsa.cl', domain: 'tecsa.cl' },
  { firstName: 'John', lastName: 'Mestre', fullName: 'John Mestre', email: 'jmestre@salfaustral.cl', domain: 'salfaustral.cl' },
  { firstName: 'Lucas', lastName: 'Peña', fullName: 'Lucas Peña', email: 'lpenaag@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'Tomás', lastName: 'Díaz', fullName: 'Tomás Díaz', email: 'tidiaz@maqsa.cl', domain: 'maqsa.cl' },
  { firstName: 'MATIAS', lastName: 'QUEZADA', fullName: 'MATIAS NICOLAS SOTO QUEZADA', email: 'msotoq@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Daniel', lastName: 'Mora', fullName: 'Daniel Emilio Torres Mora', email: 'dtorres@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'N.', lastName: 'TORRES', fullName: 'N. IVAN MUÑOZ TORRES', email: 'nimunoz@salfacorp.com', domain: 'salfacorp.com' },
  { firstName: 'Soporte', lastName: '', fullName: 'Soporte', email: 'cesar@salfacloud.cl', domain: 'salfacloud.cl' },
  { firstName: 'RONALD', lastName: 'ORELLANA', fullName: 'RONALD JOACHIM KRAUSE ORELLANA', email: 'rkrause@tecsa.cl', domain: 'tecsa.cl' },
  { firstName: 'FRANCISCA', lastName: 'LABORDA', fullName: 'FRANCISCA TIARE TRAMON LABORDA', email: 'ftramon@tecsa.cl', domain: 'tecsa.cl' },
  { firstName: 'NICOLAS', lastName: 'MORALES', fullName: 'NICOLAS IGNACIO MUÑOZ MORALES', email: 'nmunozm@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'DANIEL', lastName: 'CARRASCO', fullName: 'DANIEL EDMUNDO CIFUENTES CARRASCO', email: 'dcifuentes@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'CAMILA', lastName: 'SILVA', fullName: 'CAMILA MARGARITA SAAVEDRA SILVA', email: 'cmsaavedra@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'WILSON', lastName: 'CORTES', fullName: 'WILSON OCTAVIO CERDA CORTES', email: 'wcerda@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'RICARDO', lastName: 'PAZ', fullName: 'RICARDO ALBERTO ESPICEL LA PAZ', email: 'respicel@salfaustral.cl', domain: 'salfaustral.cl' },
  { firstName: 'OSCAR', lastName: 'URETA', fullName: 'OSCAR PEDRO JIMENEZ URETA', email: 'ojimenez@inoval.cl', domain: 'inoval.cl' },
  { firstName: 'SEBASTIAN', lastName: 'CONTRERAS', fullName: 'SEBASTIAN IGNACIO NUÑEZ CONTRERAS', email: 'snunez@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'ANIBAL', lastName: 'MORENO', fullName: 'ANIBAL IGNACIO ALVAREZ MORENO', email: 'aialvarez@geovita.cl', domain: 'geovita.cl' },
  { firstName: 'JOSE', lastName: 'ALVEAL', fullName: 'JOSE ARIEL AHUMADA ALVEAL', email: 'jahumadaa@salfamontajes.com', domain: 'salfamontajes.com' },
  { firstName: 'JULIO', lastName: 'FIGUEROA', fullName: 'JULIO IGNACIO RIVERO FIGUEROA', email: 'jriverof@iaconcagua.com', domain: 'iaconcagua.com' },
  { firstName: 'DANIEL', lastName: 'VIDELA', fullName: 'DANIEL ADOLFO ORTEGA VIDELA', email: 'dortega@novatec.cl', domain: 'novatec.cl' },
  { firstName: 'MANUEL', lastName: 'MARAMBIO', fullName: 'MANUEL ALEJANDRO BURGOA MARAMBIO', email: 'mburgoa@novatec.cl', domain: 'novatec.cl' },
  { firstName: 'GONZALO', lastName: 'GONZALEZ', fullName: 'GONZALO FERNANDO ALVAREZ GONZALEZ', email: 'gfalvarez@novatec.cl', domain: 'novatec.cl' },
  { firstName: 'AGUSTIN', lastName: 'MARDONES', fullName: 'AGUSTIN PABLO KAMKE MARDONES', email: 'akamke@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'RICARDO', lastName: 'MOISAN', fullName: 'RICARDO ANDRES FUENTES MOISAN', email: 'rfuentesm@inoval.cl', domain: 'inoval.cl' },
  { firstName: 'SEBASTIAN', lastName: 'Rodriguez', fullName: 'SEBASTIAN RODRIGO Cortes Rodriguez', email: 'scortesr@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'MARÍA', lastName: 'TAPIA', fullName: 'MARÍA INÉS BARRIGA TAPIA', email: 'mbarriga@salfagestion.cl', domain: 'salfagestion.cl' },
  { firstName: 'Hans', lastName: 'Castillo', fullName: 'Hans Castillo', email: 'hcastillo@fegrande.cl', domain: 'fegrande.cl' },
  { firstName: 'Capacitaciones', lastName: 'IA', fullName: 'Capacitaciones IA', email: 'capacitacionesia@salfacloud.cl', domain: 'salfacloud.cl' },
];

/**
 * Map domain to company name
 */
function getCompanyFromDomain(domain: string): string {
  const domainMap: Record<string, string> = {
    'salfagestion.cl': 'Salfa Gestión',
    'salfamontajes.com': 'Salfa Montajes',
    'fegrande.cl': 'FE Grande',
    'geovita.cl': 'Geovita',
    'salfaustral.cl': 'Salfa Austral',
    'novatec.cl': 'Novatec',
    'salfamantenciones.cl': 'Salfa Mantenciones',
    'tecsa.cl': 'Tecsa',
    'maqsa.cl': 'Maqsa',
    'salfacorp.com': 'Salfa Corp',
    'salfacloud.cl': 'Salfa Cloud',
    'iaconcagua.com': 'IA Concagua',
    'inoval.cl': 'Inoval',
  };

  return domainMap[domain] || domain;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies });
    
    if (!session) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (session.role !== 'admin') {
      return new Response(JSON.stringify({ 
        error: 'Forbidden' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare users data
    const usersToCreate = USERS_DATA.map(userData => ({
      email: userData.email,
      name: userData.fullName,
      company: getCompanyFromDomain(userData.domain),
      department: undefined,
    }));

    // Create all users
    const results = {
      created: [] as string[],
      errors: [] as Array<{ email: string; error: string }>,
    };

    for (const userData of usersToCreate) {
      try {
        await createUser(
          userData.email,
          userData.name,
          ['user'],
          userData.company,
          session.email,
          userData.department
        );

        results.created.push(userData.email);
        console.log(`✅ Created: ${userData.email}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ email: userData.email, error: errorMessage });
        console.error(`❌ Failed: ${userData.email} - ${errorMessage}`);
      }
    }

    // Return results
    return new Response(JSON.stringify({
      success: true,
      summary: {
        total: usersToCreate.length,
        created: results.created.length,
        failed: results.errors.length,
      },
      results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

