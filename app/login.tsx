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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      alert('Please enter email and password');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleGoogleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>Access your sports complex management</Text>

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

            {/* Password Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
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

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.loginBtnText}>Signing in...</Text>
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Google Login */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
              <Ionicons name="logo-google" size={18} color="#374151" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.registerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Help Link */}
          <View style={styles.supportSection}>
            <TouchableOpacity style={styles.supportLink}>
              <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.supportText}> Need help signing in?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingVertical: 24, paddingHorizontal: 16 },
  logoSection: { alignItems: 'center', marginBottom: 30 },
  logoImage: { width: 100, height: 100, marginBottom: 10, tintColor: '#15803D', backgroundColor: 'transparent' },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#15803D', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appName: { fontSize: 24, fontWeight: '700', color: '#111827' },
  appSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  input: { flex: 1, color: '#111827', fontSize: 14 },
  loginBtn: { backgroundColor: '#15803D', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 12, color: '#6B7280', fontSize: 13 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10 },
  googleBtnText: { color: '#374151', fontWeight: '600', marginLeft: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  footerText: { color: '#6B7280', fontSize: 13 },
  registerLink: { color: '#15803D', fontWeight: '600' },
  supportSection: { alignItems: 'center' },
  supportLink: { flexDirection: 'row', alignItems: 'center' },
  supportText: { color: '#6B7280', fontSize: 13 },
});
