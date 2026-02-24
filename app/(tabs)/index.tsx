import { useNotificationCount } from '@/hooks/useNotificationCount';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    DashboardHeader,
    Header,
    SlotAvailability,
    StatsCard,
    UpcomingBookings,
} from '@/components/dashboard';
import SideMenu from '@/components/SideMenu';
import { getDashboardStats, getUpcomingBookings, getSports, getSlotAvailability, logout } from '@/services/indoorAdminApi';
import { DashboardStats, Booking, Sport, SlotAvailabilityResponse } from '@/types/api';

// Define preferred sport order (early registered sports first)
const SPORT_ORDER_PRIORITY: Record<string, number> = {
  'football': 1,
  'soccer': 98,
  'cricket': 2,
  'pool': 3,
  'swimming': 3,
  'basketball': 4,
  'badminton': 5,
  'tennis': 6,
  'gym': 98,
};

// Helper function to get sort priority for a sport
const getSportPriority = (sportName: string): number => {
  const name = sportName.toLowerCase().trim();
  for (const [key, priority] of Object.entries(SPORT_ORDER_PRIORITY)) {
    if (name.includes(key)) {
      return priority;
    }
  }
  // Default: put unknown sports at the end, sorted alphabetically
  return 100;
};

// Base mock data for sports
const baseSportData = [
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
  {
    id: 'cricket',
    name: 'Cricket',
    icon: 'radio-button-on' as const,
    iconColor: '#DC2626',
    courts: 1,
    slots: [
      { time: '10:00 AM', status: 'available' as const },
      { time: '11:00 AM', status: 'available' as const },
      { time: '12:00 PM', status: 'available' as const },
      { time: '01:00 PM', status: 'booked' as const },
      { time: '02:00 PM', status: 'available' as const },
      { time: '03:00 PM', status: 'available' as const },
      { time: '04:00 PM', status: 'available' as const },
      { time: '05:00 PM', status: 'booked' as const },
      { time: '06:00 PM', status: 'available' as const },
      { time: '07:00 PM', status: 'available' as const },
      { time: '08:00 PM', status: 'available' as const },
      { time: '09:00 PM', status: 'available' as const },
      { time: '10:00 PM', status: 'available' as const },
    ],
  },
];

// Helper to check if a time slot has passed
const isSlotTimePast = (timeStr: string, selectedDate: Date): boolean => {
  const now = new Date();
  const isSameDay = selectedDate.getFullYear() === now.getFullYear() && 
                    selectedDate.getMonth() === now.getMonth() && 
                    selectedDate.getDate() === now.getDate();
  
  // If selected date is in the past, all slots are past
  if (selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    return true;
  }
  
  // If not today, slots are not past
  if (!isSameDay) return false;
  
  try {
    const [time, period] = timeStr.split(' ');
    const [hourStr] = time.split(':');
    let hour = parseInt(hourStr);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour <= now.getHours();
  } catch (e) {
    return false;
  }
};

// Function to get sports data with date-based slot availability
const getSportDataForDate = (date: Date) => {
  const dayOfWeek = date.getDay();
  return baseSportData.map(sport => ({
    ...sport,
    slots: sport.slots.map((slot, idx) => {
      // Check if slot time has passed
      if (isSlotTimePast(slot.time, date)) {
        return { ...slot, status: 'past' as const };
      }
      
      // Vary availability based on date to show changes
      let status = slot.status;
      // Make different slots booked on different days
      if (dayOfWeek === 1 && idx % 3 === 0) status = 'booked';
      if (dayOfWeek === 2 && idx % 4 === 0) status = 'booked';
      if (dayOfWeek === 3 && (idx === 2 || idx === 5 || idx === 8)) status = 'booked';
      if (dayOfWeek === 4 && idx % 2 === 0) status = 'booked';
      if (dayOfWeek === 5 && idx === 1) status = 'booked';
      if (dayOfWeek === 6 && idx % 5 === 0) status = 'booked';
      return { ...slot, status };
    }),
  }));
};

// Helper functions for API data transformation
const getSportIcon = (sportName: string): 'football' | 'water' | 'radio-button-on' | 'basketball' | 'tennisball' | 'fitness' => {
  const name = sportName.toLowerCase();
  if (name.includes('football') || name.includes('soccer')) return 'football';
  if (name.includes('pool') || name.includes('swim')) return 'water';
  if (name.includes('cricket')) return 'radio-button-on';
  if (name.includes('basket')) return 'basketball';
  if (name.includes('tennis') || name.includes('badminton')) return 'tennisball';
  return 'fitness';
};

