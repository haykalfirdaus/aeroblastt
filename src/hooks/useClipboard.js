import { useCallback, useState } from 'react';

/**
 * Returns [copiedKey, copy]. `copy(text, key)` writes `text` to the
 * clipboard and flags `key` as copied for 1.5s — enough time to swap an
 * icon/label to a "Copied!" state before it reverts, matching the legacy
 * copyText() indicator.
 */
export function useClipboard(resetDelay = 1500) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copy = useCallback(
    async (text, key = text) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), resetDelay);
      } catch {
        // Clipboard permission denied or unavailable — fail silently, same as before.
      }
    },
    [resetDelay]
  );

  return [copiedKey, copy];
}
