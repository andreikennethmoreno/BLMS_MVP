/**
 * Top Navigation Component
 * 
 * Provides horizontal navigation for customers.
 * Features:
 * - Responsive design with mobile menu
 * - User profile display
 * - Role-specific navigation items
 * 
 * Data Flow:
 * 1. Gets user from AuthContext
 * 2. Renders customer-specific navigation items
 * 3. Handles logout and profile display
 */

import React from 'react';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoutesForRole } from '../../config/routes';
import { getRoleColor } from '../../utils/statusHelpers';

interface TopNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
  onLoginClick?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ 
  currentView,
  onViewChange,
  showBackButton = false,
  backButtonText = 'Back',
  onBackClick,
  onLoginClick
}) => {
  const { user, logout } = useAuth();

  const navigationItems = user ? getRoutesForRole(user.role) : [];
  const roleColor = user ? getRoleColor(user.role) : 'bg-blue-600';

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation Items */}
          <div className="flex items-center space-x-8">
            {/* Back Button */}
            {showBackButton && onBackClick && (
              <button
                onClick={onBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{backButtonText}</span>
              </button>
            )}
            
            {showBackButton && <div className="h-6 w-px bg-gray-300"></div>}
            
            {/* Logo */}
            <div className="text-2xl font-bold text-gray-900">
              HotelPlatform
            </div>
            
            {/* Desktop Navigation */}
            {user && (
              <div className="hidden md:flex space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? `${roleColor} text-white`
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Profile and Logout */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-gray-500 capitalize">
                    {user.role?.replace('_', ' ')}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;

              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;