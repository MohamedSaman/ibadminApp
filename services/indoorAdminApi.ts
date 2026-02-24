import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getErrorMessage } from './apiClient';
import { BASE_URL, INDOOR_ADMIN_API } from '../constants/api';
import {
  AuthTokens,
  LoginResponse,
  User,
  ProfileResponse,
  Venue,
  VenueUpdatePayload,
  Sport,
  SportCreatePayload,
  SportUpdatePayload,
  Booking,
  BookingListParams,
  BookingStatusUpdate,
  SlotAvailabilityResponse,
  SlotAvailabilityParams,
  Facility,
  FacilityCreatePayload,
  Discount,
  DiscountCreatePayload,
  VenueReview,
  SportReview,
  DashboardStats,
  RevenueReport,
  RevenueReportParams,
  BookingReport,
  BookingReportParams,
  SportsRevenueReport,
  IndoorAdmin,
  IndoorAdminCreatePayload,
  AssignVenuePayload,
  PaginatedResponse,
  AdminHoldSlotPayload,
  AdminHoldSlotResponse,
  AdminCreateBookingPayload,
  AdminCreateBookingResponse,
  AdminCancelBookingResponse,
  StaffMember,
  StaffMemberCreatePayload,
  StaffMemberUpdatePayload,
  AdminNotification,
  AdminNotificationListResponse,
  AdminUnreadCountResponse,
} from '../types/api';

// =====================================================
// Authentication
// =====================================================

export async function indoorAdminLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post(INDOOR_ADMIN_API.auth.login, { email, password });
  
  // Backend returns { message, user, tokens: { access, refresh } }
  const { user, tokens } = res.data;
  const access = tokens?.access || res.data.access;
  const refresh = tokens?.refresh || res.data.refresh;
  
  // Store tokens
  await AsyncStorage.setItem('accessToken', access);
  await AsyncStorage.setItem('refreshToken', refresh);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  return { access, refresh, user };
}

export async function indoorAdminRegister(payload: IndoorAdminCreatePayload): Promise<AuthTokens> {
  const res = await api.post(INDOOR_ADMIN_API.auth.register, payload);
  
  // Backend returns { message, user, tokens: { access, refresh } }
  const tokens = res.data.tokens || res.data;
  const access = tokens.access;
  const refresh = tokens.refresh;
  
  await AsyncStorage.setItem('accessToken', access);
  await AsyncStorage.setItem('refreshToken', refresh);
  if (res.data.user) {
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
  }
  
  return { access, refresh };
}

export async function getProfile(): Promise<ProfileResponse> {
  const res = await api.get(INDOOR_ADMIN_API.auth.profile);
  return res.data;
}

