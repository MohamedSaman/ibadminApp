import { ThemedText } from '@/components/themed-text';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'cancellation' | 'reminder' | 'system';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  icon: string;
  color: string;
  bookingDetails?: {
    sport: string;
    court: string;
    date: string;
    time: string;
    customer: string;
    status: string;
    isPaid: boolean;
  };
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'booking',
    title: 'New Booking Confirmed',
    description: 'Football slot booked for today at 6:00 PM',
    timestamp: '5 minutes ago',
    isRead: false,
    icon: 'checkmark-circle',
    color: '#10B981',
    bookingDetails: {
      sport: 'Football',
      court: 'Court 1',
      date: 'January 27, 2026',
      time: '6:00 PM',
      customer: 'Ahmed Al-Mansouri',
      status: 'Confirmed',
      isPaid: true,
    },
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Received',
    description: 'Payment of AED 100 received for Pool booking',
    timestamp: '2 hours ago',
    isRead: false,
    icon: 'cash',
    color: '#059669',
    bookingDetails: {
      sport: 'Pools',
      court: 'Pool Lane 2',
      date: 'January 27, 2026',
      time: '2:00 PM',
      customer: 'Fatima Al-Kaabi',
      status: 'Paid',
      isPaid: true,
    },
  },
  {
    id: '3',
    type: 'reminder',
    title: 'Upcoming Booking Reminder',
    description: 'Reminder: Football booking in 1 hour',
    timestamp: '1 hour ago',
    isRead: true,
    icon: 'notifications',
    color: '#0EA5E9',
    bookingDetails: {
      sport: 'Football',
      court: 'Court 2',
      date: 'January 27, 2026',
      time: '7:00 PM',
      customer: 'Ali Hassan',
      status: 'Pending',
      isPaid: false,
    },
  },
  {
    id: '4',
    type: 'cancellation',
    title: 'Booking Cancelled',
    description: 'Pool booking for tomorrow cancelled by customer',
    timestamp: '3 hours ago',
    isRead: true,
    icon: 'close-circle',
    color: '#EF4444',
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update',
    description: 'New booking features are now available',
    timestamp: '1 day ago',
    isRead: true,
    icon: 'information-circle',
    color: '#8B5CF6',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const { updateCount } = useNotificationCount();

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map((notif) =>
      notif.id === id ? { ...notif, isRead: true } : notif
    );
    setNotifications(updatedNotifications);
    
    // Update global notification count immediately
    const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;
    updateCount(unreadCount);
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.bookingDetails) {
      setSelectedNotification(notification);
      setDetailsModalVisible(true);
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'booking':
        return 'Booking';
      case 'payment':
        return 'Payment';
      case 'cancellation':
        return 'Cancellation';
      case 'reminder':
        return 'Reminder';
      case 'system':
        return 'System';
      default:
        return 'Notification';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.notificationCardUnread]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <ThemedText style={styles.notificationDescription}>{item.description}</ThemedText>
        <View style={styles.notificationFooter}>
          <ThemedText style={styles.notificationTime}>{item.timestamp}</ThemedText>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{getTypeLabel(item.type)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteNotification(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        <View style={{ width: 28 }} />
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off" size={64} color="#D1D5DB" />
          <ThemedText style={styles.emptyText}>No notifications</ThemedText>
          <ThemedText style={styles.emptySubText}>You're all caught up!</ThemedText>
        </View>
      )}

      {/* Notification Details Bubble Message */}
      {detailsModalVisible && selectedNotification && (
        <View style={styles.messageContainer}>
          <TouchableOpacity
            style={styles.messageOverlay}
            onPress={() => setDetailsModalVisible(false)}
          />
          <View style={[styles.messageBubble, { borderLeftColor: selectedNotification.color }]}>
            <View style={styles.messageBubbleHeader}>
              <ThemedText style={styles.messageBubbleTitle}>{selectedNotification.title}</ThemedText>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.messageBubbleText}>{selectedNotification.description}</ThemedText>

            {selectedNotification.bookingDetails && (
              <>
                <View style={styles.messageDivider} />
                <ThemedText style={styles.messageDetailLabel}>Booking Details:</ThemedText>
                <ThemedText style={styles.messageDetailText}>
                  • {selectedNotification.bookingDetails.sport} - {selectedNotification.bookingDetails.court}
                </ThemedText>
                <ThemedText style={styles.messageDetailText}>
                  • {selectedNotification.bookingDetails.date} at {selectedNotification.bookingDetails.time}
                </ThemedText>
                <ThemedText style={styles.messageDetailText}>
                  • Customer: {selectedNotification.bookingDetails.customer}
                </ThemedText>
                <ThemedText style={styles.messageDetailText}>
                  • Status: {selectedNotification.bookingDetails.status}
                </ThemedText>
                <ThemedText style={[styles.messageDetailText, { color: selectedNotification.bookingDetails.isPaid ? '#10B981' : '#EF4444' }]}>
                  • Payment: {selectedNotification.bookingDetails.isPaid ? 'Paid' : 'Unpaid'}
                </ThemedText>
              </>
            )}

            <ThemedText style={styles.messageTime}>{selectedNotification.timestamp}</ThemedText>
          </View>
        </View>
      )}
      </SafeAreaView>
    </>
  );
}

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
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
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
  detailsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
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
  detailsHeader: {
    backgroundColor: '#15803D',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  detailsCloseBtn: {
    padding: 8,
  },
  detailsContent: {
    padding: 20,
  },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  simpleLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  simpleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailsFooter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButton: {
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
