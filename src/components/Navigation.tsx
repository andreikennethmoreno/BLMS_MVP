import React from 'react';
import { LogOut, Home, Building, Users, Settings, AlertTriangle, Wrench, FileText, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { user, logout } = useAuth();

  const getNavigationItems = () => {
    switch (user?.role) {
      case 'property_manager':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'properties', label: 'Properties', icon: Building },
          { id: 'owners', label: 'Unit Owners', icon: Users },
          { id: 'bookings', label: 'Bookings', icon: Settings },
          { id: 'calendar', label: 'Calendar', icon: Settings },
          { id: 'concerns', label: 'Concerns', icon: AlertTriangle },
          { id: 'jobs', label: 'Job Orders', icon: Wrench },
          { id: 'forms', label: 'Form Templates', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      case 'unit_owner':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'properties', label: 'My Properties', icon: Building },
          { id: 'bookings', label: 'Bookings', icon: Settings },
          { id: 'calendar', label: 'Calendar', icon: Settings },
          { id: 'concerns', label: 'Concerns', icon: AlertTriangle },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      case 'customer':
        return [
          { id: 'browse', label: 'Browse Properties', icon: Home },
          { id: 'bookings', label: 'My Bookings', icon: Settings },
          { id: 'concerns', label: 'Report Issues', icon: AlertTriangle }
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleColor = () => {
    switch (user?.role) {
      case 'property_manager':
        return 'bg-blue-600';
      case 'unit_owner':
        return 'bg-emerald-600';
      case 'customer':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold text-gray-900">
              HotelPlatform
            </div>
            
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === item.id
                        ? `${getRoleColor()} text-white`
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user?.name}</div>
              <div className="text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
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

export default Navigation;