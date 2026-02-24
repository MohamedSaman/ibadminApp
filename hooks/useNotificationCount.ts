import { useCallback, useEffect, useRef, useState } from 'react';
import { getUnreadNotificationCount } from '@/services/indoorAdminApi';

// Simple event emitter for notification count
type Listener = (count: number) => void;
const listeners: Set<Listener> = new Set();
let currentCount = 0;

export const notificationEvents = {
  setCount: (count: number) => {
    currentCount = count;
    listeners.forEach(listener => listener(count));
  },
  getCount: () => currentCount,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotificationCount() {
  const [count, setCount] = useState(currentCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const unread = await getUnreadNotificationCount();
      notificationEvents.setCount(unread);
    } catch {
      // Silently ignore — user may not be logged in yet
    }
  }, []);

  useEffect(() => {
    // Subscribe to count changes from other components
    const unsubscribe = notificationEvents.subscribe((newCount) => {
      setCount(newCount);
    });

    // Initial fetch
    fetchCount();

    // Poll periodically
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL);

    return () => {
      unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCount]);

  const updateCount = useCallback((newCount: number) => {
    notificationEvents.setCount(newCount);
  }, []);

  return { count, updateCount };
}