const getSportColor = (sportName: string): string => {
  const name = sportName.toLowerCase();
  if (name.includes('football') || name.includes('soccer')) return '#16A34A';
  if (name.includes('pool') || name.includes('swim')) return '#0EA5E9';
  if (name.includes('cricket')) return '#DC2626';
  if (name.includes('basket')) return '#F97316';
  if (name.includes('tennis') || name.includes('badminton')) return '#8B5CF6';
  return '#6366F1';
};

const generateSlotsForSport = (sport: Sport, date: Date) => {
  const dayOfWeek = date.getDay();
  const baseSlots = [
    { time: '10:00 AM', status: 'available' as const },
    { time: '11:00 AM', status: 'available' as const },
    { time: '12:00 PM', status: 'available' as const },
    { time: '01:00 PM', status: 'available' as const },
    { time: '02:00 PM', status: 'available' as const },
    { time: '03:00 PM', status: 'available' as const },
    { time: '04:00 PM', status: 'available' as const },
    { time: '05:00 PM', status: 'available' as const },
    { time: '06:00 PM', status: 'available' as const },
    { time: '07:00 PM', status: 'available' as const },
    { time: '08:00 PM', status: 'available' as const },
    { time: '09:00 PM', status: 'available' as const },
    { time: '10:00 PM', status: 'available' as const },
  ];

  return baseSlots.map((slot, idx) => {
    if (isSlotTimePast(slot.time, date)) {
      return { ...slot, status: 'past' as const };
    }
    // Vary availability based on day of week
    let status = slot.status;
    if (dayOfWeek === 1 && idx % 3 === 0) status = 'booked';
    if (dayOfWeek === 2 && idx % 4 === 0) status = 'booked';
    if (dayOfWeek === 3 && (idx === 2 || idx === 5 || idx === 8)) status = 'booked';
    if (dayOfWeek === 4 && idx % 2 === 0) status = 'booked';
    if (dayOfWeek === 5 && idx === 1) status = 'booked';
    if (dayOfWeek === 6 && idx % 5 === 0) status = 'booked';
    return { ...slot, status };
  });
};

const formatTime = (timeStr: string): string => {
  if (!timeStr) return 'N/A';
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
};

const formatBookingDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [gameName, setGameName] = useState('');
  const [gameType, setGameType] = useState('Outdoor');
  const [rateType, setRateType] = useState('Per hour');
  const [price, setPrice] = useState('');
  const [maxCourt, setMaxCourt] = useState('');
  const [status, setStatus] = useState('Active');
  const [description, setDescription] = useState('');
  const [advancePayment, setAdvancePayment] = useState(false);
  const { count: notificationCount } = useNotificationCount();

  // API data state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [slotAvailabilityMap, setSlotAvailabilityMap] = useState<Record<string, SlotAvailabilityResponse>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else if (!initialLoadDone.current) setLoading(true);
      setError(null);

      const [statsData, bookingsData, sportsData] = await Promise.all([
        getDashboardStats().catch(() => null),
        getUpcomingBookings().catch(() => []),
        getSports().catch(() => []),
      ]);

      if (statsData) setDashboardStats(statsData);
      setUpcomingBookings(bookingsData);
      setSports(sportsData);

      // Fetch real slot availability for every sport
      if (sportsData.length > 0) {
        // Use local timezone date, NOT UTC (toISOString converts to UTC which can shift the day)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const slotResults: Record<string, SlotAvailabilityResponse> = {};
        await Promise.all(
          sportsData.map(async (sport: Sport) => {
            try {
              const data = await getSlotAvailability({ sport_id: sport.id, date: dateStr });
              slotResults[sport.id.toString()] = data;
            } catch (err) {
              console.error(`Failed to fetch slots for ${sport.name}:`, err);
            }
          }),
        );
        setSlotAvailabilityMap(slotResults);
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      initialLoadDone.current = true;
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Auto-refresh when returning from booking page (or any other screen)
  useFocusEffect(
    useCallback(() => {
      if (initialLoadDone.current) {
        fetchDashboardData();
      }
    }, [fetchDashboardData])
  );

  // Convert API sports to display format using real slot availability
  const sportDataForDisplay = useMemo(() => {
    if (!sports.length) {
      return getSportDataForDate(selectedDate);
    }
    
    // Map API sports to display format with real slot data
    // Sort sports by priority (early registered sports first)
    const sortedSports = [...sports].sort((a, b) => {
      const priorityA = getSportPriority(a.name);
      const priorityB = getSportPriority(b.name);
      // Primary sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // Secondary sort by name for same priority
      return a.name.localeCompare(b.name);
    });

    return sortedSports.map((sport) => {
      const slotData = slotAvailabilityMap[sport.id.toString()];
      let slots;

      if (slotData && slotData.courts && slotData.courts.length > 0) {
        // Use real slot data from API
        slots = slotData.courts[0].slots.map(slot => ({
          time: slot.display_time || formatTime(slot.start_time),
          status: slot.status,
        }));
      } else {
        // Fallback to generated slots when API data isn't available yet
        slots = generateSlotsForSport(sport, selectedDate);
      }

      return {
        id: sport.id.toString(),
        name: sport.name,
        icon: getSportIcon(sport.name),
        iconColor: getSportColor(sport.name),
        courts: sport.maximum_court || sport.max_courts || 1,
        slots,
      };
    });
  }, [sports, selectedDate, slotAvailabilityMap]);

  // Transform API bookings to display format
  const displayBookings = useMemo(() => {
    if (!upcomingBookings.length) {
      return mockUpcomingBookings;
    }
    
    return upcomingBookings.map((booking: any) => ({
      id: booking.id?.toString() || '0',
      customerEmail: booking.user_email || booking.user_name || 'Unknown',
      sport: booking.sport_name || 'N/A',
      time: booking.time_slot || formatTime(booking.start_time),
      date: formatBookingDate(booking.booking_date),
    }));
  }, [upcomingBookings]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    router.replace('/login');
  };

  const handleAddBooking = () => {
    router.push('/booking');
  };

  const handleMenuPress = () => {
    setMenuOpen(true);
  };

  const handleNotificationPress = () => {
    // Navigate to Notifications page
    router.push('/notifications');
  };

  const handleProfilePress = () => {
    setProfileMenuOpen(true);
  };

  const handleNewSlot = () => setAddModalVisible(true);

  const closeAddModal = () => setAddModalVisible(false);

  const addSport = () => {
    console.log('Add sport', { gameName, gameType, rateType, price, maxCourt, status, description, advancePayment });
    setAddModalVisible(false);
    setGameName(''); setGameType('Outdoor'); setRateType('Per hour'); setPrice(''); setMaxCourt(''); setStatus('Active'); setDescription(''); setAdvancePayment(false);
  };

  const handleSlotPress = (sport: any, slot: any) => {
    // Navigate to booking page with sport and slot info
    router.push({
      pathname: '/booking',
      params: {
        sport: sport.name,
        time: slot.time,
        date: selectedDate.toISOString(),
      },
    });
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
        notificationCount={notificationCount}
      />

      {/* Profile Menu Modal */}
      <Modal visible={profileMenuOpen} transparent animationType="fade" onRequestClose={() => setProfileMenuOpen(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setProfileMenuOpen(false)} activeOpacity={1}>
          <View style={styles.profileMenuBox}>
            <TouchableOpacity style={styles.profileMenuItem} onPress={() => { setProfileMenuOpen(false); router.push('/settings'); }}>
              <Text style={styles.profileMenuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileMenuItem} onPress={() => { setProfileMenuOpen(false); /* navigate to profile */ router.push('/settings'); }}>
              <Text style={styles.profileMenuText}>Profile</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.profileMenuItem} onPress={handleLogout}>
              <Text style={[styles.profileMenuText, { color: '#DC2626' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Add Sport Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={closeAddModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Sport</Text>
              <Pressable onPress={closeAddModal} style={styles.modalCloseBtn}><Ionicons name="close" size={20} color="#fff" /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.rowSplit}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Game Name*</Text>
                  <TextInput style={styles.input} placeholder="Select Sport" value={gameName} onChangeText={setGameName} />

                  <Text style={styles.fieldLabel}>Rate Type*</Text>
                  <TextInput style={styles.input} placeholder="Per hour" value={rateType} onChangeText={setRateType} />

                  <Text style={styles.fieldLabel}>Maximum Court*</Text>
                  <TextInput style={styles.input} placeholder="" value={maxCourt} onChangeText={setMaxCourt} keyboardType="numeric" />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Game Type*</Text>
                  <TextInput style={styles.input} placeholder="Outdoor" value={gameType} onChangeText={setGameType} />

                  <Text style={styles.fieldLabel}>Price*</Text>
                  <TextInput style={styles.input} placeholder="" value={price} onChangeText={setPrice} keyboardType="numeric" />

                  <Text style={styles.fieldLabel}>Status*</Text>
                  <TextInput style={styles.input} placeholder="Active" value={status} onChangeText={setStatus} />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: '#111827' }]}
                placeholder="Optional"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={styles.advanceRow}>
                <Switch value={advancePayment} onValueChange={setAdvancePayment} trackColor={{ true: '#15803D', false: '#E5E7EB' }} />
                <Text style={styles.advanceText}>Advance Payment Required</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeAddModal}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.addSportBtn} onPress={addSport}><Text style={styles.addSportText}>Add Sport</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#15803D']} />
        }
      >
        {/* Dashboard Title and Add Booking Button */}
        <DashboardHeader onAddBooking={handleAddBooking} />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#15803D" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        )}

        {/* Error Message */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={24} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDashboardData()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Cards */}
        {!loading && (
          <View style={styles.statsContainer}>
            <StatsCard
              title="Total Sports"
              value={dashboardStats?.total_sports ?? sports.length}
              trend="up"
              trendText={dashboardStats?.active_sports ? `${dashboardStats.active_sports} active` : 'Manage sports'}
              icon="calendar"
              variant={activeStat === 'sports' ? 'primary' : 'default'}
              onPress={() => setActiveStat('sports')}
            />
            
            <StatsCard
              title="Total Bookings"
              value={dashboardStats?.total_bookings ?? 0}
              trend={dashboardStats?.today_bookings && dashboardStats.today_bookings > 0 ? 'up' : 'neutral'}
              trendText={dashboardStats?.today_bookings ? `${dashboardStats.today_bookings} today` : 'No bookings today'}
              icon="play-circle"
              variant={activeStat === 'bookings' ? 'primary' : 'default'}
              onPress={() => setActiveStat('bookings')}
            />
            
            <StatsCard
              title="Total Revenue"
              value={dashboardStats?.total_revenue ? `Rs ${parseFloat(dashboardStats.total_revenue).toLocaleString()}` : 'Rs 0'}
              trend={dashboardStats?.today_revenue && parseFloat(dashboardStats.today_revenue) > 0 ? 'up' : 'neutral'}
              trendText={dashboardStats?.today_revenue ? `Rs ${dashboardStats.today_revenue} today` : 'No revenue today'}
              icon="stats-chart"
              variant={activeStat === 'revenue' ? 'primary' : 'default'}
              onPress={() => setActiveStat('revenue')}
            />
            
            <StatsCard
              title="Canceled Booking"
              value={dashboardStats?.cancelled_bookings ?? 0}
              trend="neutral"
              trendText={dashboardStats?.pending_bookings ? `${dashboardStats.pending_bookings} pending` : 'Track status'}
              icon="time"
              variant={activeStat === 'canceled' ? 'primary' : 'default'}
              onPress={() => setActiveStat('canceled')}
            />
          </View>
        )}

        {/* Slot Availability Section */}
        {!loading && (
          <SlotAvailability
            sports={sportDataForDisplay}
            selectedDate={selectedDate}
            onNewPress={handleNewSlot}
            onSlotPress={handleSlotPress}
            onDateChange={setSelectedDate}
          />
        )}

        {/* Calendar removed per request */}

        {/* Upcoming Bookings */}
        {!loading && (
          <UpcomingBookings
            bookings={displayBookings}
            onViewAll={handleViewAllBookings}
            onBookingPress={handleBookingPress}
          />
        )}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  menuOverlay: { flex: 1, backgroundColor: 'transparent' },
  profileMenuBox: { position: 'absolute', top: 98, right: 12, width: 160, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  profileMenuItem: { paddingVertical: 10, paddingHorizontal: 12 },
  profileMenuText: { fontSize: 15, color: '#111827' },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '94%', maxHeight: '90%', backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  modalHeader: { backgroundColor: '#15803D', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalCloseBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6 },
  modalContent: { padding: 14 },
  rowSplit: { flexDirection: 'row', gap: 12 },
  formCol: { flex: 1 },
  fieldLabel: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginBottom: 12 },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  advanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  advanceText: { color: '#374151', marginLeft: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6' },
  cancelText: { color: '#374151', fontWeight: '600' },
  addSportBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#15803D' },
  addSportText: { color: '#fff', fontWeight: '700' },
});
