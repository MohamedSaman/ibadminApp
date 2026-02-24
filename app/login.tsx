import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ping } from '../services/apiClient';
import { indoorAdminLogin, getErrorMessage } from '../services/indoorAdminApi';

interface SavedAccount {
  email: string;
  password: string;
  savedAt: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingBackend, setTestingBackend] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [emailFocused, setEmailFocused] = useState(false);

  // Load saved accounts on mount
  useEffect(() => {
    loadSavedAccounts();
  }, []);

  const loadSavedAccounts = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedAccounts');
      if (saved) {
        setSavedAccounts(JSON.parse(saved));
      }
    } catch (e) {
      console.log('Error loading saved accounts:', e);
    }
  };

  const saveCredentials = async (emailToSave: string, passwordToSave: string) => {
    try {
      const existing = [...savedAccounts];
      // Remove if already exists (to update)
      const filtered = existing.filter(acc => acc.email !== emailToSave);
      const newAccount: SavedAccount = {
        email: emailToSave,
        password: passwordToSave,
        savedAt: new Date().toISOString(),
      };
      const updated = [newAccount, ...filtered].slice(0, 5); // Keep max 5 accounts
      await AsyncStorage.setItem('savedAccounts', JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (e) {
      console.log('Error saving credentials:', e);
    }
  };

  const removeSavedAccount = async (emailToRemove: string) => {
    try {
      const filtered = savedAccounts.filter(acc => acc.email !== emailToRemove);
      await AsyncStorage.setItem('savedAccounts', JSON.stringify(filtered));
      setSavedAccounts(filtered);
    } catch (e) {
      console.log('Error removing account:', e);
    }
  };

  const selectSavedAccount = (account: SavedAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setEmailFocused(false);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      // quick connectivity check
      try {
        await ping();
      } catch (e) {
        setLoading(false);
        Alert.alert('Network Error', 'Cannot reach backend server. Please check your connection.');
        return;
      }

      const response = await indoorAdminLogin(email.trim(), password.trim());
      
      // Check if user is an indoor admin or superadmin
      if (response.user.user_type !== 'indoor_admin' && response.user.user_type !== 'superadmin') {
        Alert.alert('Access Denied', 'This app is for indoor venue administrators only.');
        setLoading(false);
        return;
      }

      setLoading(false);
      
      // Ask to save credentials
      const isAlreadySaved = savedAccounts.some(acc => acc.email === email.trim());
      if (!isAlreadySaved) {
        Alert.alert(
          'Save Login?',
          'Do you want to save this email and password for quick sign in next time?',
          [
            { text: 'No', style: 'cancel', onPress: () => router.replace('/(tabs)') },
            { 
              text: 'Yes, Save', 
              onPress: async () => {
                await saveCredentials(email.trim(), password.trim());
                router.replace('/(tabs)');
              }
            },
          ]
        );
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setLoading(false);
      const msg = getErrorMessage(err);
      Alert.alert('Login Failed', msg);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleGoogleLogin = () => {
    router.replace('/(tabs)');
  };

  const handleTestBackend = async () => {
    setTestingBackend(true);
    try {
      await ping();
      Alert.alert('✅ Backend Connected', 'Your backend is reachable! You can now sign in.');
    } catch (err: any) {
      Alert.alert('❌ Backend Not Reachable', getErrorMessage(err));
    } finally {
      setTestingBackend(false);
    }
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
              <View>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
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
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setTimeout(() => setEmailFocused(false), 200)}
                  />
                </View>

                {/* Saved Accounts Dropdown */}
                {emailFocused && savedAccounts.length > 0 && (
                  <View style={styles.accountsDropdown}>
                    {savedAccounts.map((account) => (
                      <TouchableOpacity
                        key={account.email}
                        style={styles.dropdownItem}
                        onPress={() => selectSavedAccount(account)}
                      >
                        <View style={styles.dropdownItemAvatar}>
                          <Ionicons name="person" size={16} color="#fff" />
                        </View>
                        <View style={styles.dropdownItemContent}>
                          <Text style={styles.dropdownItemEmail} numberOfLines={1}>{account.email}</Text>
                          <Text style={styles.dropdownItemPassword}>••••••••</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.dropdownItemRemove}
                          onPress={(e) => {
                            e.stopPropagation();
                            Alert.alert(
                              'Remove Account?',
                              `Remove ${account.email} from saved accounts?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Remove', style: 'destructive', onPress: () => removeSavedAccount(account.email) },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="close" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
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

          {/* Test Backend Connection */}
          <View style={styles.testSection}>
            <TouchableOpacity
              style={[styles.testBtn, testingBackend && styles.testBtnDisabled]}
              onPress={handleTestBackend}
              disabled={testingBackend}
            >
              <Ionicons name="server" size={14} color="#3B82F6" />
              <Text style={styles.testBtnText}>{testingBackend ? 'Testing Backend...' : 'Test Backend Connection'}</Text>
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
  // Form Styles
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  inputWrapperFocused: { borderColor: '#15803D', borderWidth: 2 },
  input: { flex: 1, color: '#111827', fontSize: 14 },
  // Dropdown Styles
  accountsDropdown: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#15803D', 
    borderTopWidth: 0,
    borderBottomLeftRadius: 10, 
    borderBottomRightRadius: 10, 
    marginTop: -1,
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  dropdownItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#15803D', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  dropdownItemContent: { marginLeft: 12, flex: 1 },
  dropdownItemEmail: { fontSize: 13, fontWeight: '600', color: '#111827' },
  dropdownItemPassword: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  dropdownItemRemove: { padding: 6 },
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
  testSection: { alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  testBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#3B82F6' },
  testBtnDisabled: { opacity: 0.6 },
  testBtnText: { color: '#3B82F6', fontSize: 12, fontWeight: '600', marginLeft: 6 },
});
