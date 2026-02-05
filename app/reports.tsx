import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const bookingRows = [
  { id: 1, username: 'code@gmail.com', court: '1', sport: 'N/A', date: 'Jan 16, 2026', time: '06:00 PM - 08:00 PM', duration: '2.00', status: 'CONFIRMED', revenue: 'LKR 3,000.00' },
  { id: 2, username: 'mhdakmal1796@gmail.com', court: '1', sport: 'N/A', date: 'Jan 16, 2026', time: '02:00 PM - 04:00 PM', duration: '2.00', status: 'CONFIRMED', revenue: 'LKR 3,000.00' },
];

const revenueRows = [
  { sport: 'N/A', court: '1', totalBookings: '1', totalHours: '2.00', totalRevenue: 'LKR 3,000.00', avgRevenue: 'LKR 3,000.00' },
  { sport: 'N/A', court: '1', totalBookings: '1', totalHours: '2.00', totalRevenue: 'LKR 3,000.00', avgRevenue: 'LKR 3,000.00' },
];

const timeOptions = ['Daily (Last 7 Days)', 'Weekly (Last 4 Weeks)', 'Monthly (Last 12 Months)'];

export default function ReportsScreen() {
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState('Daily (Last 7 Days)');
  const [showBookingReport, setShowBookingReport] = useState(false);
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);

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
            <View style={styles.timeFilterContainer}>
              <TouchableOpacity style={styles.timeFilterBtn} onPress={() => setShowTimeOptions((s) => !s)}>
                <Text style={styles.timeFilterText}>{timePeriod}</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>

              {showTimeOptions && (
                <View style={styles.timeOptionsWrap}>
                  {timeOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.timeOptionItem, opt === timePeriod ? styles.timeOptionSelected : null]}
                      onPress={() => { setTimePeriod(opt); setShowTimeOptions(false); }}
                    >
                      <Text style={[styles.timeOptionText, opt === timePeriod ? styles.timeOptionSelectedText : null]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Chart placeholder</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.bookingBtn]} onPress={() => setShowBookingReport(true)}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.actionText}>Booking Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.revenueBtn]} onPress={() => setShowRevenueReport(true)}>
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

      {showBookingReport && (
        <View style={styles.reportOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Comprehensive Booking Details Report - Indoor Booking System</Text>
              <TouchableOpacity onPress={() => setShowBookingReport(false)} style={styles.reportCloseBtn}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.reportContent} keyboardShouldPersistTaps="handled">
              <View style={styles.complexInfoRow}>
                <View style={styles.complexPhotoPlaceholder} />
                <View style={styles.complexTextInfo}>
                  <Text style={styles.complexPhotoLabel}>Complex Photo</Text>
                  <Text style={styles.complexName}>Default Complex</Text>
                  <Text style={styles.complexAddress}>Warana Rd, Kalagedihena</Text>
                </View>
              </View>

              <Text style={styles.datesLabel}>Dates: Jan 10, 2026 to Jan 16, 2026</Text>
              <Text style={styles.bookingDetailsTitle}>BOOKING DETAILS</Text>

              <ScrollView horizontal={true} keyboardShouldPersistTaps="handled" style={styles.tableScrollView}>
                <View style={styles.tableWrapper}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { width: 120 }]}>Booking ID</Text>
                    <Text style={[styles.th, { width: 200 }]}>Username</Text>
                    <Text style={[styles.th, { width: 80 }]}>Court</Text>
                    <Text style={[styles.th, { width: 100 }]}>Sport</Text>
                    <Text style={[styles.th, { width: 130 }]}>Date</Text>
                    <Text style={[styles.th, { width: 180 }]}>Time</Text>
                    <Text style={[styles.th, { width: 130 }]}>Duration (Hours)</Text>
                    <Text style={[styles.th, { width: 120 }]}>Status</Text>
                    <Text style={[styles.th, { width: 150 }]}>Revenue</Text>
                  </View>

                  {bookingRows.map((row, idx) => (
                    <View key={row.id} style={[styles.tableDataRow, idx % 2 === 0 ? styles.rowAlt : null]}>
                      <Text style={[styles.td, { width: 120 }]}>{row.id}</Text>
                      <Text style={[styles.td, { width: 200 }]}>{row.username}</Text>
                      <Text style={[styles.td, { width: 80 }]}>{row.court}</Text>
                      <Text style={[styles.td, { width: 100 }]}>{row.sport}</Text>
                      <Text style={[styles.td, { width: 130 }]}>{row.date}</Text>
                      <Text style={[styles.td, { width: 180 }]}>{row.time}</Text>
                      <Text style={[styles.td, { width: 130 }]}>{row.duration}</Text>
                      <View style={[styles.td, { width: 120 }]}> 
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>{row.status}</Text>
                        </View>
                      </View>
                      <Text style={[styles.td, { width: 150 }]}>{row.revenue}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.reportActions}>
                <TouchableOpacity style={styles.printReportBtn} onPress={() => alert('Print report')}>
                  <Text style={styles.printReportText}>Print Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportCloseActionBtn} onPress={() => setShowBookingReport(false)}>
                  <Text style={styles.reportCloseActionText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {showRevenueReport && (
        <View style={styles.reportOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Comprehensive Revenue Report - Indoor Booking System</Text>
              <TouchableOpacity onPress={() => setShowRevenueReport(false)} style={styles.reportCloseBtn}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.reportContent} keyboardShouldPersistTaps="handled">
              <View style={styles.complexInfoRow}>
                <View style={styles.complexPhotoPlaceholder} />
                <View style={styles.complexTextInfo}>
                  <Text style={styles.complexPhotoLabel}>Complex Photo</Text>
                  <Text style={styles.complexName}>Default Complex</Text>
                  <Text style={styles.complexAddress}>Warana Rd, Kalagedihena</Text>
                </View>
              </View>

              <Text style={styles.datesLabel}>Dates: Jan 10, 2026 to Jan 16, 2026</Text>
              <Text style={styles.bookingDetailsTitle}>REVENUE SUMMARY</Text>

              <ScrollView horizontal={true} keyboardShouldPersistTaps="handled" style={styles.tableScrollView}>
                <View style={styles.tableWrapper}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { width: 80 }]}>Sport</Text>
                    <Text style={[styles.th, { width: 80 }]}>Court</Text>
                    <Text style={[styles.th, { width: 140 }]}>Total Bookings</Text>
                    <Text style={[styles.th, { width: 170 }]}>Total Hours Booked</Text>
                    <Text style={[styles.th, { width: 180 }]}>Total Revenue (LKR)</Text>
                    <Text style={[styles.th, { width: 230 }]}>Average Revenue per Booking (LKR)</Text>
                  </View>

                  {revenueRows.map((row, idx) => (
                    <View key={idx} style={[styles.tableDataRow, idx % 2 === 0 ? styles.rowAlt : null]}>
                      <Text style={[styles.td, { width: 80 }]}>{row.sport}</Text>
                      <Text style={[styles.td, { width: 80 }]}>{row.court}</Text>
                      <Text style={[styles.td, { width: 140 }]}>{row.totalBookings}</Text>
                      <Text style={[styles.td, { width: 170 }]}>{row.totalHours}</Text>
                      <Text style={[styles.td, { width: 180 }]}>{row.totalRevenue}</Text>
                      <Text style={[styles.td, { width: 230 }]}>{row.avgRevenue}</Text>
                    </View>
                  ))}

                  <View style={[styles.tableDataRow, { borderBottomWidth: 0, backgroundColor: '#fff' }]}>
                    <Text style={[styles.td, { width: 80 }]}></Text>
                    <Text style={[styles.td, { width: 80, fontWeight: '700', textAlign: 'right' }]}>Total:</Text>
                    <Text style={[styles.td, { width: 140, fontWeight: '700' }]}>2</Text>
                    <Text style={[styles.td, { width: 170, fontWeight: '700' }]}>4.00</Text>
                    <Text style={[styles.td, { width: 180, fontWeight: '700' }]}>LKR 6,000.00</Text>
                    <Text style={[styles.td, { width: 230, fontWeight: '700' }]}>LKR 3,000.00</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.reportActions}>
                <TouchableOpacity style={styles.printReportBtn} onPress={() => alert('Print report')}>
                  <Text style={styles.printReportText}>Print Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportCloseActionBtn} onPress={() => setShowRevenueReport(false)}>
                  <Text style={styles.reportCloseActionText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
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
  timeFilterContainer: { position: 'relative' },
  timeFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#15803D',
    gap: 6,
    backgroundColor: '#fff'
  },
  timeFilterText: { color: '#111827', fontWeight: '500', fontSize: 12 },
  timeOptionsWrap: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 150,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 6,
    overflow: 'hidden',
    zIndex: 2000,
  },
  timeOptionItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  timeOptionSelected: {
    backgroundColor: '#2563EB',
  },
  timeOptionText: {
    color: '#111827',
    fontSize: 12,
  },
  timeOptionSelectedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
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
  reportOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 64, zIndex: 1000 },
  reportModal: { width: '94%', maxHeight: '90%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', flexDirection: 'column' },
  reportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  reportTitle: { fontSize: 15, fontWeight: '600', flex: 1, color: '#111827' },
  reportCloseBtn: { padding: 4 },
  reportContent: { padding: 16, paddingBottom: 20 },
  complexInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  complexPhotoPlaceholder: { width: 60, height: 60, backgroundColor: '#F3F4F6', borderRadius: 6, marginRight: 12 },
  complexTextInfo: { flex: 1, alignItems: 'center' },
  complexPhotoLabel: { fontWeight: '600', fontSize: 12, color: '#6B7280' },
  complexName: { color: '#111827', marginTop: 4, fontSize: 14, fontWeight: '600' },
  complexAddress: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  datesLabel: { fontWeight: '700', marginVertical: 8, fontSize: 12, color: '#111827' },
  bookingDetailsTitle: { fontWeight: '700', marginVertical: 8, fontSize: 12, color: '#111827' },
  tableScrollView: { marginVertical: 8 },
  tableWrapper: { marginTop: 8, minWidth: '100%' },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#E5E7EB', backgroundColor: '#FAFAFA' },
  th: { fontWeight: '700', fontSize: 11, color: '#0F172A', paddingHorizontal: 6 },
  tableDataRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  td: { fontSize: 11, color: '#111827', paddingHorizontal: 6 },
  statusBadge: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start' },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  rowAlt: { backgroundColor: '#FBFBFB' },
  reportActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  printReportBtn: { backgroundColor: '#166534', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, marginRight: 12 },
  printReportText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reportCloseActionBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  reportCloseActionText: { color: '#374151', fontWeight: '600', fontSize: 14 },
});
