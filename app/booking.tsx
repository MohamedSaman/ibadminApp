import { Calendar } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface TimeSlot {
  time: string;
  status: 'past' | 'available' | 'booked';
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  duration?: string;
}

interface Court {
  id: string;
  name: string;
  slots: TimeSlot[];
}

// Random name and phone generator
const firstNames = ['Ahmed', 'Fatima', 'Ali', 'Noor', 'Khalid', 'Sara', 'Omar', 'Layla', 'Hassan', 'Aisha'];
const lastNames = ['Al-Mansouri', 'Al-Falahi', 'Al-Mazrouei', 'Al-Mutawa', 'Al-Kaabi', 'Al-Neyadi', 'Al-Suwaidi', 'Al-Marri'];

const getRandomName = (seed: number) => {
  const first = firstNames[seed % firstNames.length];
  const last = lastNames[(seed + 1) % lastNames.length];
  return `${first} ${last}`;
};

const getRandomPhone = (seed: number) => {
  const areaCode = 500 + (seed % 100);
  const exchangeCode = 100 + ((seed * 7) % 900);
  const lineNumber = 1000 + ((seed * 13) % 9000);
  return `+971${areaCode}${exchangeCode}${lineNumber}`.replace(/(.{3})(.{3})(.{4})/, '$1-$2-$3');
};

interface Court {
  id: string;
  name: string;
  slots: TimeSlot[];
}

