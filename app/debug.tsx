import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../constants/api';
import { ping } from '../services/apiClient';

export default function DebugScreen() {
  const [testLog, setTestLog] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (msg: string) => {
    setTestLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const runTests = async () => {
    setTesting(true);
    setTestLog([]);

    addLog(`Backend URL: ${BASE_URL}`);
    addLog('Testing connectivity...');

    try {
      await ping();
      addLog('✅ Ping successful - backend is reachable!');
    } catch (err: any) {
      addLog(`❌ Ping failed: ${err?.message || JSON.stringify(err)}`);
      setTesting(false);
      return;
    }

    addLog('Test complete. Backend is ready!');
    setTesting(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Backend Connection Debug</Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Backend URL:</Text>
        <Text style={styles.value}>{BASE_URL}</Text>
      </View>

      <TouchableOpacity
        style={[styles.testBtn, testing && styles.testBtnDisabled]}
        onPress={runTests}
        disabled={testing}
      >
        {testing ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.testBtnText}>Testing...</Text>
          </>
        ) : (
          <Text style={styles.testBtnText}>Test Backend Connection</Text>
        )}
      </TouchableOpacity>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Test Logs:</Text>
        {testLog.length === 0 ? (
          <Text style={styles.logEmpty}>Click "Test Backend Connection" to start...</Text>
        ) : (
          testLog.map((log, idx) => (
            <Text key={idx} style={styles.logLine}>
              {log}
            </Text>
          ))
        )}
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>If test fails:</Text>
        <Text style={styles.tip}>• Ensure Django is running: python manage.py runserver 0.0.0.0:8000</Text>
        <Text style={styles.tip}>• Verify PC IP in constants/api.ts matches your Wi‑Fi IP</Text>
        <Text style={styles.tip}>• Check phone and PC are on same Wi-Fi network</Text>
        <Text style={styles.tip}>• Windows Firewall: Allow port 8000 inbound (see BACKEND_SETUP.md)</Text>
        <Text style={styles.tip}>• Open {BASE_URL} in Safari on phone to test network directly</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },
  infoCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  value: { fontSize: 14, color: '#111827', fontFamily: 'monospace' },
  testBtn: { backgroundColor: '#15803D', paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  testBtnDisabled: { opacity: 0.6 },
  testBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  logContainer: { backgroundColor: '#1F2937', padding: 12, borderRadius: 8, marginBottom: 16, minHeight: 150 },
  logTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 8 },
  logEmpty: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  logLine: { fontSize: 12, color: '#D1D5DB', fontFamily: 'monospace', marginBottom: 4 },
  tipsCard: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  tipsTitle: { fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  tip: { fontSize: 12, color: '#78350F', marginBottom: 6 },
});
