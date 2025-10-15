import { useEffect } from 'react';

/**
 * Hook to handle modal closing with ESC key and click outside
 * Usage:
 *   useModalClose(isOpen, onClose);
 */
export function useModalClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    // Handle ESC key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('🔑 ESC pressed - closing modal');
        onClose();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleEscape);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
}

/**
 * Helper function to handle backdrop click
 * Usage:
 *   <div onClick={handleBackdropClick(onClose)}>
 *     <div onClick={(e) => e.stopPropagation()}>
 *       Modal content
 *     </div>
 *   </div>
 */
export function handleBackdropClick(onClose: () => void) {
  return (event: React.MouseEvent) => {
    // Only close if clicking the backdrop itself
    if (event.target === event.currentTarget) {
      console.log('🖱️ Click outside modal - closing');
      onClose();
    }
  };
}

