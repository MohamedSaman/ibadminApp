import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface TimeSlot {
  time: string;
  status: 'past' | 'available' | 'booked';
  customerEmail?: string;
  customerPhone?: string;
  duration?: string;
}

interface Court {
  id: string;
  name: string;
  slots: TimeSlot[];
}

export default function BookingScreen() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('football');
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 9)); // January 9, 2026
  const [selectedCourt, setSelectedCourt] = useState('court-1');

  const sports = [
    { id: 'football', name: 'Football', icon: 'football' as const },
    { id: 'pools', name: 'Pools', icon: 'water' as const },
  ];

  const courts: Court[] = [
    {
      id: 'court-1',
      name: 'COURT 1',
      slots: [
        { time: '5:00 AM - 6:00 AM', status: 'past' },
        { time: '6:00 AM - 7:00 AM', status: 'past' },
        { time: '7:00 AM - 8:00 AM', status: 'past' },
        { time: '8:00 AM - 9:00 AM', status: 'past' },
        { time: '9:00 AM - 10:00 AM', status: 'past' },
        { time: '10:00 AM - 11:00 AM', status: 'past' },
        { time: '11:00 AM - 12:00 PM', status: 'past' },
        { time: '12:00 PM - 1:00 PM', status: 'past' },
        { time: '1:00 PM - 2:00 PM', status: 'past' },
        { time: '2:00 PM - 3:00 PM', status: 'past' },
        { time: '3:00 PM - 4:00 PM', status: 'past' },
        { time: '4:00 PM - 5:00 PM', status: 'available' },
        {
          time: '5:00 PM - 6:00 PM',
          status: 'booked',
          customerEmail: 'code@gmail.com',
          customerPhone: '+94787471323',
          duration: '01:00',
        },
        {
          time: '6:00 PM - 7:00 PM',
          status: 'booked',
          customerEmail: 'code@gmail.com',
          customerPhone: '+94787471323',
          duration: '01:00',
        },
        { time: '7:00 PM - 8:00 PM', status: 'available' },
        { time: '8:00 PM - 9:00 PM', status: 'available' },
        { time: '9:00 PM - 10:00 PM', status: 'available' },
        { time: '10:00 PM - 11:00 PM', status: 'available' },
        { time: '11:00 PM - 12:00 AM', status: 'available' },
      ],
    },
  ];

  const currentCourt = courts.find((c) => c.id === selectedCourt);

  const formatDate = (date: Date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleDateChange = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  const handleBookSlot = (slot: TimeSlot) => {
    if (slot.status === 'available') {
      console.log('Booking slot:', slot.time);
      // TODO: Navigate to booking confirmation
    }
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
          <ThemedText style={styles.dateText}>{formatDate(selectedDate)}</ThemedText>
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
                    <View style={[styles.slot, styles.slotBooked]}>
                      <View style={styles.bookedAvatar}>
                        <Ionicons name="person" size={16} color="#fff" />
                      </View>
                      <View style={styles.bookedInfo}>
                        <ThemedText style={styles.bookedEmail}>{slot.customerEmail}</ThemedText>
                        <ThemedText style={styles.bookedPhone}>{slot.customerPhone}</ThemedText>
                      </View>
                      <ThemedText style={styles.bookedDuration}>{slot.duration}</ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
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
    backgroundColor: '#FED7AA',
    borderWidth: 1,
    borderColor: '#FB923C',
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
  bookedEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textDecorationLine: 'underline',
  },
  bookedPhone: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  bookedDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
  },
});
