import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getVenueReviews, getSportReviews } from '@/services/indoorAdminApi';
import { VenueReview, SportReview } from '@/types/api';
import { BASE_URL } from '@/constants/api';

type TabType = 'venue' | 'sport';

export default function FeedbackScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('venue');

  // Venue reviews state
  const [venueReviews, setVenueReviews] = useState<VenueReview[]>([]);
  const [venueAvgRating, setVenueAvgRating] = useState(0);
  const [venueRatingDist, setVenueRatingDist] = useState<Record<string, number>>({});
  const [venueTotal, setVenueTotal] = useState(0);
  const [venueRecommendPct, setVenueRecommendPct] = useState(0);
  const [loadingVenue, setLoadingVenue] = useState(true);

  // Sport reviews state
  const [sportReviews, setSportReviews] = useState<SportReview[]>([]);
  const [sportAvgRating, setSportAvgRating] = useState(0);
  const [sportRatingDist, setSportRatingDist] = useState<Record<string, number>>({});
  const [sportTotal, setSportTotal] = useState(0);
  const [loadingSport, setLoadingSport] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const fetchVenueReviews = useCallback(async () => {
    try {
      setLoadingVenue(true);
      const data = await getVenueReviews();
      setVenueReviews(data.results || []);
      setVenueAvgRating((data as any).average_rating || 0);
      setVenueRatingDist((data as any).rating_distribution || {});
      setVenueTotal(data.count || 0);
      setVenueRecommendPct((data as any).recommend_percentage || 0);
    } catch (err) {
      console.error('Failed to fetch venue reviews:', err);
    } finally {
      setLoadingVenue(false);
    }
  }, []);

  const fetchSportReviews = useCallback(async () => {
    try {
      setLoadingSport(true);
      const data = await getSportReviews();
      setSportReviews(data.results || []);
      setSportAvgRating((data as any).average_rating || 0);
      setSportRatingDist((data as any).rating_distribution || {});
      setSportTotal(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch sport reviews:', err);
    } finally {
      setLoadingSport(false);
    }
  }, []);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchVenueReviews();
      fetchSportReviews();
    }, [fetchVenueReviews, fetchSportReviews])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchVenueReviews(), fetchSportReviews()]);
    setRefreshing(false);
  }, [fetchVenueReviews, fetchSportReviews]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getPhotoUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_URL.replace(/\/$/, '')}${url}`;
  };

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Select data based on active tab
  const reviews = activeTab === 'venue' ? venueReviews : sportReviews;
  const avgRating = activeTab === 'venue' ? venueAvgRating : sportAvgRating;
  const ratingDist = activeTab === 'venue' ? venueRatingDist : sportRatingDist;
  const totalReviews = activeTab === 'venue' ? venueTotal : sportTotal;
  const isLoading = activeTab === 'venue' ? loadingVenue : loadingSport;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews & Feedback</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color="#15803D" />
        </TouchableOpacity>
      </View>

      {/* Top Banner */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Customer Reviews</Text>
        <Text style={styles.topMonth}>{currentMonth}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#15803D']} />}
      >
        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'venue' && styles.tabBtnActive]}
            onPress={() => setActiveTab('venue')}
          >
            <Ionicons name="business" size={16} color={activeTab === 'venue' ? '#fff' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'venue' && styles.tabTextActive]}>Venue Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'sport' && styles.tabBtnActive]}
            onPress={() => setActiveTab('sport')}
          >
            <Ionicons name="football" size={16} color={activeTab === 'sport' ? '#fff' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'sport' && styles.tabTextActive]}>Sport Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.bigRating}>{avgRating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons
                  key={i}
                  name={i <= Math.round(avgRating) ? 'star' : i - 0.5 <= avgRating ? 'star-half' : 'star-outline'}
                  size={18}
                  color="#F59E0B"
                />
              ))}
            </View>
            <Text style={styles.totalCountText}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
            {activeTab === 'venue' && venueRecommendPct > 0 && (
              <View style={styles.recommendRow}>
                <Ionicons name="thumbs-up" size={14} color="#15803D" />
                <Text style={styles.recommendText}>{venueRecommendPct}% recommend</Text>
              </View>
            )}
          </View>
          <View style={styles.summaryRight}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDist[String(star)] || 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <View key={star} style={styles.distRow}>
                  <Text style={styles.distStar}>{star}</Text>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <View style={styles.distBarTrack}>
                    <View style={[styles.distBarFill, { width: `${Math.max(pct, 2)}%` }]} />
                  </View>
                  <Text style={styles.distCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#15803D" />
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && reviews.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No {activeTab === 'venue' ? 'venue' : 'sport'} reviews yet</Text>
            <Text style={styles.emptySubtext}>Reviews will appear here when customers leave feedback</Text>
          </View>
        )}

        {/* Reviews List */}
        {!isLoading && reviews.map((r: any) => (
          <View key={`${activeTab}-${r.id}`} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              {r.profile_picture ? (
                <Image source={{ uri: getPhotoUrl(r.profile_picture) }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {(r.user_name || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.reviewerName}>{r.user_name || 'Anonymous'}</Text>
                  {r.would_recommend && (
                    <View style={styles.recommendBadge}>
                      <Ionicons name="thumbs-up" size={10} color="#15803D" />
                    </View>
                  )}
                </View>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons key={i} name={i <= (r.rating || 0) ? 'star' : 'star-outline'} size={14} color="#F59E0B" />
                  ))}
                  <Text style={styles.ratingNum}>{r.rating}/5</Text>
                </View>
                <Text style={styles.reviewMeta}>
                  {formatDate(r.created_at)}
                  {r.user_email ? ` · ${r.user_email}` : ''}
                </Text>
                {activeTab === 'sport' && r.sport?.name && (
                  <View style={styles.sportBadge}>
                    <Ionicons name="football-outline" size={11} color="#0369A1" />
                    <Text style={styles.sportBadgeText}>{r.sport.name}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Review Comment */}
            <Text style={styles.reviewText}>{r.comment || 'No comment'}</Text>

            {/* Categories */}
            {r.categories && r.categories.length > 0 && (
              <View style={styles.categoriesRow}>
                {r.categories.map((cat: string, idx: number) => (
                  <View key={idx} style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{cat}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Review Photos */}
            {r.photos && r.photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
                {r.photos.map((photoUrl: string, idx: number) => (
                  <Image
                    key={idx}
                    source={{ uri: getPhotoUrl(photoUrl) }}
                    style={styles.reviewPhoto}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}

            {/* Review Footer */}
            <View style={styles.reviewFooter}>
              <Text style={styles.reviewFooterMeta}>
                User ID: {r.user || 'N/A'}
                {activeTab === 'sport' && r.visit_date ? ` · Visit: ${formatDate(r.visit_date)}` : ''}
              </Text>
            </View>
          </View>
        ))}

        {/* Review Count Footer */}
        {!isLoading && reviews.length > 0 && (
          <View style={styles.listFooter}>
            <Text style={styles.listFooterText}>
              Showing {reviews.length} of {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
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
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  topBar: {
    backgroundColor: '#15803D',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  topMonth: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  container: { padding: 12, paddingBottom: 32 },

  // Tab Selector
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabBtnActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 100,
  },
  bigRating: { fontSize: 40, fontWeight: '800', color: '#111827' },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  totalCountText: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recommendText: { fontSize: 11, color: '#15803D', fontWeight: '600' },
  summaryRight: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
    gap: 5,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distStar: { fontSize: 12, fontWeight: '600', color: '#374151', minWidth: 10, textAlign: 'right' },
  distBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  distBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  distCount: { fontSize: 11, color: '#6B7280', minWidth: 20, textAlign: 'right' },

  // Loading
  loadingWrap: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },

  // Empty State
  emptyWrap: { alignItems: 'center', padding: 40 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtext: { marginTop: 4, fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  // Review Card
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  recommendBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  ratingNum: { fontSize: 12, color: '#6B7280', marginLeft: 4, fontWeight: '500' },
  reviewMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  sportBadgeText: { fontSize: 11, color: '#0369A1', fontWeight: '600' },
  reviewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  // Categories
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  categoryChipText: { fontSize: 11, color: '#15803D', fontWeight: '600' },

  // Photos
  photosRow: { marginTop: 10 },
  reviewPhoto: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },

  // Footer
  reviewFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reviewFooterMeta: { fontSize: 11, color: '#9CA3AF' },

  // List Footer
  listFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  listFooterText: { fontSize: 12, color: '#9CA3AF' },
});
