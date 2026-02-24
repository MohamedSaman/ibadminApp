import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { getSports, createSport, updateSport, deleteSport, toggleSportStatus } from '@/services/indoorAdminApi';
import { Sport, SportCreatePayload } from '@/types/api';

// Default placeholder images for sports
const sportImages: { [key: string]: string } = {
  football: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=60',
  pools: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1200&q=60',
  cricket: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=60',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=60',
  tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=60',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=60',
  default: 'https://images.unsplash.com/photo-1461896836934-d681ea643efc?auto=format&fit=crop&w=1200&q=60',
};

const getSportImage = (sportName: string): string => {
  const name = sportName.toLowerCase();
  for (const key of Object.keys(sportImages)) {
    if (name.includes(key)) return sportImages[key];
  }
  return sportImages.default;
};

// No mapping needed - backend uses the same format: 'Active'/'Inactive' and plain string rate_types

export default function SportsScreen() {
  const router = useRouter();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [gameName, setGameName] = useState('');
  const [gameType, setGameType] = useState('');
  const [gameTypeDropdownVisible, setGameTypeDropdownVisible] = useState(false);
  const [rateType, setRateType] = useState('Per hour');
  const [rateTypeDropdownVisible, setRateTypeDropdownVisible] = useState(false);
  const [price, setPrice] = useState('');
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [maxCourt, setMaxCourt] = useState('');
  const [status, setStatus] = useState('Active');
  const [description, setDescription] = useState('');
  const [advancePayment, setAdvancePayment] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const addSportScrollRef = useRef<ScrollView | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const manageScrollRef = useRef<ScrollView | null>(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [editGameName, setEditGameName] = useState('');
  const [editGameType, setEditGameType] = useState('');
  const [editGameTypeDropdownVisible, setEditGameTypeDropdownVisible] = useState(false);
  const [editRateType, setEditRateType] = useState('Per hour');
  const [editRateTypeDropdownVisible, setEditRateTypeDropdownVisible] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editMaxCourt, setEditMaxCourt] = useState('');
  const [editStatusDropdownVisible, setEditStatusDropdownVisible] = useState(false);
  const [editStatus, setEditStatus] = useState('Active');
  const [editDescription, setEditDescription] = useState('');
  const [editSelectedImage, setEditSelectedImage] = useState<string | null>(null);
  const [editSelectedImageFile, setEditSelectedImageFile] = useState<{ uri: string; name: string; type: string } | null>(null);

  // API data state
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch sports from API
  const fetchSports = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await getSports();
      setSports(data);
    } catch (err: any) {
      console.error('Failed to fetch sports:', err);
      Alert.alert('Error', 'Failed to load sports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSports();
  }, [fetchSports]);

  const onRefresh = useCallback(() => {
    fetchSports(true);
  }, [fetchSports]);

  const openAddModal = () => setAddModalVisible(true);
  const closeAddModal = () => {
    setAddModalVisible(false);
    // Reset form
    setGameName('');
    setGameType('');
    setRateType('Per hour');
    setPrice('');
    setMaxCourt('');
    setStatus('Active');
    setDescription('');
    setAdvancePayment(false);
    setSelectedImage(null);
    setSelectedImageFile(null);
  };

  const pickImage = async (mode: 'add' | 'edit') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library to upload sport images.');
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
      const name = uri.split('/').pop() || 'photo.jpg';
      const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
      const type = ext === 'png' ? 'image/png' : 'image/jpeg';
      if (mode === 'add') {
        setSelectedImage(uri);
        setSelectedImageFile({ uri, name, type });
      } else {
        setEditSelectedImage(uri);
        setEditSelectedImageFile({ uri, name, type });
      }
    }
  };

  const openManageModal = (sport: Sport) => {
    setSelectedSport(sport);
    setEditGameName(sport.name);
    setEditPrice(sport.price?.toString() || '');
    setEditRateType(sport.rate_type || 'Per hour');
    setEditMaxCourt((sport.maximum_court || sport.max_courts || 1).toString());
    setEditStatus(sport.status || 'Active');
    setEditDescription(sport.description || '');
    setEditSelectedImage(null);
    setEditSelectedImageFile(null);
    setManageModalVisible(true);
  };
  
  const closeManageModal = () => {
    setManageModalVisible(false);
    setSelectedSport(null);
  };

  const addSport = async () => {
    if (!gameName.trim() || !price.trim() || !maxCourt.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
    if (!selectedImageFile) {
      Alert.alert('Validation Error', 'Please select an image for the sport.');
      return;
    }

    setSaving(true);
    try {
      const payload: SportCreatePayload = {
        name: gameName.trim(),
        rate_type: rateType,
        price: price,
        image_file: selectedImageFile,
        maximum_court: parseInt(maxCourt, 10),
        status: status as 'Active' | 'Inactive',
        description: description.trim() || undefined,
        advance_required: advancePayment,
      };
      
      await createSport(payload);
      Alert.alert('Success', 'Sport added successfully!');
      closeAddModal();
      fetchSports();
    } catch (err: any) {
      console.error('Failed to add sport:', err);
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to add sport. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSport = async () => {
    if (!selectedSport || !editGameName.trim() || !editPrice.trim() || !editMaxCourt.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        name: editGameName.trim(),
        rate_type: editRateType,
        price: editPrice,
        maximum_court: parseInt(editMaxCourt, 10),
        status: editStatus as 'Active' | 'Inactive',
        description: editDescription.trim() || undefined,
      };
      if (editSelectedImageFile) {
        updateData.image_file = editSelectedImageFile;
      }
      await updateSport(selectedSport.id, updateData);
      Alert.alert('Success', 'Sport updated successfully!');
      closeManageModal();
      fetchSports();
    } catch (err: any) {
      console.error('Failed to update sport:', err);
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update sport. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSport = () => {
    if (!selectedSport) return;
    
    Alert.alert(
      'Delete Sport',
      `Are you sure you want to delete "${selectedSport.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteSport(selectedSport.id);
              Alert.alert('Success', 'Sport deleted successfully!');
              closeManageModal();
              fetchSports();
            } catch (err: any) {
              console.error('Failed to delete sport:', err);
              Alert.alert('Error', err?.response?.data?.detail || 'Failed to delete sport. Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>sports</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.page} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#15803D']} />
      }>
        <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Sports Management</Text>
          <Text style={styles.subtitle}>Manage all sports activities and their booking status</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+  Add New Sport</Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#15803D" />
          <Text style={styles.loadingText}>Loading sports...</Text>
        </View>
      )}

      {/* Empty State */}
      {!loading && sports.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="tennisball-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No sports found</Text>
          <Text style={styles.emptySubtext}>Add your first sport to get started</Text>
        </View>
      )}

      {/* Sports List */}
      {!loading && sports.length > 0 && (
        <View style={styles.cardGrid}>
          {sports.map(s => (
            <View key={s.id} style={styles.card}>
              <Image source={{ uri: s.image_url || s.image || getSportImage(s.name) }} style={styles.cardImage} />
              <View style={[styles.badge, { backgroundColor: s.status === 'Active' ? '#15803D' : '#6B7280' }]}>
                <Text style={styles.badgeText}>{s.status}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{s.name}</Text>
                <View style={styles.row}><Text style={styles.label}>Rate:</Text><Text style={styles.value}>Rs. {s.price} / {s.rate_type || 'Per hour'}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Available Courts:</Text><Text style={styles.value}>{s.maximum_court || s.max_courts || 1}</Text></View>
              </View>
              <TouchableOpacity style={styles.manageBtn} onPress={() => openManageModal(s)}>
                <Text style={styles.manageText}>Manage</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    
    {/* Add Sport Modal */}
    <Modal visible={addModalVisible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={closeAddModal}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'position'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <View style={[styles.modalBox, !keyboardHeight ? { marginBottom: 48 } : {}]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Sport</Text>
                <Pressable onPress={closeAddModal} style={styles.modalCloseBtn}><Ionicons name="close" size={20} color="#fff" /></Pressable>
              </View>
              <ScrollView ref={addSportScrollRef} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.rowSplit}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>Game Name*</Text>
                    <TextInput style={styles.input} placeholder="Select Sport" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={gameName} onChangeText={setGameName} onFocus={() => { setTimeout(() => addSportScrollRef.current?.scrollTo({ y: 0, animated: true }), 100); }} />

                    <Text style={styles.fieldLabel}>Rate Type*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setRateTypeDropdownVisible(!rateTypeDropdownVisible);
                        if (!rateTypeDropdownVisible) setTimeout(() => addSportScrollRef.current?.scrollTo({ y: 20, animated: true }), 100);
                      }}
                    >
                      <Text style={rateType ? styles.selectInputTextSelected : { color: '#9CA3AF' }}>{rateType || 'Select rate type'}</Text>
                      <Ionicons name={rateTypeDropdownVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {rateTypeDropdownVisible && (
                      <View style={styles.inlineDropdown}>
                        {['Per hour', 'Per session', 'Per day'].map(opt => (
                          <TouchableOpacity key={opt} style={[styles.dropdownOption, rateType === opt && styles.dropdownOptionSelected]} onPress={() => { setRateType(opt); setRateTypeDropdownVisible(false); }}>
                            <Text style={rateType === opt ? styles.dropdownOptionTextSelected : {}}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <Text style={styles.fieldLabel}>Maximum Court*</Text>
                    <TextInput style={styles.input} placeholder="" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={maxCourt} onChangeText={setMaxCourt} keyboardType="numeric" onFocus={() => { setTimeout(() => addSportScrollRef.current?.scrollTo({ y: 40, animated: true }), 100); }} />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>Game Type*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setGameTypeDropdownVisible(!gameTypeDropdownVisible);
                        if (!gameTypeDropdownVisible) setTimeout(() => addSportScrollRef.current?.scrollTo({ y: 20, animated: true }), 100);
                      }}
                    >
                      <Text style={gameType ? styles.selectInputTextSelected : { color: '#9CA3AF' }}>
                        {gameType || 'Select Game Type'}
                      </Text>
                      <Ionicons name={gameTypeDropdownVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {gameTypeDropdownVisible && (
                      <View style={styles.inlineDropdown}>
                        {['Indoor', 'Outdoor'].map(opt => (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.dropdownOption, gameType === opt && styles.dropdownOptionSelected]}
                            onPress={() => { setGameType(opt); setGameTypeDropdownVisible(false); }}
                          >
                            <Text style={gameType === opt ? styles.dropdownOptionTextSelected : {}}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <Text style={styles.fieldLabel}>Price*</Text>
                    <TextInput style={styles.input} placeholder="" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={price} onChangeText={setPrice} keyboardType="numeric" onFocus={() => { setTimeout(() => addSportScrollRef.current?.scrollTo({ y: 40, animated: true }), 100); }} />

                    <Text style={styles.fieldLabel}>Status*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setStatusDropdownVisible(!statusDropdownVisible);
                        if (!statusDropdownVisible) setTimeout(() => addSportScrollRef.current?.scrollTo({ y: 70, animated: true }), 100);
                      }}
                    >
                      <Text style={status ? styles.selectInputTextSelected : { color: '#9CA3AF' }}>{status || 'Select status'}</Text>
                      <Ionicons name={statusDropdownVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {statusDropdownVisible && (
                      <View style={styles.inlineDropdown}>
                        {['Active', 'Inactive', 'Maintenance'].map(opt => (
                          <TouchableOpacity key={opt} style={[styles.dropdownOption, status === opt && styles.dropdownOptionSelected]} onPress={() => { setStatus(opt); setStatusDropdownVisible(false); }}>
                            <Text style={status === opt ? styles.dropdownOptionTextSelected : {}}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Image Picker */}
                <Text style={styles.fieldLabel}>Sport Image*</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage('add')}>
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                      <Text style={styles.imagePickerText}>Tap to select image</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {selectedImage && (
                  <TouchableOpacity onPress={() => { setSelectedImage(null); setSelectedImageFile(null); }} style={styles.removeImageBtn}>
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    <Text style={styles.removeImageText}>Remove image</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: '#111827' }]}
                  placeholder="Optional"
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#0EA5E9"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  onFocus={() => { setTimeout(() => addSportScrollRef.current?.scrollTo({ y: 150, animated: true }), 100); }}
                />

                <View style={styles.advanceRow}>
                  <Switch value={advancePayment} onValueChange={setAdvancePayment} trackColor={{ true: '#15803D', false: '#E5E7EB' }} />
                  <Text style={styles.advanceText}>Advance Payment Required</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeAddModal} disabled={saving}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.addSportBtn, saving && { opacity: 0.6 }]} onPress={addSport} disabled={saving}><Text style={styles.addSportText}>{saving ? 'Adding...' : 'Add Sport'}</Text></TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Manage Sport Modal */}
    <Modal visible={manageModalVisible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={closeManageModal}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'position'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <View style={[styles.modalBox, { width: '98%', maxHeight: '96%' }, !keyboardHeight ? { marginBottom: 48 } : {}]}>
              <View style={[styles.modalHeader, { backgroundColor: '#0EA5E9' }]}>
                <Text style={styles.modalTitle}>Edit Sport</Text>
                <Pressable onPress={closeManageModal} style={styles.modalCloseBtn}><Ionicons name="close" size={24} color="#fff" /></Pressable>
              </View>
              <ScrollView ref={manageScrollRef} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                {/* Editable Sport Image */}
                <TouchableOpacity style={styles.editImagePickerBtn} onPress={() => pickImage('edit')}>
                  <Image
                    source={{ uri: editSelectedImage || selectedSport?.image_url || selectedSport?.image || getSportImage(selectedSport?.name || '') }}
                    style={{ width: '100%', height: 120, borderRadius: 8 }}
                  />
                  <View style={styles.editImageOverlay}>
                    <Ionicons name="camera" size={22} color="#fff" />
                    <Text style={styles.editImageOverlayText}>Change Image</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.rowSplit}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>Game Name*</Text>
                    <TextInput style={styles.input} value={editGameName} onChangeText={setEditGameName} onFocus={() => { setTimeout(() => manageScrollRef.current?.scrollTo({ y: 0, animated: true }), 100); }} />

                    <Text style={styles.fieldLabel}>Rate Type*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setEditRateTypeDropdownVisible(!editRateTypeDropdownVisible);
                        if (!editRateTypeDropdownVisible) setTimeout(() => manageScrollRef.current?.scrollTo({ y: 20, animated: true }), 100);
                      }}
                    >
                      <Text style={editRateType ? styles.selectInputTextSelected : { color: '#9CA3AF' }}>{editRateType || 'Select rate type'}</Text>
                      <Ionicons name={editRateTypeDropdownVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {editRateTypeDropdownVisible && (
                      <View style={styles.inlineDropdown}>
                        {['Per hour', 'Per session', 'Per day'].map(opt => (
                          <TouchableOpacity key={opt} style={[styles.dropdownOption, editRateType === opt && styles.dropdownOptionSelected]} onPress={() => { setEditRateType(opt); setEditRateTypeDropdownVisible(false); }}>
                            <Text style={editRateType === opt ? styles.dropdownOptionTextSelected : {}}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <Text style={styles.fieldLabel}>Maximum Courts*</Text>
                    <TextInput style={styles.input} value={editMaxCourt} onChangeText={setEditMaxCourt} keyboardType="numeric" onFocus={() => { setTimeout(() => manageScrollRef.current?.scrollTo({ y: 40, animated: true }), 100); }} />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>Game Type*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setEditGameTypeDropdownVisible(!editGameTypeDropdownVisible);
                        if (!editGameTypeDropdownVisible) setTimeout(() => manageScrollRef.current?.scrollTo({ y: 20, animated: true }), 100);
                      }}
                    >
                      <Text style={editGameType ? styles.selectInputTextSelected : { color: '#9CA3AF' }}>
                        {editGameType || 'Select Game Type'}
                      </Text>
                      <Ionicons name={editGameTypeDropdownVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {editGameTypeDropdownVisible && (
                      <View style={styles.inlineDropdown}>
                        {['Indoor', 'Outdoor'].map(opt => (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.dropdownOption, editGameType === opt && styles.dropdownOptionSelected]}
                            onPress={() => { setEditGameType(opt); setEditGameTypeDropdownVisible(false); }}
                          >
                            <Text style={editGameType === opt ? styles.dropdownOptionTextSelected : {}}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <Text style={styles.fieldLabel}>Price (LKR)*</Text>
                    <TextInput style={styles.input} value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" onFocus={() => { setTimeout(() => manageScrollRef.current?.scrollTo({ y: 40, animated: true }), 100); }} />

                    <Text style={styles.fieldLabel}>Status*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setEditStatusDropdownVisible(!editStatusDropdownVisible);
                        if (!editStatusDropdownVisible) setTimeout(() => manageScrollRef.current?.scrollTo({ y: 70, animated: true }), 100);
                      }}
                    >
                      <Text style={editStatus ? styles.selectInputTextSelected : { color: '#9CA3AF' }}>{editStatus || 'Select status'}</Text>
                      <Ionicons name={editStatusDropdownVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {editStatusDropdownVisible && (
                      <View style={styles.inlineDropdown}>
                        {['Active', 'Inactive', 'Maintenance'].map(opt => (
                          <TouchableOpacity key={opt} style={[styles.dropdownOption, editStatus === opt && styles.dropdownOptionSelected]} onPress={() => { setEditStatus(opt); setEditStatusDropdownVisible(false); }}>
                            <Text style={editStatus === opt ? styles.dropdownOptionTextSelected : {}}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput style={[styles.input, styles.textArea, { color: '#111827' }]} placeholder="Optional" placeholderTextColor="#9CA3AF" value={editDescription} onChangeText={setEditDescription} multiline onFocus={() => { setTimeout(() => manageScrollRef.current?.scrollTo({ y: 150, animated: true }), 100); }} />

                <View style={styles.manageActions}>
                  <TouchableOpacity style={styles.manageCancelBtn} onPress={closeManageModal} disabled={saving}><Text style={styles.manageCancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteSport} disabled={saving}><Text style={styles.deleteText}>{saving ? 'Deleting...' : 'Delete'}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateSport} disabled={saving}><Text style={styles.updateText}>{saving ? 'Updating...' : 'Update Sport'}</Text></TouchableOpacity>
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

const screenWidth = Dimensions.get('window').width;
const cardWidth = Math.min(520, screenWidth - 40);

const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#15803D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 14,
  },
  cardGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: '#fff', fontWeight: '700' },
  cardBody: {
    padding: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#6B7280' },
  value: { color: '#111827', fontWeight: '700' },
  manageBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  manageText: { color: '#fff', fontWeight: '700' },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 12 },
  modalBox: { width: '95%', maxHeight: '85%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  modalHeader: { backgroundColor: '#15803D', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalCloseBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6 },
  modalContent: { padding: 14 },
  rowSplit: { flexDirection: 'row', gap: 12 },
  formCol: { flex: 1 },
  fieldLabel: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginBottom: 12 },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  advanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  advanceText: { color: '#374151', marginLeft: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6' },
  cancelText: { color: '#374151', fontWeight: '600' },
  addSportBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#15803D' },
  addSportText: { color: '#fff', fontWeight: '700' },
  manageActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  manageCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#6B7280' },
  manageCancelText: { color: '#fff', fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#DC2626' },
  deleteText: { color: '#fff', fontWeight: '600' },
  updateBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563EB' },
  updateText: { color: '#fff', fontWeight: '700' },
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  selectInputTextSelected: { color: '#111827', fontWeight: '700' },
  inlineDropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginTop: -18, borderTopWidth: 0, overflow: 'hidden', zIndex: 50, elevation: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownOptionSelected: { backgroundColor: '#ECFDF5' },
  dropdownOptionTextSelected: { color: '#065F46', fontWeight: '700' },
  // Image picker styles
  imagePickerBtn: { borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 10, overflow: 'hidden', marginBottom: 12, backgroundColor: '#F9FAFB' },
  imagePreview: { width: '100%', height: 140, borderRadius: 8 },
  imagePickerPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
  imagePickerText: { color: '#9CA3AF', marginTop: 6, fontSize: 13 },
  removeImageBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 12, marginTop: -6 },
  removeImageText: { color: '#DC2626', marginLeft: 4, fontSize: 13 },
  editImagePickerBtn: { position: 'relative', marginBottom: 14, borderRadius: 8, overflow: 'hidden' },
  editImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 6 },
  editImageOverlayText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
