#!/bin/bash
# Generate detailed status table for M3-v2 upload

LOG_FILE="m3v2-upload-full.log"

echo "📊 M3-v2 UPLOAD - DETAILED STATUS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Count totals
TOTAL_FILES=$(find upload-queue/M3-v2-20251125 -name "*.PDF" -o -name "*.pdf" | wc -l | tr -d ' ')
STARTED=$(grep -c "📄 ARCHIVO" "$LOG_FILE" 2>/dev/null || echo "0")
COMPLETED=$(grep -c "✅ ARCHIVO COMPLETADO" "$LOG_FILE" 2>/dev/null || echo "0")
FAILED=$(grep -c "❌.*failed:" "$LOG_FILE" 2>/dev/null || echo "0")

echo "Progress: $STARTED/$TOTAL_FILES started | $COMPLETED completed | $FAILED failed"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Get list of all files
echo "📁 DOCUMENT STATUS BY FOLDER"
echo ""

# Parse log to get status of each file
python3 << 'PYTHON'
import re
from pathlib import Path

log_file = "m3v2-upload-full.log"

try:
    with open(log_file, 'r') as f:
        content = f.read()
except:
    print("Log file not found")
    exit(0)

# Find all files mentioned
file_pattern = r'📄 ARCHIVO \d+ de \d+.*?📁 Archivo: (.+?)(?:\n|$)'
files_found = re.findall(file_pattern, content)

# Check status of each
status_map = {}

for filename in files_found:
    # Check if completed
    if f"✅ ARCHIVO COMPLETADO: {filename}" in content:
        status_map[filename] = "✅ COMPLETE"
    elif f"❌ {filename} failed:" in content:
        # Get error details
        error_pattern = f"❌ {re.escape(filename)} failed: (.+?)(?:\n|$)"
        error_match = re.search(error_pattern, content)
        if error_match:
            error = error_match.group(1)[:50]
            status_map[filename] = f"❌ FAILED: {error}"
        else:
            status_map[filename] = "❌ FAILED"
    else:
        status_map[filename] = "⏳ IN PROGRESS"

# Get all PDFs from folder
base_path = Path("upload-queue/M3-v2-20251125")
all_pdfs = sorted(base_path.rglob("*.PDF")) + sorted(base_path.rglob("*.pdf"))
all_pdfs = sorted(set([p.name for p in all_pdfs]))

# Group by folder
from collections import defaultdict
folder_groups = defaultdict(list)

for pdf_path in sorted(base_path.rglob("*.PDF")) + sorted(base_path.rglob("*.pdf")):
    folder = pdf_path.parent.name
    if folder == "M3-v2-20251125":
        folder = "ROOT"
    filename = pdf_path.name
    
    # Get status
    status = status_map.get(filename, "⏸️  PENDING")
    
    folder_groups[folder].append((filename, status))

# Print by folder
for folder in sorted(folder_groups.keys()):
    print(f"\n{'─'*80}")
    print(f"📁 {folder}")
    print(f"{'─'*80}\n")
    
    files = folder_groups[folder]
    
    # Print table header
    print(f"{'#':<4} {'Document Name':<60} {'Status':<20}")
    print(f"{'-'*4} {'-'*60} {'-'*20}")
    
    for idx, (filename, status) in enumerate(files, 1):
        # Truncate long filenames
        display_name = filename[:57] + "..." if len(filename) > 60 else filename
        print(f"{idx:<4} {display_name:<60} {status:<20}")
    
    print(f"\nSubtotal: {len(files)} files")

print(f"\n{'═'*80}")
print(f"GRAND TOTAL: {len(all_pdfs)} unique PDF files")
print(f"{'═'*80}\n")

PYTHON

