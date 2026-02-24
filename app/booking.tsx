import { Calendar } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { getSports, getSlotAvailability, createManualBooking, getVenue, cancelBooking } from '@/services/indoorAdminApi';
import { Sport, SlotAvailabilityResponse, CourtSlots, SlotInfo, Venue } from '@/types/api';

// Helper function to get sport icon for booking screen
const getSportIconForBooking = (sportName: string): 'football' | 'water' | 'radio-button-on' | 'basketball' | 'tennisball' | 'fitness' => {
  const name = sportName.toLowerCase();
  if (name.includes('football') || name.includes('soccer')) return 'football';
  if (name.includes('pool') || name.includes('swim')) return 'water';
  if (name.includes('cricket')) return 'radio-button-on';
  if (name.includes('basket')) return 'basketball';
  if (name.includes('tennis') || name.includes('badminton')) return 'tennisball';
  return 'fitness';
};

// Define preferred sport order
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

// Format slot display time (e.g., "10:00 AM")
const formatSlotDisplayTime = (time24: string): string => {
  try {
    const [hours] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:00 ${period}`;
  } catch {
    return time24;
  }
};

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sport?: string; time?: string; date?: string }>();

  // API data state  
  const [apiSports, setApiSports] = useState<Sport[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [slotData, setSlotData] = useState<SlotAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Live clock for real-time slot status updates
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialize from route params if provided
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(() => {
    if (params.date) {
      const d = new Date(params.date);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [selectedCourtNum, setSelectedCourtNum] = useState(1);

  // If time param passed, auto-open booking modal for that slot
  const [autoOpenDone, setAutoOpenDone] = useState(false);

  // Fetch sports list on mount
  useEffect(() => {
    (async () => {
      try {
        const sportsData = await getSports().catch(() => []);
        setApiSports(sportsData);
        
        // Auto-select first sport (sorted by priority) or match route param
        if (sportsData.length > 0) {
          let matched = '';
          
          if (params.sport) {
            // If sport param provided, try to match it
            const s = params.sport.toLowerCase();
            const found = sportsData.find(sp => sp.name.toLowerCase().includes(s));
            matched = found ? found.id.toString() : '';
          }
          
          if (!matched) {
            // No param or not found - select first sport by priority (football)
            const sorted = sportsData
              .map(sp => ({
                id: sp.id.toString(),
                name: sp.name,
                priority: getSportPriority(sp.name),
              }))
              .sort((a, b) => {
                if (a.priority !== b.priority) {
                  return a.priority - b.priority;
                }
                return a.name.localeCompare(b.name);
              });
            
            matched = sorted[0].id;
          }
          
          setSelectedSport(matched);
        }
      } catch (err) {
        console.error('Failed to fetch sports:', err);
      }
    })();
  }, []);

  // Fetch venue data when screen is focused (to get fresh opening hours)
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const venueData = await getVenue().catch(() => null);
          setVenue(venueData);
          console.log('[Booking] ===== VENUE DATA FETCHED =====');
          console.log('[Booking] Full venue.opening_hours:', JSON.stringify(venueData?.opening_hours, null, 2));
          console.log('[Booking] Monday config:', JSON.stringify(venueData?.opening_hours?.monday, null, 2));
          console.log('[Booking] Saturday config:', JSON.stringify(venueData?.opening_hours?.saturday, null, 2));
        } catch (err) {
          console.error('Failed to fetch venue:', err);
        }
      })();
    }, [])
  );

  // Re-fetch slots when screen comes back to focus (after settings changes)
  useFocusEffect(
    useCallback(() => {
      console.log('[Booking] Screen focused, refreshing slots...');
      fetchSlots(true);
    }, [fetchSlots])
  );

  // Fetch slot availability when sport or date changes
  const fetchSlots = useCallback(async (showRefresh = false) => {
    console.log('[Booking] fetchSlots called:', { selectedSport, selectedDate: selectedDate.toISOString(), showRefresh });
    if (!selectedSport) {
      console.log('[Booking] fetchSlots SKIPPED - no selectedSport');
      return;
    }
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // Use local timezone date, NOT UTC (toISOString converts to UTC which can shift the day)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDate.getDay()];
      console.log(`[Booking] Fetching slots for ${dayOfWeek} (${dateStr}), sport_id=${selectedSport}`);
      
      const data = await getSlotAvailability({
        sport_id: parseInt(selectedSport),
        date: dateStr,
      });
      console.log('[Booking] fetchSlots RAW response:', JSON.stringify(data, null, 2));
      console.log('[Booking] fetchSlots summary:', {
        date: dateStr,
        dayOfWeek,
        message: data?.message,
        courts: data?.courts?.length,
        firstCourtSlots: data?.courts?.[0]?.slots?.length,
      });
      setSlotData(data);
    } catch (err) {
      console.error('[Booking] fetchSlots FAILED:', err);
      setSlotData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSport, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const onRefresh = useCallback(() => {
    fetchSlots(true);
  }, [fetchSlots]);

  // Generate sports list from API (sorted by preferred order)
  const sports = useMemo(() => {
    return apiSports
      .map(s => ({
        id: s.id.toString(),
        name: s.name,
        icon: getSportIconForBooking(s.name),
        priority: getSportPriority(s.name),
      }))
      .sort((a, b) => {
        // First sort by priority
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // If same priority, sort alphabetically by name
        return a.name.localeCompare(b.name);
      })
      // Remove priority field for final output
      .map(({ priority, ...rest }) => rest);
  }, [apiSports]);

  // Get courts from slot data
  const courts: CourtSlots[] = slotData?.courts || [];
  const currentCourt = courts.find((c) => c.court_number === selectedCourtNum) || courts[0] || null;

  // Debug: log court data
  console.log('[Booking] ===== COURT/SLOT DATA =====');
  console.log('[Booking] selectedSport:', selectedSport);
  console.log('[Booking] slotData:', slotData ? { sport_id: slotData.sport_id, sport_name: slotData.sport_name, date: slotData.date, courts_count: slotData.courts?.length, message: slotData.message } : 'null');
  console.log('[Booking] courts.length:', courts.length);
  console.log('[Booking] selectedCourtNum:', selectedCourtNum);
  console.log('[Booking] currentCourt:', currentCourt ? { court_number: currentCourt.court_number, court_name: currentCourt.court_name, slots_count: currentCourt.slots?.length } : 'null');

  const formatDate = (date: Date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // Helper: get opening hours info for selected date
  const getOpeningHoursForDate = useCallback((): { closed: boolean; open: number; close: number; label: string } => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = selectedDate.getDay();
    const dayName = dayNames[dayIndex];
    const dayLabel = dayLabels[dayIndex];

    const opening_hours = venue?.opening_hours as Record<string, any> || {};
    
    console.log(`[Booking] ===== OPENING HOURS CHECK =====`);
    console.log(`[Booking] Selected Date: ${formatDate(selectedDate)}`);
    console.log(`[Booking] Day Index (getDay()): ${dayIndex}, Day Name: ${dayName}, Day Label: ${dayLabel}`);
    console.log(`[Booking] All opening_hours:`, JSON.stringify(opening_hours, null, 2));
    
    const dayConfig = opening_hours[dayName];
    
    console.log(`[Booking] Config for "${dayName}":`, dayConfig);
    console.log(`[Booking] Is Closed? ${dayConfig?.closed}`);

    // Default to open if no config found
    if (!dayConfig) {
      console.log(`[Booking] ⚠️  No config for ${dayName}, using DEFAULT (6 AM - 10 PM))`);
      return { closed: false, open: 6, close: 22, label: `${dayLabel}: 6 AM - 10 PM` };
    }

    if (dayConfig.closed) {
      console.log(`[Booking] 🔒 ${dayName} is CLOSED`);
      return { closed: true, open: 0, close: 0, label: `${dayLabel}: Closed` };
    }

    // Parse hours from "06:00" format
    const parseHour = (timeStr: string) => {
      try {
        return parseInt(timeStr.split(':')[0], 10);
      } catch {
        return 6;
      }
    };

    const openHour = parseHour(dayConfig.open || '06:00');
    const closeHour = parseHour(dayConfig.close || '22:00');

    // Convert to 12-hour format for display
    const format12 = (h: number) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12} ${period}`;
    };

    console.log(`[Booking] ✅ ${dayName} is OPEN: ${format12(openHour)} - ${format12(closeHour)}`);
    return {
      closed: false,
      open: openHour,
      close: closeHour,
      label: `${dayLabel}: ${format12(openHour)} - ${format12(closeHour)}`,
    };
  }, [selectedDate, venue]);

  // Live clock: update currentTime every 30 seconds for real-time slot status
  useEffect(() => {
    const tick = () => {
      setCurrentTime(new Date());
      // Also update selectedDate if it's still today (to catch day rollover)
      const now = new Date();
      if (isSameDay(selectedDate, now)) {
        setSelectedDate(new Date());
      }
    };
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, [selectedDate]);

  // Auto-open booking modal if time param was passed from dashboard/home
  useEffect(() => {
    if (!autoOpenDone && params.time && currentCourt) {
      const incomingTime = params.time?.trim();
      const matchSlot = currentCourt.slots.find(s => {
        const displayTime = s.display_time?.trim() || formatSlotDisplayTime(s.start_time);
        // Match by display_time or formatted start_time
        return displayTime === incomingTime || displayTime.toLowerCase() === incomingTime?.toLowerCase();
      });
      
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

  // Helper: check if a slot is in the past (for today only)
  const isSlotPast = useCallback((slot: SlotInfo): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(selectedDate);
    selDate.setHours(0, 0, 0, 0);

    // Past dates: all slots are past
    if (selDate < today) return true;
    // Future dates: no slots are past
    if (selDate > today) return false;
    // Today: compare slot hour with current hour
    const [slotHour] = slot.start_time.split(':').map(Number);
    return slotHour < currentTime.getHours();
  }, [selectedDate, currentTime]);

  const handleBookSlot = (slot: SlotInfo) => {
    // Allow booking if slot is not past and not booked
    if (!isSlotPast(slot) && slot.status !== 'booked') {
      setSelectedSlot(slot);
      setBookingModalVisible(true);
    }
  };

  const handleBookedSlotPress = (slot: SlotInfo) => {
    if (slot.status === 'booked') {
      setSelectedBookedSlot(slot);
      setBoostedDetailsVisible(true);
    }
  };

  // Booking modal state
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [bookingStatus, setBookingStatus] = useState('Pending');
  const [permanentBooking, setPermanentBooking] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState('');
  // Booked details modal state
  const [bookedDetailsVisible, setBoostedDetailsVisible] = useState(false);
  const [selectedBookedSlot, setSelectedBookedSlot] = useState<SlotInfo | null>(null);
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

  const confirmBooking = async () => {
    if (!playerName.trim() || !playerPhone.trim()) {
      Alert.alert('Error', 'Player name and phone number are required.');
      return;
    }

    // Validate phone number - must be exactly 10 digits
    const phoneDigitsOnly = playerPhone.replace(/\D/g, '');
    if (phoneDigitsOnly.length !== 10) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits.');
      return;
    }

    if (!selectedSlot || !selectedSport) {
      Alert.alert('Error', 'Please select a slot and sport.');
      return;
    }

    try {
      setSaving(true);
      const sportId = parseInt(selectedSport, 10);
      // Use local timezone date, NOT UTC
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Get sport price for the slot
      const sport = apiSports.find(s => s.id === sportId);
      if (!sport) {
        Alert.alert('Error', 'Sport not found.');
        setSaving(false);
        return;
      }
      
      const price = parseFloat(sport.price);
      if (isNaN(price)) {
        Alert.alert('Error', 'Invalid sport price.');
        setSaving(false);
        return;
      }

      // Ensure end_time is properly set
      let endTime = selectedSlot.end_time || '';
      if (!endTime || (typeof endTime === 'string' && !endTime.trim())) {
        const [h] = selectedSlot.start_time.split(':').map(Number);
        endTime = `${((h + 1) % 24).toString().padStart(2, '0')}:00`;
      }

      const payload = {
        sport_id: sportId,
        booking_date: dateStr,
        customer_name: playerName.trim(),
        customer_phone: playerPhone.trim(),
        payment_method: 'Cash',
        payment_status: isPaid ? 'Paid' : 'Pending',
        slots: [{
          start_time: selectedSlot.start_time,
          end_time: endTime,
          price: price,
          duration: 60,
        }],
        notes: notes.trim() || '',
        skip_hold: true,
      };

      console.log('=== BOOKING PAYLOAD ===');
      console.log('Sport ID:', sportId);
      console.log('Booking Date:', dateStr);
      console.log('Customer:', playerName, playerPhone);
      console.log('Slot:', selectedSlot.start_time, '-', endTime);
      console.log('Price:', price);
      console.log('Full Payload:', JSON.stringify(payload, null, 2));
      console.log('Endpoint: POST api/indoor-admin/bookings/create/');

      await createManualBooking(payload);

      setBookingModalVisible(false);
      setPlayerName('');
      setPlayerPhone('');
      setNotes('');
      setIsPaid(false);
      Alert.alert('Success', 'Booking created successfully!');
      // Refresh slots to show the new booking
      fetchSlots();
    } catch (err: any) {
      console.error('=== BOOKING ERROR ===');
      console.error('Full Error:', err);
      console.error('Error Response Data:', err?.response?.data);
      console.error('Error Message:', err?.message);
      console.error('Error Status:', err?.response?.status);
      
      let errorMsg = 'Failed to create booking.';
      
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (err.response.data.slots) {
          errorMsg = `Slot error: ${JSON.stringify(err.response.data.slots)}`;
        } else {
          errorMsg = JSON.stringify(err.response.data);
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }
      
      console.error('Final Error Message:', errorMsg);
      Alert.alert('Booking Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookedSlot?.booking?.id) {
      Alert.alert('Error', 'Cannot cancel: Booking ID not found.');
      return;
    }

    const bookingId = selectedBookedSlot.booking.id;
    const customerName = selectedBookedSlot.booking.customer_name || 'Booking';

    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel the booking for ${customerName}?`,
      [
        { text: 'No', onPress: () => {}, style: 'cancel' },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            try {
              setCanceling(true);
              await cancelBooking(bookingId);
              setBoostedDetailsVisible(false);
              setSelectedBookedSlot(null);
              Alert.alert('Success', 'Booking cancelled successfully!');
              // Refresh slots to update the booking list
              fetchSlots();
            } catch (err: any) {
              console.error('=== CANCEL BOOKING ERROR ===');
              console.error('Full Error:', err);
              console.error('Error Response Data:', err?.response?.data);
              
              let errorMsg = 'Failed to cancel booking.';
              if (err?.response?.data?.detail) {
                errorMsg = err.response.data.detail;
              } else if (err?.response?.data?.error) {
                errorMsg = err.response.data.error;
              } else if (err?.message) {
                errorMsg = err.message;
              }
              
              Alert.alert('Cancellation Error', errorMsg);
            } finally {
              setCanceling(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
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

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#15803D']} />
      }>
        {/* Sport Header */}
        <View style={styles.sportHeader}>
          <View style={styles.sportHeaderContent}>
            <Ionicons name="trophy" size={24} color="#fff" />
            <ThemedText style={styles.sportHeaderText}>Sports Booking</ThemedText>
          </View>
        </View>

        {/* Sport Tabs - Horizontally Scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sportTabsScroll}
          contentContainerStyle={styles.sportTabsContent}
          scrollEventThrottle={16}
        >
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
                size={18}
                color={selectedSport === sport.id ? '#15803D' : '#6B7280'}
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
        </ScrollView>

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

        {/* Opening Hours Banner */}
        {!loading && (
          (() => {
            const openingInfo = getOpeningHoursForDate();
            console.log('[Booking] Opening Hours Banner - Status:', openingInfo.closed ? '🔒 CLOSED' : '✅ OPEN', 'Label:', openingInfo.label);
            return (
              <View style={[styles.openingHoursBanner, openingInfo.closed && styles.openingHoursClosed]}>
                <Ionicons 
                  name={openingInfo.closed ? "lock-closed" : "time"} 
                  size={20} 
                  color={openingInfo.closed ? "#DC2626" : "#15803D"} 
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <ThemedText 
                    style={[
                      styles.openingHoursText,
                      openingInfo.closed && { color: '#DC2626', fontWeight: '700' }
                    ]}
                  >
                    {openingInfo.label}
                  </ThemedText>
                  {openingInfo.closed && (
                    <ThemedText style={styles.openingHoursSubtext}>
                      Venue is closed on this day
                    </ThemedText>
                  )}
                </View>
              </View>
            );
          })()
        )}

        {/* Loading State */}
        {loading && !refreshing && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#15803D" />
            <ThemedText style={{ marginTop: 12, color: '#6B7280' }}>Loading slots...</ThemedText>
          </View>
        )}

        {/* No sports message */}
        {!loading && sports.length === 0 && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
            <ThemedText style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>No sports found. Add sports first.</ThemedText>
          </View>
        )}

        {/* Court Tabs (if multiple courts) */}
        {!loading && courts.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {courts.map((court) => (
              <TouchableOpacity
                key={court.court_number}
                style={[
                  styles.sportTab,
                  selectedCourtNum === court.court_number && styles.sportTabActive,
                ]}
                onPress={() => setSelectedCourtNum(court.court_number)}
              >
                <Ionicons name="location" size={16} color={selectedCourtNum === court.court_number ? '#15803D' : '#6B7280'} />
                <ThemedText style={[styles.sportTabText, selectedCourtNum === court.court_number && styles.sportTabTextActive]}>
                  {court.court_name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Court Section */}
        {!loading && currentCourt && currentCourt.slots.length > 0 && (
          <View style={styles.courtSection}>
            <View style={styles.courtHeader}>
              <ThemedText style={styles.courtName}>{currentCourt.court_name}</ThemedText>
            </View>

            {/* Time Slots */}
            <View style={styles.timeSlotsContainer}>
              {currentCourt.slots.map((slot, index) => {
                // Determine effective status using live time
                const slotIsPast = isSlotPast(slot);
                let effectiveStatus = slot.status;

                // For future dates: override backend "past" to "available"
                if (!slotIsPast && slot.status === 'past') {
                  effectiveStatus = 'available';
                }
                // For today: if slot time has now passed & it's available, mark as past
                if (slotIsPast && slot.status === 'available') {
                  effectiveStatus = 'past';
                }
                // Booked slots on past times: still show as booked (with past indicator)
                const isBookedPast = slot.status === 'booked' && slotIsPast;

                return (
                  <View key={index} style={styles.slotRow}>
                    {/* Time Column */}
                    <View style={styles.timeColumn}>
                      <ThemedText style={styles.timeText}>{formatSlotDisplayTime(slot.start_time)}</ThemedText>
                      <ThemedText style={styles.timeText}>{formatSlotDisplayTime(slot.end_time)}</ThemedText>
                    </View>

                    {/* Slot Content */}
                    {effectiveStatus === 'past' && (
                      <View style={[styles.slot, styles.slotPast]}>
                        <Ionicons name="lock-closed" size={18} color="#999" />
                        <ThemedText style={styles.slotPastText}>Time Past</ThemedText>
                      </View>
                    )}

                    {effectiveStatus === 'available' && (
                      <TouchableOpacity
                        style={[styles.slot, styles.slotAvailable]}
                        onPress={() => handleBookSlot(slot)}
                      >
                        <ThemedText style={styles.slotAvailableText}>Available</ThemedText>
                      </TouchableOpacity>
                    )}

                    {effectiveStatus === 'booked' && (
                      <TouchableOpacity style={[styles.slot, styles.slotBooked, isBookedPast && { opacity: 0.6 }]} onPress={() => handleBookedSlotPress(slot)}>
                        <View style={styles.bookedAvatar}>
                          <Ionicons name="person" size={16} color="#fff" />
                        </View>
                        <View style={styles.bookedInfoCompact}>
                          <ThemedText style={styles.bookedName} numberOfLines={1} ellipsizeMode="tail">{slot.booking?.customer_name || 'Booked'}</ThemedText>
                          {slot.booking?.customer_phone ? (
                            <ThemedText style={styles.bookedPhone} numberOfLines={1} ellipsizeMode="tail">{slot.booking.customer_phone}</ThemedText>
                          ) : null}
                        </View>
                        <ThemedText style={styles.bookedLabel}>{isBookedPast ? 'Completed' : 'Booked'}</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Closed Day or Empty Slots Message */}
        {!loading && (!currentCourt || currentCourt.slots.length === 0) && (
          (() => {
            // Use ONLY backend response as source of truth for closed status
            const backendClosed = slotData?.message?.toLowerCase().includes('closed') || false;
            console.log('[Booking] ===== NO SLOTS DISPLAY =====');
            console.log('[Booking] currentCourt:', currentCourt);
            console.log('[Booking] currentCourt?.slots.length:', currentCourt?.slots?.length);
            console.log('[Booking] slotData?.courts?.length:', slotData?.courts?.length);
            console.log('[Booking] slotData?.message:', slotData?.message);
            console.log('[Booking] backendClosed:', backendClosed);
            return (
              <View style={{ paddingVertical: 40, alignItems: 'center', marginTop: 16 }}>
                <Ionicons 
                  name={backendClosed ? "lock-closed" : "alert-circle-outline"} 
                  size={48} 
                  color={backendClosed ? "#DC2626" : "#9CA3AF"} 
                />
                <ThemedText style={{ marginTop: 12, color: '#6B7280', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                  {backendClosed ? 'Venue is closed on this day' : 'No slots available for the selected date'}
                </ThemedText>
                {backendClosed && (
                  <ThemedText style={{ marginTop: 8, color: '#9CA3AF', fontSize: 12, textAlign: 'center', paddingHorizontal: 24 }}>
                    Please select a different day when the venue is open
                  </ThemedText>
                )}
              </View>
            );
          })()
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
                  <View style={styles.infoBox}><Text style={styles.infoLabel}>Game:</Text><Text style={styles.infoValue}>{slotData?.sport_name || ''}</Text></View>
                  <View style={styles.infoBox}><Text style={styles.infoLabel}>Court:</Text><Text style={styles.infoValue}>{currentCourt?.court_name || ''}</Text></View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoBox}><Text style={styles.infoLabel}>Date:</Text><Text style={styles.infoValue}>{formatDate(selectedDate)}</Text></View>
                  <View style={styles.infoBox}><Text style={styles.infoLabel}>Time:</Text><Text style={styles.infoValue}>{selectedSlot ? formatSlotDisplayTime(selectedSlot.start_time) : ''}</Text></View>
                </View>

                <Text style={styles.fieldLabel}>Player Name *</Text>
                <TextInput style={styles.input} placeholder="Enter player name" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={playerName} onChangeText={setPlayerName} />

                <Text style={styles.fieldLabel}>Phone Number *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter phone number (10 digits)" 
                  placeholderTextColor="#9CA3AF" 
                  selectionColor="#0EA5E9" 
                  value={playerPhone} 
                  onChangeText={(text) => {
                    // Only allow digits, max 10
                    const digitsOnly = text.replace(/\D/g, '');
                    setPlayerPhone(digitsOnly.slice(0, 10));
                  }} 
                  keyboardType="phone-pad"
                  maxLength={10}
                />

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
                  <TouchableOpacity style={[styles.bookBtn, saving && { opacity: 0.5 }]} onPress={confirmBooking} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.bookText}>Book Slot</Text>}
                  </TouchableOpacity>
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
                          <ThemedText style={styles.customerNameLarge}>{selectedBookedSlot.booking?.customer_name || 'N/A'}</ThemedText>
                          <TouchableOpacity onPress={() => selectedBookedSlot.booking?.customer_phone && Linking.openURL(`tel:${selectedBookedSlot.booking.customer_phone}`)}>
                            <ThemedText style={[styles.customerPhoneLarge, { textDecorationLine: 'underline', color: '#0EA5E9' }]}>{selectedBookedSlot.booking?.customer_phone || 'N/A'}</ThemedText>
                          </TouchableOpacity>
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
                            <ThemedText style={styles.timeDetailValue}>{selectedBookedSlot.display_time}</ThemedText>
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
                              {slotData?.sport_name || ''}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.facilityItem}>
                          <Ionicons name="location" size={20} color="#15803D" />
                          <View style={{ marginLeft: 12 }}>
                            <ThemedText style={styles.timeDetailLabel}>Court</ThemedText>
                            <ThemedText style={styles.timeDetailValue}>{currentCourt?.court_name || 'Court 1'}</ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Payment Status */}
                    <View style={styles.detailsSection}>
                      <ThemedText style={styles.sectionTitle}>Payment Status</ThemedText>
                      <View style={[styles.detailsCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons 
                            name={selectedBookedSlot.booking?.payment_status === 'Paid' ? 'checkmark-circle' : 'close-circle'} 
                            size={24} 
                            color={selectedBookedSlot.booking?.payment_status === 'Paid' ? '#10B981' : '#EF4444'} 
                          />
                          <View style={{ marginLeft: 12 }}>
                            <ThemedText style={styles.timeDetailLabel}>Status</ThemedText>
                            <ThemedText style={[styles.timeDetailValue, { color: selectedBookedSlot.booking?.payment_status === 'Paid' ? '#10B981' : '#EF4444', fontWeight: '700' }]}>
                              {selectedBookedSlot.booking?.payment_status || 'Pending'}
                            </ThemedText>
                          </View>
                        </View>
                        {selectedBookedSlot.booking?.price && (
                          <View style={{ alignItems: 'flex-end' }}>
                            <ThemedText style={styles.timeDetailLabel}>Price</ThemedText>
                            <ThemedText style={[styles.timeDetailValue, { fontWeight: '700', color: '#15803D' }]}>
                              Rs {selectedBookedSlot.booking.price}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Notes Section - Only show if notes exist */}
                    {selectedBookedSlot.booking?.notes && selectedBookedSlot.booking.notes.trim() && (
                      <View style={styles.detailsSection}>
                        <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
                        <View style={[styles.detailsCard, { backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }]}>
                          <Ionicons name="document-text" size={20} color="#F59E0B" style={{ marginRight: 12 }} />
                          <ThemedText style={[styles.timeDetailValue, { flex: 1, color: '#92400E', fontStyle: 'italic' }]}>
                            {selectedBookedSlot.booking.notes}
                          </ThemedText>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              <View style={styles.detailsFooter}>
                <TouchableOpacity 
                  style={[styles.detailsCancelBtn, canceling && { opacity: 0.5 }]} 
                  onPress={handleCancelBooking}
                  disabled={canceling}
                >
                  {canceling ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.detailsCancelText}>Cancel Booking</Text>}
                </TouchableOpacity>
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
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
  },
  sportHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  sportTabsScroll: {
    marginTop: 8,
  },
  sportTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 100,
  },
  sportTabActive: {
    backgroundColor: '#DCFCE7',
    borderBottomColor: '#15803D',
  },
  sportTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
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
  openingHoursBanner: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#15803D',
    alignItems: 'center',
  },
  openingHoursClosed: {
    backgroundColor: '#FEE2E2',
    borderLeftColor: '#DC2626',
  },
  openingHoursText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },
  openingHoursSubtext: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '500',
  },
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
  bookedInfoCompact: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
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
  detailsCancelBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsCancelText: {
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