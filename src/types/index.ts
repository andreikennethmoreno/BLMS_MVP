/**
 * Type Definitions
 * 
 * Centralized type definitions for the entire application.
 * This ensures type consistency and makes it easier to maintain
 * data structures across components.
 */

import { USER_ROLES, PROPERTY_STATUS, BOOKING_STATUS, CONTRACT_STATUS, CONCERN_STATUS, JOB_ORDER_STATUS, PRIORITY_LEVELS } from '../config/constants';

// ===== USER TYPES =====
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export interface User {
  id: string;
  email: string;
  password?: string; // Optional for security (not included in auth context)
  role: UserRole;
  name: string;
  verified: boolean;
  createdAt: string;
  onboardingData?: OnboardingData; // For unit owners
}

export interface OnboardingData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
  identity: {
    idType: string;
    idNumber: string;
    idDocument: string;
    selfieDocument: string;
  };
  business: {
    businessType: string;
    businessName: string;
    taxId: string;
    businessAddress: string;
    yearsInBusiness: string;
  };
  financial: {
    bankAccount: string;
    routingNumber: string;
    accountType: string;
    monthlyIncome: string;
    creditScore: string;
  };
  property: {
    propertyCount: string;
    propertyTypes: string[];
    totalValue: string;
    experience: string;
  };
}

// ===== PROPERTY TYPES =====
export type PropertyStatus = typeof PROPERTY_STATUS[keyof typeof PROPERTY_STATUS];

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  address: string;
  images: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  proposedRate: number;
  baseRate?: number; // Rate before commission
  finalRate: number | null; // Rate after commission
  commissionPercentage?: number;
  commissionAmount?: number;
  rentalType?: 'short-term' | 'long-term'; // Owner-specified rental type
  maxStayDays?: number; // Maximum stay length in days
  maxStayUnit?: 'days' | 'months' | 'years'; // Unit for maximum stay
  maxStayDisplay?: string; // Human-readable display of max stay
  termClassification?: 'short-term' | 'long-term'; // Auto-calculated based on max stay
  status: PropertyStatus;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  appealCount?: number;
  contractSentAt?: string;
  contractAcceptedAt?: string;
  contractApproved?: boolean;
  managerApproved?: boolean;
}

// ===== BOOKING TYPES =====
export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

export interface Booking {
  id: string;
  propertyId: string;
  customerId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: 'paid' | 'pending' | 'failed';
  bookedAt: string;
  customerName: string;
  customerEmail: string;
}

// ===== CONTRACT TYPES =====
export type ContractStatus = typeof CONTRACT_STATUS[keyof typeof CONTRACT_STATUS];

export interface ContractField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'checkbox';
  required: boolean;
  value?: string;
  defaultValue?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: ContractField[];
  commissionPercentage: number;
  createdAt: string;
  createdBy: string;
}

export interface Contract {
  id: string;
  templateId: string;
  propertyId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  templateName: string;
  terms: string;
  commissionPercentage: number;
  fields?: ContractField[];
  baseRate?: number;
  finalRate?: number;
  status: ContractStatus;
  sentAt: string;
  reviewedAt?: string;
  agreedAt?: string;
  disagreedAt?: string;
  disagreementReason?: string;
}

// ===== CONCERN & JOB ORDER TYPES =====
export type ConcernStatus = typeof CONCERN_STATUS[keyof typeof CONCERN_STATUS];
export type JobOrderStatus = typeof JOB_ORDER_STATUS[keyof typeof JOB_ORDER_STATUS];
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface Concern {
  id: string;
  bookingId: string;
  propertyId: string;
  customerId: string;
  ownerId: string;
  title: string;
  description: string;
  status: ConcernStatus;
  priority: PriorityLevel;
  createdAt: string;
  customerName: string;
  messages: Message[];
}

export interface JobOrder {
  id: string;
  concernId: string;
  propertyId: string;
  ownerId: string;
  title: string;
  description: string;
  assignedTeam: string;
  status: JobOrderStatus;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion: string;
  notes: string;
  createdBy: string;
}

// ===== REVIEW TYPES =====
export interface Review {
  id: string;
  propertyId: string;
  customerId: string;
  bookingId: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  customerName: string;
  verified: boolean;
}

// ===== PDF DOCUMENT TYPES =====
export interface PDFDocument {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  createdBy: string;
  createdAt: string;
  sentTo: string[];
  category: 'contract' | 'form' | 'agreement' | 'notice';
  status: 'draft' | 'sent' | 'signed' | 'completed';
  signatures: DocumentSignature[];
}

export interface DocumentSignature {
  id: string;
  documentId: string;
  signedBy: string;
  signerName: string;
  signedAt: string;
  signedPdfUrl: string;
}

// ===== ANALYTICS TYPES =====
export interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  occupancyRate: number;
  monthlyRevenue: MonthlyRevenueData[];
  topProperties: PropertyPerformance[];
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

export interface PropertyPerformance {
  id: string;
  title: string;
  revenue: number;
  bookings: number;
  images: string[];
}

// ===== FORM TYPES =====
export interface BookingFilters {
  ownerId: string;
  propertyId: string;
  minPrice: number;
  maxPrice: number;
  minGuests: number;
  maxGuests: number;
  status: string;
}

export interface PropertyFilters {
  search: string;
  status: string;
  unitType: string;
  timeline: string;
  sortBy: string;
}

// ===== CALCULATION TYPES =====
export interface PropertyRateCalculation {
  baseRate: number;
  commissionPercentage: number;
  finalRate: number;
  commissionAmount: number;
}

export interface BookingCalculation {
  subtotal: number;
  serviceFee: number;
  taxes: number;
  total: number;
  nights: number;
  ratePerNight: number;
}

// ===== NAVIGATION TYPES =====
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

// ===== MODAL TYPES =====
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// ===== SIGNATURE TYPES =====
export interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}