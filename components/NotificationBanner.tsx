import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationPayloadEvents } from '@/hooks/useNotificationCount';

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [enabled, setEnabled] = useState(true);
  const anim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Load banner preference from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('bannerNotificationsEnabled');
        if (saved !== null) {
          setEnabled(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Failed to load banner notification preference:', e);
      }
    })();
  }, []);

  useEffect(() => {
    const unsub = notificationPayloadEvents.subscribe((n) => {
      // Only show if enabled
      if (!enabled) return;

      setPayload(n);
      setVisible(true);
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      // Auto-dismiss after 4 seconds
      setTimeout(() => hide(), 4000);
    });
    return unsub;
  }, [enabled]);

  const hide = () => {
    Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setVisible(false);
      setPayload(null);
    });
  };

  if (!visible || !payload) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] });

  const title = payload.title || 'Notification';
  const message = payload.message || (payload.data && payload.data.message) || '';

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]} pointerEvents="box-none">
      <Pressable style={styles.inner} onPress={() => { router.push('/notifications'); hide(); }}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text numberOfLines={2} style={styles.message}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // place a bit below the status bar / top edge
    top: Platform.OS === 'ios' ? 44 : 16,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingTop: 0,
  },
  inner: {
    width: '94%',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
  },
  message: {
    color: '#E5E7EB',
    marginTop: 4,
    fontSize: 13,
  }
});
