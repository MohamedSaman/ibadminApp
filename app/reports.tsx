import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getDashboardStats, getRevenueReport, getBookingReport, getBookings, getSportsRevenueReport } from '@/services/indoorAdminApi';
import { DashboardStats, RevenueReport, RevenueDataPoint, BookingReport, SportsRevenueReport } from '@/types/api';

const screenWidth = Dimensions.get('window').width;

const timeOptions = ['Daily (Last 7 Days)', 'Weekly (Last 4 Weeks)', 'Monthly (Last 12 Months)'];

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `LKR ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
};

export default function ReportsScreen() {
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState('Daily (Last 7 Days)');
  const [showBookingReport, setShowBookingReport] = useState(false);
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);

  // API data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookingReportData, setBookingReportData] = useState<any>(null);
  const [revenueReportData, setRevenueReportData] = useState<RevenueReport | null>(null);
  const [sportsRevenueData, setSportsRevenueData] = useState<SportsRevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingBookingReport, setLoadingBookingReport] = useState(false);
  const [loadingRevenueReport, setLoadingRevenueReport] = useState(false);
  const [loadingSportsRevenue, setLoadingSportsRevenue] = useState(false);
  const [showSportsRevenueReport, setShowSportsRevenueReport] = useState(false);
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Fetch chart data from revenue API - always daily for day-by-day view
  const fetchChartData = useCallback(async (period: string) => {
    try {
      setLoadingChart(true);
      // Always fetch daily for day-by-day chart
      const data = await getRevenueReport({ period: 'daily' });
      setChartData(data.data || []);
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      setChartData([]);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  // Fetch stats from API
  const fetchStats = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchChartData(timePeriod);
  }, [fetchStats, fetchChartData]);

  const onRefresh = useCallback(() => {
    fetchStats(true);
    fetchChartData(timePeriod);
  }, [fetchStats, fetchChartData, timePeriod]);

  // Format chart labels - day by day
  const getChartLabels = (data: RevenueDataPoint[]): string[] => {
    if (data.length === 0) return ['No data'];
    return data.map(d => {
      const date = new Date(d.date + 'T00:00:00');
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      return `${month} ${day}`;
    });
  };

  const getChartValues = (data: RevenueDataPoint[]): number[] => {
    if (data.length === 0) return [0];
    return data.map(d => parseFloat(d.revenue) || 0);
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(21, 128, 61, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: { borderRadius: 12 },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#15803D',
      fill: '#ffffff',
    },
    propsForBackgroundLines: {
      strokeDasharray: '4 4',
      stroke: '#E5E7EB',
    },
    propsForLabels: {
      fontSize: 10,
    },
    fillShadowGradientFrom: '#15803D',
    fillShadowGradientTo: '#ffffff',
    fillShadowGradientFromOpacity: 0.15,
    fillShadowGradientToOpacity: 0,
  };

  // Fetch booking report when modal is opened
  const handleShowBookingReport = async () => {
    setShowBookingReport(true);
    setLoadingBookingReport(true);
    try {
      // Fetch actual bookings list from the backend
      const data = await getBookings();
      const bookings = data.results || data || [];
      // Build summary from the bookings
      const total = bookings.length;
      const confirmed = bookings.filter((b: any) => b.status === 'Confirmed' || b.status === 'Upcoming').length;
      const cancelled = bookings.filter((b: any) => b.status === 'Cancelled').length;
      const completed = bookings.filter((b: any) => b.status === 'Completed').length;
      const pending = bookings.filter((b: any) => b.status === 'Pending').length;
      const totalRevenue = bookings
        .filter((b: any) => ['Confirmed', 'Upcoming', 'Completed'].includes(b.status))
        .reduce((sum: number, b: any) => sum + parseFloat(b.price || '0'), 0);
      
      setBookingReportData({
        bookings,
        summary: { total, confirmed, cancelled, completed, pending, total_revenue: totalRevenue.toFixed(2) },
      });
    } catch (err) {
      console.error('Failed to fetch booking report:', err);
    } finally {
      setLoadingBookingReport(false);
    }
  };

  // Fetch revenue report when modal is opened
  const handleShowRevenueReport = async () => {
    setShowRevenueReport(true);
    setLoadingRevenueReport(true);
    try {
      const period = timePeriod.includes('Daily') ? 'daily' : timePeriod.includes('Weekly') ? 'weekly' : 'monthly';
      const data = await getRevenueReport({ period });
      setRevenueReportData(data);
    } catch (err) {
      console.error('Failed to fetch revenue report:', err);
    } finally {
      setLoadingRevenueReport(false);
    }
  };

  // Fetch sports revenue report
  const handleShowSportsRevenueReport = async () => {
    setShowSportsRevenueReport(true);
    setLoadingSportsRevenue(true);
    try {
      const data = await getSportsRevenueReport();
      setSportsRevenueData(data);
    } catch (err) {
      console.error('Failed to fetch sports revenue report:', err);
    } finally {
      setLoadingSportsRevenue(false);
    }
  };

  const statCards = [
    { id: 'total', title: 'Total Bookings', value: stats?.total_bookings?.toString() ?? '0', bg: '#DBEAFE', textColor: '#0369A1' },
    { id: 'upcoming', title: 'Upcoming Bookings (Today)', value: stats?.today_bookings?.toString() ?? '0', bg: '#FEFCE8', textColor: '#854D0E' },
    { id: 'revenue', title: 'Total Revenue', value: stats?.total_revenue ? formatCurrency(stats.total_revenue) : 'LKR 0.00', bg: '#DCFCE7', textColor: '#166534' },
    { id: 'cancelled', title: 'Cancelled Bookings', value: stats?.cancelled_bookings?.toString() ?? '0', bg: '#FCE7F3', textColor: '#831843' },
  ];

  // Transform API booking data to display format
  const bookingRows = bookingReportData?.bookings?.map((b: any) => ({
    id: b.id,
    username: b.user_email || b.user_name || 'N/A',
    court: b.court_number?.toString() || '1',
    sport: b.sport_name || 'N/A',
    date: formatDate(b.booking_date),
    time: b.time_slot || `${formatTime(b.start_time)} - ${formatTime(b.end_time)}`,
    duration: '1.00',
    status: (b.status || 'Pending').toUpperCase(),
    revenue: formatCurrency(b.price || '0'),
  })) || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#15803D']} />
      }>
        <View style={styles.exportContainer}>
          <TouchableOpacity style={styles.exportBtn} onPress={() => { /* export action */ }}>
            <Ionicons name="download" size={16} color="#fff" />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#15803D" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        )}

        {/* Stats Cards */}
        {!loading && (
          <View style={styles.cardsGrid}>
            {statCards.map((c) => (
              <View key={c.id} style={[styles.statCard, { backgroundColor: c.bg }]}>
                <Text style={styles.statTitle}>{c.title}</Text>
                <Text style={[styles.statValue, { color: c.textColor }]}>{c.value}</Text>
                <Text style={styles.statNote}>Filtered by selected criteria</Text>
              </View>
            ))}
          </View>
        )}

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
                      onPress={() => { setTimePeriod(opt); setShowTimeOptions(false); fetchChartData(opt); }}
                    >
                      <Text style={[styles.timeOptionText, opt === timePeriod ? styles.timeOptionSelectedText : null]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {loadingChart ? (
            <View style={styles.chartPlaceholder}>
              <ActivityIndicator size="large" color="#15803D" />
              <Text style={[styles.chartPlaceholderText, { marginTop: 8 }]}>Loading chart...</Text>
            </View>
          ) : chartData.length === 0 ? (
            <View style={styles.chartPlaceholder}>
              <Ionicons name="bar-chart-outline" size={36} color="#9CA3AF" />
              <Text style={[styles.chartPlaceholderText, { marginTop: 8 }]}>No revenue data available</Text>
              <Text style={[styles.chartPlaceholderText, { fontSize: 11 }]}>Bookings will appear here once created</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={{
                  labels: getChartLabels(chartData),
                  datasets: [{ data: getChartValues(chartData), color: (opacity = 1) => `rgba(21, 128, 61, ${opacity})`, strokeWidth: 3 }],
                }}
                width={Math.max(screenWidth - 60, chartData.length * 55)}
                height={240}
                yAxisLabel="Rs "
                yAxisSuffix=""
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 10, marginLeft: -10 }}
                fromZero
                withInnerLines
                withOuterLines={false}
                withVerticalLabels
                withHorizontalLabels
                segments={5}
                verticalLabelRotation={chartData.length > 10 ? 45 : 0}
                onDataPointClick={({ value, index }) => {
                  const point = chartData[index];
                  if (point) {
                    const date = new Date(point.date + 'T00:00:00');
                    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    alert(`${dateStr}\nDaily Revenue: LKR ${parseFloat(point.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}\nBookings: ${point.bookings}`);
                  }
                }}
              />
            </ScrollView>
          )}

          {/* Chart summary below */}
          {!loadingChart && chartData.length > 0 && (
            <View style={styles.chartSummaryRow}>
              <View style={styles.chartSummaryItem}>
                <View style={[styles.chartDot, { backgroundColor: '#15803D' }]} />
                <Text style={styles.chartSummaryLabel}>Total: LKR {getChartValues(chartData).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.chartSummaryItem}>
                <View style={[styles.chartDot, { backgroundColor: '#0369A1' }]} />
                <Text style={styles.chartSummaryLabel}>Avg/day: LKR {(getChartValues(chartData).reduce((a, b) => a + b, 0) / chartData.length).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.chartSummaryItem}>
                <View style={[styles.chartDot, { backgroundColor: '#854D0E' }]} />
                <Text style={styles.chartSummaryLabel}>{chartData.length} days</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.bookingBtn]} onPress={handleShowBookingReport}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.actionText}>Booking Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.revenueBtn]} onPress={handleShowRevenueReport}>
            <Ionicons name="cash" size={20} color="#fff" />
            <Text style={styles.actionText}>Revenue Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.sportsRevenueBtn]} onPress={handleShowSportsRevenueReport}>
            <Ionicons name="football" size={20} color="#fff" />
            <Text style={styles.actionText}>Sports Revenue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.performanceBtn]} onPress={() => { /* TODO: Performance page */ }}>
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

              <Text style={styles.datesLabel}>Booking Report</Text>
              <Text style={styles.bookingDetailsTitle}>BOOKING DETAILS</Text>

              {loadingBookingReport && (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#15803D" />
                  <Text style={styles.loadingText}>Loading booking data...</Text>
                </View>
              )}

              {!loadingBookingReport && bookingReportData && (
                <View style={styles.bookingSummaryRow}>
                  <Text style={styles.summaryText}>Total: {bookingReportData.summary?.total ?? 0} | </Text>
                  <Text style={[styles.summaryText, { color: '#15803D' }]}>Confirmed: {bookingReportData.summary?.confirmed ?? 0}</Text>
                  <Text style={[styles.summaryText, { color: '#DC2626' }]}> | Cancelled: {bookingReportData.summary?.cancelled ?? 0}</Text>
                </View>
              )}

              {!loadingBookingReport && (
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

                    {bookingRows.map((row: any, idx: number) => (
                      <View key={row.id} style={[styles.tableDataRow, idx % 2 === 0 ? styles.rowAlt : null]}>
                        <Text style={[styles.td, { width: 120 }]}>{row.id}</Text>
                        <Text style={[styles.td, { width: 200 }]}>{row.username}</Text>
                        <Text style={[styles.td, { width: 80 }]}>{row.court}</Text>
                        <Text style={[styles.td, { width: 100 }]}>{row.sport}</Text>
                        <Text style={[styles.td, { width: 130 }]}>{row.date}</Text>
                        <Text style={[styles.td, { width: 180 }]}>{row.time}</Text>
                        <Text style={[styles.td, { width: 130 }]}>{row.duration}</Text>
                        <View style={[styles.td, { width: 120 }]}> 
                          <View style={[styles.statusBadge, { backgroundColor: row.status === 'CONFIRMED' ? '#DCFCE7' : row.status === 'CANCELLED' ? '#FEE2E2' : '#FEF3C7' }]}>
                            <Text style={[styles.statusBadgeText, { color: row.status === 'CONFIRMED' ? '#166534' : row.status === 'CANCELLED' ? '#991B1B' : '#92400E' }]}>{row.status}</Text>
                          </View>
                        </View>
                        <Text style={[styles.td, { width: 150 }]}>{row.revenue}</Text>
                      </View>
                    ))}

                    {bookingRows.length === 0 && (
                      <View style={styles.noDataRow}>
                        <Text style={styles.noDataText}>No booking data available</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              )}

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

              <Text style={styles.datesLabel}>Revenue Summary</Text>
              <Text style={styles.bookingDetailsTitle}>REVENUE SUMMARY</Text>

              {loadingRevenueReport && (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#15803D" />
                  <Text style={styles.loadingText}>Loading revenue data...</Text>
                </View>
              )}

              {!loadingRevenueReport && (
                <>
                  <View style={styles.revenueSummaryCards}>
                    <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={styles.summaryLabel}>Total Revenue</Text>
                      <Text style={[styles.summaryValue, { color: '#166534' }]}>
                        {revenueReportData ? formatCurrency(revenueReportData.total_revenue) : 'LKR 0.00'}
                      </Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={styles.summaryLabel}>Total Bookings</Text>
                      <Text style={[styles.summaryValue, { color: '#0369A1' }]}>
                        {revenueReportData?.total_bookings ?? 0}
                      </Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#FEFCE8' }]}>
                      <Text style={styles.summaryLabel}>Avg Booking Value</Text>
                      <Text style={[styles.summaryValue, { color: '#854D0E' }]}>
                        {revenueReportData ? formatCurrency(revenueReportData.average_booking_value) : 'LKR 0.00'}
                      </Text>
                    </View>
                  </View>

                  <ScrollView horizontal={true} keyboardShouldPersistTaps="handled" style={styles.tableScrollView}>
                    <View style={styles.tableWrapper}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, { width: 120 }]}>Date</Text>
                        <Text style={[styles.th, { width: 150 }]}>Revenue</Text>
                        <Text style={[styles.th, { width: 120 }]}>Bookings</Text>
                      </View>

                      {(revenueReportData?.data || []).map((row, idx) => (
                        <View key={idx} style={[styles.tableDataRow, idx % 2 === 0 ? styles.rowAlt : null]}>
                          <Text style={[styles.td, { width: 120 }]}>{row.date}</Text>
                          <Text style={[styles.td, { width: 150 }]}>{formatCurrency(row.revenue)}</Text>
                          <Text style={[styles.td, { width: 120 }]}>{row.bookings}</Text>
                        </View>
                      ))}

                      {(revenueReportData?.data?.length === 0 || !revenueReportData) && (
                        <View style={styles.noDataRow}>
                          <Text style={styles.noDataText}>No revenue data available</Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </>
              )}

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

      {showSportsRevenueReport && (
        <View style={styles.reportOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Sports Revenue Report</Text>
              <TouchableOpacity onPress={() => setShowSportsRevenueReport(false)} style={styles.reportCloseBtn}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.reportContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.bookingDetailsTitle}>REVENUE BY SPORT</Text>

              {loadingSportsRevenue && (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#15803D" />
                  <Text style={styles.loadingText}>Loading sports revenue...</Text>
                </View>
              )}

              {!loadingSportsRevenue && sportsRevenueData && (
                <>
                  <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7', width: '100%', marginBottom: 16 }]}>
                    <Text style={styles.summaryLabel}>Total Revenue (All Sports)</Text>
                    <Text style={[styles.summaryValue, { color: '#166534' }]}>
                      {formatCurrency(sportsRevenueData.total_revenue)}
                    </Text>
                  </View>

                  {sportsRevenueData.sports.map((sport, idx) => (
                    <View key={sport.sport_id} style={styles.sportRevenueCard}>
                      <View style={styles.sportRevenueHeader}>
                        {sport.sport_image ? (
                          <Image
                            source={{ uri: sport.sport_image }}
                            style={styles.sportIcon}
                          />
                        ) : (
                          <View style={[styles.sportIcon, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="football" size={24} color="#6B7280" />
                          </View>
                        )}
                        <View style={styles.sportRevenueInfo}>
                          <Text style={styles.sportName}>{sport.sport_name}</Text>
                          <Text style={styles.sportBookings}>{sport.total_bookings} bookings</Text>
                        </View>
                        <Text style={styles.sportRevenueValue}>{formatCurrency(sport.total_revenue)}</Text>
                      </View>
                      <View style={styles.percentageBar}>
                        <View style={[styles.percentageFill, { width: `${sport.percentage}%` }]} />
                      </View>
                      <Text style={styles.percentageText}>{sport.percentage}% of total</Text>
                    </View>
                  ))}

                  {sportsRevenueData.sports.length === 0 && (
                    <View style={styles.noDataRow}>
                      <Text style={styles.noDataText}>No sports revenue data available</Text>
                    </View>
                  )}
                </>
              )}

              <View style={styles.reportActions}>
                <TouchableOpacity style={styles.reportCloseActionBtn} onPress={() => setShowSportsRevenueReport(false)}>
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
    height: 220,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: { color: '#9CA3AF', fontSize: 13 },
  chartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  chartSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartSummaryLabel: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
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
  sportsRevenueBtn: { backgroundColor: '#DC2626' },
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
  loadingContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  modalLoadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  revenueSummaryCards: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 12, justifyContent: 'space-between' },
  summaryCard: { width: '31%', padding: 12, borderRadius: 8, marginBottom: 8 },
  summaryLabel: { fontSize: 11, color: '#374151', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  noDataRow: { padding: 20, alignItems: 'center' },
  noDataText: { color: '#6B7280', fontSize: 14 },
  bookingSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8, paddingHorizontal: 4 },
  summaryText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  // Sports Revenue Styles
  sportRevenueCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sportRevenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sportIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  sportRevenueInfo: {
    flex: 1,
  },
  sportName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  sportBookings: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sportRevenueValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  percentageBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    backgroundColor: '#15803D',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'right',
  },
});
