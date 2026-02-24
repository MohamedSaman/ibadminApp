// =====================================================
// Indoor Admin API Types
// =====================================================

// User Types
export type UserType = 'user' | 'indoor_admin' | 'superadmin';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
  is_active: boolean;
  phone_number?: string;
  profile_picture?: string;
  venue_id?: number | null;
  venue_name?: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
  message?: string;
}

export interface ProfileResponse extends User {}

// Venue Types
export interface Venue {
  id: number;
  name: string;
  address: string;
  location?: string;
  rating: number;
  reviews: number;
  image_url?: string;
  complex_type?: string;
  county?: string;
  postal_code?: string;
  contact_number?: string;
  email_address?: string;
  website?: string;
  status: string;
  opening_hours?: any;
  amenities?: any;
  cover_image?: string;
  gallery_images_json?: any;
  video_tour_url?: string;
  description?: string;
  terms?: string;
  social_links?: any;
  sports_count?: number;
  total_bookings?: number;
  created_at: string;
  updated_at: string;
}

export interface VenueUpdatePayload {
  name?: string;
  description?: string;
  address?: string;
  location?: string;
  image_url?: string;
  complex_type?: string;
  county?: string;
  postal_code?: string;
  contact_number?: string;
  email_address?: string;
  website?: string;
  status?: string;
  opening_hours?: any;
  amenities?: any;
  cover_image?: string;
  gallery_images_json?: any;
  video_tour_url?: string;
  terms?: string;
  social_links?: any;
}

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

// Sport Types
export type SportStatus = 'Active' | 'Inactive';

