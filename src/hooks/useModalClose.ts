import { useEffect, useRef } from 'react';

/**
 * Hook for handling modal close on ESC key and click outside
 * 
 * Usage:
 * const modalRef = useModalClose(isOpen, onClose);
 * <div ref={modalRef}>Modal content</div>
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback to close the modal
 * @param closeOnOutsideClick - Whether to close on outside click (default: true)
 * @param closeOnEscape - Whether to close on ESC key (default: true)
 * @param preventBodyScroll - Whether to prevent body scroll when open (default: false for menus, true for modals)
 */
export function useModalClose(
  isOpen: boolean,
  onClose: () => void,
  closeOnOutsideClick: boolean = true,
  closeOnEscape: boolean = true,
  preventBodyScroll: boolean = false
) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Handle ESC key
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    // Handle click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (!closeOnOutsideClick) return;
      
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscape);
    if (closeOnOutsideClick) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Prevent body scroll when modal is open (optional)
    let originalOverflow: string | undefined;
    if (preventBodyScroll) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (closeOnOutsideClick) {
        document.removeEventListener('mousedown', handleClickOutside);
      }
      if (preventBodyScroll && originalOverflow !== undefined) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [isOpen, onClose, closeOnOutsideClick, closeOnEscape, preventBodyScroll]);

  return modalRef;
}
