import SideMenu from '@/components/SideMenu';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, updateProfile, changePassword, getVenue, updateVenue, getStaffMembers, createStaffMember, deleteStaffMember, updateStaffMember } from '@/services/indoorAdminApi';
import { User, Venue, StaffMember as StaffMemberType, VenueUpdatePayload } from '@/types/api';

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

  // API data state
  const [profile, setProfile] = useState<User | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load banner notification preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('bannerNotificationsEnabled');
        if (saved !== null) setBannerNotifications(JSON.parse(saved));
      } catch (e) {
        // default to true
      }
    })();
  }, []);

  // Save banner notification preference when changed
  const handleBannerNotificationToggle = async (value: boolean) => {
    setBannerNotifications(value);
    try {
      await AsyncStorage.setItem('bannerNotificationsEnabled', JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save banner notification setting:', e);
    }
  };

  // Fetch profile and venue data
  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [profileData, venueData] = await Promise.all([
        getProfile().catch(() => null),
        getVenue().catch(() => null),
      ]);

      if (profileData) {
        setProfile(profileData);
        // Update form fields with profile data
        setEmail(profileData.email || '');
        setContactNumber(profileData.phone || '');
      }

      if (venueData) {
        setVenue(venueData);
        // Update form fields with venue data
        setComplexName(venueData.name || '');
        setFullAddress(venueData.address || '');
        setPostalCode(venueData.postal_code || '');
        setCounty(venueData.county || '');
        setWebsite(venueData.website || '');
        setDescription(venueData.description || '');
        // Venue-specific fields from signup
        setLocation(venueData.location || '');
        setComplexType(venueData.complex_type || 'Indoor');
        setComplexStatus(venueData.status || 'Active');
        // Venue contact info - separate from admin profile
        if (venueData.email_address) setEmail(venueData.email_address);
        if (venueData.contact_number) setContactNumber(venueData.contact_number);

        // Load cover image and gallery images from backend
        if (venueData.cover_image) {
          setCoverImageUri(venueData.cover_image);
        }
        if (venueData.gallery_images_json && Array.isArray(venueData.gallery_images_json)) {
          setGalleryImageUris(venueData.gallery_images_json);
        }
        if (venueData.video_tour_url) setVideoTourUrl(venueData.video_tour_url);
        if (venueData.description) setDescription(venueData.description);
        if (venueData.terms) setTermsConditions(venueData.terms);

        // Parse opening hours from backend format to display format
        if (venueData.opening_hours && typeof venueData.opening_hours === 'object') {
          const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          
          const convert24To12 = (time24: string): string => {
            if (!time24) return '6 AM';
            const [hours] = time24.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const hour12 = hours % 12 || 12;
            return `${hour12} ${period}`;
          };

          const parsedHours = dayNames.map((dayName, idx) => {
            const config = venueData.opening_hours[dayName];
            if (!config) return { day: dayLabels[idx], time: '6 AM - 9 PM' }; // Default
            if (config.closed) return { day: dayLabels[idx], time: 'Closed' };
            const open = convert24To12(config.open);
            const close = convert24To12(config.close);
            return { day: dayLabels[idx], time: `${open} - ${close}` };
          });
          
          console.log('[Settings] Loaded opening_hours from backend:', JSON.stringify(venueData.opening_hours, null, 2));
          console.log('[Settings] Parsed for display:', parsedHours);
          setOpeningHours(parsedHours);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch staff members from backend
  const fetchStaff = useCallback(async () => {
    try {
      setStaffLoading(true);
      const data = await getStaffMembers();
      setStaffData(data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [staffSearch, roleFilter, shiftFilter]);

  // Pick staff photo
  const pickStaffPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library to upload staff photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = uri.split('/').pop() || 'staff.jpg';
      const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
      const type = ext === 'png' ? 'image/png' : 'image/jpeg';
      setNewStaffPhotoUri(uri);
      setNewStaffPhotoFile({ uri, name, type });
    }
  };

  // Pick cover image from gallery
  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = uri.split('/').pop() || 'cover.jpg';
      const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
      const type = ext === 'png' ? 'image/png' : 'image/jpeg';
      setCoverImageUri(uri);
      setCoverImageFile({ uri, name, type });
    }
  };

  // Pick gallery images (multiple)
  const pickGalleryImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newUris: string[] = [];
      const newFiles: { uri: string; name: string; type: string }[] = [];
      result.assets.forEach((asset) => {
        const uri = asset.uri;
        const name = uri.split('/').pop() || 'gallery.jpg';
        const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
        const type = ext === 'png' ? 'image/png' : 'image/jpeg';
        newUris.push(uri);
        newFiles.push({ uri, name, type });
      });
      setGalleryImageUris((prev) => [...prev, ...newUris]);
      setGalleryImageFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Remove a gallery image (local, before upload)
  const removeGalleryImage = (index: number) => {
    setGalleryImageUris((prev) => prev.filter((_, i) => i !== index));
    setGalleryImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Enter edit mode for staff
  const enterEditMode = (staff: StaffMemberType) => {
    setEditedStaffName(staff.name);
    setEditedStaffRole(staff.role);
    setEditedStaffShift(staff.shift);
    setEditedStaffPhone(staff.phone || '');
    setEditedStaffStatus(staff.status);
    setEditedStaffStatusDetail(staff.status_detail || '');
    setEditedStaffPhotoUri(staff.photo || null);
    setEditedStaffPhotoFile(null);
    setIsEditingStaff(true);
  };

  // Pick edited staff photo
  const pickEditStaffPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library to upload staff photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = uri.split('/').pop() || 'staff.jpg';
      const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
      const type = ext === 'png' ? 'image/png' : 'image/jpeg';
      setEditedStaffPhotoUri(uri);
      setEditedStaffPhotoFile({ uri, name, type });
    }
  };

  // Save edited staff
  const saveEditedStaff = async () => {
    if (!selectedStaff || !editedStaffName.trim() || !editedStaffRole || !editedStaffShift) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (editedStaffPhone.trim() && editedStaffPhone.replace(/\D/g, '').length !== 10) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits.');
      return;
    }

    try {
      setSaving(true);
      const updateData: any = {
        name: editedStaffName,
        role: editedStaffRole,
        shift: editedStaffShift,
        phone: editedStaffPhone,
        status: editedStaffStatus,
        status_detail: editedStaffStatusDetail,
      };

      // Add photo if a new one was selected
      if (editedStaffPhotoFile) {
        updateData.photo = editedStaffPhotoFile;
      }

      await updateStaffMember(selectedStaff.id, updateData);
      Alert.alert('Success', 'Staff member updated successfully!');
      setIsEditingStaff(false);
      setStaffDetailModalVisible(false);
      fetchStaff();
    } catch (err: any) {
      console.error('Staff update error:', err);
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update staff member');
    } finally {
      setSaving(false);
    }
  };

  // Refresh data when settings screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[Settings] Screen focused, refreshing opening hours...');
      // Fetch only venue data to get latest opening hours
      (async () => {
        try {
          const venueData = await getVenue().catch(() => null);
          if (venueData) {
            console.log('[Settings] Refreshed opening_hours:', JSON.stringify(venueData.opening_hours, null, 2));
            setVenue(venueData);
            
            // Update opening hours display
            if (venueData.opening_hours && typeof venueData.opening_hours === 'object') {
              const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              
              const convert24To12 = (time24: string): string => {
                if (!time24) return '6 AM';
                const [hours] = time24.split(':').map(Number);
                const period = hours >= 12 ? 'PM' : 'AM';
                const hour12 = hours % 12 || 12;
                return `${hour12} ${period}`;
              };

              const parsedHours = dayNames.map((dayName, idx) => {
                const config = venueData.opening_hours[dayName];
                if (!config) return { day: dayLabels[idx], time: '6 AM - 9 PM' };
                if (config.closed) return { day: dayLabels[idx], time: 'Closed' };
                const open = convert24To12(config.open);
                const close = convert24To12(config.close);
                return { day: dayLabels[idx], time: `${open} - ${close}` };
              });
              
              setOpeningHours(parsedHours);
            }
          }
        } catch (err) {
          console.error('[Settings] Failed to refresh opening hours:', err);
        }
      })();
    }, [])
  );

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Handle profile update
  const handleSaveProfile = async () => {
    if (contactNumber.trim() && contactNumber.replace(/\D/g, '').length !== 10) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        phone: contactNumber,
      });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Handle venue update
  const handleSaveVenue = async () => {
    setSaving(true);
    try {
      // Prepare data to send
      const venueData: VenueUpdatePayload = {
        name: complexName,
        address: fullAddress,
        postal_code: postalCode,
        county: county,
        website: website,
        description: description,
        location: location,
        complex_type: complexType,
        contact_number: contactNumber,
        email_address: email,
        status: complexStatus,
        video_tour_url: videoTourUrl,
        terms: termsConditions,
      };

      // If there are image files, send everything via FormData in one request
      if (coverImageFile || galleryImageFiles.length > 0) {
        setUploadingImages(true);
        const updatedVenue = await updateVenue(venueData, {
          cover_image_file: coverImageFile,
          gallery_image_files: galleryImageFiles.length > 0 ? galleryImageFiles : undefined,
        });
        // Update state with response URLs
        if (updatedVenue.cover_image) {
          setCoverImageUri(updatedVenue.cover_image);
        }
        if (updatedVenue.gallery_images_json && Array.isArray(updatedVenue.gallery_images_json)) {
          setGalleryImageUris(updatedVenue.gallery_images_json);
        }
        setVenue(updatedVenue);
        // Clear file objects (already uploaded)
        setCoverImageFile(null);
        setGalleryImageFiles([]);
        setUploadingImages(false);
      } else {
        // Just update text fields without files
        const updatedVenue = await updateVenue(venueData);
        setVenue(updatedVenue);
      }

      Alert.alert('Success', 'Venue details updated successfully!');
      setEditComplexModalVisible(false);
      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error('Venue update error:', err);
      const errorMsg = err?.response?.data?.detail 
        || (typeof err?.response?.data === 'object' ? JSON.stringify(err?.response?.data) : 'Failed to update venue');
      Alert.alert('Error', errorMsg);
      setUploadingImages(false);
    } finally {
      setSaving(false);
    }
  };

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
  const [bannerNotifications, setBannerNotifications] = useState(true);

  // Team Member Section State
  const [staffSearch, setStaffSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [shiftFilter, setShiftFilter] = useState('All Shifts');
  const [currentPage, setCurrentPage] = useState(1);

  const roleOptions = ['All Roles', 'Reception', 'Game Supervisor', 'Maintenance', 'Manager'];
  const shiftOptions = ['All Shifts', 'Morning (8AM-4PM)', 'Evening (4PM-12AM)', 'Night (12AM-8AM)', 'Flexible', 'Full-time'];
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [showShiftOptions, setShowShiftOptions] = useState(false);

  const [staffData, setStaffData] = useState<StaffMemberType[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  // Filter staff based on search and filters
  const filteredStaffData = staffData.filter((staff) => {
    const matchesSearch = staff.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
                         staff.phone.toLowerCase().includes(staffSearch.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || staff.role === roleFilter;
    const matchesShift = shiftFilter === 'All Shifts' || 
      (shiftFilter === 'Morning (8AM-4PM)' && staff.shift === 'Morning') ||
      (shiftFilter === 'Evening (4PM-12AM)' && staff.shift === 'Evening') ||
      (shiftFilter === 'Night (12AM-8AM)' && staff.shift === 'Night') ||
      (shiftFilter === 'Flexible' && staff.shift === 'Flexible') ||
      (shiftFilter === 'Full-time' && staff.shift === 'Full-time');
    
    return matchesSearch && matchesRole && matchesShift;
  });

  // Add Staff modal & fields
  const [addStaffModalVisible, setAddStaffModalVisible] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffShift, setNewStaffShift] = useState('Morning');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffPhotoUri, setNewStaffPhotoUri] = useState<string | null>(null);
  const [newStaffPhotoFile, setNewStaffPhotoFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [showNewStaffRoleOptions, setShowNewStaffRoleOptions] = useState(false);
  const [showNewStaffShiftOptions, setShowNewStaffShiftOptions] = useState(false);
  const addStaffScrollRef = useRef<ScrollView | null>(null);
  const editModalScrollRef = useRef<ScrollView | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Staff detail modal
  const [staffDetailModalVisible, setStaffDetailModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMemberType | null>(null);
  
  // Edit staff mode
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editedStaffName, setEditedStaffName] = useState('');
  const [editedStaffRole, setEditedStaffRole] = useState('');
  const [editedStaffShift, setEditedStaffShift] = useState('');
  const [editedStaffPhone, setEditedStaffPhone] = useState('');
  const [editedStaffStatus, setEditedStaffStatus] = useState('');
  const [editedStaffStatusDetail, setEditedStaffStatusDetail] = useState('');
  const [editedStaffPhotoUri, setEditedStaffPhotoUri] = useState<string | null>(null);
  const [editedStaffPhotoFile, setEditedStaffPhotoFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [showEditStaffRoleOptions, setShowEditStaffRoleOptions] = useState(false);
  const [showEditStaffShiftOptions, setShowEditStaffShiftOptions] = useState(false);
  const [showEditStaffStatusOptions, setShowEditStaffStatusOptions] = useState(false);

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
    { day: 'Monday', time: '6 AM - 9 PM' },
    { day: 'Tuesday', time: '6 AM - 9 PM' },
    { day: 'Wednesday', time: '6 AM - 9 PM' },
    { day: 'Thursday', time: '6 AM - 11 PM' },
    { day: 'Friday', time: '6 AM - 10 PM' },
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

  // Cover Image & Gallery Images State
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [galleryImageUris, setGalleryImageUris] = useState<string[]>([]);
  const [galleryImageFiles, setGalleryImageFiles] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [galleryViewerVisible, setGalleryViewerVisible] = useState(false);
  const [galleryViewerIndex, setGalleryViewerIndex] = useState(0);

  // Staff photo viewer
  const [staffPhotoViewerVisible, setStaffPhotoViewerVisible] = useState(false);
  const [staffPhotoViewerUri, setStaffPhotoViewerUri] = useState<string | null>(null);

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

  const saveOpeningHours = async () => {
    try {
      setSaving(true);
      
      // Convert display format to backend format
      const convertTime12To24 = (time12: string): string => {
        if (!time12) return '00:00';
        const match = time12.trim().match(/(\d{1,2})\s*(AM|PM)/i);
        if (!match) return '00:00';
        let hours = parseInt(match[1], 10);
        const period = match[2].toUpperCase();
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return `${hours.toString().padStart(2, '0')}:00`;
      };

      // Build backend opening_hours JSON
      const backendHours: Record<string, any> = {};
      const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      editableHours.forEach((hour, idx) => {
        const dayName = dayNames[idx];
        if (hour.closed) {
          backendHours[dayName] = { open: '', close: '', closed: true };
        } else {
          backendHours[dayName] = {
            open: convertTime12To24(hour.open),
            close: convertTime12To24(hour.close),
            closed: false,
          };
        }
      });

      console.log('[Settings] Saving opening_hours to backend:', JSON.stringify(backendHours, null, 2));
      console.log('[Settings] dayNames mapping:', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, i) => `${i}: ${day}`));
      console.log('[Settings] editableHours mapping:', editableHours.map((h, i) => `${i}: ${h.day} - ${h.closed ? 'CLOSED' : h.open + ' to ' + h.close}`));

      // Save to backend
      const response = await updateVenue({ opening_hours: backendHours });
      console.log('[Settings] Backend response opening_hours:', JSON.stringify(response?.opening_hours, null, 2));
      console.log('[Settings] Saturday saved as:', JSON.stringify(backendHours['saturday'], null, 2));
      console.log('[Settings] Monday saved as:', JSON.stringify(backendHours['monday'], null, 2));
      
      // Update display format for UI
      const newHours = editableHours.map((e) => ({ day: e.day, time: e.closed ? 'Closed' : `${e.open} - ${e.close}` }));
      setOpeningHours(newHours);
      
      Alert.alert('Success', 'Opening hours updated successfully!');
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update opening hours');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => setEditModalVisible(false);

  // Inline time picker state
  const [expandedTimeField, setExpandedTimeField] = useState<string | null>(null); // "dayIdx-field" format
  const [pickerHour, setPickerHour] = useState(6);
  const [pickerAmPm, setPickerAmPm] = useState<'AM' | 'PM'>('AM');

  const formatTime = (h: number, ap: 'AM' | 'PM') => {
    return `${h} ${ap}`;
  };

  const parseTimeString = (s: string) => {
    if (!s) return { h: 6, ap: 'AM' as 'AM' | 'PM' };
    const m = String(s).trim().match(/(\d{1,2})\s*(AM|PM)/i);
    if (!m) return { h: 6, ap: 'AM' as 'AM' | 'PM' };
    const h = parseInt(m[1], 10);
    const ap = (m[2].toUpperCase() === 'PM' ? 'PM' : 'AM') as 'AM' | 'PM';
    return { h, ap };
  };

  const toggleTimePicker = (dayIdx: number, field: 'open' | 'close') => {
    const key = `${dayIdx}-${field}`;
    if (expandedTimeField === key) {
      setExpandedTimeField(null);
    } else {
      const current = editableHours[dayIdx]?.[field] ?? '';
      const parsed = parseTimeString(current);
      setPickerHour(parsed.h);
      setPickerAmPm(parsed.ap);
      setExpandedTimeField(key);
    }
  };

  const saveTimeSelection = () => {
    if (!expandedTimeField) return;
    const [dayIdxStr, field] = expandedTimeField.split('-');
    const dayIdx = parseInt(dayIdxStr, 10);
    const formatted = formatTime(pickerHour, pickerAmPm);
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
                {coverImageUri ? (
                  <Image source={{ uri: coverImageUri }} style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: '#E5E7EB' }} resizeMode="cover" />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="business" size={28} color="#9CA3AF" />
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.complexName}>{complexName || 'Your Complex'}</Text>
                  <View style={styles.tagRow}>
                    <View style={styles.indoorTag}>
                      <Text style={styles.indoorTagText}>{complexType || 'Indoor'}</Text>
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color="#6B7280" />
                      <Text style={styles.locationText}>{location || county || 'Not set'}</Text>
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
                  <Text style={styles.value}>{email || '-'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Website</Text>
                  <Text style={styles.value}>{website || '-'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Contact Number</Text>
                  <Text style={styles.value}>{contactNumber || '-'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Status</Text>
                  <View style={[styles.statusBadge, complexStatus !== 'Active' && { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.statusText, complexStatus !== 'Active' && { color: '#DC2626' }]}>{complexStatus || 'Active'}</Text>
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
                  <Text style={styles.label}>Country</Text>
                  <Text style={styles.value}>{county || '-'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>City / Location</Text>
                  <Text style={styles.value} numberOfLines={1}>{location || '-'}</Text>
                </View>
                <View style={styles.gridItemFull}>
                  <Text style={styles.label}>Full Address</Text>
                  <Text style={styles.value}>{fullAddress || '-'}</Text>
                </View>
                <View style={styles.gridItemFull}>
                  <Text style={styles.label}>Postal Code</Text>
                  <Text style={styles.value}>{postalCode || '-'}</Text>
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
              {/* Cover Image Section */}
              <View style={styles.cardBody}>
                <Text style={styles.label}>Cover Image</Text>
                {coverImageUri ? (
                  <TouchableOpacity onPress={() => { setGalleryViewerIndex(-1); setGalleryViewerVisible(true); }}>
                    <Image source={{ uri: coverImageUri }} style={{ width: '100%', height: 160, borderRadius: 8, marginTop: 8 }} resizeMode="cover" />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.valueGray}>No cover image uploaded</Text>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Video Tour URL</Text>
                {videoTourUrl ? (
                  <TouchableOpacity onPress={() => Linking.openURL(videoTourUrl)}>
                    <Text style={{ color: '#2563EB', fontSize: 13, marginTop: 4 }}>{videoTourUrl}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.valueGray}>Not available</Text>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Gallery Images</Text>
                {galleryImageUris.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {galleryImageUris.map((uri, idx) => (
                      <TouchableOpacity key={idx} onPress={() => { setGalleryViewerIndex(idx); setGalleryViewerVisible(true); }}>
                        <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.valueGray}>No gallery images available</Text>
                )}
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
                <Text style={styles.valueGray}>{description || '-'}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.label}>Terms & Conditions</Text>
                <Text style={styles.valueGray}>{termsConditions || '-'}</Text>
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
                  <Text style={styles.label}>Top Banner Alert</Text>
                  <Text style={styles.securitySubtext}>Show notification banner at top of screen</Text>
                </View>
                <Switch value={bannerNotifications} onValueChange={handleBannerNotificationToggle} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
              </View>

              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />

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
              {staffLoading ? (
                <View style={{ padding: 40, alignItems: 'center', width: '100%' }}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={{ color: '#6B7280', marginTop: 8 }}>Loading staff...</Text>
                </View>
              ) : filteredStaffData.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center', width: '100%' }}>
                  <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                  <Text style={{ color: '#6B7280', marginTop: 8, fontSize: 15 }}>
                    {staffSearch || roleFilter !== 'All Roles' || shiftFilter !== 'All Shifts' 
                      ? 'No staff matches your search' 
                      : 'No staff members yet'}
                  </Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                    {staffSearch || roleFilter !== 'All Roles' || shiftFilter !== 'All Shifts'
                      ? 'Try adjusting your filters'
                      : 'Tap "Add Staff" to get started'}
                  </Text>
                </View>
              ) : (
              filteredStaffData.slice((currentPage - 1) * 6, currentPage * 6).map((staff) => (
                <TouchableOpacity key={staff.id} style={styles.staffCardItem} onPress={() => {
                  setSelectedStaff(staff);
                  setStaffDetailModalVisible(true);
                }}>
                  <View style={styles.staffCardImageContainer}>
                    <TouchableOpacity 
                      onPress={() => {
                        if (staff.photo) {
                          setStaffPhotoViewerUri(staff.photo);
                          setStaffPhotoViewerVisible(true);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      {staff.photo ? (
                        <Image source={{ uri: staff.photo }} style={styles.staffImage} />
                      ) : (
                        <View style={[styles.staffImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }]}>
                          <Ionicons name="person" size={32} color="#D1D5DB" />
                        </View>
                      )}
                    </TouchableOpacity>
                    {staff.is_online ? (
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
                    <TouchableOpacity 
                      style={styles.actionIconBtn}
                      onPress={() => {
                        setSelectedStaff(staff);
                        setStaffDetailModalVisible(true);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionIconBtn}
                      onPress={() => {
                        if (!staff.phone) {
                          Alert.alert('Error', 'No phone number available for this staff member.');
                          return;
                        }
                        Linking.openURL(`tel:${staff.phone}`).catch(() => {
                          Alert.alert('Error', 'Unable to make call. Please try again.');
                        });
                      }}
                    >
                      <Ionicons name="call-outline" size={16} color="#06B6D4" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconBtn} onPress={() => {
                      Alert.alert(
                        'Delete Staff',
                        `Are you sure you want to remove ${staff.name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: async () => {
                            try {
                              await deleteStaffMember(staff.id);
                              fetchStaff();
                            } catch (err) {
                              Alert.alert('Error', 'Failed to delete staff member.');
                            }
                          }},
                        ]
                      );
                    }}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.statusLine}>
                    <Text style={styles.statusLineText}>Currently: {staff.status}</Text>
                    {staff.status_detail ? <Text style={styles.statusDetailText}>({staff.status_detail})</Text> : null}
                  </View>
                </TouchableOpacity>
              ))
              )}
            </View>

            <View style={styles.paginationSection}>
              <TouchableOpacity style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Previous</Text>
              </TouchableOpacity>
              <View style={styles.pageNumbers}>
                {Array.from({ length: Math.ceil(filteredStaffData.length / 6) }, (_, i) => i + 1).map((page) => (
                  <TouchableOpacity key={page} style={[styles.pageNum, page === currentPage && styles.pageNumActive]} onPress={() => setCurrentPage(page)}>
                    <Text style={[styles.pageNumText, page === currentPage && styles.pageNumTextActive]}>{page}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.pageBtn, currentPage === Math.ceil(filteredStaffData.length / 6) && styles.pageBtnDisabled]} onPress={() => currentPage < Math.ceil(filteredStaffData.length / 6) && setCurrentPage(currentPage + 1)} disabled={currentPage === Math.ceil(filteredStaffData.length / 6)}>
                <Text style={[styles.pageBtnText, currentPage === Math.ceil(filteredStaffData.length / 6) && styles.pageBtnTextDisabled]}>Next</Text>
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

              <TouchableOpacity style={[styles.updateButton, saving && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={saving}>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.updateButtonText}>{saving ? 'Updating...' : 'Update Password'}</Text>
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
                      <Text style={styles.inlinePickerLabel}>Select Hour</Text>

                      {/* AM/PM Toggle */}
                      <View style={styles.ampmToggleRow}>
                        {(['AM', 'PM'] as const).map((ap) => (
                          <TouchableOpacity
                            key={ap}
                            style={[styles.ampmToggleBtn, pickerAmPm === ap && styles.ampmToggleBtnActive]}
                            onPress={() => setPickerAmPm(ap)}
                          >
                            <Text style={[styles.ampmToggleBtnText, pickerAmPm === ap && styles.ampmToggleBtnTextActive]}>{ap}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Hour Grid (4 columns x 3 rows) */}
                      <View style={styles.hourGrid}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <TouchableOpacity
                            key={h}
                            style={[styles.hourGridBtn, pickerHour === h && styles.hourGridBtnActive]}
                            onPress={() => {
                              setPickerHour(h);
                            }}
                          >
                            <Text style={[styles.hourGridBtnText, pickerHour === h && styles.hourGridBtnTextActive]}>
                              {h} {pickerAmPm}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 8 }}>
                        <TouchableOpacity style={styles.inlinePickerCancelBtn} onPress={() => setExpandedTimeField(null)}>
                          <Text style={styles.inlinePickerCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.inlinePickerSaveBtn} onPress={saveTimeSelection}>
                          <Text style={styles.inlinePickerSaveText}>Set</Text>
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
                  <Text style={styles.fieldLabel}>Photo (Optional)</Text>
                  <TouchableOpacity style={styles.photoPickerBtn} onPress={pickStaffPhoto}>
                    {newStaffPhotoUri ? (
                      <>
                        <Image source={{ uri: newStaffPhotoUri }} style={{ width: '100%', height: 180, borderRadius: 8 }} />
                        <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: '#fff', borderRadius: 20, padding: 6 }}>
                          <Ionicons name="pencil" size={16} color="#2563EB" />
                        </View>
                      </>
                    ) : (
                      <View style={styles.photoPickerPlaceholder}>
                        <Ionicons name="camera" size={32} color="#9CA3AF" />
                        <Text style={styles.photoPickerText}>Tap to add photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>

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

                  <Text style={styles.fieldLabel}>Phone Number * (10 digits)</Text>
                  <TextInput style={styles.input} placeholder="Enter 10-digit phone number" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={newStaffPhone} onChangeText={(text) => { const d = text.replace(/\D/g, ''); setNewStaffPhone(d.slice(0, 10)); }} keyboardType="phone-pad" maxLength={10} onFocus={() => {
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
                    <TouchableOpacity style={styles.bookBtn} onPress={async () => {
                      if (!newStaffName.trim()) { Alert.alert('Error', 'Name is required.'); return; }
                      if (!newStaffRole) { Alert.alert('Error', 'Role is required.'); return; }
                      if (!newStaffPhone.trim()) { Alert.alert('Error', 'Phone number is required.'); return; }
                      if (newStaffPhone.replace(/\D/g, '').length !== 10) { Alert.alert('Error', 'Phone number must be exactly 10 digits.'); return; }
                      try {
                        setSaving(true);
                        // Map display shift to backend value (strip time info)
                        const shiftValue = newStaffShift.split(' (')[0] || 'Morning';
                        await createStaffMember({
                          name: newStaffName.trim(),
                          role: newStaffRole,
                          shift: shiftValue,
                          phone: newStaffPhone.trim(),
                          photo: newStaffPhotoFile || undefined,
                          status: 'On Duty',
                          is_online: true,
                        });
                        setAddStaffModalVisible(false);
                        setNewStaffName(''); setNewStaffRole(''); setNewStaffShift('Morning'); setNewStaffPhone('');
                        setNewStaffPhotoUri(null); setNewStaffPhotoFile(null);
                        fetchStaff(); // Refresh from backend
                        Alert.alert('Success', 'Staff member added successfully.');
                      } catch (err: any) {
                        console.error('Failed to create staff:', err);
                        const msg = err?.response?.data?.detail || err?.response?.data?.name?.[0] || 'Failed to add staff member.';
                        Alert.alert('Error', msg);
                      } finally {
                        setSaving(false);
                      }
                    }}><Text style={styles.bookText}>{saving ? 'Saving...' : 'Save Staff'}</Text></TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>



      {/* Edit Complex Details Modal - Full screen with KeyboardAvoidingView */}
      <Modal visible={editComplexModalVisible} animationType="slide" transparent={false} presentationStyle="fullScreen" onRequestClose={() => setEditComplexModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1, backgroundColor: '#F8FAFC' }} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[styles.editComplexHeader, { backgroundColor: '#16A34A' }]}>
              <Text style={styles.editComplexTitle}>Edit Complex Details</Text>
              <Pressable onPress={() => setEditComplexModalVisible(false)} style={styles.editComplexCloseBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
            <ScrollView 
              ref={editModalScrollRef} 
              contentContainerStyle={[styles.editComplexContent, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 40 }]} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
            {/* Basic Information */}
            <Text style={styles.editComplexSectionTitle}>Basic Information</Text>
            <View style={styles.editComplexGrid}>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Complex Name</Text>
                <TextInput 
                  style={styles.editComplexInput} 
                  value={complexName} 
                  onChangeText={setComplexName} 
                  placeholder="Complex Name" 
                  placeholderTextColor="#9CA3AF" 
                  onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 50, animated: true }), 150); }}
                />
              </View>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Complex Type</Text>
                <TextInput 
                  style={styles.editComplexInput} 
                  value={complexType} 
                  onChangeText={setComplexType} 
                  placeholder="Indoor" 
                  placeholderTextColor="#9CA3AF" 
                  onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 50, animated: true }), 150); }}
                />
              </View>
            </View>
            <View style={styles.editComplexGrid}>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Status</Text>
                <TextInput 
                  style={styles.editComplexInput} 
                  value={complexStatus} 
                  onChangeText={setComplexStatus} 
                  placeholder="Active" 
                  placeholderTextColor="#9CA3AF" 
                  onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 100, animated: true }), 150); }}
                />
              </View>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Cover Image</Text>
                <TouchableOpacity style={styles.editComplexFileBtn} onPress={pickCoverImage}>
                  <Text style={styles.editComplexFileBtnText}>Choose File</Text>
                  <Text style={styles.editComplexFileName}>{coverImageFile ? coverImageFile.name : (coverImageUri ? 'Current image loaded' : 'No file chosen')}</Text>
                </TouchableOpacity>
                {coverImageUri && (
                  <View style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden' }}>
                    <Image source={{ uri: coverImageUri }} style={{ width: '100%', height: 100, borderRadius: 8 }} resizeMode="cover" />
                    <TouchableOpacity 
                      onPress={() => { setCoverImageUri(null); setCoverImageFile(null); }}
                      style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 }}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Contact Information */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Contact Information</Text>
            <View style={styles.editComplexGrid}>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Email Address</Text>
                <TextInput 
                  style={styles.editComplexInput} 
                  value={email} 
                  onChangeText={setEmail} 
                  placeholder="Email" 
                  placeholderTextColor="#9CA3AF" 
                  keyboardType="email-address" 
                  onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 250, animated: true }), 150); }}
                />
              </View>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Contact Number</Text>
                <TextInput 
                  style={styles.editComplexInput} 
                  value={contactNumber} 
                  onChangeText={(text) => { const d = text.replace(/\D/g, ''); setContactNumber(d.slice(0, 10)); }} 
                  placeholder="Enter 10-digit phone number" 
                  placeholderTextColor="#9CA3AF" 
                  keyboardType="phone-pad" 
                  maxLength={10} 
                  onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 250, animated: true }), 150); }}
                />
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Website</Text>
              <TextInput 
                style={styles.editComplexInput} 
                value={website} 
                onChangeText={setWebsite} 
                placeholder="Website" 
                placeholderTextColor="#9CA3AF" 
                onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 320, animated: true }), 150); }}
              />
            </View>

            {/* Address */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Address</Text>
            <View style={styles.editComplexGrid}>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>County</Text>
                <TextInput 
                  style={styles.editComplexInput} 
                  value={county} 
                  onChangeText={setCounty} 
                  placeholder="County" 
                  placeholderTextColor="#9CA3AF" 
                  onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 400, animated: true }), 150); }}
                />
              </View>
              <View style={styles.editComplexCol}>
                <Text style={styles.editComplexLabel}>Location</Text>
                <TextInput 
                  style={styles.editComplexInput} 
                  value={location} 
                  onChangeText={setLocation} 
                  placeholder="Location" 
                  placeholderTextColor="#9CA3AF" 
                  onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 400, animated: true }), 150); }}
                />
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Full Address</Text>
              <TextInput 
                style={[styles.editComplexInput, { minHeight: 80, textAlignVertical: 'top' }]} 
                value={fullAddress} 
                onChangeText={setFullAddress} 
                placeholder="Full Address" 
                placeholderTextColor="#9CA3AF" 
                multiline 
                onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 480, animated: true }), 150); }}
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Postal Code</Text>
              <TextInput 
                style={styles.editComplexInput} 
                value={postalCode} 
                onChangeText={setPostalCode} 
                placeholder="Postal Code" 
                placeholderTextColor="#9CA3AF" 
                onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 580, animated: true }), 150); }}
              />
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
                  onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 650, animated: true }), 150); }}
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
              <TextInput 
                style={styles.editComplexInput} 
                value={videoTourUrl} 
                onChangeText={setVideoTourUrl} 
                placeholder="Video Tour URL" 
                placeholderTextColor="#9CA3AF" 
                onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 750, animated: true }), 150); }}
              />
            </View>
            <View style={styles.editComplexGalleryBox}>
              <Text style={styles.editComplexLabel}>Gallery Images (Select up to 4 at a time)</Text>
              <TouchableOpacity style={styles.editComplexFileBtn} onPress={pickGalleryImages}>
                <Text style={styles.editComplexFileBtnText}>Choose Files</Text>
                <Text style={styles.editComplexFileName}>{galleryImageFiles.length > 0 ? `${galleryImageFiles.length} new file(s) selected` : (galleryImageUris.length > 0 ? `${galleryImageUris.length} image(s)` : 'No file chosen')}</Text>
              </TouchableOpacity>
              {galleryImageUris.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {galleryImageUris.map((uri, idx) => (
                    <View key={idx} style={{ position: 'relative', width: 72, height: 72 }}>
                      <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8 }} resizeMode="cover" />
                      <TouchableOpacity 
                        onPress={() => removeGalleryImage(idx)}
                        style={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2 }}
                      >
                        <Ionicons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Additional Details */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Additional Details</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Description</Text>
              <TextInput 
                style={[styles.editComplexInput, { minHeight: 100, textAlignVertical: 'top' }]} 
                value={description} 
                onChangeText={setDescription} 
                placeholder="Description" 
                placeholderTextColor="#9CA3AF" 
                multiline 
                onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 950, animated: true }), 150); }}
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editComplexLabel}>Terms & Conditions</Text>
              <TextInput 
                style={[styles.editComplexInput, { minHeight: 100, textAlignVertical: 'top' }]} 
                value={termsConditions} 
                onChangeText={setTermsConditions} 
                placeholder="Terms & Conditions" 
                placeholderTextColor="#9CA3AF" 
                multiline 
                onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollTo({ y: 1100, animated: true }), 150); }}
              />
            </View>

            {/* Social Links */}
            <Text style={[styles.editComplexSectionTitle, { marginTop: 20 }]}>Social Links</Text>
            <View style={styles.editComplexSocialRow}>
              <TextInput 
                style={styles.editComplexSocialSelect} 
                placeholder="Select Platform" 
                placeholderTextColor="#9CA3AF" 
                onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollToEnd({ animated: true }), 150); }}
              />
              <TextInput 
                style={styles.editComplexSocialInput} 
                placeholder="https://..." 
                placeholderTextColor="#9CA3AF" 
                onFocus={(e) => { setTimeout(() => editModalScrollRef.current?.scrollToEnd({ animated: true }), 150); }}
              />
              <TouchableOpacity style={styles.editComplexAddSocialBtn}>
                <Text style={styles.editComplexAddSocialText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.editComplexActionsRow}>
              <TouchableOpacity style={styles.editComplexCancelBtn} onPress={() => setEditComplexModalVisible(false)}>
                <Text style={styles.editComplexCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editComplexSaveBtn} onPress={handleSaveVenue} disabled={saving || uploadingImages}>
                {(saving || uploadingImages) ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.editComplexSaveText}>{uploadingImages ? 'Uploading...' : 'Saving...'}</Text>
                  </View>
                ) : (
                  <Text style={styles.editComplexSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Staff Detail Modal */}
      <Modal visible={staffDetailModalVisible} animationType="fade" transparent presentationStyle="overFullScreen" onRequestClose={() => {
        if (isEditingStaff) {
          setIsEditingStaff(false);
        } else {
          setStaffDetailModalVisible(false);
        }
      }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '85%', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{isEditingStaff ? 'Edit Staff' : 'Staff Details'}</Text>
              <TouchableOpacity onPress={() => {
                if (isEditingStaff) {
                  setIsEditingStaff(false);
                } else {
                  setStaffDetailModalVisible(false);
                }
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 16 }}>
              {selectedStaff && (
                <>
                  {isEditingStaff ? (
                    // EDIT MODE
                    <>
                      {/* Photo */}
                      <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity onPress={pickEditStaffPhoto} style={{ position: 'relative' }}>
                          {editedStaffPhotoUri ? (
                            <Image source={{ uri: editedStaffPhotoUri }} style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB' }} />
                          ) : (
                            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                              <Ionicons name="person" size={44} color="#D1D5DB" />
                            </View>
                          )}
                          <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6', borderRadius: 20, padding: 6 }}>
                            <Ionicons name="camera" size={14} color="#fff" />
                          </View>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>Tap to change photo</Text>
                      </View>

                      {/* Name Input */}
                      <View style={{ marginBottom: 14 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6 }}>Name *</Text>
                        <TextInput style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 13, color: '#111827' }} value={editedStaffName} onChangeText={setEditedStaffName} placeholder="Staff name" placeholderTextColor="#9CA3AF" />
                      </View>

                      {/* Role Dropdown */}
                      <View style={{ marginBottom: 14 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6 }}>Role *</Text>
                        <TouchableOpacity style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setShowEditStaffRoleOptions(!showEditStaffRoleOptions)}>
                          <Text style={{ fontSize: 13, color: editedStaffRole ? '#111827' : '#9CA3AF' }}>{editedStaffRole || 'Select role'}</Text>
                          <Ionicons name={showEditStaffRoleOptions ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                        </TouchableOpacity>
                        {showEditStaffRoleOptions && (
                          <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#fff' }}>
                            {['Reception', 'Game Supervisor', 'Maintenance', 'Manager'].map((role) => (
                              <TouchableOpacity key={role} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }} onPress={() => {
                                setEditedStaffRole(role);
                                setShowEditStaffRoleOptions(false);
                              }}>
                                <Text style={{ fontSize: 13, color: '#111827' }}>{role}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Shift Dropdown */}
                      <View style={{ marginBottom: 14 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6 }}>Shift *</Text>
                        <TouchableOpacity style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setShowEditStaffShiftOptions(!showEditStaffShiftOptions)}>
                          <Text style={{ fontSize: 13, color: editedStaffShift ? '#111827' : '#9CA3AF' }}>{editedStaffShift || 'Select shift'}</Text>
                          <Ionicons name={showEditStaffShiftOptions ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                        </TouchableOpacity>
                        {showEditStaffShiftOptions && (
                          <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#fff' }}>
                            {['Morning (8AM-4PM)', 'Evening (4PM-12AM)', 'Night (12AM-8AM)', 'Flexible', 'Full-time'].map((shift) => (
                              <TouchableOpacity key={shift} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }} onPress={() => {
                                setEditedStaffShift(shift);
                                setShowEditStaffShiftOptions(false);
                              }}>
                                <Text style={{ fontSize: 13, color: '#111827' }}>{shift}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Phone Input */}
                      <View style={{ marginBottom: 14 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6 }}>Phone</Text>
                        <TextInput style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 13, color: '#111827' }} value={editedStaffPhone} onChangeText={(text) => { const d = text.replace(/\D/g, ''); setEditedStaffPhone(d.slice(0, 10)); }} placeholder="Enter 10-digit phone number" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={10} />
                      </View>

                      {/* Status Dropdown */}
                      <View style={{ marginBottom: 14 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6 }}>Status</Text>
                        <TouchableOpacity style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setShowEditStaffStatusOptions(!showEditStaffStatusOptions)}>
                          <Text style={{ fontSize: 13, color: editedStaffStatus ? '#111827' : '#9CA3AF' }}>{editedStaffStatus || 'Select status'}</Text>
                          <Ionicons name={showEditStaffStatusOptions ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                        </TouchableOpacity>
                        {showEditStaffStatusOptions && (
                          <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#fff' }}>
                            {['On Duty', 'Off Duty', 'In Meeting', 'On Leave'].map((status) => (
                              <TouchableOpacity key={status} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }} onPress={() => {
                                setEditedStaffStatus(status);
                                setShowEditStaffStatusOptions(false);
                              }}>
                                <Text style={{ fontSize: 13, color: '#111827' }}>{status}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Status Detail Input */}
                      <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6 }}>Status Detail</Text>
                        <TextInput style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 13, color: '#111827', minHeight: 60 }} value={editedStaffStatusDetail} onChangeText={setEditedStaffStatusDetail} placeholder="E.g., In meeting with admin" placeholderTextColor="#9CA3AF" multiline />
                      </View>

                      {/* Action Buttons - Edit Mode */}
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: '#E5E7EB', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => setIsEditingStaff(false)} disabled={saving}>
                          <Text style={{ color: '#374151', fontWeight: '700', fontSize: 13 }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: saving ? '#9CA3AF' : '#15803D', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={saveEditedStaff} disabled={saving}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{saving ? 'Saving...' : 'Save'}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    // VIEW MODE
                    <>
                      {/* Photo */}
                      <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity 
                          onPress={() => {
                            if (selectedStaff.photo) {
                              setStaffPhotoViewerUri(selectedStaff.photo);
                              setStaffPhotoViewerVisible(true);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          {selectedStaff.photo ? (
                            <Image source={{ uri: selectedStaff.photo }} style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB' }} />
                          ) : (
                            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                              <Ionicons name="person" size={44} color="#D1D5DB" />
                            </View>
                          )}
                        </TouchableOpacity>
                        <Text style={{ fontSize: 16, fontWeight: '700', marginTop: 12, color: '#111827' }}>{selectedStaff.name}</Text>
                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>{selectedStaff.role}</Text>
                      </View>

                      {/* Status Row */}
                      <View style={{ flexDirection: 'row', marginBottom: 14, gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: selectedStaff.is_online ? '#D1FAE5' : '#FEE2E2', borderRadius: 8, padding: 12 }}>
                          <Text style={{ fontSize: 11, color: selectedStaff.is_online ? '#065F46' : '#7F1D1D', fontWeight: '600' }}>Status</Text>
                          <Text style={{ fontSize: 12, color: selectedStaff.is_online ? '#047857' : '#DC2626', fontWeight: '700', marginTop: 4 }}>
                            {selectedStaff.is_online ? 'Online' : 'Offline'}
                          </Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 12 }}>
                          <Text style={{ fontSize: 11, color: '#1E40AF', fontWeight: '600' }}>Shift</Text>
                          <Text style={{ fontSize: 12, color: '#1D4ED8', fontWeight: '700', marginTop: 4 }}>{selectedStaff.shift}</Text>
                        </View>
                      </View>

                      {/* Details Grid */}
                      <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                        <View style={{ marginBottom: 10 }}>
                          <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Phone</Text>
                          <TouchableOpacity onPress={() => selectedStaff?.phone && Linking.openURL(`tel:${selectedStaff.phone}`)}>
                            <Text style={{ fontSize: 13, color: '#3B82F6', marginTop: 4, fontWeight: '500', textDecorationLine: 'underline' }}>{selectedStaff.phone}</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ marginBottom: 10 }}>
                          <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Current Status</Text>
                          <Text style={{ fontSize: 13, color: '#111827', marginTop: 4, fontWeight: '500' }}>{selectedStaff.status}</Text>
                        </View>
                        {selectedStaff.status_detail && (
                          <View>
                            <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Status Detail</Text>
                            <Text style={{ fontSize: 13, color: '#111827', marginTop: 4, fontWeight: '500' }}>{selectedStaff.status_detail}</Text>
                          </View>
                        )}
                      </View>

                      {/* Timestamps */}
                      <View style={{ backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                        <View style={{ marginBottom: 6 }}>
                          <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>Added: {new Date(selectedStaff.created_at).toLocaleDateString()}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>Updated: {new Date(selectedStaff.updated_at).toLocaleDateString()}</Text>
                      </View>

                      {/* Action Buttons - View Mode */}
                      <View style={{ flexDirection: 'column', gap: 10 }}>
                        <TouchableOpacity style={{ width: '100%', backgroundColor: '#3B82F6', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => enterEditMode(selectedStaff)}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Edit Staff</Text>
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity style={{ flex: 1, backgroundColor: '#E5E7EB', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => setStaffDetailModalVisible(false)}>
                            <Text style={{ color: '#374151', fontWeight: '700', fontSize: 13 }}>Close</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={{ flex: 1, backgroundColor: '#EF4444', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => {
                            Alert.alert(
                              'Delete Staff',
                              `Are you sure you want to remove ${selectedStaff.name}?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: async () => {
                                  try {
                                    await deleteStaffMember(selectedStaff.id);
                                    setStaffDetailModalVisible(false);
                                    fetchStaff();
                                  } catch (err) {
                                    Alert.alert('Error', 'Failed to delete staff member.');
                                  }
                                }},
                              ]
                            );
                          }}>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Gallery Image Viewer Modal */}
      <Modal visible={galleryViewerVisible} animationType="fade" transparent onRequestClose={() => setGalleryViewerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          {/* Close Button */}
          <TouchableOpacity 
            onPress={() => setGalleryViewerVisible(false)} 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          {/* Image Display */}
          {galleryViewerIndex === -1 && coverImageUri ? (
            <Image source={{ uri: coverImageUri }} style={{ width: '90%', height: '70%', borderRadius: 12 }} resizeMode="contain" />
          ) : galleryImageUris[galleryViewerIndex] ? (
            <Image source={{ uri: galleryImageUris[galleryViewerIndex] }} style={{ width: '90%', height: '70%', borderRadius: 12 }} resizeMode="contain" />
          ) : null}

          {/* Navigation for gallery images */}
          {galleryViewerIndex >= 0 && galleryImageUris.length > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 20 }}>
              <TouchableOpacity 
                onPress={() => setGalleryViewerIndex((prev) => Math.max(0, prev - 1))}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, padding: 10 }}
                disabled={galleryViewerIndex === 0}
              >
                <Ionicons name="chevron-back" size={24} color={galleryViewerIndex === 0 ? '#666' : '#fff'} />
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{galleryViewerIndex + 1} / {galleryImageUris.length}</Text>
              <TouchableOpacity 
                onPress={() => setGalleryViewerIndex((prev) => Math.min(galleryImageUris.length - 1, prev + 1))}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, padding: 10 }}
                disabled={galleryViewerIndex === galleryImageUris.length - 1}
              >
                <Ionicons name="chevron-forward" size={24} color={galleryViewerIndex === galleryImageUris.length - 1 ? '#666' : '#fff'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Staff Photo Viewer Modal */}
      <Modal visible={staffPhotoViewerVisible} animationType="fade" transparent onRequestClose={() => setStaffPhotoViewerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          {/* Close Button */}
          <TouchableOpacity 
            onPress={() => setStaffPhotoViewerVisible(false)} 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          {/* Image Display */}
          {staffPhotoViewerUri && (
            <Image source={{ uri: staffPhotoViewerUri }} style={{ width: '90%', height: '70%', borderRadius: 12 }} resizeMode="contain" />
          )}
        </View>
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
  inlinePickerContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  inlinePickerLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  ampmToggleRow: { flexDirection: 'row', gap: 0, marginBottom: 14, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#D1D5DB' },
  ampmToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  ampmToggleBtnActive: { backgroundColor: '#15803D' },
  ampmToggleBtnText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  ampmToggleBtnTextActive: { color: '#fff' },
  hourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourGridBtn: { width: '23%' as any, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  hourGridBtnActive: { backgroundColor: '#DCFCE7', borderColor: '#15803D', borderWidth: 2 },
  hourGridBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  hourGridBtnTextActive: { color: '#15803D', fontWeight: '700' },
  inlinePickerCancelBtn: { borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fff' },
  inlinePickerCancelText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  inlinePickerSaveBtn: { backgroundColor: '#15803D', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  inlinePickerSaveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  /* Edit Complex Details Modal Styles */
  editComplexOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 12 },
  editComplexBox: { width: '94%', maxHeight: '88%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  editComplexHeader: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editComplexTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  editComplexCloseBtn: { padding: 8 },
  editComplexContent: { paddingHorizontal: 16, paddingVertical: 20, backgroundColor: '#F8FAFC' },
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
  photoPickerBtn: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  photoPickerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  photoPickerText: {
    color: '#9CA3AF',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
