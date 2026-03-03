import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Platform, RefreshControl, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getDashboardStats, getRevenueReport, getBookingReport, getSportsRevenueReport, getPerformanceReport, exportReportCSV } from '@/services/indoorAdminApi';
import { DashboardStats, RevenueReport, RevenueDataPoint, BookingReport, SportsRevenueReport, PerformanceReport } from '@/types/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

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
  const [showPerformanceReport, setShowPerformanceReport] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceReport | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  // Fetch booking report data
  const fetchBookingReport = useCallback(async () => {
    try {
      setLoadingBookingReport(true);
      const data = await getBookingReport();
      setBookingReportData(data);
    } catch (err) {
      console.error('Failed to fetch booking report:', err);
    } finally {
      setLoadingBookingReport(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    fetchStats(true);
    fetchChartData(timePeriod);
    // Also refresh booking report if it's visible
    if (showBookingReport) {
      fetchBookingReport();
    }
  }, [fetchStats, fetchChartData, timePeriod, showBookingReport, fetchBookingReport]);

  // Refresh booking report data when screen comes into focus (after creating booking)
  useFocusEffect(
    useCallback(() => {
      if (showBookingReport) {
        fetchBookingReport();
      }
    }, [showBookingReport, fetchBookingReport])
  );

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
    await fetchBookingReport();
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

  // Fetch performance & utilization report
  const handleShowPerformanceReport = async () => {
    setShowPerformanceReport(true);
    setLoadingPerformance(true);
    try {
      const data = await getPerformanceReport();
      setPerformanceData(data);
    } catch (err) {
      console.error('Failed to fetch performance report:', err);
    } finally {
      setLoadingPerformance(false);
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
    paymentStatus: (b.payment_status || 'Pending').toUpperCase(),
    revenue: formatCurrency(b.price || '0'),
  })) || [];

  // Generate CSV content for reports from provided data
  const generateCSVFromData = (
    statsData: DashboardStats | null,
    bookingData: any,
    revenueData: RevenueReport | null,
    sportsData: SportsRevenueReport | null,
    perfData: PerformanceReport | null
  ): string => {
    const lines: string[] = [];
    const now = new Date().toLocaleString();

    // Header with timestamp
    lines.push('INDOOR BOOKING ADMIN - REPORTS EXPORT');
    lines.push(`Generated on: ${now}`);
    lines.push('');

    // Dashboard Summary
    lines.push('DASHBOARD SUMMARY');
    lines.push('Metric,Value');
    lines.push(`Total Bookings,"${statsData?.total_bookings || 0}"`);
    lines.push(`Today's Bookings,"${statsData?.today_bookings || 0}"`);
    lines.push(`Total Revenue,"${statsData?.total_revenue || 'LKR 0.00'}"`);
    lines.push(`Cancelled Bookings,"${statsData?.cancelled_bookings || 0}"`);
    lines.push('');

    // Booking Report
    const rows = bookingData?.bookings?.map((b: any) => ({
      id: b.id,
      username: b.user_email || b.user_name || 'N/A',
      court: b.court_number?.toString() || '1',
      sport: b.sport_name || 'N/A',
      date: formatDate(b.booking_date),
      time: b.time_slot || `${formatTime(b.start_time)} - ${formatTime(b.end_time)}`,
      duration: '1.00',
      status: (b.status || 'Pending').toUpperCase(),
      paymentStatus: (b.payment_status || 'Pending').toUpperCase(),
      revenue: formatCurrency(b.price || '0'),
    })) || [];

    if (rows.length > 0) {
      lines.push('BOOKING REPORT');
      lines.push('ID,Username,Court,Sport,Date,Time,Duration,Status,Payment Status,Revenue');
      rows.forEach((row: any) => {
        lines.push(`"${row.id}","${row.username}","${row.court}","${row.sport}","${row.date}","${row.time}","${row.duration}","${row.status}","${row.paymentStatus}","${row.revenue}"`);
      });
      lines.push('');
    }

    // Revenue Report
    if (revenueData?.data && revenueData.data.length > 0) {
      lines.push('REVENUE REPORT');
      lines.push('Date,Revenue');
      revenueData.data.forEach((item) => {
        lines.push(`"${item.date}","LKR ${parseFloat(item.revenue).toFixed(2)}"`);
      });
      lines.push('');
    }

    // Sports Revenue Report
    if (sportsData?.data && sportsData.data.length > 0) {
      lines.push('SPORTS REVENUE BREAKDOWN');
      lines.push('Sport,Revenue,Bookings');
      sportsData.data.forEach((item) => {
        lines.push(`"${item.sport_name}","LKR ${parseFloat(item.revenue).toFixed(2)}","${item.booking_count}"`);
      });
      lines.push('');
    }

    // Performance Report
    if (perfData) {
      lines.push('PERFORMANCE & UTILIZATION');
      lines.push('Metric,Value');
      lines.push(`Completion Rate,"${perfData.summary?.completion_rate || 0}%"`);
      lines.push(`Cancellation Rate,"${perfData.summary?.cancellation_rate || 0}%"`);
      lines.push(`Avg Daily Bookings,"${perfData.summary?.average_daily_bookings || 0}"`);
      lines.push(`Busiest Day,"${perfData.summary?.busiest_day || 'N/A'}"`);
      lines.push(`Busiest Hour,"${perfData.summary?.busiest_hour || 'N/A'}"`);
      lines.push('');

      if (perfData.sport_utilization && perfData.sport_utilization.length > 0) {
        lines.push('SPORT UTILIZATION');
        lines.push('Sport,Bookings,Utilization %');
        perfData.sport_utilization.forEach((item) => {
          lines.push(`"${item.sport_name}","${item.bookings}","${item.percentage}%"`);
        });
      }
    }

    return lines.join('\n');
  };

  // Fetch all report data for export
  const fetchAllReportData = async () => {
    const [freshStats, freshBooking, freshRevenue, freshSports, freshPerformance] = await Promise.allSettled([
      getDashboardStats(),
      getBookingReport(),
      getRevenueReport({ period: 'daily' }),
      getSportsRevenueReport(),
      getPerformanceReport(),
    ]);

    if (freshStats.status === 'fulfilled') setStats(freshStats.value);
    if (freshBooking.status === 'fulfilled') setBookingReportData(freshBooking.value);
    if (freshRevenue.status === 'fulfilled') setRevenueReportData(freshRevenue.value);
    if (freshSports.status === 'fulfilled') setSportsRevenueData(freshSports.value);
    if (freshPerformance.status === 'fulfilled') setPerformanceData(freshPerformance.value);

    return {
      statsData: freshStats.status === 'fulfilled' ? freshStats.value : stats,
      bookingData: freshBooking.status === 'fulfilled' ? freshBooking.value : bookingReportData,
      revenueData: freshRevenue.status === 'fulfilled' ? freshRevenue.value : revenueReportData,
      sportsData: freshSports.status === 'fulfilled' ? freshSports.value : sportsRevenueData,
      perfData: freshPerformance.status === 'fulfilled' ? freshPerformance.value : performanceData,
    };
  };

  // Generate PDF HTML content
  const generatePDFHtml = (
    statsData: DashboardStats | null,
    bookingData: any,
    revenueData: RevenueReport | null,
    sportsData: SportsRevenueReport | null,
    perfData: PerformanceReport | null
  ): string => {
    const now = new Date().toLocaleString();

    const bookingRows = bookingData?.bookings?.map((b: any) => ({
      id: b.id,
      username: b.user_email || b.user_name || 'N/A',
      court: b.court_number?.toString() || '1',
      sport: b.sport_name || 'N/A',
      date: formatDate(b.booking_date),
      time: b.time_slot || `${formatTime(b.start_time)} - ${formatTime(b.end_time)}`,
      status: (b.status || 'Pending').toUpperCase(),
      paymentStatus: (b.payment_status || 'Pending').toUpperCase(),
      revenue: formatCurrency(b.price || '0'),
    })) || [];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1F2937; padding: 32px; font-size: 11px; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #15803D; padding-bottom: 16px; }
          .header h1 { font-size: 22px; color: #15803D; margin-bottom: 4px; }
          .header p { font-size: 11px; color: #6B7280; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 700; color: #15803D; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #D1FAE5; }
          .stats-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
          .stat-card { flex: 1; min-width: 120px; background: #F0FDF4; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #BBF7D0; }
          .stat-card .value { font-size: 20px; font-weight: 700; color: #15803D; }
          .stat-card .label { font-size: 10px; color: #6B7280; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
          th { background: #15803D; color: #fff; padding: 6px 8px; text-align: left; font-weight: 600; }
          td { padding: 5px 8px; border-bottom: 1px solid #E5E7EB; }
          tr:nth-child(even) { background: #F9FAFB; }
          .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
          .status-confirmed { background: #D1FAE5; color: #065F46; }
          .status-cancelled { background: #FEE2E2; color: #991B1B; }
          .status-pending { background: #FEF3C7; color: #92400E; }
          .status-completed { background: #DBEAFE; color: #1E40AF; }
          .status-paid { background: #D1FAE5; color: #065F46; }
          .status-unpaid { background: #FEE2E2; color: #991B1B; }
          .perf-grid { display: flex; flex-wrap: wrap; gap: 10px; }
          .perf-item { flex: 1; min-width: 100px; background: #F8FAFC; border-radius: 8px; padding: 10px; text-align: center; border: 1px solid #E2E8F0; }
          .perf-item .val { font-size: 18px; font-weight: 700; color: #0F172A; }
          .perf-item .lbl { font-size: 9px; color: #64748B; margin-top: 2px; }
          .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Indoor Booking Admin</h1>
          <p>Reports Export &bull; Generated on ${now}</p>
        </div>

        <div class="section">
          <div class="section-title">Dashboard Summary</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${statsData?.total_bookings || 0}</div>
              <div class="label">Total Bookings</div>
            </div>
            <div class="stat-card">
              <div class="value">${statsData?.today_bookings || 0}</div>
              <div class="label">Today's Bookings</div>
            </div>
            <div class="stat-card">
              <div class="value">${statsData?.total_revenue ? formatCurrency(statsData.total_revenue) : 'LKR 0.00'}</div>
              <div class="label">Total Revenue</div>
            </div>
            <div class="stat-card">
              <div class="value">${statsData?.cancelled_bookings || 0}</div>
              <div class="label">Cancelled</div>
            </div>
          </div>
        </div>

        ${bookingRows.length > 0 ? `
        <div class="section">
          <div class="section-title">Booking Report</div>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>User</th><th>Sport</th><th>Court</th><th>Date</th><th>Time</th><th>Status</th><th>Payment</th><th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${bookingRows.map((r: any) => `
                <tr>
                  <td>${r.id}</td>
                  <td>${r.username}</td>
                  <td>${r.sport}</td>
                  <td>${r.court}</td>
                  <td>${r.date}</td>
                  <td>${r.time}</td>
                  <td><span class="status-badge status-${r.status.toLowerCase()}">${r.status}</span></td>
                  <td><span class="status-badge status-${r.paymentStatus === 'PAID' ? 'paid' : 'unpaid'}">${r.paymentStatus}</span></td>
                  <td>${r.revenue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${revenueData?.data && revenueData.data.length > 0 ? `
        <div class="section">
          <div class="section-title">Revenue Report</div>
          <table>
            <thead><tr><th>Date</th><th>Revenue</th></tr></thead>
            <tbody>
              ${revenueData.data.map(item => `
                <tr><td>${item.date}</td><td>LKR ${parseFloat(item.revenue).toFixed(2)}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${sportsData?.data && sportsData.data.length > 0 ? `
        <div class="section">
          <div class="section-title">Sports Revenue Breakdown</div>
          <table>
            <thead><tr><th>Sport</th><th>Revenue</th><th>Bookings</th></tr></thead>
            <tbody>
              ${sportsData.data.map(item => `
                <tr><td>${item.sport_name}</td><td>LKR ${parseFloat(item.revenue).toFixed(2)}</td><td>${item.booking_count}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${perfData ? `
        <div class="section">
          <div class="section-title">Performance & Utilization</div>
          <div class="perf-grid">
            <div class="perf-item"><div class="val">${perfData.summary?.completion_rate || 0}%</div><div class="lbl">Completion Rate</div></div>
            <div class="perf-item"><div class="val">${perfData.summary?.cancellation_rate || 0}%</div><div class="lbl">Cancellation Rate</div></div>
            <div class="perf-item"><div class="val">${perfData.summary?.average_daily_bookings || 0}</div><div class="lbl">Avg Daily Bookings</div></div>
            <div class="perf-item"><div class="val">${perfData.summary?.busiest_day || 'N/A'}</div><div class="lbl">Busiest Day</div></div>
            <div class="perf-item"><div class="val">${perfData.summary?.busiest_hour || 'N/A'}</div><div class="lbl">Busiest Hour</div></div>
          </div>
          ${perfData.sport_utilization && perfData.sport_utilization.length > 0 ? `
          <table style="margin-top: 12px;">
            <thead><tr><th>Sport</th><th>Bookings</th><th>Utilization</th></tr></thead>
            <tbody>
              ${perfData.sport_utilization.map(item => `
                <tr><td>${item.sport_name}</td><td>${item.bookings}</td><td>${item.percentage}%</td></tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}
        </div>
        ` : ''}

        <div class="footer">Indoor Booking Admin &copy; ${new Date().getFullYear()}</div>
      </body>
      </html>
    `;
  };

  // Handle export to CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setShowExportMenu(false);

      let csvContent = '';

      // Try backend CSV export first
      try {
        csvContent = await exportReportCSV();
      } catch (backendErr) {
        console.log('Backend export not available, using client-side generation');
        const { statsData, bookingData, revenueData, sportsData, perfData } = await fetchAllReportData();
        csvContent = generateCSVFromData(statsData, bookingData, revenueData, sportsData, perfData);
      }

      // Try file-based sharing (expo-file-system + expo-sharing)
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (baseDir) {
        try {
          const fileName = `reports_${new Date().getTime()}.csv`;
          const filePath = `${baseDir}${fileName}`;

          await FileSystem.writeAsStringAsync(filePath, csvContent, {
            encoding: FileSystem.EncodingType.UTF8,
          });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(filePath, {
              mimeType: 'text/csv',
              dialogTitle: 'Export Reports',
              UTI: 'public.comma-separated-values-text',
            });
            return;
          }
        } catch (fileErr) {
          console.log('File-based export failed, falling back to Share API:', fileErr);
        }
      }

      // Fallback: Use React Native built-in Share API (shares text content)
      await Share.share({
        message: csvContent,
        title: 'Reports Export',
      });

    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert('Error', 'Failed to export CSV report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Handle export to PDF
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      setShowExportMenu(false);

      // Fetch all report data
      const { statsData, bookingData, revenueData, sportsData, perfData } = await fetchAllReportData();
      const html = generatePDFHtml(statsData, bookingData, revenueData, sportsData, perfData);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Share the PDF file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Reports PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'PDF report generated successfully.');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert('Error', 'Failed to export PDF report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

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
      } onScrollBeginDrag={() => setShowExportMenu(false)}>
        <View style={styles.exportContainer}>
          <TouchableOpacity
            style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
            onPress={() => setShowExportMenu(!showExportMenu)}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download" size={16} color="#fff" />
            )}
            <Text style={styles.exportText}>{exporting ? 'Exporting...' : 'Export'}</Text>
            {!exporting && <Ionicons name="chevron-down" size={14} color="#fff" />}
          </TouchableOpacity>
          {showExportMenu && (
            <View style={styles.exportMenu}>
              <TouchableOpacity style={styles.exportMenuItem} onPress={handleExportCSV}>
                <Ionicons name="document-text-outline" size={18} color="#15803D" />
                <View style={styles.exportMenuTextWrap}>
                  <Text style={styles.exportMenuLabel}>Export as CSV</Text>
                  <Text style={styles.exportMenuSub}>Spreadsheet format</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.exportMenuDivider} />
              <TouchableOpacity style={styles.exportMenuItem} onPress={handleExportPDF}>
                <Ionicons name="document-outline" size={18} color="#DC2626" />
                <View style={styles.exportMenuTextWrap}>
                  <Text style={styles.exportMenuLabel}>Export as PDF</Text>
                  <Text style={styles.exportMenuSub}>Printable report</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
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

          <TouchableOpacity style={[styles.actionBtn, styles.performanceBtn]} onPress={handleShowPerformanceReport}>
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
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={fetchBookingReport} style={styles.reportCloseBtn} disabled={loadingBookingReport}>
                  <Ionicons name="refresh" size={20} color={loadingBookingReport ? '#9CA3AF' : '#374151'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowBookingReport(false)} style={styles.reportCloseBtn}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
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
                  <Text style={styles.summaryText}>Total: {bookingReportData.summary?.total ?? 0}  </Text>
                  <Text style={[styles.summaryText, { color: '#15803D' }]}>Confirmed: {bookingReportData.summary?.confirmed ?? 0}  </Text>
                  <Text style={[styles.summaryText, { color: '#DC2626' }]}>Cancelled: {bookingReportData.summary?.cancelled ?? 0}  </Text>
                  <Text style={[styles.summaryText, { color: '#0369A1' }]}>Paid: {bookingReportData.summary?.paid ?? 0}  </Text>
                  <Text style={[styles.summaryText, { color: '#B45309' }]}>Unpaid: {bookingReportData.summary?.unpaid ?? 0}</Text>
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
                      <Text style={[styles.th, { width: 120 }]}>Payment</Text>
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
                        <View style={[styles.td, { width: 120 }]}>
                          <View style={[styles.statusBadge, { backgroundColor: row.paymentStatus === 'PAID' ? '#DCFCE7' : '#FEF3C7' }]}>
                            <Text style={[styles.statusBadgeText, { color: row.paymentStatus === 'PAID' ? '#166534' : '#92400E' }]}>{row.paymentStatus}</Text>
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

      {showPerformanceReport && (
        <View style={styles.reportOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Performance &amp; Utilization Report</Text>
              <TouchableOpacity onPress={() => setShowPerformanceReport(false)} style={styles.reportCloseBtn}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.reportContent} keyboardShouldPersistTaps="handled">
              {loadingPerformance && (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#EA580C" />
                  <Text style={styles.loadingText}>Loading performance data...</Text>
                </View>
              )}

              {!loadingPerformance && performanceData && (
                <>
                  {/* ── Summary Cards ── */}
                  <Text style={styles.perfSectionTitle}>OVERVIEW</Text>
                  <View style={styles.perfSummaryGrid}>
                    <View style={[styles.perfCard, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={styles.perfCardLabel}>Total Bookings</Text>
                      <Text style={[styles.perfCardValue, { color: '#166534' }]}>{performanceData.summary.total_bookings}</Text>
                    </View>
                    <View style={[styles.perfCard, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={styles.perfCardLabel}>Completion Rate</Text>
                      <Text style={[styles.perfCardValue, { color: '#0369A1' }]}>{performanceData.summary.completion_rate}%</Text>
                    </View>
                    <View style={[styles.perfCard, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={styles.perfCardLabel}>Cancellation Rate</Text>
                      <Text style={[styles.perfCardValue, { color: '#991B1B' }]}>{performanceData.summary.cancellation_rate}%</Text>
                    </View>
                    <View style={[styles.perfCard, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={styles.perfCardLabel}>No-Show Rate</Text>
                      <Text style={[styles.perfCardValue, { color: '#92400E' }]}>{performanceData.summary.no_show_rate}%</Text>
                    </View>
                    <View style={[styles.perfCard, { backgroundColor: '#F3E8FF' }]}>
                      <Text style={styles.perfCardLabel}>Avg Daily Bookings</Text>
                      <Text style={[styles.perfCardValue, { color: '#6B21A8' }]}>{performanceData.summary.average_daily_bookings}</Text>
                    </View>
                    <View style={[styles.perfCard, { backgroundColor: '#FFEDD5' }]}>
                      <Text style={styles.perfCardLabel}>Avg Revenue / Booking</Text>
                      <Text style={[styles.perfCardValue, { color: '#C2410C' }]}>{formatCurrency(performanceData.summary.avg_revenue_per_booking)}</Text>
                    </View>
                  </View>

                  <View style={styles.perfHighlightRow}>
                    <View style={styles.perfHighlight}>
                      <Ionicons name="calendar" size={16} color="#EA580C" />
                      <Text style={styles.perfHighlightLabel}>Busiest Day</Text>
                      <Text style={styles.perfHighlightValue}>{performanceData.summary.busiest_day}</Text>
                    </View>
                    <View style={styles.perfHighlight}>
                      <Ionicons name="time" size={16} color="#EA580C" />
                      <Text style={styles.perfHighlightLabel}>Busiest Hour</Text>
                      <Text style={styles.perfHighlightValue}>{performanceData.summary.busiest_hour}</Text>
                    </View>
                  </View>

                  {/* ── Booking Status Distribution ── */}
                  <Text style={styles.perfSectionTitle}>BOOKING STATUS</Text>
                  {performanceData.status_distribution.map((item) => {
                    const statusColor: Record<string, string> = {
                      Completed: '#15803D', Confirmed: '#0369A1', Upcoming: '#0369A1',
                      Cancelled: '#DC2626', Pending: '#B45309', 'No-Show': '#7C3AED', Playing: '#EA580C',
                    };
                    const color = statusColor[item.status] || '#6B7280';
                    return (
                      <View key={item.status} style={styles.perfBarRow}>
                        <Text style={styles.perfBarLabel}>{item.status}</Text>
                        <View style={styles.perfBarTrack}>
                          <View style={[styles.perfBarFill, { width: `${Math.max(item.percentage, 2)}%`, backgroundColor: color }]} />
                        </View>
                        <Text style={styles.perfBarCount}>{item.count} ({item.percentage}%)</Text>
                      </View>
                    );
                  })}

                  {/* ── Hourly Distribution ── */}
                  <Text style={styles.perfSectionTitle}>PEAK HOURS</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    <View style={styles.hourGrid}>
                      {(() => {
                        const maxCount = Math.max(...performanceData.hourly_distribution.map(h => h.count), 1);
                        return performanceData.hourly_distribution
                          .filter(h => h.count > 0)
                          .map(h => (
                            <View key={h.hour} style={styles.hourCol}>
                              <Text style={styles.hourCount}>{h.count}</Text>
                              <View style={styles.hourBarTrack}>
                                <View style={[styles.hourBarFill, { height: `${Math.round(h.count / maxCount * 100)}%` }]} />
                              </View>
                              <Text style={styles.hourLabel}>{h.label}</Text>
                            </View>
                          ));
                      })()}
                      {performanceData.hourly_distribution.every(h => h.count === 0) && (
                        <Text style={styles.noDataText}>No hourly data</Text>
                      )}
                    </View>
                  </ScrollView>

                  {/* ── Day of Week Distribution ── */}
                  <Text style={styles.perfSectionTitle}>BOOKINGS BY DAY</Text>
                  {(() => {
                    const maxCount = Math.max(...performanceData.daily_distribution.map(d => d.count), 1);
                    return performanceData.daily_distribution.map(d => (
                      <View key={d.day} style={styles.perfBarRow}>
                        <Text style={[styles.perfBarLabel, { width: 90 }]}>{d.label.slice(0, 3)}</Text>
                        <View style={styles.perfBarTrack}>
                          <View style={[styles.perfBarFill, { width: `${Math.round(d.count / maxCount * 100)}%`, backgroundColor: '#EA580C' }]} />
                        </View>
                        <Text style={styles.perfBarCount}>{d.count}</Text>
                      </View>
                    ));
                  })()}

                  {/* ── Court Utilization ── */}
                  {performanceData.court_utilization.length > 0 && (
                    <>
                      <Text style={styles.perfSectionTitle}>COURT UTILIZATION</Text>
                      {performanceData.court_utilization.map(c => (
                        <View key={c.court} style={styles.perfBarRow}>
                          <Text style={styles.perfBarLabel}>Court {c.court}</Text>
                          <View style={styles.perfBarTrack}>
                            <View style={[styles.perfBarFill, { width: `${Math.max(c.percentage, 2)}%`, backgroundColor: '#7C3AED' }]} />
                          </View>
                          <Text style={styles.perfBarCount}>{c.bookings} ({c.percentage}%)</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {/* ── Sport Utilization ── */}
                  {performanceData.sport_utilization.length > 0 && (
                    <>
                      <Text style={styles.perfSectionTitle}>SPORT UTILIZATION</Text>
                      {performanceData.sport_utilization.map((s, idx) => (
                        <View key={idx} style={styles.perfBarRow}>
                          <Text style={styles.perfBarLabel}>{s.sport_name}</Text>
                          <View style={styles.perfBarTrack}>
                            <View style={[styles.perfBarFill, { width: `${Math.max(s.percentage, 2)}%`, backgroundColor: '#0369A1' }]} />
                          </View>
                          <Text style={styles.perfBarCount}>{s.bookings} ({s.percentage}%)</Text>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}

              {!loadingPerformance && !performanceData && (
                <View style={styles.noDataRow}>
                  <Text style={styles.noDataText}>No performance data available</Text>
                </View>
              )}

              <View style={styles.reportActions}>
                <TouchableOpacity style={styles.reportCloseActionBtn} onPress={() => setShowPerformanceReport(false)}>
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
    zIndex: 10,
  },
  exportMenu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 190,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  exportMenuTextWrap: {
    flex: 1,
  },
  exportMenuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  exportMenuSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  exportMenuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 14,
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
  // Performance & Utilization Styles
  perfSectionTitle: {
    fontWeight: '700',
    fontSize: 12,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  perfSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  perfCard: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  perfCardLabel: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 4,
  },
  perfCardValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  perfHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  perfHighlight: {
    width: '48%',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  perfHighlightLabel: {
    fontSize: 11,
    color: '#9A3412',
    marginTop: 4,
  },
  perfHighlightValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
    marginTop: 2,
  },
  perfBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  perfBarLabel: {
    width: 80,
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  perfBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 7,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  perfBarFill: {
    height: '100%',
    borderRadius: 7,
    minWidth: 4,
  },
  perfBarCount: {
    width: 90,
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
  },
  hourGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    paddingBottom: 20,
  },
  hourCol: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 36,
    height: '100%',
    justifyContent: 'flex-end',
  },
  hourCount: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  hourBarTrack: {
    width: 20,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  hourBarFill: {
    width: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 4,
    minHeight: 4,
  },
  hourLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 4,
    transform: [{ rotate: '-45deg' }],
    width: 36,
    textAlign: 'center',
  },
});

