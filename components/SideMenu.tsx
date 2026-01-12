import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = screenWidth * 0.75;
  const translateX = useRef(new Animated.Value(-menuWidth)).current;
  const [internalVisible, setInternalVisible] = useState(visible);

  const nav = (path?: string) => {
    onClose();
    if (path) router.push(path);
  };

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      // animate out, then hide
      Animated.timing(translateX, {
        toValue: -menuWidth,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setInternalVisible(false));
    }
  }, [visible, translateX, menuWidth]);

  return (
    <Modal visible={internalVisible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.container, { transform: [{ translateX }] }] }>
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>IndoorB</Text>
          </View>

          <Text style={styles.sectionTitle}>ADMIN</Text>

          <TouchableOpacity style={[styles.item, styles.itemPrimary]} onPress={() => nav('/') }>
            <Ionicons name="grid" size={20} color="#fff" />
            <Text style={[styles.itemText, styles.itemTextPrimary]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => nav('/booking') }>
            <Ionicons name="calendar" size={18} color="#333" />
            <Text style={styles.itemText}>Bookings</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>0</Text></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => nav('/sports') }>
            <Ionicons name="map" size={18} color="#333" />
            <Text style={styles.itemText}>Sports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => nav('/reports') }>
            <Ionicons name="document-text" size={18} color="#333" />
            <Text style={styles.itemText}>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => nav('/feedback') }>
            <Ionicons name="chatbubbles" size={18} color="#333" />
            <Text style={styles.itemText}>Feedback</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>GENERAL</Text>

          <TouchableOpacity style={styles.item} onPress={() => nav('/settings') }>
            <Ionicons name="settings" size={18} color="#333" />
            <Text style={styles.itemText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => nav('/help') }>
            <Ionicons name="help-circle" size={18} color="#333" />
            <Text style={styles.itemText}>Help</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => { /* implement logout */ }}>
            <Ionicons name="log-out" size={18} color="#333" />
            <Text style={styles.itemText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '75%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  logoSection: {
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 20,
    paddingTop: 32,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemPrimary: {
    backgroundColor: '#15803D',
    marginBottom: 12,
  },
  itemText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  itemTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    marginLeft: 'auto',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    minWidth: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  }
});