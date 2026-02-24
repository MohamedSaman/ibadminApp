import { StyleSheet, Text, View } from 'react-native';

export default function BookingsReportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookings Report</Text>
      <Text style={styles.placeholder}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  placeholder: { fontSize: 14, color: '#6B7280', marginTop: 8 },
});
