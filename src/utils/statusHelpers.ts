/**
 * Status Helper Functions
 * 
 * This module provides utilities for working with various status values
 * including colors, icons, and text formatting.
 */

import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  FileText,
  Wrench,
  Star
} from 'lucide-react';
import { UI_CONFIG } from '../config/constants';
import type { PropertyStatus, BookingStatus, ContractStatus, ConcernStatus, JobOrderStatus, PriorityLevel } from '../types';

/**
 * Get CSS classes for status display
 */
export const getStatusColor = (status: string): string => {
  return UI_CONFIG.STATUS_COLORS[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Get appropriate icon component for status
 */
export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed':
    case 'approved':
    case 'agreed':
    case 'completed':
    case 'resolved':
      return CheckCircle;
    case 'pending':
    case 'pending_review':
    case 'pending_contract':
    case 'sent':
    case 'in_progress':
      return Clock;
    case 'cancelled':
    case 'rejected':
    case 'disagreed':
      return XCircle;
    case 'high':
      return AlertTriangle;
    default:
      return FileText;
  }
};

/**
 * Format status text for display
 */
export const formatStatusText = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get priority icon
 */
export const getPriorityIcon = (priority: PriorityLevel) => {
  switch (priority) {
    case 'high':
      return AlertTriangle;
    case 'medium':
      return Clock;
    case 'low':
      return CheckCircle;
    default:
      return Clock;
  }
};

/**
 * Get role-specific color
 */
export const getRoleColor = (role: string): string => {
  return UI_CONFIG.ROLE_COLORS[role] || 'bg-gray-600';
};

/**
 * Check if status indicates completion
 */
export const isStatusComplete = (status: string): boolean => {
  const completeStatuses = ['approved', 'completed', 'resolved', 'agreed', 'confirmed'];
  return completeStatuses.includes(status);
};

/**
 * Check if status indicates pending state
 */
export const isStatusPending = (status: string): boolean => {
  const pendingStatuses = ['pending', 'pending_review', 'pending_contract', 'sent', 'in_progress'];
  return pendingStatuses.includes(status);
};

/**
 * Check if status indicates failure/rejection
 */
export const isStatusRejected = (status: string): boolean => {
  const rejectedStatuses = ['rejected', 'cancelled', 'disagreed', 'failed'];
  return rejectedStatuses.includes(status);
};