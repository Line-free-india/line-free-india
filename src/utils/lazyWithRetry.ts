import { lazy, ComponentType } from 'react';

/**
 * Robust lazy loading with automatic retry for mobile devices.
 * Retries up to 3 times on chunk load failure (network hiccups / cache miss).
 * If all retries fail, reloads the page once to pull the latest asset manifest.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  name: string = 'Chunk'
) {
  return lazy(async () => {
    const sessionKey = `retry_reload_${name}`;
    const alreadyReloaded = sessionStorage.getItem(sessionKey) === 'true';

    try {
      return await factory();
    } catch (err1) {
      console.warn(`[LazyRetry] Attempt 1 failed for ${name}, retrying in 300ms...`, err1);
      await new Promise((r) => setTimeout(r, 300));
      try {
        return await factory();
      } catch (err2) {
        console.warn(`[LazyRetry] Attempt 2 failed for ${name}, retrying in 800ms...`, err2);
        await new Promise((r) => setTimeout(r, 800));
        try {
          return await factory();
        } catch (finalErr) {
          console.error(`[LazyRetry] All 3 attempts failed for ${name}:`, finalErr);
          if (!alreadyReloaded) {
            sessionStorage.setItem(sessionKey, 'true');
            window.location.reload();
            return new Promise<{ default: T }>(() => {});
          }
          throw finalErr;
        }
      }
    }
  });
}

export default lazyWithRetry;
