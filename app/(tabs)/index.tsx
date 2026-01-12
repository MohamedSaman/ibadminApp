import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Calendar,
  DashboardHeader,
  Header,
  SlotAvailability,
  StatsCard,
  UpcomingBookings,
} from '@/components/dashboard';
import SideMenu from '@/components/SideMenu';

// Mock data for the dashboard
const mockSports = [
  {
    id: 'football',
    name: 'Football',
    icon: 'football' as const,
    iconColor: '#16A34A',
    
    slots: [
      { time: '10:00 AM', status: 'available' as const },
      { time: '11:00 AM', status: 'available' as const },
      { time: '12:00 PM', status: 'available' as const },
      { time: '01:00 PM', status: 'available' as const },
      { time: '02:00 PM', status: 'available' as const },
      { time: '03:00 PM', status: 'available' as const },
      { time: '04:00 PM', status: 'available' as const },
      { time: '05:00 PM', status: 'available' as const },
      { time: '06:00 PM', status: 'booked' as const },
      { time: '07:00 PM', status: 'booked' as const },
      { time: '08:00 PM', status: 'available' as const },
      { time: '09:00 PM', status: 'available' as const },
      { time: '10:00 PM', status: 'available' as const },
    ],
  },
  {
    id: 'pools',
    name: 'Pools',
    icon: 'water' as const,
    iconColor: '#0EA5E9',
    courts: 2,
    slots: [
      { time: '10:00 AM', status: 'available' as const },
      { time: '11:00 AM', status: 'available' as const },
      { time: '12:00 PM', status: 'available' as const },
      { time: '01:00 PM', status: 'available' as const },
      { time: '02:00 PM', status: 'booked' as const },
      { time: '03:00 PM', status: 'booked' as const },
      { time: '04:00 PM', status: 'available' as const },
      { time: '05:00 PM', status: 'available' as const },
      { time: '06:00 PM', status: 'available' as const },
      { time: '07:00 PM', status: 'available' as const },
      { time: '08:00 PM', status: 'available' as const },
      { time: '09:00 PM', status: 'available' as const },
      { time: '10:00 PM', status: 'available' as const },
    ],
  },
];

const mockUpcomingBookings = [
  {
    id: '1',
    customerEmail: 'code@gmail.com',
    sport: 'Football',
    time: '6:00 PM',
    date: 'Today',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeStat, setActiveStat] = useState<'sports' | 'bookings' | 'revenue' | 'canceled'>('sports');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAddBooking = () => {
    router.push('/booking');
  };

  const handleMenuPress = () => {
    setMenuOpen(true);
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Navigate to notifications
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
    // Open profile menu
  };

  const handleNewSlot = () => {
    console.log('New slot pressed');
    // Open new slot creation
  };

  const handleSlotPress = (sport: any, slot: any) => {
    console.log('Slot pressed:', sport.name, slot.time);
    // Handle slot selection
  };

  const handleViewAllBookings = () => {
    console.log('View all bookings pressed');
    // Navigate to all bookings
  };

  const handleBookingPress = (booking: any) => {
    console.log('Booking pressed:', booking.id);
    // Navigate to booking details
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Menu, Notifications, Profile - fixed above scrollable content */}
      <Header
        onMenuPress={handleMenuPress}
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
      />

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard Title and Add Booking Button */}
        <DashboardHeader onAddBooking={handleAddBooking} />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatsCard
            title="Total Sports"
            value={2}
            trend="up"
            trendText="Increased from last month"
            icon="calendar"
            variant={activeStat === 'sports' ? 'primary' : 'default'}
            onPress={() => setActiveStat('sports')}
          />
          
          <StatsCard
            title="Total Bookings"
            value={14}
            trend="up"
            trendText="Increased from last month"
            icon="play-circle"
            variant={activeStat === 'bookings' ? 'primary' : 'default'}
            onPress={() => setActiveStat('bookings')}
          />
          
          <StatsCard
            title="Total Revenue"
            value={0}
            trend="down"
            trendText="Decreased from last month"
            icon="stats-chart"
            variant={activeStat === 'revenue' ? 'primary' : 'default'}
            onPress={() => setActiveStat('revenue')}
          />
          
          <StatsCard
            title="Canceled Booking"
            value={1}
            trend="neutral"
            trendText="On Discussion"
            icon="time"
            variant={activeStat === 'canceled' ? 'primary' : 'default'}
            onPress={() => setActiveStat('canceled')}
          />
        </View>

        {/* Slot Availability Section */}
        <SlotAvailability
          sports={mockSports}
          selectedDate={selectedDate}
          onNewPress={handleNewSlot}
          onSlotPress={handleSlotPress}
        />

        {/* Calendar */}
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Upcoming Bookings */}
        <UpcomingBookings
          bookings={mockUpcomingBookings}
          onViewAll={handleViewAllBookings}
          onBookingPress={handleBookingPress}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  statsContainer: {
    paddingHorizontal: 16,
  },
});
