import { ThemedText } from '@/components/themed-text';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as apiDeleteNotification,
} from '@/services/indoorAdminApi';
import { AdminNotification, AdminNotificationType } from '@/types/api';

// ─── Helpers ──────────────────────────────────────────────
function getTypeLabel(type: AdminNotificationType): string {
  const map: Record<AdminNotificationType, string> = {
    new_booking: 'New Booking',
    booking_confirmed: 'Confirmed',
    booking_cancelled: 'Cancelled',
    booking_completed: 'Completed',
    booking_updated: 'Updated',
    password_changed: 'Security',
    system: 'System',
  };
  return map[type] || 'Notification';
}

function getTypeColor(type: AdminNotificationType): string {
  const map: Record<AdminNotificationType, string> = {
    new_booking: '#10B981',
    booking_confirmed: '#0EA5E9',
    booking_cancelled: '#EF4444',
    booking_completed: '#8B5CF6',
    booking_updated: '#F59E0B',
    password_changed: '#F97316',
    system: '#6366F1',
  };
  return map[type] || '#6B7280';
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ─── Component ────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const { updateCount } = useNotificationCount();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const PAGE_SIZE = 20;

  // ─── Fetch ───────────────────────────────────────────
  const fetchNotifications = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        const res = await getAdminNotifications(pageNum, PAGE_SIZE);
        if (append) {
          setNotifications((prev) => [...prev, ...res.results]);
        } else {
          setNotifications(res.results);
        }
        setTotalCount(res.count);
        setPage(pageNum);

        // Update global badge count
        const unread = append
          ? [...notifications, ...res.results].filter((n) => !n.is_read).length
          : res.results.filter((n) => !n.is_read).length;
        updateCount(unread);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    },
    [],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchNotifications(1);
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(1);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || notifications.length >= totalCount) return;
    setLoadingMore(true);
    await fetchNotifications(page + 1, true);
    setLoadingMore(false);
  };

  // ─── Actions ─────────────────────────────────────────
  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      const newUnread = notifications.filter((n) => !n.is_read && n.id !== id).length;
      updateCount(newUnread);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      updateCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeleteNotification(id);
            const updated = notifications.filter((n) => n.id !== id);
            setNotifications(updated);
            updateCount(updated.filter((n) => !n.is_read).length);
            if (selectedNotification?.id === id) {
              setDetailsModalVisible(false);
              setSelectedNotification(null);
            }
          } catch (err) {
            console.error('Failed to delete notification:', err);
          }
        },
      },
    ]);
  };

  const handleNotificationPress = (notification: AdminNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    setSelectedNotification(notification);
    setDetailsModalVisible(true);
  };

  // ─── Counts ──────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ─── Render Item ─────────────────────────────────────
  const renderNotificationItem = ({ item }: { item: AdminNotification }) => {
    const color = getTypeColor(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.is_read && styles.notificationCardUnread]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <ThemedText style={styles.notificationDescription} numberOfLines={2}>
            {item.message}
          </ThemedText>
          <View style={styles.notificationFooter}>
            <ThemedText style={styles.notificationTime}>{timeAgo(item.created_at)}</ThemedText>
            <View style={[styles.notificationBadge, { backgroundColor: color + '18' }]}>
              <Text style={[styles.notificationBadgeText, { color }]}>
                {getTypeLabel(item.type)}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ─── Render ──────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Ionicons name="checkmark-done" size={24} color="#0EA5E9" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <ThemedText style={styles.loadingText}>Loading notifications…</ThemedText>
          </View>
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0EA5E9']} />
            }
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator style={{ paddingVertical: 16 }} color="#0EA5E9" />
              ) : null
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#D1D5DB" />
            <ThemedText style={styles.emptyText}>No notifications</ThemedText>
            <ThemedText style={styles.emptySubText}>You're all caught up!</ThemedText>
          </View>
        )}

        {/* Detail Popup */}
        {detailsModalVisible && selectedNotification && (
          <View style={styles.messageContainer}>
            <TouchableOpacity
              style={styles.messageOverlay}
              onPress={() => setDetailsModalVisible(false)}
            />
            <View
              style={[
                styles.messageBubble,
                { borderLeftColor: getTypeColor(selectedNotification.type) },
              ]}
            >
              <View style={styles.messageBubbleHeader}>
                <ThemedText style={styles.messageBubbleTitle}>
                  {selectedNotification.title}
                </ThemedText>
                <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.messageBubbleText}>
                {selectedNotification.message}
              </ThemedText>

              {/* Booking Details from data JSON */}
              {selectedNotification.data && selectedNotification.data.booking_id && (
                <>
                  <View style={styles.messageDivider} />
                  <ThemedText style={styles.messageDetailLabel}>Booking Details:</ThemedText>
                  {selectedNotification.data.game_name && (
                    <ThemedText style={styles.messageDetailText}>
                      • Sport: {selectedNotification.data.game_name}
                    </ThemedText>
                  )}
                  {selectedNotification.data.court_number && (
                    <ThemedText style={styles.messageDetailText}>
                      • Court: {selectedNotification.data.court_number}
                    </ThemedText>
                  )}
                  {selectedNotification.data.booking_date && (
                    <ThemedText style={styles.messageDetailText}>
                      • Date: {selectedNotification.data.booking_date}
                    </ThemedText>
                  )}
                  {selectedNotification.data.start_time && (
                    <ThemedText style={styles.messageDetailText}>
                      • Time: {selectedNotification.data.start_time} -{' '}
                      {selectedNotification.data.end_time}
                    </ThemedText>
                  )}
                  {selectedNotification.data.user_name && (
                    <ThemedText style={styles.messageDetailText}>
                      • Customer: {selectedNotification.data.user_name}
                    </ThemedText>
                  )}
                  {selectedNotification.data.price && (
                    <ThemedText style={styles.messageDetailText}>
                      • Price: Rs {selectedNotification.data.price}
                    </ThemedText>
                  )}
                </>
              )}

              <ThemedText style={styles.messageTime}>
                {timeAgo(selectedNotification.created_at)}
              </ThemedText>
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationCardUnread: {
    borderLeftColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0EA5E9',
    marginLeft: 8,
  },
  notificationDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  notificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  messageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    marginHorizontal: 20,
    maxWidth: '85%',
    zIndex: 10,
  },
  messageBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageBubbleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  messageBubbleText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  messageDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  messageDetailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  messageDetailText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 10,
  },
});
