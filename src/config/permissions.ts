/**
 * Permission System Configuration
 * 
 * Defines what actions each user role can perform.
 * This centralizes authorization logic and makes it easier to manage permissions.
 */

import type { UserRole } from '../types';

/**
 * Available actions in the system
 */
export const ACTIONS = {
  // Property actions
  VIEW_ALL_PROPERTIES: 'view_all_properties',
  VIEW_OWN_PROPERTIES: 'view_own_properties',
  CREATE_PROPERTY: 'create_property',
  EDIT_PROPERTY: 'edit_property',
  APPROVE_PROPERTY: 'approve_property',
  REJECT_PROPERTY: 'reject_property',
  
  // Booking actions
  VIEW_ALL_BOOKINGS: 'view_all_bookings',
  VIEW_OWN_BOOKINGS: 'view_own_bookings',
  CREATE_BOOKING: 'create_booking',
  CANCEL_BOOKING: 'cancel_booking',
  WALK_IN_REGISTRATION: 'walk_in_registration',
  
  // Contract actions
  CREATE_CONTRACT: 'create_contract',
  REVIEW_CONTRACT: 'review_contract',
  SIGN_CONTRACT: 'sign_contract',
  
  // User management
  VERIFY_USERS: 'verify_users',
  VIEW_USER_DETAILS: 'view_user_details',
  
  // Concern and job order actions
  CREATE_CONCERN: 'create_concern',
  VIEW_ALL_CONCERNS: 'view_all_concerns',
  VIEW_OWN_CONCERNS: 'view_own_concerns',
  CREATE_JOB_ORDER: 'create_job_order',
  MANAGE_JOB_ORDERS: 'manage_job_orders',
  
  // Analytics and reporting
  VIEW_PLATFORM_ANALYTICS: 'view_platform_analytics',
  VIEW_OWN_ANALYTICS: 'view_own_analytics',
  EXPORT_DATA: 'export_data',
  
  // Review system
  CREATE_REVIEW: 'create_review',
  VIEW_REVIEWS: 'view_reviews',
} as const;

/**
 * Permission matrix defining what each role can do
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  property_manager: [
    ACTIONS.VIEW_ALL_PROPERTIES,
    ACTIONS.APPROVE_PROPERTY,
    ACTIONS.REJECT_PROPERTY,
    ACTIONS.VIEW_ALL_BOOKINGS,
    ACTIONS.CREATE_CONTRACT,
    ACTIONS.VERIFY_USERS,
    ACTIONS.VIEW_USER_DETAILS,
    ACTIONS.VIEW_ALL_CONCERNS,
    ACTIONS.CREATE_JOB_ORDER,
    ACTIONS.MANAGE_JOB_ORDERS,
    ACTIONS.VIEW_PLATFORM_ANALYTICS,
    ACTIONS.EXPORT_DATA,
    ACTIONS.VIEW_REVIEWS,
    ACTIONS.WALK_IN_REGISTRATION,
  ],
  
  unit_owner: [
    ACTIONS.VIEW_OWN_PROPERTIES,
    ACTIONS.CREATE_PROPERTY,
    ACTIONS.EDIT_PROPERTY,
    ACTIONS.VIEW_OWN_BOOKINGS,
    ACTIONS.REVIEW_CONTRACT,
    ACTIONS.SIGN_CONTRACT,
    ACTIONS.VIEW_OWN_CONCERNS,
    ACTIONS.VIEW_OWN_ANALYTICS,
    ACTIONS.VIEW_REVIEWS,
  ],
  
  customer: [
    ACTIONS.VIEW_ALL_PROPERTIES, // Only approved properties
    ACTIONS.CREATE_BOOKING,
    ACTIONS.VIEW_OWN_BOOKINGS,
    ACTIONS.CANCEL_BOOKING,
    ACTIONS.CREATE_CONCERN,
    ACTIONS.VIEW_OWN_CONCERNS,
    ACTIONS.CREATE_REVIEW,
    ACTIONS.VIEW_REVIEWS,
  ],
};

/**
 * Check if user has permission for specific action
 */
export const hasPermission = (userRole: UserRole, action: string): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(action) || false;
};

/**
 * Get all permissions for a role
 */
export const getPermissionsForRole = (role: UserRole): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};