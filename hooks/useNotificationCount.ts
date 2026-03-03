import { useCallback, useEffect, useRef, useState } from 'react';
import { getUnreadNotificationCount, getAdminNotifications } from '@/services/indoorAdminApi';

// Simple event emitter for notification count
type Listener = (count: number) => void;
type NotificationListener = (notification: any) => void;
const listeners: Set<Listener> = new Set();
const notificationListeners: Set<NotificationListener> = new Set();
let currentCount = 0;

export const notificationEvents = {
  setCount: (count: number) => {
    const old = currentCount;
    currentCount = count;
    listeners.forEach(listener => listener(count));

    // If count increased, fetch latest notification and emit payload (don't block caller)
    if (count > old) {
      (async () => {
        try {
          const res = await getAdminNotifications(1, 1);
          const latest = res && res.results && res.results[0];
          if (latest) notificationPayloadEvents.show(latest);
        } catch (e) {
          // ignore
        }
      })();
    }
  },
  getCount: () => currentCount,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

// Emit full notification payloads when a new notification arrives
export const notificationPayloadEvents = {
  show: (notification: any) => {
    notificationListeners.forEach(l => l(notification));
  },
  subscribe: (listener: NotificationListener) => {
    notificationListeners.add(listener);
    return () => notificationListeners.delete(listener);
  }
};

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotificationCount() {
  const [count, setCount] = useState(currentCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const unread = await getUnreadNotificationCount();

      // If count increased since last known value, fetch latest notification and emit full payload
      try {
        if (unread > notificationEvents.getCount()) {
          const res = await getAdminNotifications(1, 1);
          const latest = res && res.results && res.results[0];
          if (latest) notificationPayloadEvents.show(latest);
        }
      } catch (e) {
        // ignore payload fetch errors silently
      }

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

