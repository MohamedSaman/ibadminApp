import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  notificationCount?: number;
}

export function Header({ onMenuPress, onNotificationPress, onProfilePress, notificationCount = 0 }: HeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: -8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EEF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  menuButton: {
    backgroundColor: '#6B7280',
    borderRadius: 8,
    padding: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
