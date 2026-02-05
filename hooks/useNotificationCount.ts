import { useCallback, useEffect, useState } from 'react';

// Simple event emitter for notification count
type Listener = (count: number) => void;
const listeners: Set<Listener> = new Set();
let currentCount = 2;

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

export function useNotificationCount() {
  const [count, setCount] = useState(currentCount);

  useEffect(() => {
    // Subscribe to count changes
    const unsubscribe = notificationEvents.subscribe((newCount) => {
      setCount(newCount);
    });

    // Get initial count
    setCount(notificationEvents.getCount());

    return unsubscribe;
  }, []);

  const updateCount = useCallback((newCount: number) => {
    notificationEvents.setCount(newCount);
  }, []);

  return { count, updateCount };
}
