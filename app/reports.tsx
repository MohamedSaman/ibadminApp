import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ReportsScreen() {
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState('Daily (Last 7 Days)');

  const statCards = [
    { id: 'total', title: 'Total Bookings', value: '14', bg: '#DBEAFE', textColor: '#0369A1' },
    { id: 'upcoming', title: 'Upcoming Bookings (Today)', value: '0', bg: '#FEFCE8', textColor: '#854D0E' },
    { id: 'revenue', title: 'Total Revenue', value: 'LKR 0.00', bg: '#DCFCE7', textColor: '#166534' },
    { id: 'cancelled', title: 'Cancelled Bookings', value: '1', bg: '#FCE7F3', textColor: '#831843' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.exportContainer}>
          <TouchableOpacity style={styles.exportBtn} onPress={() => { /* export action */ }}>
            <Ionicons name="download" size={16} color="#fff" />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardsGrid}>
          {statCards.map((c) => (
            <View key={c.id} style={[styles.statCard, { backgroundColor: c.bg }]}>
              <Text style={styles.statTitle}>{c.title}</Text>
              <Text style={[styles.statValue, { color: c.textColor }]}>{c.value}</Text>
              <Text style={styles.statNote}>Filtered by selected criteria</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Revenue Trend</Text>
            <TouchableOpacity style={styles.timeFilterBtn}>
              <Text style={styles.timeFilterText}>{timePeriod}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Chart placeholder</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.bookingBtn]} onPress={() => router.push('/reports/bookings')}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.actionText}>Booking Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.revenueBtn]} onPress={() => router.push('/reports/revenue')}>
            <Ionicons name="cash" size={20} color="#fff" />
            <Text style={styles.actionText}>Revenue Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.customerBtn]} onPress={() => router.push('/reports/customers')}>
            <Ionicons name="people" size={20} color="#fff" />
            <Text style={styles.actionText}>Customer Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.performanceBtn]} onPress={() => router.push('/reports/performance')}>
            <Ionicons name="trending-up" size={20} color="#fff" />
            <Text style={styles.actionText}>Performance & Utilization</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
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
  headerTitle: { fontSize: 18, fontWeight: '600' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  container: { padding: 16, paddingBottom: 40 },
  exportContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  statTitle: { color: '#0F172A', fontWeight: '600', marginBottom: 8, fontSize: 13 },
  statValue: { fontWeight: '800', fontSize: 22, marginBottom: 6 },
  statNote: { color: '#6B7280', fontSize: 11 },
  chartCard: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: { fontWeight: '600' },
  timeFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  timeFilterText: { color: '#666', fontWeight: '500', fontSize: 13 },
  chartPlaceholder: {
    height: 240,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: { color: '#9CA3AF' },
  actionsRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
    width: '48%',
  },
  bookingBtn: { backgroundColor: '#2563EB' },
  revenueBtn: { backgroundColor: '#15803D' },
  customerBtn: { backgroundColor: '#7C3AED' },
  performanceBtn: { backgroundColor: '#EA580C' },
  actionText: { color: '#fff', fontWeight: '700', marginLeft: 12 },
});
