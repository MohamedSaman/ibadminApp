import { useNotificationCount } from '@/hooks/useNotificationCount';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    DashboardHeader,
    Header,
    SlotAvailability,
    StatsCard,
    UpcomingBookings,
} from '@/components/dashboard';
import SideMenu from '@/components/SideMenu';

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
            <TouchableOpacity style={styles.profileMenuItem} onPress={() => { setProfileMenuOpen(false); router.replace('/login'); }}>
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
          sports={useMemo(() => getSportDataForDate(selectedDate), [selectedDate])}
          selectedDate={selectedDate}
          onNewPress={handleNewSlot}
          onSlotPress={handleSlotPress}
          onDateChange={setSelectedDate}
        />

        {/* Calendar removed per request */}

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
