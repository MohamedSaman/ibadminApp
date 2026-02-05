import SideMenu from '@/components/SideMenu';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const menuItems = [
  { id: 'profile', label: 'My Profile', icon: 'person' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'opening', label: 'Opening time', icon: 'time' },
  { id: 'team', label: 'Team Member', icon: 'people' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [menuOpen, setMenuOpen] = useState(false);

  // Security Section State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState('Weekly');
  const [maintenanceDropdownVisible, setMaintenanceDropdownVisible] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Team Member Section State
  const [staffSearch, setStaffSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [shiftFilter, setShiftFilter] = useState('All Shifts');
  const [currentPage, setCurrentPage] = useState(1);

  const roleOptions = ['All Roles', 'Reception', 'Game Supervisor', 'Maintenance', 'Manager'];
  const shiftOptions = ['All Shifts', 'Morning (8AM-4PM)', 'Evening (4PM-12AM)', 'Night (12AM-8AM)'];
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [showShiftOptions, setShowShiftOptions] = useState(false);

  const [staffData, setStaffData] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Reception Staff',
      shift: 'Morning',
      status: 'On Duty',
      statusDetail: '',
      online: true,
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Bowling Alley Supervisor',
      shift: 'Evening',
      status: 'Off Duty',
      statusDetail: 'Starts at 4PM',
      online: false,
    },
    {
      id: 3,
      name: 'David Wilson',
      role: 'Facility Maintenance',
      shift: 'Flexible',
      status: 'On Duty',
      statusDetail: 'Equipment Check',
      online: true,
    },
    {
      id: 4,
      name: 'Emma Rodriguez',
      role: 'Facility Manager',
      shift: 'Full-time',
      status: 'In Meeting',
      statusDetail: '',
      online: true,
    },
  ]);

  // Add Staff modal & fields
  const [addStaffModalVisible, setAddStaffModalVisible] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffShift, setNewStaffShift] = useState('Morning');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [showNewStaffRoleOptions, setShowNewStaffRoleOptions] = useState(false);
  const [showNewStaffShiftOptions, setShowNewStaffShiftOptions] = useState(false);
  const addStaffScrollRef = useRef<ScrollView | null>(null);
  const editModalScrollRef = useRef<ScrollView | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => setKeyboardHeight(e.endCoordinates?.height || 0);
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Opening hours sample (editable)
  const [openingHours, setOpeningHours] = useState([
    { day: 'Monday', time: '06:09 AM - 09:09 PM' },
    { day: 'Tuesday', time: '03:09 AM - 03:09 PM' },
    { day: 'Wednesday', time: '03:09 AM - 03:10 PM' },
    { day: 'Thursday', time: '02:00 AM - 11:00 PM' },
    { day: 'Friday', time: '04:00 AM - 10:00 PM' },
    { day: 'Saturday', time: 'Closed' },
    { day: 'Sunday', time: 'Closed' },
  ]);

  // Edit Complex Details Modal State
  const [editComplexModalVisible, setEditComplexModalVisible] = useState(false);
  const [complexName, setComplexName] = useState('Kanzul sport\'s complex');
  const [complexType, setComplexType] = useState('Indoor');
  const [complexStatus, setComplexStatus] = useState('Active');
  const [email, setEmail] = useState('maleensaman@gmail.com');
  const [contactNumber, setContactNumber] = useState('0761265772');
  const [website, setWebsite] = useState('');
  const [county, setCounty] = useState('Sri Lanka');
  const [location, setLocation] = useState('7.122875259759434, 80.07202735372985');
  const [fullAddress, setFullAddress] = useState('Warana Rd, Kalagedihena');
  const [postalCode, setPostalCode] = useState('43500');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [videoTourUrl, setVideoTourUrl] = useState('');
  const [description, setDescription] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editableHours, setEditableHours] = useState(() =>
    openingHours.map((o) => {
      if (o.time === 'Closed') return { day: o.day, open: '', close: '', closed: true };
      const parts = o.time.split('-').map((p) => p.trim());
      return { day: o.day, open: parts[0] ?? '', close: parts[1] ?? '', closed: false };
    })
  );

  const openEditModal = () => {
    setEditableHours(
      openingHours.map((o) => {
        if (o.time === 'Closed') return { day: o.day, open: '', close: '', closed: true };
        const parts = o.time.split('-').map((p) => p.trim());
        return { day: o.day, open: parts[0] ?? '', close: parts[1] ?? '', closed: false };
      })
    );
    setEditModalVisible(true);
  };

  const saveOpeningHours = () => {
    const newHours = editableHours.map((e) => ({ day: e.day, time: e.closed ? 'Closed' : `${e.open} - ${e.close}` }));
    setOpeningHours(newHours);
    setEditModalVisible(false);
  };

  const cancelEdit = () => setEditModalVisible(false);

  // Inline time picker state
  const [expandedTimeField, setExpandedTimeField] = useState<string | null>(null); // "dayIdx-field" format
  const [pickerHour, setPickerHour] = useState(6);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerAmPm, setPickerAmPm] = useState<'AM' | 'PM'>('AM');

  const formatTime = (h: number, m: number, ap: 'AM' | 'PM') => {
    const hh = h < 10 ? `0${h}` : `${h}`;
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `${hh}:${mm} ${ap}`;
  };

  const parseTimeString = (s: string) => {
    if (!s) return { h: 6, m: 0, ap: 'AM' as 'AM' | 'PM' };
    const m = String(s).trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return { h: 6, m: 0, ap: 'AM' as 'AM' | 'PM' };
    let h = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ap = (m[3].toUpperCase() === 'PM' ? 'PM' : 'AM') as 'AM' | 'PM';
    return { h, m: mm, ap };
  };

  const toggleTimePicker = (dayIdx: number, field: 'open' | 'close') => {
    const key = `${dayIdx}-${field}`;
    if (expandedTimeField === key) {
      setExpandedTimeField(null);
    } else {
      const current = editableHours[dayIdx]?.[field] ?? '';
      const parsed = parseTimeString(current);
      setPickerHour(parsed.h);
      setPickerMinute(parsed.m);
      setPickerAmPm(parsed.ap);
      setExpandedTimeField(key);
    }
  };

  const saveTimeSelection = () => {
    if (!expandedTimeField) return;
    const [dayIdxStr, field] = expandedTimeField.split('-');
    const dayIdx = parseInt(dayIdxStr, 10);
    const formatted = formatTime(pickerHour, pickerMinute, pickerAmPm);
    const copy = [...editableHours];
    copy[dayIdx] = { ...copy[dayIdx], [field as 'open' | 'close']: formatted };
    setEditableHours(copy);
    setExpandedTimeField(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Horizontal Small Menu Bar */}
      <View style={styles.menuBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuBarScroll}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, activeSection === item.id && styles.menuItemActive]}
              onPress={() => setActiveSection(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={activeSection === item.id ? '#fff' : '#374151'}
              />
              <Text style={[styles.menuItemText, activeSection === item.id && styles.menuItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeSection === 'profile' && (
          <>
            {/* Profile Header Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.placeholderText}>Default{'\n'}Complex{'\n'}Image</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.complexName}>Kanzul sport's complex</Text>
                  <View style={styles.tagRow}>
                    <View style={styles.indoorTag}>
                      <Text style={styles.indoorTagText}>Indoor</Text>
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color="#6B7280" />
                      <Text style={styles.locationText}>Sri Lanka</Text>
                    </View>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => setEditComplexModalVisible(true)}>
                <Ionicons name="create-outline" size={16} color="#15803D" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Contact Information Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="id-card" size={18} color="#2563EB" />
                <Text style={styles.cardTitle}>Contact Information</Text>
              </View>
              <View style={styles.cardGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Email Address</Text>
                  <Text style={styles.value}>maleensaman@gmail.com</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Website</Text>
                  <Text style={styles.value}>-</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Contact Number</Text>
                  <Text style={styles.value}>0761265772</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Address Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="location" size={18} color="#2563EB" />
                <Text style={styles.cardTitle}>Address</Text>
              </View>
              <View style={styles.cardGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>County</Text>
                  <Text style={styles.value}>Sri Lanka</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Location</Text>
                  <Text style={styles.value} numberOfLines={1}>7.1228752, 80.0720273</Text>
                </View>
                <View style={styles.gridItemFull}>
                  <Text style={styles.label}>Full Address</Text>
                  <Text style={styles.value}>Warana Rd, Kalagedihena</Text>
                </View>
                <View style={styles.gridItemFull}>
                  <Text style={styles.label}>Postal Code</Text>
                  <Text style={styles.value}>43500</Text>
                </View>
              </View>
            </View>

            {/* Operating Details Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="time" size={18} color="#2563EB" />
                <Text style={styles.cardTitle}>Operating Details</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Amenities</Text>
                <Text style={styles.valueGray}>No amenities listed</Text>
              </View>
            </View>

            {/* Media Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="images" size={18} color="#2563EB" />
                <Text style={styles.cardTitle}>Media</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Video Tour URL</Text>
                <Text style={styles.valueGray}>Not available</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Gallery Images</Text>
                <Text style={styles.valueGray}>No gallery images available</Text>
              </View>
            </View>

            {/* Additional Details Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="information-circle" size={18} color="#2563EB" />
                <Text style={styles.cardTitle}>Additional Details</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.valueGray}>-</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Terms & Conditions</Text>
                <Text style={styles.valueGray}>-</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Social Links</Text>
                <Text style={styles.valueGray}>No social links available</Text>
              </View>
            </View>
          </>
        )}

        {activeSection === 'notifications' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications" size={18} color="#2563EB" />
              <Text style={styles.cardTitle}>Notification Settings</Text>
            </View>
            <View style={{ paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.label}>Email Notifications</Text>
                  <Text style={styles.securitySubtext}>Receive notifications via email</Text>
                </View>
                <Switch value={emailNotifications} onValueChange={setEmailNotifications} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
              </View>

              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.label}>SMS Notifications</Text>
                  <Text style={styles.securitySubtext}>Receive text message alerts</Text>
                </View>
                <Switch value={smsNotifications} onValueChange={setSmsNotifications} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginTop: 8 }} />
            <View style={{ paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar" size={18} color="#15803D" />
                <Text style={[styles.cardTitle, { marginLeft: 8, fontSize: 15 }]}>Upcoming Bookings</Text>
              </View>
            </View>
          </View>
        )}

        {activeSection === 'team' && (
          <View style={styles.teamContainer}>
            <View style={styles.teamHeader}>
              <View style={styles.teamTitleRow}>
                <Ionicons name="people" size={20} color="#2563EB" />
                <Text style={styles.teamTitle}>Facility Staff</Text>
              </View>
              <TouchableOpacity style={styles.addStaffBtn} onPress={() => setAddStaffModalVisible(true)}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addStaffBtnText}>Add Staff</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filtersSection}>
              <View style={styles.searchBarWrapper}>
                <Ionicons name="search" size={18} color="#6B7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search staff..."
                  value={staffSearch}
                  onChangeText={setStaffSearch}
                />
              </View>
              <View style={styles.dropdownsRow}>
                <View style={styles.dropdownWrap}>
                  <TouchableOpacity style={[styles.dropdownBtn, styles.filterBtn]} onPress={() => { setShowRoleOptions((s) => !s); setShowShiftOptions(false); }}>
                    <Text style={styles.dropdownText}>{roleFilter}</Text>
                    <Ionicons name="chevron-down" size={14} color="#374151" />
                  </TouchableOpacity>
                  {showRoleOptions && (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                      {roleOptions.map((r) => (
                        <TouchableOpacity key={r} style={[styles.dropdownItem, r === roleFilter ? styles.dropdownItemSelected : null]} onPress={() => { setRoleFilter(r); setShowRoleOptions(false); }}>
                          <Text style={[styles.dropdownItemText, r === roleFilter ? styles.dropdownItemTextSelected : null]}>{r}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                <View style={styles.dropdownWrap}>
                  <TouchableOpacity style={[styles.dropdownBtn, styles.filterBtn]} onPress={() => { setShowShiftOptions((s) => !s); setShowRoleOptions(false); }}>
                    <Text style={styles.dropdownText}>{shiftFilter}</Text>
                    <Ionicons name="chevron-down" size={14} color="#374151" />
                  </TouchableOpacity>
                  {showShiftOptions && (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                      {shiftOptions.map((s) => (
                        <TouchableOpacity key={s} style={[styles.dropdownItem, s === shiftFilter ? styles.dropdownItemSelected : null]} onPress={() => { setShiftFilter(s); setShowShiftOptions(false); }}>
                          <Text style={[styles.dropdownItemText, s === shiftFilter ? styles.dropdownItemTextSelected : null]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.staffCardsGrid}>
              {staffData.slice((currentPage - 1) * 6, currentPage * 6).map((staff) => (
                <View key={staff.id} style={styles.staffCardItem}>
                  <View style={styles.staffCardImageContainer}>
                    <View style={styles.staffImage} />
                    {staff.online ? (
                      <View style={styles.statusBadgeOnline}>
                        <Ionicons name="checkmark-circle" size={24} color="#15803D" />
                      </View>
                    ) : (
                      <View style={styles.statusBadgeOffline}>
                        <Ionicons name="close-circle" size={24} color="#DC2626" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.staffCardName}>{staff.name}</Text>
                  <Text style={styles.staffCardRole}>{staff.role}</Text>
                  <View style={[styles.shiftBadge, { backgroundColor: staff.shift === 'Evening' ? '#F59E0B' : staff.shift === 'Flexible' ? '#06B6D4' : staff.shift === 'Full-time' ? '#111827' : '#2563EB' }]}>
                    <Text style={styles.shiftBadgeText}>Shift: {staff.shift}</Text>
                  </View>
                  <View style={styles.actionIconsRow}>
                    <TouchableOpacity style={styles.actionIconBtn}>
                      <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconBtn}>
                      <Ionicons name="call-outline" size={16} color="#06B6D4" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconBtn}>
                      <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.statusLine}>
                    <Text style={styles.statusLineText}>Currently: {staff.status}</Text>
                    {staff.statusDetail ? <Text style={styles.statusDetailText}>({staff.statusDetail})</Text> : null}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.paginationSection}>
              <TouchableOpacity style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Previous</Text>
              </TouchableOpacity>
              <View style={styles.pageNumbers}>
                {Array.from({ length: Math.ceil(staffData.length / 6) }, (_, i) => i + 1).map((page) => (
                  <TouchableOpacity key={page} style={[styles.pageNum, page === currentPage && styles.pageNumActive]} onPress={() => setCurrentPage(page)}>
                    <Text style={[styles.pageNumText, page === currentPage && styles.pageNumTextActive]}>{page}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.pageBtn, currentPage === Math.ceil(staffData.length / 6) && styles.pageBtnDisabled]} onPress={() => currentPage < Math.ceil(staffData.length / 6) && setCurrentPage(currentPage + 1)} disabled={currentPage === Math.ceil(staffData.length / 6)}>
                <Text style={[styles.pageBtnText, currentPage === Math.ceil(staffData.length / 6) && styles.pageBtnTextDisabled]}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeSection === 'security' && (
          <View style={styles.securityContainer}>
            {/* Security Settings Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
                <Text style={styles.cardTitle}>Security Settings</Text>
              </View>
              
              <View style={styles.securityRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Two-Factor Authentication</Text>
                  <Text style={styles.securitySubtext}>Add an extra layer of security to your account</Text>
                  
                  <View style={styles.switchRow}>
                    <Switch
                      value={is2FAEnabled}
                      onValueChange={setIs2FAEnabled}
                      trackColor={{ false: "#E5E7EB", true: "#15803D" }}
                    />
                    <Text style={styles.switchLabel}>Enable 2FA</Text>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.configureButton}>
                  <Ionicons name="create-outline" size={16} color="#2563EB" />
                  <Text style={styles.configureButtonText}>Configure</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Change Password Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="key" size={20} color="#F59E0B" />
                <Text style={styles.cardTitle}>Change Password</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showCurrentPassword}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <Ionicons name={showCurrentPassword ? "eye" : "eye-outline"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showNewPassword}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons name={showNewPassword ? "eye" : "eye-outline"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.hintText}>8+ characters with uppercase, lowercase, number & symbol</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye" : "eye-outline"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.updateButton}>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.updateButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>

            {/* CCTV Maintenance Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="videocam" size={20} color="#DC2626" />
                <Text style={styles.cardTitle}>CCTV Maintenance</Text>
              </View>

              <Text style={styles.devPending}>development work pending</Text>

              <Text style={styles.sectionSubtitle}>Camera Status</Text>
              <View style={styles.cameraRow}>
                <View style={styles.cameraCard}>
                  <View style={styles.cameraIconBox}>
                    <Ionicons name="videocam-off" size={24} color="#374151" />
                  </View>
                  <View style={styles.cameraInfo}>
                    <View style={styles.cameraBadge}>
                      <Text style={styles.cameraBadgeText}>Main Entrance</Text>
                    </View>
                    <Text style={styles.offlineText}>Offline</Text>
                  </View>
                </View>

                <View style={styles.cameraCard}>
                  <View style={styles.cameraIconBox}>
                    <Ionicons name="videocam" size={24} color="#374151" />
                  </View>
                  <View style={styles.cameraInfo}>
                    <View style={[styles.cameraBadge, { backgroundColor: '#2563EB' }]}>
                      <Text style={styles.cameraBadgeText}>Lobby</Text>
                    </View>
                    <Text style={styles.onlineText}>Online</Text>
                  </View>
                </View>
              </View>

              <View style={styles.scheduleSection}>
                <Text style={styles.label}>Maintenance Schedule</Text>
                <View style={styles.scheduleRow}>
                  <View style={styles.dropdownWrapper}>
                    <Pressable style={styles.dropdown} onPress={() => setMaintenanceDropdownVisible((v) => !v)}>
                      <Text style={styles.scheduleDropdownText}>{maintenanceSchedule}</Text>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </Pressable>
                    {maintenanceDropdownVisible && (
                      <View style={styles.dropdownMenu}>
                        {['Daily', 'Weekly', 'Monthly'].map((opt) => (
                          <Pressable
                            key={opt}
                            onPress={() => { setMaintenanceSchedule(opt); setMaintenanceDropdownVisible(false); }}
                            style={[styles.dropdownOption, maintenanceSchedule === opt && styles.dropdownOptionSelected]}
                          >
                            <Text style={[styles.dropdownOptionText, maintenanceSchedule === opt && styles.dropdownOptionTextSelected]}>{opt}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={styles.setScheduleButton}>
                    <Ionicons name="calendar-outline" size={16} color="#374151" />
                    <Text style={styles.setScheduleText}>Set Schedule</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.restartButton}>
                <Ionicons name="refresh-outline" size={18} color="#DC2626" />
                <Text style={styles.restartButtonText}>Restart All Cameras</Text>
              </TouchableOpacity>

              <View style={styles.lastLoginSection}>
                <Text style={styles.label}>Last Login</Text>
                <View style={styles.lastLoginRow}>
                  <Ionicons name="time-outline" size={16} color="#374151" />
                  <Text style={styles.lastLoginText}>2023-11-15 14:30:22 from 192.168.1.100 (Chrome, Windows)</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeSection === 'opening' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={18} color="#2563EB" />
              <Text style={styles.cardTitle}>Opening Hours</Text>
              <TouchableOpacity style={styles.openingEditBtn} onPress={openEditModal}>
                <Ionicons name="create-outline" size={16} color="#2563EB" />
                <Text style={styles.openingEditText}>Edit Opening Hours</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.openingList}>
              {openingHours.map((o) => (
                <View key={o.day} style={styles.openingRow}>
                  <Text style={styles.openingDay}>{o.day}</Text>
                  {o.time === 'Closed' ? (
                    <View style={styles.closedBadge}><Text style={styles.closedBadgeText}>Closed</Text></View>
                  ) : (
                    <Text style={styles.openingTime}>{o.time}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Edit Opening Hours Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={cancelEdit}>
        <SafeAreaView style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <View />
            <Pressable style={styles.editModalCloseBtn} onPress={cancelEdit}>
              <Text style={styles.editModalCloseText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.editModalContent}>
            <Text style={styles.editModalHeading}>Opening Hours</Text>

            {editableHours.map((e, idx) => {
              const isOpenExpanded = expandedTimeField === `${idx}-open`;
              const isCloseExpanded = expandedTimeField === `${idx}-close`;
              return (
                <View key={e.day}>
                  <View style={styles.editRow}>
                    <Text style={styles.editDayLabel}>{e.day}</Text>

                    <View style={styles.editTimeGroup}>
                      <TouchableOpacity
                        style={[styles.timeInputBox, isOpenExpanded && { borderColor: '#15803D', borderWidth: 2 }]}
                        onPress={() => toggleTimePicker(idx, 'open')}
                        disabled={e.closed}
                      >
                        <Text style={styles.timeInputField}>{e.open || '—'}</Text>
                        <Ionicons name={isOpenExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
                      </TouchableOpacity>

                      <Text style={styles.toLabel}>to</Text>

                      <TouchableOpacity
                        style={[styles.timeInputBox, isCloseExpanded && { borderColor: '#15803D', borderWidth: 2 }]}
                        onPress={() => toggleTimePicker(idx, 'close')}
                        disabled={e.closed}
                      >
                        <Text style={styles.timeInputField}>{e.close || '—'}</Text>
                        <Ionicons name={isCloseExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.editClosedCheckbox}>
                      <Switch
                        value={e.closed}
                        onValueChange={(v) => {
                          const copy = [...editableHours];
                          copy[idx] = { ...copy[idx], closed: v };
                          if (v) {
                            copy[idx].open = '';
                            copy[idx].close = '';
                          }
                          setEditableHours(copy);
                        }}
                        trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                      />
                    </View>
                  </View>

                  {/* Inline Time Picker */}
                  {(isOpenExpanded || isCloseExpanded) && (
                    <View style={styles.inlinePickerContainer}>
                      <Text style={styles.inlinePickerLabel}>Select Time</Text>
                      <View style={styles.inlinePickerRow}>
                        <View style={styles.inlinePickerCol}>
                          <Text style={styles.inlinePickerColLabel}>Hour</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                              <TouchableOpacity key={h} style={[styles.inlinePickerBtn, pickerHour === h && styles.inlinePickerBtnActive]} onPress={() => setPickerHour(h)}>
                                <Text style={[styles.inlinePickerBtnText, pickerHour === h && styles.inlinePickerBtnTextActive]}>{h}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        <View style={styles.inlinePickerCol}>
                          <Text style={styles.inlinePickerColLabel}>Minute</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
                            {[0, 15, 30, 45].map((m) => (
                              <TouchableOpacity key={m} style={[styles.inlinePickerBtn, pickerMinute === m && styles.inlinePickerBtnActive]} onPress={() => setPickerMinute(m)}>
                                <Text style={[styles.inlinePickerBtnText, pickerMinute === m && styles.inlinePickerBtnTextActive]}>{m < 10 ? `0${m}` : `${m}`}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        <View style={styles.inlinePickerCol}>
                          <Text style={styles.inlinePickerColLabel}>AM/PM</Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            {(['AM', 'PM'] as const).map((ap) => (
                              <TouchableOpacity key={ap} style={[styles.inlineAmpmBtn, pickerAmPm === ap && styles.inlineAmpmBtnActive]} onPress={() => setPickerAmPm(ap)}>
                                <Text style={[styles.inlineAmpmBtnText, pickerAmPm === ap && styles.inlineAmpmBtnTextActive]}>{ap}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
                        <TouchableOpacity style={styles.inlinePickerCancelBtn} onPress={() => setExpandedTimeField(null)}>
                          <Text style={styles.inlinePickerCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.inlinePickerSaveBtn} onPress={saveTimeSelection}>
                          <Text style={styles.inlinePickerSaveText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={styles.editModalActions}>
              <TouchableOpacity style={styles.saveBtnPrimary} onPress={saveOpeningHours}>
                <Text style={styles.saveBtnText}>Save Opening Hours</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtnSecondary} onPress={cancelEdit}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Staff Modal */}
      <Modal visible={addStaffModalVisible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setAddStaffModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'position'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
              <View style={[styles.modalBox, !keyboardHeight ? { marginBottom: 48 } : {}]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Staff</Text>
                  <Pressable onPress={() => setAddStaffModalVisible(false)} style={styles.modalCloseBtn}><Ionicons name="close" size={20} color="#fff" /></Pressable>
                </View>
                <ScrollView ref={addStaffScrollRef} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                  <Text style={styles.fieldLabel}>Name *</Text>
                  <TextInput style={styles.input} placeholder="Enter full name" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={newStaffName} onChangeText={setNewStaffName} onFocus={() => {
                    setTimeout(() => addStaffScrollRef.current?.scrollToEnd({ animated: true }), 120);
                  }} />

                  <Text style={styles.fieldLabel}>Role *</Text>
                  <View style={styles.dropdownWrapInline}>
                    <TouchableOpacity style={styles.dropdown} onPress={() => { setShowNewStaffRoleOptions((s) => !s); setShowNewStaffShiftOptions(false); }}>
                      <Text style={[styles.dropdownText, !newStaffRole && { color: '#9CA3AF' }]}>{newStaffRole || 'Select Role'}</Text>
                      <Ionicons name="chevron-down" size={16} color="#374151" style={{position: 'absolute', right: 12}} />
                    </TouchableOpacity>
                    {showNewStaffRoleOptions && (
                      <ScrollView style={styles.dropdownListInline} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                        {roleOptions.map((r) => (
                          <TouchableOpacity key={r} style={[styles.dropdownItem, r === newStaffRole ? styles.dropdownItemSelected : null]} onPress={() => { setNewStaffRole(r); setShowNewStaffRoleOptions(false); }}>
                            <Text style={[styles.dropdownItemText, r === newStaffRole ? styles.dropdownItemTextSelected : null]}>{r}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  <Text style={styles.fieldLabel}>Shift *</Text>
                  <View style={styles.dropdownWrapInline}>
                    <TouchableOpacity style={styles.dropdown} onPress={() => { setShowNewStaffShiftOptions((s) => !s); setShowNewStaffRoleOptions(false); }}>
                      <Text style={[styles.dropdownText, !newStaffShift && { color: '#9CA3AF' }]}>{newStaffShift || 'Select Shift'}</Text>
                      <Ionicons name="chevron-down" size={16} color="#374151" style={{position: 'absolute', right: 12}} />
                    </TouchableOpacity>
                    {showNewStaffShiftOptions && (
                      <ScrollView style={styles.dropdownListInline} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                        {shiftOptions.map((s) => (
                          <TouchableOpacity key={s} style={[styles.dropdownItem, s === newStaffShift ? styles.dropdownItemSelected : null]} onPress={() => { setNewStaffShift(s); setShowNewStaffShiftOptions(false); }}>
                            <Text style={[styles.dropdownItemText, s === newStaffShift ? styles.dropdownItemTextSelected : null]}>{s}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  <Text style={styles.fieldLabel}>Phone Number *</Text>
                  <TextInput style={styles.input} placeholder="Enter phone number" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={newStaffPhone} onChangeText={setNewStaffPhone} keyboardType="phone-pad" onFocus={() => {
                    setTimeout(() => addStaffScrollRef.current?.scrollToEnd({ animated: true }), 120);
                  }} />

                  <View style={styles.infoRow}>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>Name:</Text><Text style={styles.infoValue}>{newStaffName || '-'}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>Role:</Text><Text style={styles.infoValue}>{newStaffRole || '-'}</Text></View>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>Shift:</Text><Text style={styles.infoValue}>{newStaffShift || '-'}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>Phone:</Text><Text style={styles.infoValue}>{newStaffPhone || '-'}</Text></View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddStaffModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.bookBtn} onPress={() => {
                      const newStaff = { id: Date.now(), name: newStaffName || 'New Staff', role: newStaffRole || 'Staff', shift: newStaffShift || 'Morning', contact: newStaffPhone || '', status: 'On Duty', statusDetail: '', online: true };
                      setStaffData([newStaff, ...staffData]);
                      setAddStaffModalVisible(false);
                      setNewStaffName(''); setNewStaffRole(''); setNewStaffShift('Morning'); setNewStaffPhone('');
                    }}><Text style={styles.bookText}>Save Staff</Text></TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>



      {/* Edit Complex Details Modal - KeyboardAvoidingView but no auto-scroll */}
      <Modal visible={editComplexModalVisible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setEditComplexModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.editComplexOverlay, { justifyContent: 'flex-end' }]}>
              <View style={[styles.editComplexBox, { marginBottom: 48 }]}>
                <View style={[styles.editComplexHeader, { backgroundColor: '#16A34A' }]}>
                  <Text style={styles.editComplexTitle}>Edit Complex Details</Text>
                  <Pressable onPress={() => setEditComplexModalVisible(false)} style={styles.editComplexCloseBtn}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </Pressable>
                </View>
                <ScrollView ref={editModalScrollRef} contentContainerStyle={styles.editComplexContent} keyboardShouldPersistTaps="handled">
            {/* Basic Information */}
            <Text style={styles.editComplexSectionTitle}>Basic Information</Text>
            <View style={styles.editComplexGrid}>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Complex Name</Text>
                <TextInput style={styles.editComplexInput} value={complexName} onChangeText={setComplexName} placeholder="Complex Name" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Complex Type</Text>
                <TextInput style={styles.editComplexInput} value={complexType} onChangeText={setComplexType} placeholder="Indoor" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
            <View style={styles.editComplexGrid}>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Status</Text>
                <TextInput style={styles.editComplexInput} value={complexStatus} onChangeText={setComplexStatus} placeholder="Active" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Cover Image</Text>
                <TouchableOpacity style={styles.editComplexFileBtn}>
                  <Text style={styles.editComplexFileBtnText}>Choose File</Text>
                  <Text style={styles.editComplexFileName}>No file chosen</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Contact Information */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Contact Information</Text>
            <View style={styles.editComplexGrid}>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Email Address</Text>
                <TextInput style={styles.editComplexInput} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#9CA3AF" keyboardType="email-address" />
              </View>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Contact Number</Text>
                <TextInput style={styles.editComplexInput} value={contactNumber} onChangeText={setContactNumber} placeholder="Contact Number" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Website</Text>
              <TextInput style={styles.editComplexInput} value={website} onChangeText={setWebsite} placeholder="Website" placeholderTextColor="#9CA3AF" />
            </View>

            {/* Address */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Address</Text>
            <View style={styles.editComplexGrid}>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>County</Text>
                <TextInput style={styles.editComplexInput} value={county} onChangeText={setCounty} placeholder="County" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Location</Text>
                <TextInput style={styles.editComplexInput} value={location} onChangeText={setLocation} placeholder="Location" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Full Address</Text>
              <TextInput style={[styles.editComplexInput, { minHeight: 80, textAlignVertical: 'top' }]} value={fullAddress} onChangeText={setFullAddress} placeholder="Full Address" placeholderTextColor="#9CA3AF" multiline />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Postal Code</Text>
              <TextInput style={styles.editComplexInput} value={postalCode} onChangeText={setPostalCode} placeholder="Postal Code" placeholderTextColor="#9CA3AF" />
            </View>

            {/* Amenities */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Amenities</Text>
            <View style={styles.editComplexAmenitiesBox}>
              <Text style={styles.editComplexAmenitiesLabel}>Amenities</Text>
              {amenities.length === 0 ? (
                <Text style={styles.editComplexNoAmenities}>No amenities added yet</Text>
              ) : (
                amenities.map((a, i) => <Text key={i} style={styles.editComplexAmenity}>{a}</Text>)
              )}
              <View style={styles.editComplexAmenityRow}>
                <TextInput
                  style={styles.editComplexAmenityInput}
                  placeholder="Add new amenity"
                  placeholderTextColor="#9CA3AF"
                  value={newAmenity}
                  onChangeText={setNewAmenity}
                />
                <TouchableOpacity
                  style={styles.editComplexAddAmenityBtn}
                  onPress={() => {
                    if (newAmenity.trim()) {
                      setAmenities([...amenities, newAmenity]);
                      setNewAmenity('');
                    }
                  }}
                >
                  <Text style={styles.editComplexAddAmenityText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Media */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Media</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Video Tour URL</Text>
              <TextInput style={styles.editComplexInput} value={videoTourUrl} onChangeText={setVideoTourUrl} placeholder="Video Tour URL" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.editComplexGalleryBox}>
              <Text style={styles.editComplexLabel}>Gallery Images (Upload 4 at a time)</Text>
              <TouchableOpacity style={styles.editComplexFileBtn}>
                <Text style={styles.editComplexFileBtnText}>Choose Files</Text>
                <Text style={styles.editComplexFileName}>No file chosen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editComplexUploadBtn}>
                <Text style={styles.editComplexUploadBtnText}>Upload</Text>
              </TouchableOpacity>
            </View>

            {/* Additional Details */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Additional Details</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Description</Text>
              <TextInput style={[styles.editComplexInput, { minHeight: 100, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#9CA3AF" multiline />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Terms & Conditions</Text>
              <TextInput style={[styles.editComplexInput, { minHeight: 100, textAlignVertical: 'top' }]} value={termsConditions} onChangeText={setTermsConditions} placeholder="Terms & Conditions" placeholderTextColor="#9CA3AF" multiline />
            </View>

            {/* Social Links */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Social Links</Text>
            <View style={styles.editComplexSocialRow}>
              <TextInput style={styles.editComplexSocialSelect} placeholder="Select Platform" placeholderTextColor="#9CA3AF" />
              <TextInput style={styles.editComplexSocialInput} placeholder="https://..." placeholderTextColor="#9CA3AF" />
              <TouchableOpacity style={styles.editComplexAddSocialBtn}>
                <Text style={styles.editComplexAddSocialText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.editComplexActionsRow}>
              <TouchableOpacity style={styles.editComplexCancelBtn} onPress={() => setEditComplexModalVisible(false)}>
                <Text style={styles.editComplexCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editComplexSaveBtn} onPress={() => { console.log('Save complex details'); setEditComplexModalVisible(false); }}>
                <Text style={styles.editComplexSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },

  // Small horizontal menu bar
  menuBarContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuBarScroll: { paddingHorizontal: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  menuItemActive: {
    backgroundColor: '#15803D',
  },
  menuItemText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  menuItemTextActive: {
    color: '#fff',
  },

  content: { padding: 12, paddingBottom: 40 },

  // Profile header card
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
  profileInfo: { marginLeft: 12, flex: 1 },
  complexName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  indoorTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  indoorTagText: { color: '#15803D', fontSize: 12, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  locationText: { marginLeft: 4, color: '#6B7280', fontSize: 12 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#15803D',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  editButtonText: { marginLeft: 4, color: '#15803D', fontWeight: '600' },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#111827' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '50%', marginBottom: 12 },
  gridItemFull: { width: '100%', marginBottom: 12 },
  cardBody: { marginBottom: 12 },
  label: { color: '#6B7280', fontSize: 12, marginBottom: 4 },
  value: { color: '#111827', fontSize: 14, fontWeight: '600' },
  valueGray: { color: '#9CA3AF', fontSize: 14 },
  statusBadge: {
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Security Styles
  securityContainer: {
    flex: 1,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  securitySubtext: {
    fontSize: 13,
    color: '#374151',
    marginVertical: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  configureButtonText: {
    marginLeft: 6,
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 6,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  hintText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  cameraRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cameraCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    alignItems: 'center',
  },
  cameraIconBox: {
    width: '100%',
    height: 70,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraInfo: {
    alignItems: 'center',
  },
  cameraBadge: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  cameraBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  offlineText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  onlineText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  scheduleDropdownText: {
    fontSize: 14,
    color: '#111827',
  },
  setScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  setScheduleText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 6,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  restartButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  lastLoginSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lastLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  lastLoginText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },

  // Team Member Styles
  teamContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  addStaffBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addStaffBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  filtersSection: {
    gap: 10,
    marginBottom: 16,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#111827',
  },
  dropdownsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  dropdownWrap: { flex: 1, position: 'relative' },
  dropdownList: { position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#111827', borderRadius: 6, zIndex: 2000, maxHeight: 220 },
  dropdownItem: { paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dropdownItemSelected: { backgroundColor: '#2563EB' },
  dropdownItemText: { color: '#111827' },
  dropdownItemTextSelected: { color: '#fff', fontWeight: '700' },
  filterBtn: { paddingVertical: 8 },
  /* Inline modal dropdown styles */
  dropdownWrapInline: { position: 'relative' },
  dropdownBtnInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8 },
  dropdownTextInline: { color: '#111827', fontWeight: '600', fontSize: 12 },
  dropdownListInline: { position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#111827', borderRadius: 6, zIndex: 2000, maxHeight: 200 },
  staffCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  staffCardItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  staffCardImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  staffImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
  },
  statusBadgeOnline: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  statusBadgeOffline: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  staffCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  staffCardRole: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  shiftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  shiftBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  statusLine: {
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  statusLineText: {
    fontSize: 11,
    color: '#6B7280',
  },
  statusDetailText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  paginationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
  },
  pageBtnDisabled: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  pageBtnText: {
    fontSize: 12,
    color: '#374151',
  },
  pageBtnTextDisabled: {
    color: '#9CA3AF',
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 4,
  },
  pageNum: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  pageNumActive: {
    backgroundColor: '#2563EB',
  },
  pageNumText: {
    fontSize: 12,
    color: '#374151',
  },
  pageNumTextActive: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  // Opening hours styles
  openingList: { marginTop: 8 },
  openingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  openingDay: { fontSize: 14, color: '#111827', fontWeight: '600' },
  openingTime: { fontSize: 14, color: '#6B7280' },
  closedBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  closedBadgeText: { color: '#DC2626', fontWeight: '700' },
  openingEditBtn: { marginLeft: 'auto', borderWidth: 1, borderColor: '#2563EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  openingEditText: { color: '#2563EB', marginLeft: 8, fontWeight: '600' },
  /* Edit Opening Hours Modal Styles */
  editModalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  editModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  editModalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  editModalCloseBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#2563EB', borderRadius: 6 },
  editModalCloseText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  editModalContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 40 },
  editModalHeading: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  editRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12 },
  editDayLabel: { width: 72, fontSize: 14, color: '#6B7280', fontWeight: '600' },
  editTimeGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' },
  timeInputField: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },
  toLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  editClosedCheckbox: { width: 50, alignItems: 'center' },
  editModalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  saveBtnPrimary: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelBtnSecondary: { borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', backgroundColor: '#fff' },
  cancelBtnText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerBox: { width: '90%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pickerCol: { alignItems: 'center', marginHorizontal: 8 },
  pickerBtn: { width: 36, height: 32, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  pickerValue: { fontSize: 18, fontWeight: '700', marginVertical: 6 },
  ampmBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  ampmText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  /* Inline Time Picker Styles (within Edit Opening Hours Modal) */
  inlinePickerContainer: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  inlinePickerLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  inlinePickerRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inlinePickerCol: { flex: 1 },
  inlinePickerColLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6 },
  inlinePickerBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff', marginRight: 6, alignItems: 'center', justifyContent: 'center' },
  inlinePickerBtnActive: { backgroundColor: '#DCFCE7', borderColor: '#15803D' },
  inlinePickerBtnText: { fontSize: 12, color: '#111827', fontWeight: '600' },
  inlinePickerBtnTextActive: { color: '#15803D', fontWeight: '700' },
  inlineAmpmBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  inlineAmpmBtnActive: { backgroundColor: '#DCFCE7', borderColor: '#15803D' },
  inlineAmpmBtnText: { fontSize: 12, color: '#111827', fontWeight: '600' },
  inlineAmpmBtnTextActive: { color: '#15803D', fontWeight: '700' },
  inlinePickerCancelBtn: { borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#fff' },
  inlinePickerCancelText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  inlinePickerSaveBtn: { backgroundColor: '#15803D', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  inlinePickerSaveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  /* Edit Complex Details Modal Styles */
  editComplexOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 12 },
  editComplexBox: { width: '94%', maxHeight: '88%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  editComplexHeader: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editComplexTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  editComplexCloseBtn: { padding: 8 },
  editComplexContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 },
  editComplexSectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  editComplexGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  editComplexCol: { flex: 1 },
  editComplexLabel: { fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: '600' },
  editComplexInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: '#111827', fontSize: 14 },
  editComplexFileBtn: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F8FAFC' },
  editComplexFileBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  editComplexFileName: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  editComplexAmenitiesBox: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F8FAFC', marginBottom: 16 },
  editComplexAmenitiesLabel: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 8 },
  editComplexNoAmenities: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  editComplexAmenity: { fontSize: 13, color: '#374151', paddingVertical: 4 },
  editComplexAmenityRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editComplexAmenityInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', color: '#111827' },
  editComplexAddAmenityBtn: { backgroundColor: '#16A34A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  editComplexAddAmenityText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  editComplexGalleryBox: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F8FAFC', marginBottom: 16 },
  editComplexUploadBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  editComplexUploadBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  editComplexSocialRow: { flexDirection: 'row', gap: 8, marginBottom: 16, alignItems: 'center' },
  editComplexSocialSelect: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: '#111827', minWidth: 120 },
  editComplexSocialInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: '#111827' },
  editComplexAddSocialBtn: { backgroundColor: '#16A34A', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  editComplexAddSocialText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  editComplexActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  editComplexCancelBtn: { backgroundColor: '#6B7280', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  editComplexCancelText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  editComplexSaveBtn: { backgroundColor: '#16A34A', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  editComplexSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  devPending: { color: '#DC2626', fontStyle: 'italic', marginTop: 8, marginLeft: 6 },
  /* Maintenance schedule dropdown */
  dropdownWrapper: { position: 'relative' },
  dropdownMenu: { position: 'absolute', top: 46, left: 0, width: 160, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 6, zIndex: 50 },
  dropdownOption: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownOptionSelected: { backgroundColor: '#1E40AF' },
  dropdownOptionText: { color: '#111827', fontSize: 14 },
  dropdownOptionTextSelected: { color: '#fff', fontWeight: '700' },
  /* Add Staff modal styles (reusing modal look) */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 12 },
  modalBox: { width: '92%', maxHeight: '90%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  modalHeader: { backgroundColor: '#15803D', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalCloseBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6 },
  modalContent: { padding: 16, paddingBottom: 24 },
  rowSplit: { flexDirection: 'row', gap: 12 },
  formCol: { flex: 1 },
  fieldLabel: { fontSize: 13, color: '#374151', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: '#111827' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoBox: { flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8 },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6' },
  cancelText: { color: '#374151', fontWeight: '600' },
  bookBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: '#15803D' },
  bookText: { color: '#fff', fontWeight: '700' },
  addSportBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#15803D' },
  addSportText: { color: '#fff', fontWeight: '700' },
});
