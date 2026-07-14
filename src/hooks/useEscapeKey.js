import { useEffect } from 'react';

/** Calls `onEscape` when Escape is pressed while `active` is true. */
export function useEscapeKey(active, onEscape) {
  useEffect(() => {
    if (!active) return undefined;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onEscape();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, onEscape]);
}
