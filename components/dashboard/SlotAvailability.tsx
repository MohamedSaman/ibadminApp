import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Calendar } from './Calendar';

interface TimeSlot {
  time: string;
  status: 'available' | 'booked' | 'past';
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
  onDateChange?: (date: Date) => void;
}

export function SlotAvailability({
  sports,
  selectedDate,
  onNewPress,
  onSlotPress,
  onDateChange,
}: SlotAvailabilityProps) {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const dropdownRef = useRef<any>(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0, width: 160, height: 40 });

  const openDropdown = () => {
    if (dropdownRef.current && dropdownRef.current.measureInWindow) {
      dropdownRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        setDropdownPos({ x, y, width: Math.max(width, 160), height });
        setShowDropdown(true);
      });
    } else {
      setShowDropdown(true);
    }
  };

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
            Slot{' '}Availability
          </ThemedText>
          <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.dateTouch}>
            <Ionicons name="calendar-outline" size={16} color="#16A34A" />
            <ThemedText style={styles.dateText} lightColor="#16A34A">
              {formatDate(selectedDate)}
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity ref={dropdownRef} style={styles.dropdown} onPress={openDropdown}>
            <ThemedText style={styles.dropdownText} lightColor="#374151">
              {selectedSport === 'all' ? 'All Sports' : (sports.find(s => s.id === selectedSport)?.name ?? 'All Sports')}
            </ThemedText>
            <Ionicons name="chevron-down" size={16} color="#374151" />
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
            {sport.slots.filter(s => s.status === 'available').map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.slotButton, styles.availableSlot]}
                onPress={() => onSlotPress?.(sport, slot)}
              >
                <ThemedText style={[styles.slotTime, styles.availableSlotText]}>
                  {slot.time}
                </ThemedText>
                <ThemedText style={[styles.slotStatus, styles.availableSlotText]}>
                  Book Now
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
          <View style={[styles.dropdownMenu, { top: dropdownPos.y + dropdownPos.height + 6, left: dropdownPos.x, width: dropdownPos.width }]}>
            <TouchableOpacity style={[styles.dropdownItem, selectedSport === 'all' && styles.dropdownItemActive]} onPress={() => { setSelectedSport('all'); setShowDropdown(false); }}>
              <ThemedText style={[styles.dropdownItemText, selectedSport === 'all' && styles.dropdownItemTextActive]}>All Sports</ThemedText>
            </TouchableOpacity>
            {sports.map((s) => (
              <TouchableOpacity key={s.id} style={[styles.dropdownItem, selectedSport === s.id && styles.dropdownItemActive]} onPress={() => { setSelectedSport(s.id); setShowDropdown(false); }}>
                <ThemedText style={[styles.dropdownItemText, selectedSport === s.id && styles.dropdownItemTextActive]}>{s.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Calendar Modal for date selection */}
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
          <View style={styles.calendarBox}>
            <Calendar selectedDate={selectedDate} onDateSelect={(d) => { onDateChange?.(d); setShowCalendar(false); }} />
          </View>
        </TouchableOpacity>
      </Modal>
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
  dateTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
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
    gap: 8,
    justifyContent: 'flex-start',
  },
  slotButton: {
    paddingHorizontal: 10,
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
  modalOverlay: { flex: 1, backgroundColor: 'transparent' },
  dropdownMenu: { position: 'absolute', top: 120, right: 16, width: 160, backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  dropdownItemText: { fontSize: 14, color: '#111827' },
  dropdownItemActive: { backgroundColor: '#2563EB' },
  dropdownItemTextActive: { color: '#fff' },
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  calendarBox: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', width: '90%', maxWidth: 360 },
});
