/**
 * Global Configuration Constants
 * 
 * This file centralizes all reusable values across the application to improve
 * maintainability and consistency. Instead of scattering magic numbers and
 * strings throughout components, they are defined here once.
 */

// ===== BUSINESS RULES =====
export const BUSINESS_CONFIG = {
  // Commission and pricing
  DEFAULT_COMMISSION_PERCENTAGE: 15,
  MIN_COMMISSION_PERCENTAGE: 10,
  MAX_COMMISSION_PERCENTAGE: 25,
  
  // Booking rules
  MIN_NIGHTS: 1,
  MAX_GUESTS_PER_BOOKING: 20,
  
  // Fees (as percentages)
  SERVICE_FEE_PERCENTAGE: 12,
  TAX_PERCENTAGE: 8,
  
  // Property limits
  MIN_PROPERTY_RATE: 50,
  MAX_PROPERTY_RATE: 10000,
  
  // Review system
  MIN_RATING: 1,
  MAX_RATING: 5,
  
  // Appeal limits
  MAX_APPEALS_PER_PROPERTY: 3,
  
  // Voucher system
  MIN_VOUCHER_DISCOUNT_PERCENTAGE: 1,
  MAX_VOUCHER_DISCOUNT_PERCENTAGE: 50,
  MIN_VOUCHER_DISCOUNT_FIXED: 1,
  MAX_VOUCHER_DISCOUNT_FIXED: 1000,
  DEFAULT_VOUCHER_USAGE_LIMIT: 100,
  VOUCHER_CODE_LENGTH: 8,
} as const;

// ===== USER ROLES =====
export const USER_ROLES = {
  PROPERTY_MANAGER: 'property_manager',
  UNIT_OWNER: 'unit_owner',
  CUSTOMER: 'customer',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// ===== STATUS DEFINITIONS =====
export const PROPERTY_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING_CONTRACT: 'pending_contract',
} as const;

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const CONTRACT_STATUS = {
  SENT: 'sent',
  AGREED: 'agreed',
  DISAGREED: 'disagreed',
} as const;

export const CONCERN_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
} as const;

export const JOB_ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// ===== UI CONFIGURATION =====
export const UI_CONFIG = {
  // Sidebar
  SIDEBAR_COLLAPSED_WIDTH: 'w-16',
  SIDEBAR_EXPANDED_WIDTH: 'w-64',
  
  // Colors by role
  ROLE_COLORS: {
    [USER_ROLES.PROPERTY_MANAGER]: 'bg-blue-600',
    [USER_ROLES.UNIT_OWNER]: 'bg-emerald-600',
    [USER_ROLES.CUSTOMER]: 'bg-purple-600',
  },
  
  // Status colors
  STATUS_COLORS: {
    // Property statuses
    [PROPERTY_STATUS.PENDING_REVIEW]: 'text-orange-600 bg-orange-100',
    [PROPERTY_STATUS.APPROVED]: 'text-emerald-600 bg-emerald-100',
    [PROPERTY_STATUS.REJECTED]: 'text-red-600 bg-red-100',
    [PROPERTY_STATUS.PENDING_CONTRACT]: 'text-blue-600 bg-blue-100',
    
    // Booking statuses
    [BOOKING_STATUS.CONFIRMED]: 'text-emerald-600 bg-emerald-100',
    [BOOKING_STATUS.PENDING]: 'text-orange-600 bg-orange-100',
    [BOOKING_STATUS.CANCELLED]: 'text-red-600 bg-red-100',
    [BOOKING_STATUS.COMPLETED]: 'text-blue-600 bg-blue-100',
    
    // Priority levels
    [PRIORITY_LEVELS.HIGH]: 'text-red-600 bg-red-100',
    [PRIORITY_LEVELS.MEDIUM]: 'text-yellow-600 bg-yellow-100',
    [PRIORITY_LEVELS.LOW]: 'text-green-600 bg-green-100',
  },
  
  // Animation classes
  ANIMATIONS: {
    SLIDE_IN: 'animate-slide-in',
    FADE_IN: 'transition-opacity duration-300',
    SCALE_IN: 'transition-transform duration-200 hover:scale-105',
  },
} as const;

// ===== STORAGE KEYS =====
export const STORAGE_KEYS = {
  USER: 'hotelUser',
  PROPERTIES: 'properties',
  BOOKINGS: 'bookings',
  CONTRACTS: 'contracts',
  CONCERNS: 'concerns',
  JOB_ORDERS: 'jobOrders',
  REVIEWS: 'reviews',
  FORM_TEMPLATES: 'formTemplates',
  PDF_DOCUMENTS: 'pdfDocuments',
  DOCUMENT_SIGNATURES: 'documentSignatures',
  REVIEW_REMINDERS: 'reviewReminders',
  USERS: 'users',
  VOUCHERS: 'vouchers',
  VOUCHER_USAGE: 'voucherUsage',
} as const;

// ===== DEMO ACCOUNTS =====
export const DEMO_ACCOUNTS = [
  {
    role: "Property Manager",
    email: "manager@hotelplatform.com",
    password: "manager123",
  },
  { 
    role: "Unit Owner 1", 
    email: "owner1@example.com", 
    password: "owner123" 
  },
  { 
    role: "Unit Owner 2", 
    email: "owner2@example.com", 
    password: "owner123" 
  },
  {
    role: "Customer 1",
    email: "customer@example.com",
    password: "customer123",
  },
  {
    role: "Customer 2",
    email: "alice@example.com",
    password: "customer123",
  },
] as const;

// ===== VALIDATION RULES =====
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\(\d{3}\) \d{3}-\d{4}$/,
  PASSWORD_MIN_LENGTH: 6,
  PROPERTY_TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  MAX_IMAGES_PER_PROPERTY: 10,
  MAX_AMENITIES_PER_PROPERTY: 20,
} as const;

// ===== API ENDPOINTS (for future backend integration) =====
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
  },
  PROPERTIES: {
    LIST: '/api/properties',
    CREATE: '/api/properties',
    UPDATE: '/api/properties/:id',
    DELETE: '/api/properties/:id',
    APPROVE: '/api/properties/:id/approve',
    REJECT: '/api/properties/:id/reject',
  },
  BOOKINGS: {
    LIST: '/api/bookings',
    CREATE: '/api/bookings',
    UPDATE: '/api/bookings/:id',
    CANCEL: '/api/bookings/:id/cancel',
  },
  CONTRACTS: {
    LIST: '/api/contracts',
    CREATE: '/api/contracts',
    SIGN: '/api/contracts/:id/sign',
  },
} as const;