// Dashboard-style slot data (same as home dashboard)
const dashboardSlots = {
  football: [
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
  pools: [
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
  cricket: [
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
};

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

// Convert dashboard time format to booking slot format with random booker info
const convertToDashboardSlots = (sportId: string, dayOfWeek: number, selectedDate: Date): TimeSlot[] => {
  const baseSlots = dashboardSlots[sportId as keyof typeof dashboardSlots] || [];
  return baseSlots.map((slot, idx) => {
    // Check if slot time has passed
    if (isSlotTimePast(slot.time, selectedDate)) {
      return {
        time: slot.time,
        status: 'past' as const,
      };
    }
    
    let status = slot.status;
    // Vary availability based on day
    if (dayOfWeek === 1 && idx % 3 === 0) status = 'booked';
    if (dayOfWeek === 2 && idx % 4 === 0) status = 'booked';
    if (dayOfWeek === 3 && (idx === 2 || idx === 5 || idx === 8)) status = 'booked';
    if (dayOfWeek === 4 && idx % 2 === 0) status = 'booked';
    if (dayOfWeek === 5 && idx === 1) status = 'booked';
    if (dayOfWeek === 6 && idx % 5 === 0) status = 'booked';
    
    // Add booker info for booked slots
    if (status === 'booked') {
      const seed = idx * 7 + dayOfWeek * 13;
      return {
        time: slot.time,
        status: status as 'available' | 'booked' | 'past',
        customerName: getRandomName(seed),
        customerPhone: getRandomPhone(seed),
        customerEmail: `user${seed}@example.com`,
      };
    }
    
    return {
      time: slot.time,
      status: status as 'available' | 'booked' | 'past',
    };
  });
};

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sport?: string; time?: string; date?: string }>();

  // Initialize from route params if provided
  const [selectedSport, setSelectedSport] = useState(() => {
    if (params.sport) {
      const s = params.sport.toLowerCase();
      if (s.includes('pool')) return 'pools';
      if (s.includes('cricket')) return 'cricket';
      if (s.includes('football')) return 'football';
    }
    return 'football';
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    if (params.date) {
      const d = new Date(params.date);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [selectedCourt, setSelectedCourt] = useState('court-1');

  // If time param passed, auto-open booking modal for that slot
  const [autoOpenDone, setAutoOpenDone] = useState(false);

  const sports = [
    { id: 'football', name: 'Football', icon: 'football' as const },
    { id: 'pools', name: 'Pools', icon: 'water' as const },
    { id: 'cricket', name: 'Cricket', icon: 'radio-button-on' as const },
  ];

  // Generate courts with slots based on dashboard data
  const courts: Court[] = useMemo(() => [
    {
      id: 'court-1',
      name: 'COURT 1',
      slots: convertToDashboardSlots(selectedSport, selectedDate.getDay(), selectedDate),
    },
  ], [selectedSport, selectedDate]);

  const currentCourt = courts.find((c) => c.id === selectedCourt);

  const formatDate = (date: Date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // Keep the displayed date "live" when the user hasn't selected another day.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      // only update if selectedDate is today (so user choice isn't overridden)
      if (isSameDay(selectedDate, now)) {
        setSelectedDate(new Date());
      }
    };

    // check every 30 seconds to catch day rollover promptly
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, [selectedDate]);

  // Auto-open booking modal if time param was passed from dashboard
  useEffect(() => {
    if (!autoOpenDone && params.time && currentCourt) {
      // Find matching slot - dashboard passes time like "10:00 AM", match it exactly
      const matchSlot = currentCourt.slots.find(s => 
        s.time === params.time || 
        s.time.startsWith(params.time?.split(' ')[0] || '')
      );
      
      if (matchSlot && matchSlot.status === 'available') {
        setSelectedSlot(matchSlot);
        setBookingModalVisible(true);
        setPlayerName('');
        setPlayerPhone('');
      }
      setAutoOpenDone(true);
    }
  }, [autoOpenDone, params.time, currentCourt]);

  const handleDateChange = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  const handleBookSlot = (slot: TimeSlot) => {
    if (slot.status === 'available') {
      // open booking modal
      setSelectedSlot(slot);
      setBookingModalVisible(true);
    }
  };

  const handleBookedSlotPress = (slot: TimeSlot) => {
    if (slot.status === 'booked') {
      setSelectedBookedSlot(slot);
      setBoostedDetailsVisible(true);
    }
  };

  // Booking modal state
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [bookingStatus, setBookingStatus] = useState('Pending');
  const [permanentBooking, setPermanentBooking] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState('');
  // Booked details modal state
  const [bookedDetailsVisible, setBoostedDetailsVisible] = useState(false);
  const [selectedBookedSlot, setSelectedBookedSlot] = useState<TimeSlot | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => setKeyboardHeight(e.endCoordinates?.height || 0);
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const confirmBooking = () => {
    // For now just close and log
    console.log('Booked', { playerName, playerPhone, bookingStatus, permanentBooking, isPaid, notes, selectedSlot });
    setBookingModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Sports Booking</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Sport Header */}
        <View style={styles.sportHeader}>
          <View style={styles.sportHeaderContent}>
            <Ionicons name="trophy" size={32} color="#fff" />
            <ThemedText style={styles.sportHeaderText}>Sports Booking{'\n'}System</ThemedText>
          </View>
        </View>

        {/* Sport Tabs */}
        <View style={styles.sportTabs}>
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.sportTab,
                selectedSport === sport.id && styles.sportTabActive,
              ]}
              onPress={() => setSelectedSport(sport.id)}
            >
              <Ionicons
                name={sport.icon}
                size={20}
                color={selectedSport === sport.id ? '#fff' : '#666'}
              />
              <ThemedText
                style={[
                  styles.sportTabText,
                  selectedSport === sport.id && styles.sportTabTextActive,
                ]}
              >
                {sport.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Picker */}
        <View style={styles.datePickerContainer}>
          <TouchableOpacity onPress={() => handleDateChange(-1)}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCalendarModalVisible(true)} style={styles.dateTouch}>
            <ThemedText style={styles.dateText}>{formatDate(selectedDate)}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDateChange(1)}>
            <Ionicons name="chevron-forward" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Court Section */}
        {currentCourt && (
          <View style={styles.courtSection}>
            <View style={styles.courtHeader}>
              <ThemedText style={styles.courtName}>{currentCourt.name}</ThemedText>
            </View>

            {/* Time Slots */}
            <View style={styles.timeSlotsContainer}>
              {currentCourt.slots.map((slot, index) => (
                <View key={index} style={styles.slotRow}>
                  {/* Time Column */}
                  <View style={styles.timeColumn}>
                    <ThemedText style={styles.timeText}>{slot.time.split(' - ')[0]}</ThemedText>
                    <ThemedText style={styles.timeText}>{slot.time.split(' - ')[1]}</ThemedText>
                  </View>

                  {/* Slot Content */}
                  {slot.status === 'past' && (
                    <View style={[styles.slot, styles.slotPast]}>
                      <Ionicons name="lock-closed" size={18} color="#999" />
                      <ThemedText style={styles.slotPastText}>Time Past</ThemedText>
                    </View>
                  )}

                  {slot.status === 'available' && (
                    <TouchableOpacity
                      style={[styles.slot, styles.slotAvailable]}
                      onPress={() => handleBookSlot(slot)}
                    >
                      <ThemedText style={styles.slotAvailableText}>Available</ThemedText>
                    </TouchableOpacity>
                  )}

                  {slot.status === 'booked' && (
                    <TouchableOpacity style={[styles.slot, styles.slotBooked]} onPress={() => handleBookedSlotPress(slot)}>
                      <View style={styles.bookedAvatar}>
                        <Ionicons name="person" size={16} color="#fff" />
                      </View>
                      <View style={styles.bookedInfo}>
                        <ThemedText style={styles.bookedName}>{slot.customerName || 'Booked'}</ThemedText>
                        <ThemedText style={styles.bookedPhone}>{slot.customerPhone || ''}</ThemedText>
                      </View>
                      <ThemedText style={styles.bookedLabel}>Booked</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
        {/* Booking Modal */}
        <Modal visible={bookingModalVisible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setBookingModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'position'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
                <View style={[styles.modalBox, !keyboardHeight ? { marginBottom: 48 } : {}]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Book Slot</Text>
                    <Pressable onPress={() => setBookingModalVisible(false)} style={styles.modalCloseBtn}><Ionicons name="close" size={20} color="#fff" /></Pressable>
                  </View>

                  <ScrollView ref={scrollRef} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.infoRow}>
                  <View style={styles.infoBox}><Text style={styles.infoLabel}>Game:</Text><Text style={styles.infoValue}>{selectedSport}</Text></View>
                  <View style={styles.infoBox}><Text style={styles.infoLabel}>Court:</Text><Text style={styles.infoValue}>{currentCourt?.name}</Text></View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoBox}><Text style={styles.infoLabel}>Date:</Text><Text style={styles.infoValue}>{formatDate(selectedDate)}</Text></View>
                  <View style={styles.infoBox}><Text style={styles.infoLabel}>Time:</Text><Text style={styles.infoValue}>{selectedSlot?.time ?? ''}</Text></View>
                </View>

                <Text style={styles.fieldLabel}>Player Name *</Text>
                <TextInput style={styles.input} placeholder="Enter player name" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={playerName} onChangeText={setPlayerName} />

                <Text style={styles.fieldLabel}>Phone Number *</Text>
                <TextInput style={styles.input} placeholder="Enter phone number" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={playerPhone} onChangeText={setPlayerPhone} keyboardType="phone-pad" />

                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Status</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setBookingStatus(bookingStatus === 'Pending' ? 'Confirmed' : 'Pending')}>
                      <Text style={styles.dropdownText}>{bookingStatus}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginLeft: 12, justifyContent: 'flex-end' }}>
                    <Text style={styles.fieldLabel}>Permanent Booking</Text>
                    <Switch value={permanentBooking} onValueChange={setPermanentBooking} trackColor={{ true: '#15803D', false: '#E5E7EB' }} />
                  </View>
                </View>

                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Payment Status</Text>
                    <View style={styles.paymentStatusBox}>
                      <Ionicons name={isPaid ? 'checkmark-circle' : 'close-circle'} size={20} color={isPaid ? '#10B981' : '#EF4444'} />
                      <Text style={[styles.paymentStatusText, { color: isPaid ? '#10B981' : '#EF4444' }]}>{isPaid ? 'Paid' : 'Unpaid'}</Text>
                    </View>
                  </View>
                  <View style={{ marginLeft: 12, justifyContent: 'flex-end' }}>
                    <Text style={styles.fieldLabel}>Mark as Paid</Text>
                    <Switch value={isPaid} onValueChange={setIsPaid} trackColor={{ true: '#10B981', false: '#E5E7EB' }} />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Additional notes..."
                    placeholderTextColor="#9CA3AF"
                    selectionColor="#0EA5E9"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    onFocus={() => {
                      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
                    }}
                  />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setBookingModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.bookBtn} onPress={confirmBooking}><Text style={styles.bookText}>Book Slot</Text></TouchableOpacity>
                </View>
                  </ScrollView>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* Calendar Modal (reuses dashboard Calendar) */}
        <Modal visible={calendarModalVisible} transparent animationType="fade" onRequestClose={() => setCalendarModalVisible(false)}>
          <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={() => setCalendarModalVisible(false)}>
            <View style={styles.calendarModalBox}>
              <Calendar selectedDate={selectedDate} onDateSelect={(d) => { setSelectedDate(d); setCalendarModalVisible(false); }} />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Booked Details Modal */}
        <Modal visible={bookedDetailsVisible} animationType="fade" transparent onRequestClose={() => setBoostedDetailsVisible(false)}>
          <View style={styles.detailsOverlay}>
            <View style={styles.detailsModalBox}>
              <View style={styles.detailsHeader}>
                <Text style={styles.detailsTitle}>Booking Details</Text>
                <TouchableOpacity onPress={() => setBoostedDetailsVisible(false)} style={styles.detailsCloseBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.detailsContent}>
                {selectedBookedSlot && (
                  <>
                    {/* Customer Info */}
                    <View style={styles.detailsSection}>
                      <ThemedText style={styles.sectionTitle}>Customer Information</ThemedText>
                      <View style={styles.detailsCard}>
                        <View style={styles.customerAvatarLarge}>
                          <Ionicons name="person" size={32} color="#fff" />
                        </View>
                        <View style={styles.customerDetailsFlex}>
                          <ThemedText style={styles.customerNameLarge}>{selectedBookedSlot.customerName || 'N/A'}</ThemedText>
                          <ThemedText style={styles.customerPhoneLarge}>{selectedBookedSlot.customerPhone || 'N/A'}</ThemedText>
                        </View>
                      </View>
                    </View>

                    {/* Booking Time */}
                    <View style={styles.detailsSection}>
                      <ThemedText style={styles.sectionTitle}>Booking Time</ThemedText>
                      <View style={[styles.detailsCard, styles.timeDetailsCard]}>
                        <View style={styles.timeDetailItem}>
                          <Ionicons name="calendar-outline" size={20} color="#15803D" />
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <ThemedText style={styles.timeDetailLabel}>Date</ThemedText>
                            <ThemedText style={styles.timeDetailValue}>{formatDate(selectedDate)}</ThemedText>
                          </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.timeDetailItem}>
                          <Ionicons name="time-outline" size={20} color="#15803D" />
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <ThemedText style={styles.timeDetailLabel}>Time</ThemedText>
                            <ThemedText style={styles.timeDetailValue}>{selectedBookedSlot.time}</ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Court & Sport */}
                    <View style={styles.detailsSection}>
                      <ThemedText style={styles.sectionTitle}>Facility</ThemedText>
                      <View style={[styles.detailsCard, styles.facilityCard]}>
                        <View style={styles.facilityItem}>
                          <Ionicons name="trophy" size={20} color="#15803D" />
                          <View style={{ marginLeft: 12 }}>
                            <ThemedText style={styles.timeDetailLabel}>Sport</ThemedText>
                            <ThemedText style={styles.timeDetailValue}>
                              {selectedSport === 'football' ? 'Football' : 'Pools'}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.facilityItem}>
                          <Ionicons name="location" size={20} color="#15803D" />
                          <View style={{ marginLeft: 12 }}>
                            <ThemedText style={styles.timeDetailLabel}>Court</ThemedText>
                            <ThemedText style={styles.timeDetailValue}>{currentCourt?.name || 'Court 1'}</ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.detailsFooter}>
                <TouchableOpacity style={styles.detailsCloseButtonFull} onPress={() => setBoostedDetailsVisible(false)}>
                  <Text style={styles.detailsCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sportHeader: {
    backgroundColor: '#15803D',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
  },
  sportHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sportHeaderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  sportTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  sportTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sportTabActive: {
    borderBottomColor: '#15803D',
  },
  sportTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sportTabTextActive: {
    color: '#15803D',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateTouch: { flex: 1, alignItems: 'center' },
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  calendarModalBox: { width: '94%', maxHeight: '84%', borderRadius: 12, overflow: 'hidden' },
  courtSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  courtHeader: {
    backgroundColor: '#15803D',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  courtName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  timeSlotsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  slotRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeColumn: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    lineHeight: 14,
    textAlign: 'center',
  },
  slot: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 60,
  },
  slotPast: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    gap: 8,
  },
  slotPastText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  slotAvailable: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#0EA5E9',
  },
  slotAvailableText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  slotBooked: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  bookedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookedInfo: {
    flex: 1,
  },
  bookedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  bookedEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textDecorationLine: 'underline',
  },
  bookedPhone: {
    fontSize: 11,
    fontWeight: '500',
    color: '#555',
    marginTop: 2,
  },
  bookedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
    marginLeft: 8,
  },
  bookedDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '92%', maxHeight: '90%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  modalHeader: { backgroundColor: '#15803D', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalCloseBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6 },
  modalContent: { padding: 16, paddingBottom: 24 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoBox: { flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8 },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  fieldLabel: { fontSize: 13, color: '#374151', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: '#111827' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  dropdown: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  dropdownText: { color: '#374151', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6' },
  cancelText: { color: '#374151', fontWeight: '600' },
  bookBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: '#15803D' },
  bookText: { color: '#fff', fontWeight: '700' },
  // Booked Details Modal Styles
  detailsOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 16,
  },
  detailsModalBox: { 
    width: '100%', 
    maxHeight: '80%', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    overflow: 'hidden',
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
    paddingVertical: 20, 
    paddingHorizontal: 16,
  },
  detailsSection: { 
    marginBottom: 20,
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#374151', 
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsCard: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    padding: 16,
  },
  customerAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerDetailsFlex: {
    flex: 1,
  },
  customerNameLarge: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827',
    marginBottom: 4,
  },
  customerPhoneLarge: { 
    fontSize: 13, 
    color: '#6B7280',
    fontWeight: '500',
  },
  timeDetailsCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  timeDetailLabel: { 
    fontSize: 11, 
    color: '#6B7280', 
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeDetailValue: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#111827',
    marginTop: 2,
  },
  facilityCard: {
    paddingVertical: 16,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailsFooter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailsCloseButtonFull: {
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  paymentStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },});