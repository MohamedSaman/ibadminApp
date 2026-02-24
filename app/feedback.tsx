import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getVenueReviews } from '@/services/indoorAdminApi';

export default function FeedbackScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await getVenueReviews();
      const reviewsList = data.results || [];
      setReviews(reviewsList);
      setAverageRating(data.average_rating || 0);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Reviews</Text>
        <Text style={styles.topMonth}>January 2026</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchReviews(true)} colors={['#15803D']} />
      }>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{reviews.length}</Text>
            <Text style={styles.summaryLabel}>Total Reviews</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <View style={styles.ratingRow}>
              <Text style={styles.summaryValue}>{averageRating.toFixed(1)}</Text>
              <Text style={[styles.stars, styles.starsSpacing]}>{'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))}</Text>
            </View>
            <Text style={styles.summaryLabel}>Average Rating</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{reviews.length}</Text>
            <Text style={styles.summaryLabel}>This Period</Text>
          </View>
        </View>

        {loading && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color="#15803D" />
            <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading reviews...</Text>
          </View>
        )}

        {!loading && reviews.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
            <Text style={{ marginTop: 12, color: '#6B7280' }}>No reviews yet</Text>
          </View>
        )}

        {!loading && reviews.map((r: any) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Image source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }} style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.reviewerName}>{r.user_name || 'Anonymous'}</Text>
                  <Text style={styles.ratingText}>{' '}{'★'.repeat(r.rating || 0)}</Text>
                </View>
                <Text style={styles.reviewMeta}>{formatDate(r.created_at)} {r.user_email ? `by ${r.user_email}` : ''}</Text>
              </View>
            </View>

            <Text style={styles.reviewText}>{r.comment || 'No comment'}</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Public Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Direct Message ✉️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    backgroundColor: '#15803D',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  topTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  topMonth: { color: '#fff', fontSize: 14 },
  container: { padding: 10, paddingBottom: 28 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 0,
    marginBottom: 12,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  summaryItem: { width: '100%', alignItems: 'flex-start', paddingVertical: 8 },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { color: '#6B7280', marginTop: 4, fontSize: 12 },
  divider: { height: 1, width: '100%', backgroundColor: '#E6E6E6', marginVertical: 8 },
  stars: { color: '#F59E0B' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  starsSpacing: { marginLeft: 10 },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 0,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  reviewerName: { fontSize: 15, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { color: '#F59E0B', marginLeft: 8, fontWeight: '700' },
  reviewMeta: { color: '#6B7280', marginTop: 4 },
  reviewText: { marginTop: 8, color: '#111827' },
  actionsRow: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  actionBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
    marginTop: 6,
  },
  actionBtnText: { color: '#fff', fontWeight: '700' },
});
