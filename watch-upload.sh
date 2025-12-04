#!/bin/bash
# Beautiful real-time upload monitor

LOG="/Users/alec/.cursor/projects/Users-alec-salfagpt/terminals/3.txt"

while true; do
  clear
  
  # Colors
  GREEN='\033[0;32m'
  BLUE='\033[0;34m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  CYAN='\033[0;36m'
  MAGENTA='\033[0;35m'
  BOLD='\033[1m'
  DIM='\033[2m'
  NC='\033[0m'
  
  echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║${NC}           🚀 M3-V2 UPLOAD - LIVE STATUS MONITOR                      ${BOLD}${CYAN}║${NC}"
  echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  # Check if running
  if ps aux | grep -E "upload.ts.*M3-v2" | grep -v grep > /dev/null; then
    echo -e "${GREEN}✅ Status: RUNNING${NC}"
    PID=$(ps aux | grep -E "upload.ts.*M3-v2" | grep -v grep | head -1 | awk '{print $2}')
    echo -e "${DIM}   Process ID: $PID${NC}"
  else
    echo -e "${YELLOW}⏹️  Status: COMPLETED${NC}"
  fi
  
  echo ""
  echo -e "${BOLD}────────────────────────────────────────────────────────────────────────${NC}"
  echo -e "${BOLD}${BLUE}📊 PROGRESS METRICS${NC}"
  echo -e "${BOLD}────────────────────────────────────────────────────────────────────────${NC}"
  echo ""
  
  # Parse metrics
  TOTAL=62
  COMPLETED=$(grep -c "✅ ARCHIVO COMPLETADO\|✅ Documento asignado a agente" "$LOG" 2>/dev/null || echo "0")
  FAILED=$(grep -c "FAILED:" "$LOG" 2>/dev/null || echo "0")
  STARTED=$(grep -c "📄 ARCHIVO" "$LOG" 2>/dev/null || echo "0")
  IN_PROGRESS=$((STARTED - COMPLETED - FAILED))
  if [ "$IN_PROGRESS" -lt 0 ]; then IN_PROGRESS=0; fi
  
  echo -e "${GREEN}✅ Completed:  ${BOLD}$COMPLETED${NC}${GREEN}/$TOTAL${NC}"
  echo -e "${RED}❌ Failed:     ${BOLD}$FAILED${NC}"
  echo -e "${YELLOW}⏳ In Progress:${BOLD}$IN_PROGRESS${NC}"
  echo -e "${CYAN}⏸️  Pending:    ${BOLD}$((TOTAL - STARTED))${NC}"
  
  echo ""
  
  # Progress bar
  if [ "$TOTAL" -gt 0 ]; then
    PERCENT=$((COMPLETED * 100 / TOTAL))
    FILLED=$((PERCENT / 2))
    EMPTY=$((50 - FILLED))
    
    echo -e -n "${BOLD}["
    echo -e -n "${GREEN}"
    printf "%${FILLED}s" | tr ' ' '█'
    echo -e -n "${DIM}"
    printf "%${EMPTY}s" | tr ' ' '░'
    echo -e "${BOLD}] ${CYAN}$PERCENT%${NC}"
  fi
  
  # Extract cost and chunks if available
  COST=$(grep "💰 Costo acumulado:" "$LOG" 2>/dev/null | tail -1 | sed 's/.*\$//' || echo "0")
  CHUNKS=$(grep "📐 Total chunks:" "$LOG" 2>/dev/null | tail -1 | sed 's/.*: //' || echo "0")
  
  if [ "$COST" != "0" ]; then
    echo ""
    echo -e "${MAGENTA}💰 Cost so far: ${BOLD}\$${COST}${NC}"
  fi
  
  if [ "$CHUNKS" != "0" ]; then
    echo -e "${CYAN}📐 Total chunks: ${BOLD}${CHUNKS}${NC}"
  fi
  
  echo ""
  echo -e "${BOLD}────────────────────────────────────────────────────────────────────────${NC}"
  echo -e "${BOLD}${BLUE}📄 CURRENT FILES${NC}"
  echo -e "${BOLD}────────────────────────────────────────────────────────────────────────${NC}"
  echo ""
  
  # Show recent file activity
  grep "📄 ARCHIVO\|✅ ARCHIVO COMPLETADO\|✅ Documento asignado\|\[.*DONE:\|\[.*FAILED:" "$LOG" 2>/dev/null | tail -15 | while read line; do
    if echo "$line" | grep -q "✅"; then
      echo -e "${GREEN}${line}${NC}"
    elif echo "$line" | grep -q "❌\|FAILED"; then
      echo -e "${RED}${line}${NC}"
    else
      echo -e "${CYAN}${line}${NC}"
    fi
  done
  
  echo ""
  echo -e "${BOLD}────────────────────────────────────────────────────────────────────────${NC}"
  echo -e "${BOLD}${BLUE}🔄 LIVE PIPELINE ACTIVITY${NC}"
  echo -e "${BOLD}────────────────────────────────────────────────────────────────────────${NC}"
  echo ""
  
  # Show pipeline steps
  tail -40 "$LOG" 2>/dev/null | grep -E "Paso [0-9]/5:|✅.*exitoso|✅ Created.*chunks|✅.*embeddings|✅ Synced|✅ RAG enabled|✅ Documento asignado" | tail -12 | while read line; do
    if echo "$line" | grep -q "Paso 1/5"; then
      echo -e "${CYAN}   📤 $line${NC}"
    elif echo "$line" | grep -q "Paso 2/5"; then
      echo -e "${BLUE}   🤖 $line${NC}"
    elif echo "$line" | grep -q "Paso 3/5"; then
      echo -e "${MAGENTA}   💾 $line${NC}"
    elif echo "$line" | grep -q "Paso 4/5"; then
      echo -e "${YELLOW}   🧬 $line${NC}"
    elif echo "$line" | grep -q "Paso 5/5"; then
      echo -e "${GREEN}   📝 $line${NC}"
    elif echo "$line" | grep -q "✅"; then
      echo -e "${GREEN}      ✓ ${line}${NC}"
    fi
  done
  
  echo ""
  echo -e "${BOLD}────────────────────────────────────────────────────────────────────────${NC}"
  echo -e "${DIM}Updating every 3s... Press Ctrl+C to exit${NC}"
  echo -e "${BOLD}────────────────────────────────────────────────────────────────────────${NC}"
  
  sleep 3
done
