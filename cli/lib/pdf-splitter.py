#!/usr/bin/env python3
"""
PDF Splitter for Large Manuals

Purpose: Split large PDFs (>50MB) into smaller chunks for Gemini processing
Method: PyPDF2 (more robust than pdf-lib for corrupted PDFs)

Created: 2025-11-21
"""

import sys
import os
from PyPDF2 import PdfReader, PdfWriter
import json

def split_pdf(input_path: str, max_size_mb: float = 45, output_dir: str = None) -> dict:
    """
    Split PDF into chunks under max_size_mb
    
    Args:
        input_path: Path to input PDF
        max_size_mb: Maximum size per chunk in MB (default: 45MB for safety)
        output_dir: Output directory (default: same as input)
    
    Returns:
        dict with chunk_files and metadata
    """
    print(f'📄 [Python] Splitting PDF: {os.path.basename(input_path)}', file=sys.stderr)
    
    if not os.path.exists(input_path):
        return {
            'success': False,
            'error': f'File not found: {input_path}'
        }
    
    # Get file size
    file_size_mb = os.path.getsize(input_path) / (1024 * 1024)
    print(f'   Size: {file_size_mb:.2f} MB', file=sys.stderr)
    
    # If file is already small enough, no need to split
    if file_size_mb <= max_size_mb:
        print(f'✅ [Python] File is already under {max_size_mb}MB, no splitting needed', file=sys.stderr)
        return {
            'success': True,
            'chunk_files': [input_path],
            'total_chunks': 1,
            'total_pages': None,  # Will be determined later
            'split_required': False
        }
    
    try:
        # Read PDF
        print('   📖 Reading PDF...', file=sys.stderr)
        reader = PdfReader(input_path)
        total_pages = len(reader.pages)
        print(f'   Total pages: {total_pages}', file=sys.stderr)
        
        # Calculate pages per chunk
        # Estimate: pages_per_chunk = (max_size_mb / file_size_mb) * total_pages
        pages_per_chunk = max(1, int((max_size_mb / file_size_mb) * total_pages * 0.9))  # 0.9 safety factor
        print(f'   Pages per chunk: ~{pages_per_chunk}', file=sys.stderr)
        
        # Setup output directory
        if output_dir is None:
            output_dir = os.path.dirname(input_path)
        
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        
        # Split into chunks
        chunk_files = []
        chunk_num = 0
        page_idx = 0
        
        while page_idx < total_pages:
            chunk_num += 1
            end_page = min(page_idx + pages_per_chunk, total_pages)
            
            # Create new PDF for this chunk
            writer = PdfWriter()
            
            for p in range(page_idx, end_page):
                writer.add_page(reader.pages[p])
            
            # Write chunk to file
            chunk_filename = f'{base_name}_chunk{chunk_num:03d}_p{page_idx+1}-{end_page}.pdf'
            chunk_path = os.path.join(output_dir, chunk_filename)
            
            with open(chunk_path, 'wb') as output_file:
                writer.write(output_file)
            
            chunk_size_mb = os.path.getsize(chunk_path) / (1024 * 1024)
            print(f'   ✅ Chunk {chunk_num}: Pages {page_idx+1}-{end_page} ({chunk_size_mb:.2f}MB)', file=sys.stderr)
            
            chunk_files.append(chunk_path)
            page_idx = end_page
        
        print(f'✅ [Python] Split into {len(chunk_files)} chunks', file=sys.stderr)
        
        return {
            'success': True,
            'chunk_files': chunk_files,
            'total_chunks': len(chunk_files),
            'total_pages': total_pages,
            'split_required': True,
            'pages_per_chunk': pages_per_chunk
        }
        
    except Exception as e:
        print(f'❌ [Python] Error splitting PDF: {str(e)}', file=sys.stderr)
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 pdf-splitter.py <input.pdf> [max_size_mb] [output_dir]', file=sys.stderr)
        sys.exit(1)
    
    input_pdf = sys.argv[1]
    max_size = float(sys.argv[2]) if len(sys.argv) > 2 else 45.0
    output_dir = sys.argv[3] if len(sys.argv) > 3 else None
    
    result = split_pdf(input_pdf, max_size, output_dir)
    
    # Output JSON to stdout (for Node.js to parse)
    print(json.dumps(result))
    
    sys.exit(0 if result.get('success') else 1)

