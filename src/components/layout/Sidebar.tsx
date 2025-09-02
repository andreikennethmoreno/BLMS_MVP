/**
 * Sidebar Navigation Component
 * 
 * Provides navigation for property managers and unit owners.
 * Features:
 * - Collapsible sidebar with role-based menu items
 * - User profile display with role-specific colors
 * - Logout functionality
 * 
 * Data Flow:
 * 1. Gets user from AuthContext
 * 2. Filters navigation items based on user role
 * 3. Applies role-specific styling and colors
 */

import React from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getRoutesForRole } from "../../config/routes";
import { getRoleColor } from "../../utils/statusHelpers";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Get navigation items for current user role
  const navigationItems = getRoutesForRole(user.role);
  const roleColor = getRoleColor(user.role);

  return (
    <div
      className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } flex flex-col h-full`}
    >
      {/* Header with logo and collapse toggle */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="text-xl font-bold text-gray-900">HotelPlatform</div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? `${roleColor} text-white`
                    : "text-gray-600 hover:bg-gray-100"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info and Logout */}
      <div className="p-4 border-t border-gray-200">
        {/* Logout Button */}
        <button
          onClick={logout}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors 
            text-gray-600 hover:bg-gray-100 ${
              isCollapsed ? "justify-center" : ""
            }`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>

        {/* User Profile Info */}
        {!isCollapsed && (
          <div className="mt-4 flex items-center space-x-3">
            <div
              className={`w-10 h-10 ${roleColor} rounded-full flex items-center justify-center`}
            >
              <span className="text-white font-semibold text-sm">
                {user.name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {user.name}
              </div>
              <div className="text-sm text-gray-500 capitalize truncate">
                {user.role?.replace("_", " ")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;