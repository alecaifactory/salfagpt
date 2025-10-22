import { useEffect, useRef } from 'react';

/**
 * Hook for handling modal close on ESC key and click outside
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback to close the modal
 * @param closeOnOutsideClick - Whether to close on outside click (default: true)
 * @param closeOnEscape - Whether to close on ESC key (default: true)
 */
export function useModalClose(
  isOpen: boolean,
  onClose: () => void,
  closeOnOutsideClick: boolean = true,
  closeOnEscape: boolean = true
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
    document.addEventListener('mousedown', handleClickOutside);

    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, closeOnOutsideClick, closeOnEscape]);

  return modalRef;
}
