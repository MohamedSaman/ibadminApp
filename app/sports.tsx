import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const sports = [
  {
    id: 'football',
    title: 'Football',
    rate: 'Rs. 1,500',
    courts: 1,
    img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=60',
  },
  {
    id: 'pools',
    title: 'Pools',
    rate: 'Rs. 1,500',
    courts: 2,
    img: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1200&q=60',
  },
  {
    id: 'cricket',
    title: 'Cricket',
    rate: 'Rs. 1,500',
    courts: 3,
    img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=60',
  },
];

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
  const addSportScrollRef = useRef<ScrollView | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const manageScrollRef = useRef<ScrollView | null>(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedSport, setSelectedSport] = useState<any | null>(null);
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

  const openAddModal = () => setAddModalVisible(true);
  const closeAddModal = () => setAddModalVisible(false);

  const openManageModal = (sport: any) => {
    setSelectedSport(sport);
    setEditGameName(sport.title);
    setEditPrice(sport.rate);
    setManageModalVisible(true);
  };
  const closeManageModal = () => setManageModalVisible(false);

  const addSport = () => {
    // For now just close modal; persistence can be added later
    console.log('Add sport', { gameName, gameType, rateType, price, maxCourt, status, description, advancePayment });
    setAddModalVisible(false);
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

      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Sports Management</Text>
          <Text style={styles.subtitle}>Manage all sports activities and their booking status</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+  Add New Sport</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardGrid}>
        {sports.map(s => (
          <View key={s.id} style={styles.card}>
            <Image source={{ uri: s.img }} style={styles.cardImage} />
            <View style={styles.badge}><Text style={styles.badgeText}>Active</Text></View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <View style={styles.row}><Text style={styles.label}>Hourly Rate:</Text><Text style={styles.value}>{s.rate}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Available Courts:</Text><Text style={styles.value}>{s.courts}</Text></View>
            </View>
            <TouchableOpacity style={styles.manageBtn} onPress={() => openManageModal(s)}>
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
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
                    <TextInput style={styles.input} placeholder="Select Sport" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={gameName} onChangeText={setGameName} onFocus={() => { setTimeout(() => addSportScrollRef.current?.scrollToEnd({ animated: true }), 120); }} />

                    <Text style={styles.fieldLabel}>Rate Type*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setRateTypeDropdownVisible(!rateTypeDropdownVisible);
                        if (!rateTypeDropdownVisible) setTimeout(() => addSportScrollRef.current?.scrollToEnd({ animated: true }), 120);
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
                    <TextInput style={styles.input} placeholder="" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={maxCourt} onChangeText={setMaxCourt} keyboardType="numeric" onFocus={() => { setTimeout(() => addSportScrollRef.current?.scrollToEnd({ animated: true }), 120); }} />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>Game Type*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setGameTypeDropdownVisible(!gameTypeDropdownVisible);
                        if (!gameTypeDropdownVisible) setTimeout(() => addSportScrollRef.current?.scrollToEnd({ animated: true }), 120);
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
                    <TextInput style={styles.input} placeholder="" placeholderTextColor="#9CA3AF" selectionColor="#0EA5E9" value={price} onChangeText={setPrice} keyboardType="numeric" onFocus={() => { setTimeout(() => addSportScrollRef.current?.scrollToEnd({ animated: true }), 120); }} />

                    <Text style={styles.fieldLabel}>Status*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setStatusDropdownVisible(!statusDropdownVisible);
                        if (!statusDropdownVisible) setTimeout(() => addSportScrollRef.current?.scrollToEnd({ animated: true }), 120);
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

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: '#111827' }]}
                  placeholder="Optional"
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#0EA5E9"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  onFocus={() => { setTimeout(() => addSportScrollRef.current?.scrollToEnd({ animated: true }), 120); }}
                />

                <View style={styles.advanceRow}>
                  <Switch value={advancePayment} onValueChange={setAdvancePayment} trackColor={{ true: '#15803D', false: '#E5E7EB' }} />
                  <Text style={styles.advanceText}>Advance Payment Required</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeAddModal}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.addSportBtn} onPress={addSport}><Text style={styles.addSportText}>Add Sport</Text></TouchableOpacity>
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
                {selectedSport && <Image source={{ uri: selectedSport.img }} style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 14 }} />}

                <View style={styles.rowSplit}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>Game Name*</Text>
                    <TextInput style={styles.input} value={editGameName} onChangeText={setEditGameName} onFocus={() => { setTimeout(() => manageScrollRef.current?.scrollToEnd({ animated: true }), 120); }} />

                    <Text style={styles.fieldLabel}>Rate Type*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setEditRateTypeDropdownVisible(!editRateTypeDropdownVisible);
                        if (!editRateTypeDropdownVisible) setTimeout(() => manageScrollRef.current?.scrollToEnd({ animated: true }), 120);
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
                    <TextInput style={styles.input} value={editMaxCourt} onChangeText={setEditMaxCourt} keyboardType="numeric" onFocus={() => { setTimeout(() => manageScrollRef.current?.scrollToEnd({ animated: true }), 120); }} />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>Game Type*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setEditGameTypeDropdownVisible(!editGameTypeDropdownVisible);
                        if (!editGameTypeDropdownVisible) setTimeout(() => manageScrollRef.current?.scrollToEnd({ animated: true }), 120);
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
                    <TextInput style={styles.input} value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" onFocus={() => { setTimeout(() => manageScrollRef.current?.scrollToEnd({ animated: true }), 120); }} />

                    <Text style={styles.fieldLabel}>Status*</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.selectInput]}
                      onPress={() => {
                        setEditStatusDropdownVisible(!editStatusDropdownVisible);
                        if (!editStatusDropdownVisible) setTimeout(() => manageScrollRef.current?.scrollToEnd({ animated: true }), 120);
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
                <TextInput style={[styles.input, styles.textArea, { color: '#111827' }]} placeholder="Optional" placeholderTextColor="#9CA3AF" value={editDescription} onChangeText={setEditDescription} multiline onFocus={() => { setTimeout(() => manageScrollRef.current?.scrollToEnd({ animated: true }), 120); }} />

                <View style={styles.manageActions}>
                  <TouchableOpacity style={styles.manageCancelBtn} onPress={closeManageModal}><Text style={styles.manageCancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => { console.log('Delete', selectedSport?.id); closeManageModal(); }}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.updateBtn} onPress={() => { console.log('Update', { ...selectedSport, title: editGameName, rate: editPrice }); closeManageModal(); }}><Text style={styles.updateText}>Update Sport</Text></TouchableOpacity>
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
});
