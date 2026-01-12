import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const sports = [
  {
    id: 'football',
    title: 'Football',
    rate: 'Rs. 1,500',
    courts: 1,
    img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=60',
  },
  {
    id: 'pools',
    title: 'Pools',
    rate: 'Rs. 1,500',
    courts: 2,
    img: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1200&q=60',
  },
  {
    id: 'cricket',
    title: 'Cricket',
    rate: 'Rs. 1,500',
    courts: 3,
    img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=60',
  },
];

export default function SportsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>sports</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Sports Management</Text>
          <Text style={styles.subtitle}>Manage all sports activities and their booking status</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/sports/add')}>
          <Text style={styles.addButtonText}>+  Add New Sport</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardGrid}>
        {sports.map(s => (
          <View key={s.id} style={styles.card}>
            <Image source={{ uri: s.img }} style={styles.cardImage} />
            <View style={styles.badge}><Text style={styles.badgeText}>Active</Text></View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <View style={styles.row}><Text style={styles.label}>Hourly Rate:</Text><Text style={styles.value}>{s.rate}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Available Courts:</Text><Text style={styles.value}>{s.courts}</Text></View>
            </View>
            <TouchableOpacity style={styles.manageBtn} onPress={() => router.push(`/sports/${s.id}`)}>
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get('window').width;
const cardWidth = Math.min(520, screenWidth - 40);

const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#15803D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  cardGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: '#fff', fontWeight: '700' },
  cardBody: {
    padding: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#6B7280' },
  value: { color: '#111827', fontWeight: '700' },
  manageBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  manageText: { color: '#fff', fontWeight: '700' },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
});
