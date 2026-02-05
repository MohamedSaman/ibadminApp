import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HelpScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  function handleSend() {
    // placeholder: in-app send action (no backend)
    setSubject('');
    setMessage('');
    alert('Message sent (placeholder)');
  }

  const openWhatsApp = async () => {
    const phone = '+94761234567';
    const appUrl = `whatsapp://send?phone=${phone}`;
    const webUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (err) {
      await Linking.openURL(webUrl);
    }
  };

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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Other Ways to Contact</Text>
          
          <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={[styles.contactValue, { color: '#2563EB' }]}>+94 76 123 4567</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={() => Linking.openURL('tel:+94761234567')}>
            <Ionicons name="call" size={20} color="#2563EB" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={[styles.contactValue, { color: '#2563EB' }]}>+94 76 123 4567</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={() => Linking.openURL('https://www.linkedin.com/company/webxkey-pvt-ltd') }>
            <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>LinkedIn</Text>
              <Text style={[styles.contactValue, { color: '#0A66C2' }]}>WebXKey (Pvt) Ltd</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={() => Linking.openURL('https://www.facebook.com/search/top?q=WebXKey%20%28Pvt%29%20Ltd')}>
            <Ionicons name="logo-facebook" size={20} color="#2563EB" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Facebook</Text>
              <Text style={[styles.contactValue, { color: '#2563EB' }]}>WebXKey (Pvt) Ltd</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={() => Linking.openURL('https://instagram.com/webxkey_official')}>
            <Ionicons name="logo-instagram" size={20} color="#E1306C" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Instagram</Text>
              <Text style={[styles.contactValue, { color: '#2563EB' }]}>@webxkey_official</Text>
            </View>
          </TouchableOpacity>
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
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  contactInfo: { marginLeft: 12, flex: 1 },
  contactLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  contactValue: { fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 2 },
});
