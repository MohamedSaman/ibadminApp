import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface TimeSlot {
  time: string;
  status: 'available' | 'booked';
}

interface Sport {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  courts?: number;
  slots: TimeSlot[];
}

interface SlotAvailabilityProps {
  sports: Sport[];
  selectedDate: Date;
  onNewPress?: () => void;
  onSlotPress?: (sport: Sport, slot: TimeSlot) => void;
}

export function SlotAvailability({
  sports,
  selectedDate,
  onNewPress,
  onSlotPress,
}: SlotAvailabilityProps) {
  const [selectedSport, setSelectedSport] = useState<string>('all');

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
  };

  const getAvailableCount = (slots: TimeSlot[]) => {
    return slots.filter(s => s.status === 'available').length;
  };

  const filteredSports = selectedSport === 'all' 
    ? sports 
    : sports.filter(s => s.id === selectedSport);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.title} lightColor="#111827">
            Slot{'\n'}Availability
          </ThemedText>
          <ThemedText style={styles.subtitle} lightColor="#6B7280">
            Showing{'\n'}status for{'\n'}{formatDate(selectedDate)}
          </ThemedText>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.dropdown}>
            <ThemedText style={styles.dropdownText} lightColor="#374151">
              All Sports
            </ThemedText>
            <Ionicons name="chevron-down" size={16} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.newButton} onPress={onNewPress}>
            <Ionicons name="add" size={20} color="#fff" />
            <ThemedText style={styles.newButtonText}>New</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {filteredSports.map((sport) => (
        <View key={sport.id} style={styles.sportCard}>
          <View style={styles.sportHeader}>
            <View style={styles.sportInfo}>
              <View style={[styles.sportIcon, { backgroundColor: `${sport.iconColor}20` }]}>
                <Ionicons name={sport.icon} size={20} color={sport.iconColor} />
              </View>
              <View>
                <ThemedText style={styles.sportName} lightColor="#111827">
                  {sport.name}
                </ThemedText>
                {sport.courts && (
                  <ThemedText style={styles.courtsText} lightColor="#6B7280">
                    {sport.courts} Courts
                  </ThemedText>
                )}
              </View>
            </View>
            <View style={styles.availableBadge}>
              <ThemedText style={styles.availableText}>
                {getAvailableCount(sport.slots)} Available
              </ThemedText>
            </View>
          </View>

          <View style={styles.slotsGrid}>
            {sport.slots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.slotButton,
                  slot.status === 'available' ? styles.availableSlot : styles.bookedSlot,
                ]}
                onPress={() => onSlotPress?.(sport, slot)}
              >
                <ThemedText
                  style={[
                    styles.slotTime,
                    slot.status === 'available' ? styles.availableSlotText : styles.bookedSlotText,
                  ]}
                >
                  {slot.time}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.slotStatus,
                    slot.status === 'available' ? styles.availableSlotText : styles.bookedSlotText,
                  ]}
                >
                  {slot.status === 'available' ? 'Available' : 'Booked'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.availableLegend]} />
          <ThemedText style={styles.legendText} lightColor="#0EA5E9">
            Available
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.bookedLegend]} />
          <ThemedText style={styles.legendText} lightColor="#6B7280">
            Booked
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sportIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportName: {
    fontSize: 16,
    fontWeight: '600',
  },
  courtsText: {
    fontSize: 12,
  },
  availableBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  slotButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '31%',
    marginBottom: 8,
  },
  availableSlot: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  bookedSlot: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  slotStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  availableSlotText: {
    color: '#0EA5E9',
  },
  bookedSlotText: {
    color: '#9CA3AF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availableLegend: {
    backgroundColor: '#0EA5E9',
  },
  bookedLegend: {
    backgroundColor: '#9CA3AF',
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
