import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface Booking {
  id: string;
  customerEmail: string;
  sport: string;
  time: string;
  date: string;
  avatar?: string;
}

interface UpcomingBookingsProps {
  bookings: Booking[];
  onViewAll?: () => void;
  onBookingPress?: (booking: Booking) => void;
}

export function UpcomingBookings({
  bookings,
  onViewAll,
  onBookingPress,
}: UpcomingBookingsProps) {
  const getInitial = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title} lightColor="#111827">
          Upcoming
        </ThemedText>
        <TouchableOpacity onPress={onViewAll}>
          <ThemedText style={styles.viewAll} lightColor="#0EA5E9">
            View All
          </ThemedText>
        </TouchableOpacity>
      </View>

      {bookings.map((booking) => (
        <TouchableOpacity
          key={booking.id}
          style={styles.bookingCard}
          onPress={() => onBookingPress?.(booking)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <ThemedText style={styles.avatarText}>
              {getInitial(booking.customerEmail)}
            </ThemedText>
          </View>
          
          <View style={styles.bookingInfo}>
            <ThemedText style={styles.customerEmail} lightColor="#111827">
              {booking.customerEmail}
            </ThemedText>
            <ThemedText style={styles.bookingDetails} lightColor="#6B7280">
              {booking.sport} • {booking.time} {booking.date}
            </ThemedText>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}

      {bookings.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
          <ThemedText style={styles.emptyText} lightColor="#6B7280">
            No upcoming bookings
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
  },
  bookingInfo: {
    flex: 1,
  },
  customerEmail: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bookingDetails: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
});