export interface Sport {
  id: number;
  name: string;
  price: string;
  image?: string;
  image_url?: string;
  available: boolean;
  game_type?: string;
  rate_type?: string;
  maximum_court?: number;
  max_courts?: number; // alias
  status: SportStatus;
  description?: string;
  additional_charges?: any;
  advance_required?: boolean;
  average_rating?: number;
  facilities?: any[];
  discounts?: any[];
  reviews_count?: number;
  bookings_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SportCreatePayload {
  name: string;
  price: string;
  image?: string;
  image_file?: {
    uri: string;
    name: string;
    type: string;
  };
  available?: boolean;
  game_type?: string;
  rate_type?: string;
  maximum_court?: number;
  status?: SportStatus;
  description?: string;
  additional_charges?: any;
  advance_required?: boolean;
}

export interface SportUpdatePayload extends Partial<SportCreatePayload> {}

// Booking Types
export type BookingStatus = 'Pending' | 'Confirmed' | 'Upcoming' | 'Cancelled' | 'Completed' | 'No Show';

export interface Booking {
  id: number;
  venue_name: string;
  sport_name: string;
  court_number?: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  time_slot?: string;
  price: string;
  status: BookingStatus;
  user_email?: string;
  user_phone?: string;
  user_name?: string;
  is_permanent?: boolean;
  is_challenge_booking?: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingListParams {
  status?: string;
  sport_id?: number;
  date?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface BookingStatusUpdate {
  status: string;
  reason?: string;
}

// Slot Availability Types
export interface SlotBookingInfo {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  is_admin_booking: boolean;
  payment_status: string;
  price: string;
  notes: string;
}

export interface SlotInfo {
  start_time: string;
  end_time: string;
  display_time: string;
  status: 'available' | 'booked' | 'past';
  is_past: boolean;
  booking?: SlotBookingInfo;
}

export interface CourtSlots {
  court_number: number;
  court_name: string;
  slots: SlotInfo[];
}

export interface SlotAvailabilityResponse {
  sport_id: number;
  sport_name: string;
  date: string;
  courts: CourtSlots[];
  message?: string; // Optional message (e.g., "Venue is closed on this day.")
}

export interface SlotAvailabilityParams {
  sport_id: number;
  date: string;
}

// Facility Types
export interface Facility {
  id: number;
  name: string;
  icon?: string;
  sport: number;
}

export interface FacilityCreatePayload {
  name: string;
  icon?: string;
  sport: number;
}

// Discount Types
export type DiscountType = 'percentage' | 'fixed';

export interface Discount {
  id: number;
  type: string;
  color?: string;
  sport: number;
}

export interface DiscountCreatePayload {
  type: string;
  color?: string;
  sport: number;
}

// Review Types
export interface Review {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  rating: number;
  comment?: string;
  created_at: string;
  response?: string;
  responded_at?: string;
}

export interface VenueReview extends Review {
  venue: number;
}

export interface SportReview extends Review {
  sport: {
    id: number;
    name: string;
  };
}

// Dashboard Stats Types - matches backend DashboardStatsSerializer
export interface DashboardStats {
  total_bookings: number;
  today_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
  total_revenue: string;
  today_revenue: string;
  total_sports: number;
  active_sports: number;
  venue_rating: number;
  total_reviews: number;
}

export interface RevenueReportParams {
  period?: 'daily' | 'weekly' | 'monthly';
  start_date?: string;
  end_date?: string;
  sport_id?: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: string;
  bookings: number;
}

export interface RevenueReport {
  data: RevenueDataPoint[];
  total_revenue: string;
  total_bookings: number;
  average_booking_value: string;
}

export interface BookingReportParams {
  start_date?: string;
  end_date?: string;
  sport_id?: number;
  status?: BookingStatus;
}

export interface BookingReport {
  bookings: Booking[];
  summary: {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    pending: number;
    total_revenue: string;
  };
}

// Sports Revenue Report
export interface SportRevenueItem {
  sport_id: number;
  sport_name: string;
  sport_image: string | null;
  total_revenue: string;
  total_bookings: number;
  percentage: number;
}

export interface SportsRevenueReport {
  sports: SportRevenueItem[];
  total_revenue: string;
  total_sports: number;
}

// Super Admin Types
export interface IndoorAdminCreatePayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  // Venue / Complex registration fields
  venue_name: string;
  venue_address: string;
  venue_contact_number?: string;
  venue_email?: string;
  venue_location?: string;
  venue_complex_type?: string;
}

export interface IndoorAdmin extends User {
  managed_venue_details?: Venue;
}

export interface AssignVenuePayload {
  venue_id: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: string | string[] | undefined;
}

// Admin Manual Booking Types
export interface AdminHoldSlotPayload {
  sport_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

export interface AdminHoldSlotResponse {
  success: boolean;
  message: string;
  court_number: number;
  hold_until: string;
  available_courts: number;
}

export interface AdminBookingSlot {
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  price: number;
  duration?: number; // minutes, defaults to 60
}

export interface AdminCreateBookingPayload {
  sport_id: number;
  booking_date: string; // YYYY-MM-DD
  customer_name: string;
  customer_phone?: string;
  slots: AdminBookingSlot[];
  payment_method?: string; // defaults to 'Cash'
  payment_status?: 'Pending' | 'Paid'; // defaults to 'Paid'
  notes?: string;
  skip_hold?: boolean; // defaults to true
}

export interface AdminBookingResponse {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  court_number: number;
  price: string;
  is_admin_booking: boolean;
  walk_in_customer_name?: string;
  walk_in_customer_phone?: string;
  venue_name?: string;
  sport_name?: string;
  qr_code?: string;
  created_at: string;
}

export interface AdminCreateBookingResponse {
  message: string;
  bookings: AdminBookingResponse[];
}

export interface AdminCancelBookingResponse {
  message: string;
  booking: AdminBookingResponse;
}

// Staff Member Types
export interface StaffMember {
  id: number;
  name: string;
  role: string;
  shift: string;
  phone: string;
  photo?: string | null; // URL to staff photo
  status: string;
  status_detail: string;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffMemberCreatePayload {
  name: string;
  role: string;
  shift: string;
  phone?: string;
  photo?: {
    uri: string;
    name: string;
    type: string;
  };
  status?: string;
  status_detail?: string;
  is_online?: boolean;
}

export interface StaffMemberUpdatePayload extends Partial<StaffMemberCreatePayload> {}

// Slot Availability Types (for dashboard)
export interface TimeSlot {
  time: string;
  status: 'available' | 'booked' | 'past';
  booking_id?: number;
  customer_name?: string;
}

export interface CourtAvailability {
  court_number: number;
  slots: TimeSlot[];
}

export interface SportAvailability {
  sport_id: number;
  sport_name: string;
  courts: CourtAvailability[];
}

// Notification Types
export type AdminNotificationType =
  | 'new_booking'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'booking_updated'
  | 'password_changed'
  | 'system';

export interface AdminNotification {
  id: number;
  type: AdminNotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface AdminNotificationListResponse {
  count: number;
  page: number;
  page_size: number;
  results: AdminNotification[];
}

export interface AdminUnreadCountResponse {
  unread_count: number;
}
