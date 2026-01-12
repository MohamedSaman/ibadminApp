import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface DashboardHeaderProps {
  onAddBooking?: () => void;
}

export function DashboardHeader({ onAddBooking }: DashboardHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <ThemedText style={styles.title} lightColor="#111827">
          Dashboard
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Manage, track, and optimize your{'\n'}indoor ground bookings with ease.
        </ThemedText>
      </View>
      
      <TouchableOpacity style={styles.addButton} onPress={onAddBooking}>
        <Ionicons name="add" size={18} color="#fff" />
        <ThemedText style={styles.addButtonText}>Add{'\n'}Booking</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    
  
    

    
    
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color:'#605d5dff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
