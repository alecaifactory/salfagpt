#!/bin/bash
##
# Bulk Create Salfacorp Users via API
#
# Creates 43 Salfacorp users as normal 'user' role via the API endpoint.
# Requires:
#   1. Dev server running (npm run dev)
#   2. Admin session (login at http://localhost:3000/chat)
#   3. Session cookie from browser
#
# Usage:
#   1. Start dev server in another terminal: npm run dev
#   2. Login as admin: http://localhost:3000/chat
#   3. Open DevTools → Application → Cookies → flow_session
#   4. Copy the cookie value
#   5. Run: ./scripts/create-salfacorp-users-via-api.sh "your-session-cookie"

set -e

# Check if session cookie provided
if [ -z "$1" ]; then
  echo "❌ Error: Session cookie required"
  echo ""
  echo "Usage:"
  echo "  1. Start dev server: npm run dev"
  echo "  2. Login as admin: http://localhost:3000/chat"
  echo "  3. Get session cookie from DevTools"
  echo "  4. Run: $0 'your-session-cookie'"
  exit 1
fi

SESSION_COOKIE="$1"
CREATED_BY="alec@getaifactory.com"

echo "👥 Creando 43 usuarios de Salfacorp..."
echo "======================================"
echo ""

# Prepare CSV data (email,name,role,company,department)
CSV_DATA="nfarias@salfagestion.cl,Nenett Farias,user,Salfa Gestión,
acastillo@salfagestion.cl,Andy Castillo,user,Salfa Gestión,
mmelin@salfagestion.cl,Marcos Melin,user,Salfa Gestión,
sorellanac@salfagestion.cl,Sebastian Orellana,user,Salfa Gestión,
fdiazt@salfagestion.cl,FRANCIS ANAIS DIAZ TOBAR,user,Salfa Gestión,
mjaramillo@salfamontajes.com,Matías Jaramillo,user,Salfa Montajes,
plambert@fegrande.cl,Paul Lambert,user,FE Grande,
avalderramad@geovita.cl,Alejandro Valderrama,user,Geovita,
iwebar@salfaustral.cl,Ignacio Webar,user,Salfa Austral,
lramos@fegrande.cl,Luis Ramos,user,FE Grande,
abecerrao@salfamontajes.com,Ariel Becerra,user,Salfa Montajes,
fpereza@salfamontajes.com,Franco Pérez,user,Salfa Montajes,
cmaldonados@novatec.cl,Carlos Maldonado,user,Novatec,
erioseco@salfamantenciones.cl,Eduardo Rioseco,user,Salfa Mantenciones,
gherreral@tecsa.cl,Gabriel Herrera,user,Tecsa,
jmestre@salfaustral.cl,John Mestre,user,Salfa Austral,
lpenaag@salfamontajes.com,Lucas Peña,user,Salfa Montajes,
tidiaz@maqsa.cl,Tomás Díaz,user,Maqsa,
msotoq@salfagestion.cl,MATIAS NICOLAS SOTO QUEZADA,user,Salfa Gestión,
dtorres@salfagestion.cl,Daniel Emilio Torres Mora,user,Salfa Gestión,
nimunoz@salfacorp.com,N. IVAN MUÑOZ TORRES,user,Salfa Corp,
cesar@salfacloud.cl,Soporte,user,Salfa Cloud,
rkrause@tecsa.cl,RONALD JOACHIM KRAUSE ORELLANA,user,Tecsa,
ftramon@tecsa.cl,FRANCISCA TIARE TRAMON LABORDA,user,Tecsa,
nmunozm@salfagestion.cl,NICOLAS IGNACIO MUÑOZ MORALES,user,Salfa Gestión,
dcifuentes@salfamontajes.com,DANIEL EDMUNDO CIFUENTES CARRASCO,user,Salfa Montajes,
cmsaavedra@salfagestion.cl,CAMILA MARGARITA SAAVEDRA SILVA,user,Salfa Gestión,
wcerda@salfamontajes.com,WILSON OCTAVIO CERDA CORTES,user,Salfa Montajes,
respicel@salfaustral.cl,RICARDO ALBERTO ESPICEL LA PAZ,user,Salfa Austral,
ojimenez@inoval.cl,OSCAR PEDRO JIMENEZ URETA,user,Inoval,
snunez@salfamontajes.com,SEBASTIAN IGNACIO NUÑEZ CONTRERAS,user,Salfa Montajes,
aialvarez@geovita.cl,ANIBAL IGNACIO ALVAREZ MORENO,user,Geovita,
jahumadaa@salfamontajes.com,JOSE ARIEL AHUMADA ALVEAL,user,Salfa Montajes,
jriverof@iaconcagua.com,JULIO IGNACIO RIVERO FIGUEROA,user,IA Concagua,
dortega@novatec.cl,DANIEL ADOLFO ORTEGA VIDELA,user,Novatec,
mburgoa@novatec.cl,MANUEL ALEJANDRO BURGOA MARAMBIO,user,Novatec,
gfalvarez@novatec.cl,GONZALO FERNANDO ALVAREZ GONZALEZ,user,Novatec,
akamke@salfagestion.cl,AGUSTIN PABLO KAMKE MARDONES,user,Salfa Gestión,
rfuentesm@inoval.cl,RICARDO ANDRES FUENTES MOISAN,user,Inoval,
scortesr@salfagestion.cl,SEBASTIAN RODRIGO Cortes Rodriguez,user,Salfa Gestión,
mbarriga@salfagestion.cl,MARÍA INÉS BARRIGA TAPIA,user,Salfa Gestión,
hcastillo@fegrande.cl,Hans Castillo,user,FE Grande,
capacitacionesia@salfacloud.cl,Capacitaciones IA,user,Salfa Cloud,"

# Call API
echo "📡 Llamando a API /api/users/bulk..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/users/bulk \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=$SESSION_COOKIE" \
  -d "{\"csvText\": \"$CSV_DATA\", \"createdBy\": \"$CREATED_BY\"}")

# Parse response
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Script completado"
echo ""
echo "💡 Verifica los resultados arriba"
echo "💡 Los usuarios creados ahora pueden iniciar sesión con Google OAuth"

