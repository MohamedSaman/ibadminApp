import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getErrorMessage } from '../services/apiClient';
import { indoorAdminRegister } from '../services/indoorAdminApi';

const COMPLEX_TYPES = ['Indoor', 'Outdoor', 'Mixed'];

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — Personal details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2 — Complex / Venue details
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueContact, setVenueContact] = useState('');
  const [venueEmail, setVenueEmail] = useState('');
  const [venueLocation, setVenueLocation] = useState('');
  const [venueComplexType, setVenueComplexType] = useState('Indoor');

  const [loading, setLoading] = useState(false);

  // ---- Step 1 validation ----
  const handleNext = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      Alert.alert('Invalid Phone', 'Phone number must be exactly 10 digits.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      return;
    }
    setStep(2);
  };

  // ---- Step 2 submit ----
  const handleSignUp = async () => {
    if (!venueName.trim() || !venueAddress.trim()) {
      Alert.alert('Missing Fields', 'Complex name and address are required');
      return;
    }
    const venuePhoneDigits = (venueContact || phone).replace(/\D/g, '');
    if (venuePhoneDigits.length !== 10) {
      Alert.alert('Invalid Phone', 'Complex contact number must be exactly 10 digits.');
      return;
    }
    setLoading(true);
    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      await indoorAdminRegister({
        email: email.trim(),
        password,
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim(),
        venue_name: venueName.trim(),
        venue_address: venueAddress.trim(),
        venue_contact_number: venueContact.trim() || phone.trim(),
        venue_email: venueEmail.trim() || email.trim(),
        venue_location: venueLocation.trim(),
        venue_complex_type: venueComplexType,
      });

      setLoading(false);
      Alert.alert(
        'Account Created',
        'Your admin account and complex have been registered successfully!',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      setLoading(false);
      console.log('[Signup] Error:', JSON.stringify(err?.response?.data || err?.message));
      const msg = getErrorMessage(err);
      Alert.alert('Sign Up Failed', msg);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  // ================================================================
  //  Step 1: Personal Details
  // ================================================================
  const renderStep1 = () => (
    <View style={styles.formCard}>
      <Text style={styles.cardTitle}>Personal Details</Text>
      <Text style={styles.cardSubtitle}>Step 1 of 2 — Tell us about yourself</Text>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, styles.stepDotActive]} />
        <View style={styles.stepLine} />
        <View style={styles.stepDot} />
      </View>

      {/* Full Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>
      </View>

      {/* Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="admin@complex.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      </View>

      {/* Phone */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="call" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(text) => {
              const digitsOnly = text.replace(/\D/g, '');
              setPhone(digitsOnly.slice(0, 10));
            }}
          />
        </View>
      </View>

      {/* Password */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Create a strong password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Re-enter your password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Next Step Button */}
      <TouchableOpacity style={styles.signupBtn} onPress={handleNext}>
        <Text style={styles.signupBtnText}>Next — Register Complex</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      {/* Back to Login Link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleBackToLogin}>
          <Text style={styles.loginLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ================================================================
  //  Step 2: Complex / Venue Details
  // ================================================================
  const renderStep2 = () => (
    <View style={styles.formCard}>
      <Text style={styles.cardTitle}>Register Your Complex</Text>
      <Text style={styles.cardSubtitle}>Step 2 of 2 — Set up your sports complex</Text>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, styles.stepDotDone]}>
          <Ionicons name="checkmark" size={10} color="#fff" />
        </View>
        <View style={[styles.stepLine, styles.stepLineActive]} />
        <View style={[styles.stepDot, styles.stepDotActive]} />
      </View>

      {/* Complex Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Complex Name <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="business" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Elite Sports Arena"
            placeholderTextColor="#9CA3AF"
            value={venueName}
            onChangeText={setVenueName}
            editable={!loading}
          />
        </View>
      </View>

      {/* Address */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
        <View style={[styles.inputWrapper, { alignItems: 'flex-start', minHeight: 60 }]}>
          <Ionicons name="location" size={18} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
          <TextInput
            style={[styles.input, { textAlignVertical: 'top' }]}
            placeholder="Full address of the complex"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={2}
            value={venueAddress}
            onChangeText={setVenueAddress}
            editable={!loading}
          />
        </View>
      </View>

      {/* Location / City */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>City / Location</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="navigate" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Colombo"
            placeholderTextColor="#9CA3AF"
            value={venueLocation}
            onChangeText={setVenueLocation}
            editable={!loading}
          />
        </View>
      </View>

      {/* Complex Type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Complex Type</Text>
        <View style={styles.typeRow}>
          {COMPLEX_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeChip,
                venueComplexType === t && styles.typeChipActive,
              ]}
              onPress={() => setVenueComplexType(t)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.typeChipText,
                  venueComplexType === t && styles.typeChipTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contact Number */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Complex Contact Number</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="call" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={10}
            value={venueContact || phone}
            onChangeText={(text) => {
              const digitsOnly = text.replace(/\D/g, '');
              setVenueContact(digitsOnly.slice(0, 10));
            }}
            editable={!loading}
          />
        </View>
      </View>

      {/* Complex Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Complex Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Same as personal or different"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={venueEmail || email}
            onChangeText={setVenueEmail}
            editable={!loading}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.step2Actions}>
        <TouchableOpacity
          style={styles.backStepBtn}
          onPress={() => setStep(1)}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={16} color="#15803D" />
          <Text style={styles.backStepText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signupBtn, { flex: 1, marginLeft: 12 }, loading && styles.signupBtnDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.signupBtnText}>Creating Account...</Text>
          ) : (
            <>
              <Text style={styles.signupBtnText}>Create Account</Text>
              <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={step === 2 ? () => setStep(1) : handleBackToLogin} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#15803D" />
          <Text style={styles.backText}>{step === 2 ? 'Step 1' : 'Back'}</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/logo12.png')}
              style={styles.logoImage}
            />
            <Text style={styles.appName}>SPORTYNIX</Text>
            <Text style={styles.appSubtitle}>Admin Dashboard</Text>
          </View>

          {step === 1 ? renderStep1() : renderStep2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6, backgroundColor: 'transparent' },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#15803D', fontSize: 16, marginLeft: 6, fontWeight: '600' },
  container: { flex: 1 },
  scrollContent: { paddingVertical: 24, paddingHorizontal: 16 },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoImage: { width: 100, height: 100, marginBottom: 10, tintColor: '#15803D', backgroundColor: 'transparent' },
  appName: { fontSize: 24, fontWeight: '700', color: '#111827' },
  appSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  required: { color: '#DC2626' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  input: { flex: 1, color: '#111827', fontSize: 14 },

  // Step indicator
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: '#15803D', backgroundColor: '#DCFCE7' },
  stepDotDone: { borderColor: '#15803D', backgroundColor: '#15803D' },
  stepLine: { width: 60, height: 2, backgroundColor: '#D1D5DB', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#15803D' },

  // Complex type chips
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  typeChipActive: { borderColor: '#15803D', backgroundColor: '#DCFCE7' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  typeChipTextActive: { color: '#15803D' },

  // Step 2 action row
  step2Actions: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  backStepBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: '#15803D' },
  backStepText: { color: '#15803D', fontWeight: '700', fontSize: 14, marginLeft: 4 },

  // Shared button styles
  signupBtn: { backgroundColor: '#15803D', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  signupBtnDisabled: { opacity: 0.6 },
  signupBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  footerText: { color: '#6B7280', fontSize: 13 },
  loginLink: { color: '#15803D', fontWeight: '600' },
});
