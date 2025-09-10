/**
 * App Layout Component
 * 
 * Main layout wrapper that handles:
 * - Role-based navigation (sidebar vs top nav)
 * - Route rendering based on user permissions
 * - Layout switching between customer and admin interfaces
 * 
 * Data Flow:
 * 1. Gets current user from AuthContext
 * 2. Determines layout type based on user role
 * 3. Renders appropriate navigation and content area
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';
import { getRoutesForRole } from '../../config/routes';

interface AppLayoutProps {
  currentView: string;
  onViewChange: (view: string) => void;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  currentView, 
  onViewChange, 
  children 
}) => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Logged-out layout (landing, login, register, etc.)
if (!user) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNavigation
        currentView="landing"
        onViewChange={() => {}}
        onLoginClick={() => (window.location.href = "/login")}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}

  // Customer layout uses top navigation
  if (user.role === 'customer') {
    return (
      <>
        <TopNavigation 
          currentView={currentView} 
          onViewChange={onViewChange} 
        />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </>
    );
  }

  // Admin layouts (property_manager, unit_owner) use sidebar
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;