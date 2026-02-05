import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const reviews = [
  {
    id: 'r1',
    name: 'Mohammed Akmal',
    date: '01-01-2026',
    place: "Kanzul sport's complex",
    rating: 5,
    text: 'Ybnycv',
  },
  {
    id: 'r2',
    name: 'MAM NZN',
    date: '31-12-2025',
    place: "Kanzul sport's complex",
    rating: 5,
    text: 'Good',
  },
];

export default function FeedbackScreen() {
  const router = useRouter();

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

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>2</Text>
            <Text style={styles.summaryLabel}>Total Reviews</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <View style={styles.ratingRow}>
              <Text style={styles.summaryValue}>5.0</Text>
              <Text style={[styles.stars, styles.starsSpacing]}>★★★★★</Text>
            </View>
            <Text style={styles.summaryLabel}>Average Rating</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>2.0k</Text>
            <Text style={styles.summaryLabel}>Growth in Reviews</Text>
          </View>
        </View>

        {reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Image source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }} style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.reviewerName}>{r.name}</Text>
                  <Text style={styles.ratingText}>{' '}{'★'.repeat(r.rating)}</Text>
                </View>
                <Text style={styles.reviewMeta}>{r.date} on {r.place}</Text>
              </View>
            </View>

            <Text style={styles.reviewText}>{r.text}</Text>

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