export async function updateProfile(data: Partial<User>): Promise<ProfileResponse> {
  const res = await api.patch(INDOOR_ADMIN_API.auth.profile, data);
  return res.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post(INDOOR_ADMIN_API.auth.changePassword, {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
}

export async function getStoredUser(): Promise<User | null> {
  const userStr = await AsyncStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// =====================================================
// Dashboard
// =====================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get(INDOOR_ADMIN_API.dashboard.stats);
  return res.data;
}

export async function getRevenueReport(params?: RevenueReportParams): Promise<RevenueReport> {
  const res = await api.get(INDOOR_ADMIN_API.dashboard.revenueReport, { params });
  return res.data;
}

export async function getBookingReport(params?: BookingReportParams): Promise<BookingReport> {
  const res = await api.get(INDOOR_ADMIN_API.dashboard.bookingReport, { params });
  return res.data;
}

export async function getSportsRevenueReport(): Promise<SportsRevenueReport> {
  const res = await api.get(INDOOR_ADMIN_API.dashboard.sportsRevenue);
  return res.data;
}

// =====================================================
// Venue
// =====================================================

export async function getVenue(): Promise<Venue> {
  const res = await api.get(INDOOR_ADMIN_API.venue.get);
  return res.data;
}

export async function updateVenue(data: VenueUpdatePayload, files?: { cover_image_file?: { uri: string; name: string; type: string } | null; gallery_image_files?: { uri: string; name: string; type: string }[] }): Promise<Venue> {
  // If files are provided, send via FormData (multipart)
  if (files && (files.cover_image_file || (files.gallery_image_files && files.gallery_image_files.length > 0))) {
    const formData = new FormData();
    
    // Add only the simple string/primitive fields
    if (data.name) formData.append('name', String(data.name));
    if (data.description) formData.append('description', String(data.description));
    if (data.address) formData.append('address', String(data.address));
    if (data.location) formData.append('location', String(data.location));
    if (data.image_url) formData.append('image_url', String(data.image_url));
    if (data.complex_type) formData.append('complex_type', String(data.complex_type));
    if (data.county) formData.append('county', String(data.county));
    if (data.postal_code) formData.append('postal_code', String(data.postal_code));
    if (data.contact_number) formData.append('contact_number', String(data.contact_number));
    if (data.email_address) formData.append('email_address', String(data.email_address));
    if (data.website) formData.append('website', String(data.website));
    if (data.status) formData.append('status', String(data.status));
    if (data.video_tour_url) formData.append('video_tour_url', String(data.video_tour_url));
    if (data.terms) formData.append('terms', String(data.terms));
    
    // Add cover image file - Expo returns {uri, name, type}
    if (files.cover_image_file) {
      formData.append('cover_image_file', {
        uri: files.cover_image_file.uri,
        name: files.cover_image_file.name,
        type: files.cover_image_file.type,
      } as any);
    }
    
    // Add gallery image files
    if (files.gallery_image_files && files.gallery_image_files.length > 0) {
      files.gallery_image_files.forEach((img) => {
        formData.append('gallery_image_files', {
          uri: img.uri,
          name: img.name,
          type: img.type,
        } as any);
      });
    }
    
    console.log('Sending FormData (with files):', { hasFiles: true, coverImage: !!files.cover_image_file, galleryCount: files.gallery_image_files?.length || 0 });
    const res = await api.patch(INDOOR_ADMIN_API.venue.update, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
  
  // Otherwise send as JSON (no files)
  console.log('Sending JSON (no files):', data);
  const res = await api.patch(INDOOR_ADMIN_API.venue.update, data);
  return res.data;
}

// =====================================================
// Sports
// =====================================================

export async function getSports(): Promise<Sport[]> {
  const res = await api.get(INDOOR_ADMIN_API.sports.list);
  // Handle both paginated and non-paginated responses
  return res.data.results || res.data;
}

export async function getSport(id: number): Promise<Sport> {
  const res = await api.get(INDOOR_ADMIN_API.sports.detail(id));
  return res.data;
}

export async function createSport(data: SportCreatePayload): Promise<Sport> {
  if (data.image_file) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('price', data.price);
    if (data.game_type) formData.append('game_type', data.game_type);
    if (data.rate_type) formData.append('rate_type', data.rate_type);
    if (data.maximum_court !== undefined) formData.append('maximum_court', String(data.maximum_court));
    if (data.status) formData.append('status', data.status);
    if (data.description) formData.append('description', data.description);
    if (data.available !== undefined) formData.append('available', String(data.available));
    if (data.advance_required !== undefined) formData.append('advance_required', String(data.advance_required));
    formData.append('image_file', data.image_file as any);
    const res = await api.post(INDOOR_ADMIN_API.sports.create, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
  const res = await api.post(INDOOR_ADMIN_API.sports.create, data);
  return res.data;
}

export async function updateSport(id: number, data: SportUpdatePayload): Promise<Sport> {
  if (data.image_file) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'image_file') {
        formData.append('image_file', value as any);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    const res = await api.patch(INDOOR_ADMIN_API.sports.update(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
  const res = await api.patch(INDOOR_ADMIN_API.sports.update(id), data);
  return res.data;
}

export async function deleteSport(id: number): Promise<void> {
  await api.delete(INDOOR_ADMIN_API.sports.delete(id));
}

export async function toggleSportStatus(id: number): Promise<Sport> {
  const res = await api.post(INDOOR_ADMIN_API.sports.toggleStatus(id));
  return res.data;
}

// =====================================================
// Bookings
// =====================================================

export async function getBookings(params?: BookingListParams): Promise<PaginatedResponse<Booking>> {
  const res = await api.get(INDOOR_ADMIN_API.bookings.list, { params });
  return res.data;
}

export async function getSlotAvailability(params: SlotAvailabilityParams): Promise<SlotAvailabilityResponse> {
  const res = await api.get(INDOOR_ADMIN_API.bookings.slots, { params });
  return res.data;
}

export async function getBooking(id: number): Promise<Booking> {
  const res = await api.get(INDOOR_ADMIN_API.bookings.detail(id));
  return res.data;
}

export async function updateBookingStatus(id: number, data: BookingStatusUpdate): Promise<Booking> {
  const res = await api.patch(INDOOR_ADMIN_API.bookings.updateStatus(id), data);
  return res.data;
}

export async function getTodayBookings(): Promise<any[]> {
  const res = await api.get(INDOOR_ADMIN_API.bookings.today);
  // Backend returns { date, count, bookings } for today endpoint
  return res.data.bookings || res.data.results || res.data;
}

export async function getUpcomingBookings(): Promise<any[]> {
  const res = await api.get(INDOOR_ADMIN_API.bookings.upcoming);
  return res.data.results || res.data;
}

/**
 * Hold a slot temporarily before creating a manual booking.
 * Admins get a 10-minute hold time.
 */
export async function holdSlot(data: AdminHoldSlotPayload): Promise<AdminHoldSlotResponse> {
  const res = await api.post(INDOOR_ADMIN_API.bookings.holdSlot, data);
  return res.data;
}

/**
 * Create a manual booking for walk-in customers.
 * This bypasses the user registration requirement.
 */
export async function createManualBooking(data: AdminCreateBookingPayload): Promise<AdminCreateBookingResponse> {
  const res = await api.post(INDOOR_ADMIN_API.bookings.create, data);
  return res.data;
}

/**
 * Cancel a booking at the admin's venue.
 */
export async function cancelBooking(bookingId: number): Promise<AdminCancelBookingResponse> {
  const res = await api.post(INDOOR_ADMIN_API.bookings.cancel(bookingId));
  return res.data;
}

// =====================================================
// Facilities
// =====================================================

export async function getFacilities(): Promise<Facility[]> {
  const res = await api.get(INDOOR_ADMIN_API.facilities.list);
  return res.data.results || res.data;
}

export async function getFacility(id: number): Promise<Facility> {
  const res = await api.get(INDOOR_ADMIN_API.facilities.detail(id));
  return res.data;
}

export async function createFacility(data: FacilityCreatePayload): Promise<Facility> {
  const res = await api.post(INDOOR_ADMIN_API.facilities.create, data);
  return res.data;
}

export async function updateFacility(id: number, data: Partial<FacilityCreatePayload>): Promise<Facility> {
  const res = await api.patch(INDOOR_ADMIN_API.facilities.update(id), data);
  return res.data;
}

export async function deleteFacility(id: number): Promise<void> {
  await api.delete(INDOOR_ADMIN_API.facilities.delete(id));
}

// =====================================================
// Discounts
// =====================================================

export async function getDiscounts(): Promise<Discount[]> {
  const res = await api.get(INDOOR_ADMIN_API.discounts.list);
  return res.data.results || res.data;
}

export async function getDiscount(id: number): Promise<Discount> {
  const res = await api.get(INDOOR_ADMIN_API.discounts.detail(id));
  return res.data;
}

export async function createDiscount(data: DiscountCreatePayload): Promise<Discount> {
  const res = await api.post(INDOOR_ADMIN_API.discounts.create, data);
  return res.data;
}

export async function updateDiscount(id: number, data: Partial<DiscountCreatePayload>): Promise<Discount> {
  const res = await api.patch(INDOOR_ADMIN_API.discounts.update(id), data);
  return res.data;
}

export async function deleteDiscount(id: number): Promise<void> {
  await api.delete(INDOOR_ADMIN_API.discounts.delete(id));
}

// =====================================================
// Reviews
// =====================================================

export async function getVenueReviews(): Promise<PaginatedResponse<VenueReview>> {
  const res = await api.get(INDOOR_ADMIN_API.reviews.venue);
  return res.data;
}

export async function getSportReviews(): Promise<PaginatedResponse<SportReview>> {
  const res = await api.get(INDOOR_ADMIN_API.reviews.sports);
  return res.data;
}

// =====================================================
// Super Admin (for superadmin users only)
// =====================================================

export async function createIndoorAdmin(data: IndoorAdminCreatePayload): Promise<IndoorAdmin> {
  const res = await api.post(INDOOR_ADMIN_API.superAdmin.create, data);
  return res.data;
}

export async function listIndoorAdmins(): Promise<IndoorAdmin[]> {
  const res = await api.get(INDOOR_ADMIN_API.superAdmin.list);
  return res.data.results || res.data;
}

export async function getIndoorAdmin(id: number): Promise<IndoorAdmin> {
  const res = await api.get(INDOOR_ADMIN_API.superAdmin.detail(id));
  return res.data;
}

export async function assignVenueToAdmin(adminId: number, data: AssignVenuePayload): Promise<IndoorAdmin> {
  const res = await api.post(INDOOR_ADMIN_API.superAdmin.assignVenue(adminId), data);
  return res.data;
}

export async function activateIndoorAdmin(id: number, isActive: boolean): Promise<IndoorAdmin> {
  const res = await api.post(INDOOR_ADMIN_API.superAdmin.activate(id), { is_active: isActive });
  return res.data;
}

// =====================================================
// Staff Members
// =====================================================

export async function getStaffMembers(params?: {
  search?: string;
  role?: string;
  shift?: string;
}): Promise<StaffMember[]> {
  const res = await api.get(INDOOR_ADMIN_API.staff.list, { params });
  return res.data;
}

export async function getStaffMember(id: number): Promise<StaffMember> {
  const res = await api.get(INDOOR_ADMIN_API.staff.detail(id));
  return res.data;
}

export async function createStaffMember(data: StaffMemberCreatePayload): Promise<StaffMember> {
  // If photo is provided, use FormData for multipart upload
  if (data.photo) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('role', data.role);
    formData.append('shift', data.shift);
    if (data.phone) formData.append('phone', data.phone);
    if (data.status) formData.append('status', data.status);
    if (data.status_detail) formData.append('status_detail', data.status_detail);
    if (data.is_online !== undefined) formData.append('is_online', String(data.is_online));
    formData.append('photo', data.photo as any);
    const res = await api.post(INDOOR_ADMIN_API.staff.create, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
  const res = await api.post(INDOOR_ADMIN_API.staff.create, data);
  return res.data;
}

export async function updateStaffMember(id: number, data: StaffMemberUpdatePayload): Promise<StaffMember> {
  // If photo is provided, use FormData for multipart upload
  if (data.photo) {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.role) formData.append('role', data.role);
    if (data.shift) formData.append('shift', data.shift);
    if (data.phone) formData.append('phone', data.phone);
    if (data.status) formData.append('status', data.status);
    if (data.status_detail) formData.append('status_detail', data.status_detail);
    if (data.is_online !== undefined) formData.append('is_online', String(data.is_online));
    formData.append('photo', data.photo as any);
    const res = await api.patch(INDOOR_ADMIN_API.staff.update(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
  const res = await api.patch(INDOOR_ADMIN_API.staff.update(id), data);
  return res.data;
}

export async function deleteStaffMember(id: number): Promise<void> {
  await api.delete(INDOOR_ADMIN_API.staff.delete(id));
}

// =====================================================
// Notifications
// =====================================================

export async function getAdminNotifications(
  page: number = 1,
  pageSize: number = 20,
  type?: string,
  isRead?: boolean,
): Promise<AdminNotificationListResponse> {
  const params: Record<string, any> = { page, page_size: pageSize };
  if (type) params.type = type;
  if (isRead !== undefined) params.is_read = isRead;
  const res = await api.get(INDOOR_ADMIN_API.notifications.list, { params });
  return res.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await api.get<AdminUnreadCountResponse>(INDOOR_ADMIN_API.notifications.unreadCount);
  return res.data.unread_count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(INDOOR_ADMIN_API.notifications.markRead(id));
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post(INDOOR_ADMIN_API.notifications.markAllRead);
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(INDOOR_ADMIN_API.notifications.delete(id));
}

// Re-export error helper
export { getErrorMessage };
