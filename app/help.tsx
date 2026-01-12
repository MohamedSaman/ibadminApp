import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const faqs = [
  { q: 'How do I reset my password?', a: 'Use the "Forgot password" link on the login screen to reset your password via email.' },
  { q: 'What are your business hours?', a: 'Mon–Fri: 9am–6pm, Sat: 9am–1pm, Sun: Closed.' },
  { q: 'How can I contact support?', a: 'Use the Contact form on this page or email support@webxkey.com.' },
  { q: 'Where is WebXKey located?', a: 'We are based in Sri Lanka. See location coordinates below.' },
];

export default function HelpScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggleFAQ(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  function handleSend() {
    // placeholder: in-app send action (no backend)
    setSubject('');
    setMessage('');
    alert('Message sent (placeholder)');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Contact</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="mail" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>Contact Us</Text>
          </View>

          <Text style={styles.label}>Subject</Text>
          <TextInput value={subject} onChangeText={setSubject} placeholder="Enter subject" style={styles.input} />

          <Text style={[styles.label, { marginTop: 12 }]}>Message</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Enter your message"
            style={[styles.input, { height: 120 }]}
            multiline
          />

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.sendText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rowCards}>
          <View style={[styles.card, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.cardTitle}>Company Details</Text>
            <Text style={styles.label}>Company: <Text style={styles.value}>WebXKey (Pvt) Ltd</Text></Text>
            <Text style={styles.label}>Address: <Text style={styles.value}>273/1D, Warana Road, Central Place, Thihariya</Text></Text>
            <Text style={styles.label}>Phone: <Text style={styles.value}>+94 76 123 4567</Text></Text>
            <Text style={styles.label}>Email: <Text style={styles.value}>support@webxkey.com</Text></Text>
            <Text style={[styles.label, { marginTop: 8 }]}>Business Hours:</Text>
            <Text style={styles.value}>Mon–Fri: 9:00 AM – 6:00 PM{"\n"}Sat: 9:00 AM – 1:00 PM{"\n"}Sun: Closed</Text>
          </View>

          <View style={[styles.card, { flex: 1, marginLeft: 8 }] }>
            <Text style={styles.cardTitle}>Our Location</Text>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapText}>Map preview</Text>
            </View>
            <Text style={[styles.label, { marginTop: 8 }]}>GPS Coordinates</Text>
            <Text style={styles.value}>7.1204° N, 80.0752° E</Text>
          </View>
        </View>

        <View style={[styles.card, { marginTop: 12 }] }>
          <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
          {faqs.map((f, i) => (
            <TouchableOpacity key={i} style={styles.faqItem} onPress={() => toggleFAQ(i)}>
              <Text style={styles.faqQuestion}>{f.q}</Text>
              <Ionicons name={openIndex === i ? 'chevron-up' : 'chevron-down'} size={20} color="#374151" />
              {openIndex === i && <Text style={styles.faqAnswer}>{f.a}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  container: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8, color: '#111827' },
  label: { color: '#6B7280', marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10, marginTop: 6, backgroundColor: '#fff' },
  sendButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginTop: 12, alignSelf: 'flex-start' },
  sendText: { color: '#fff', marginLeft: 8, fontWeight: '700' },
  rowCards: { flexDirection: 'row', marginTop: 12 },
  mapPlaceholder: { height: 120, backgroundColor: '#F3F4F6', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#9CA3AF' },
  faqItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginTop: 8 },
  faqQuestion: { fontSize: 15, color: '#111827' },
  faqAnswer: { marginTop: 8, color: '#6B7280' },
});
