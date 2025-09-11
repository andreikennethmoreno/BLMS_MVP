/**
 * Application Routes Configuration
 * 
 * Defines all available routes/views for each user role.
 * This centralizes navigation logic and makes it easier to add new routes.
 */

import { 
  Home, 
  Building, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Wrench, 
  FileText, 
  BarChart3,
  Ticket
} from 'lucide-react';
import type { UserRole } from '../types';

export interface RouteConfig {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}

/**
 * All available routes in the application
 * Each route specifies which user roles can access it
 */
export const ROUTES: RouteConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    roles: ['property_manager', 'unit_owner']
  },
  {
    id: 'landing',
    label: 'Home',
    icon: Home,
    roles: ['customer']
  },
  {
    id: 'browse',
    label: 'Browse Properties',
    icon: Home,
    roles: ['customer']
  },
  {
    id: 'properties',
    label: 'Properties',
    icon: Building,
    roles: ['property_manager', 'unit_owner']
  },
  {
    id: 'owners',
    label: 'Unit Owners',
    icon: Users,
    roles: ['property_manager']
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: Calendar,
    roles: ['property_manager', 'unit_owner', 'customer']
  },
  {
    id: 'calendar',
    label: 'Calendar View',
    icon: Calendar,
    roles: ['property_manager', 'unit_owner']
  },
  {
    id: 'concerns',
    label: 'Concerns',
    icon: AlertTriangle,
    roles: ['property_manager', 'unit_owner', 'customer']
  },
  {
    id: 'jobs',
    label: 'Job Orders',
    icon: Wrench,
    roles: ['property_manager']
  },
  {
    id: 'forms',
    label: 'Form Templates',
    icon: FileText,
    roles: ['property_manager']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['property_manager', 'unit_owner']
  },
  {
    id: 'vouchers',
    label: 'Vouchers',
    icon: Ticket,
    roles: ['unit_owner']
  }
];

/**
 * Get available routes for a specific user role
 */
export const getRoutesForRole = (role: UserRole): RouteConfig[] => {
  return ROUTES.filter(route => route.roles.includes(role));
};

/**
 * Check if a route is accessible for a user role
 */
export const canAccessRoute = (routeId: string, role: UserRole): boolean => {
  const route = ROUTES.find(r => r.id === routeId);
  return route ? route.roles.includes(role) : false;
};