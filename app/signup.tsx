import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      alert('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToLogin} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#15803D" />
          <Text style={styles.backText}>Back</Text>
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

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>Sign up to manage your sports complex</Text>

            {/* Full Name Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email Field */}
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
                  editable={!loading}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Phone Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="+94 76 123 4567"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  editable={!loading}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Create a strong password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
                  <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}>
                  <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.signupBtnText}>Creating Account...</Text>
              ) : (
                <>
                  <Text style={styles.signupBtnText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#15803D', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoImage: { width: 100, height: 100, marginBottom: 10, tintColor: '#15803D', backgroundColor: 'transparent' },
  appName: { fontSize: 24, fontWeight: '700', color: '#111827' },
  appSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  input: { flex: 1, color: '#111827', fontSize: 14 },
  signupBtn: { backgroundColor: '#15803D', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  signupBtnDisabled: { opacity: 0.6 },
  signupBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  footerText: { color: '#6B7280', fontSize: 13 },
  loginLink: { color: '#15803D', fontWeight: '600' },
});
