import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'default';
  onPress?: () => void;
}

export function StatsCard({
  title,
  value,
  trend = 'neutral',
  trendText,
  icon,
  variant = 'default',
  onPress,
}: StatsCardProps) {
  const isPrimary = variant === 'primary';
  
  const getTrendIcon = () => {
    if (trend === 'up') return 'arrow-up';
    if (trend === 'down') return 'arrow-down';
    return null;
  };

  const getTrendColor = () => {
    if (isPrimary) return '#fff';
    if (trend === 'up') return '#16A34A';
    if (trend === 'down') return '#DC2626';
    return '#6B7280';
  };

  return (
    <TouchableOpacity
      style={[styles.container, isPrimary && styles.primaryContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <ThemedText
          style={[styles.title, isPrimary && styles.primaryText]}
          lightColor={isPrimary ? '#fff' : '#6B7280'}
        >
          {title}
        </ThemedText>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isPrimary ? '#fff' : '#6B7280'}
          />
        )}
      </View>
      
      <ThemedText
        style={[styles.value, isPrimary && styles.primaryText]}
        lightColor={isPrimary ? '#fff' : '#111827'}
      >
        {value}
      </ThemedText>
      
      {trendText && (
        <View style={styles.trendContainer}>
          {getTrendIcon() && (
            <Ionicons
              name={getTrendIcon()!}
              size={14}
              color={getTrendColor()}
            />
          )}
          <ThemedText
            style={[styles.trendText, { color: getTrendColor() }]}
          >
            {trendText}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryContainer: {
    backgroundColor: '#15803D',
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryText: {
    color: '#fff',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    paddingTop: 4
    
    ,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
