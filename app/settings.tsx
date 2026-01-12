import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SideMenu from '@/components/SideMenu';

const menuItems = [
  { id: 'profile', label: 'My Profile', icon: 'person' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'team', label: 'Team Member', icon: 'people' },
  { id: 'opening', label: 'Opening time', icon: 'time' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Horizontal Small Menu Bar */}
      <View style={styles.menuBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuBarScroll}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, activeSection === item.id && styles.menuItemActive]}
              onPress={() => setActiveSection(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={activeSection === item.id ? '#fff' : '#374151'}
              />
              <Text style={[styles.menuItemText, activeSection === item.id && styles.menuItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.placeholderText}>Default{'\n'}Complex{'\n'}Image</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.complexName}>Kanzul sport's complex</Text>
              <View style={styles.tagRow}>
                <View style={styles.indoorTag}>
                  <Text style={styles.indoorTagText}>Indoor</Text>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text style={styles.locationText}>Sri Lanka</Text>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color="#15803D" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="id-card" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>Contact Information</Text>
          </View>
          <View style={styles.cardGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.value}>maleensaman@gmail.com</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Website</Text>
              <Text style={styles.value}>-</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Contact Number</Text>
              <Text style={styles.value}>0761265772</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>Address</Text>
          </View>
          <View style={styles.cardGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>County</Text>
              <Text style={styles.value}>Sri Lanka</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value} numberOfLines={1}>7.1228752, 80.0720273</Text>
            </View>
            <View style={styles.gridItemFull}>
              <Text style={styles.label}>Full Address</Text>
              <Text style={styles.value}>Warana Rd, Kalagedihena</Text>
            </View>
            <View style={styles.gridItemFull}>
              <Text style={styles.label}>Postal Code</Text>
              <Text style={styles.value}>43500</Text>
            </View>
          </View>
        </View>

        {/* Operating Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>Operating Details</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.label}>Amenities</Text>
            <Text style={styles.valueGray}>No amenities listed</Text>
          </View>
        </View>

        {/* Media Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="images" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>Media</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.label}>Video Tour URL</Text>
            <Text style={styles.valueGray}>Not available</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.label}>Gallery Images</Text>
            <Text style={styles.valueGray}>No gallery images available</Text>
          </View>
        </View>

        {/* Additional Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>Additional Details</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.valueGray}>-</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.label}>Terms & Conditions</Text>
            <Text style={styles.valueGray}>-</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.label}>Social Links</Text>
            <Text style={styles.valueGray}>No social links available</Text>
          </View>
        </View>
      </ScrollView>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },

  // Small horizontal menu bar
  menuBarContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuBarScroll: { paddingHorizontal: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  menuItemActive: {
    backgroundColor: '#15803D',
  },
  menuItemText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  menuItemTextActive: {
    color: '#fff',
  },

  content: { padding: 12, paddingBottom: 40 },

  // Profile header card
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
  profileInfo: { marginLeft: 12, flex: 1 },
  complexName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  indoorTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  indoorTagText: { color: '#15803D', fontSize: 12, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  locationText: { marginLeft: 4, color: '#6B7280', fontSize: 12 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#15803D',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  editButtonText: { marginLeft: 4, color: '#15803D', fontWeight: '600' },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#111827' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '50%', marginBottom: 12 },
  gridItemFull: { width: '100%', marginBottom: 12 },
  cardBody: { marginBottom: 12 },
  label: { color: '#6B7280', fontSize: 12, marginBottom: 4 },
  value: { color: '#111827', fontSize: 14, fontWeight: '600' },
  valueGray: { color: '#9CA3AF', fontSize: 14 },
  statusBadge: {
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
