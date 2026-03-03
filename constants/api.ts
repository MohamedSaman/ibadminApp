// Set your machine's LAN IP and port here so Expo (on your phone) can reach Django.
// Updated to 192.168.1.3
//  with CORS enabled on backend.
// Example: export const BASE_URL = 'http://192.168.1.9:8000';

// Ensure trailing slash so axios baseURL + endpoint paths concatenate correctly
export const BASE_URL = 'http://192.168.1.14:8000/';

// Legacy endpoints (for backward compatibility)
export const ENDPOINTS = {
  token: 'api/token/',
  refresh: 'api/token/refresh/',
  signup: 'api/auth/signup/',
  verifySignup: 'api/auth/verify-otp/',
  login: 'api/auth/login/',
};

// Indoor Admin API Endpoints
export const INDOOR_ADMIN_API = {
  // Authentication
  auth: {
    register: 'api/indoor-admin/auth/register/',
    login: 'api/indoor-admin/auth/login/',
    profile: 'api/indoor-admin/auth/profile/',
    changePassword: 'api/indoor-admin/auth/change-password/',
  },
  
  // Dashboard
  dashboard: {
    stats: 'api/indoor-admin/dashboard/stats/',
    revenueReport: 'api/indoor-admin/dashboard/revenue-report/',
    bookingReport: 'api/indoor-admin/dashboard/booking-report/',
    sportsRevenue: 'api/indoor-admin/dashboard/sports-revenue/',
    performance: 'api/indoor-admin/dashboard/performance/',
    exportCSV: 'api/indoor-admin/dashboard/export-csv/',
  },
  
  // Venue Management
  venue: {
    get: 'api/indoor-admin/venue/',
    update: 'api/indoor-admin/venue/',
  },
  
  // Sports Management
  sports: {
    list: 'api/indoor-admin/sports/',
    create: 'api/indoor-admin/sports/',
    detail: (id: number) => `api/indoor-admin/sports/${id}/`,
    update: (id: number) => `api/indoor-admin/sports/${id}/`,
    delete: (id: number) => `api/indoor-admin/sports/${id}/`,
    toggleStatus: (id: number) => `api/indoor-admin/sports/${id}/toggle_status/`,
  },
  
  // Bookings Management
  bookings: {
    list: 'api/indoor-admin/bookings/',
    detail: (id: number) => `api/indoor-admin/bookings/${id}/`,
    updateStatus: (id: number) => `api/indoor-admin/bookings/${id}/update_status/`,
    today: 'api/indoor-admin/bookings/today/',
    upcoming: 'api/indoor-admin/bookings/upcoming/',
    slots: 'api/indoor-admin/bookings/slots/',
    // Manual booking endpoints (walk-in customers)
    holdSlot: 'api/indoor-admin/bookings/hold-slot/',
    create: 'api/indoor-admin/bookings/create/',
    cancel: (id: number) => `api/indoor-admin/bookings/${id}/cancel/`,
    updatePayment: (id: number) => `api/indoor-admin/bookings/${id}/update_payment/`,
    // Permanent (recurring) booking endpoints
    permanentList: 'api/indoor-admin/bookings/permanent/',
    permanentCancelAll: (id: number) => `api/indoor-admin/bookings/permanent/${id}/cancel-all/`,
  },
  
  // Facilities Management
  facilities: {
    list: 'api/indoor-admin/facilities/',
    create: 'api/indoor-admin/facilities/',
    detail: (id: number) => `api/indoor-admin/facilities/${id}/`,
    update: (id: number) => `api/indoor-admin/facilities/${id}/`,
    delete: (id: number) => `api/indoor-admin/facilities/${id}/`,
  },
  
  // Discounts Management
  discounts: {
    list: 'api/indoor-admin/discounts/',
    create: 'api/indoor-admin/discounts/',
    detail: (id: number) => `api/indoor-admin/discounts/${id}/`,
    update: (id: number) => `api/indoor-admin/discounts/${id}/`,
    delete: (id: number) => `api/indoor-admin/discounts/${id}/`,
  },
  
  // Reviews
  reviews: {
    venue: 'api/indoor-admin/reviews/venue/',
    sports: 'api/indoor-admin/reviews/sports/',
  },
  
  // Super Admin (for superadmin users only)
  superAdmin: {
    create: 'api/indoor-admin/admin/create/',
    list: 'api/indoor-admin/admin/list/',
    detail: (id: number) => `api/indoor-admin/admin/${id}/`,
    assignVenue: (id: number) => `api/indoor-admin/admin/${id}/assign-venue/`,
    activate: (id: number) => `api/indoor-admin/admin/${id}/activate/`,
  },

  // Staff Members
  staff: {
    list: 'api/indoor-admin/staff/',
    create: 'api/indoor-admin/staff/',
    detail: (id: number) => `api/indoor-admin/staff/${id}/`,
    update: (id: number) => `api/indoor-admin/staff/${id}/`,
    delete: (id: number) => `api/indoor-admin/staff/${id}/`,
  },

  // Notifications
  notifications: {
    list: 'api/indoor-admin/notifications/',
    unreadCount: 'api/indoor-admin/notifications/unread-count/',
    markAllRead: 'api/indoor-admin/notifications/mark-all-read/',
    markRead: (id: number) => `api/indoor-admin/notifications/${id}/mark-read/`,
    delete: (id: number) => `api/indoor-admin/notifications/${id}/`,
  },
};



