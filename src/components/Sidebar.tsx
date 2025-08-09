import React from 'react';
import { 
  Home, 
  Building, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Wrench, 
  FileText, 
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  onToggleCollapse 
}) => {
  const { user } = useAuth();

  const getNavigationItems = () => {
    switch (user?.role) {
      case 'property_manager':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'properties', label: 'Properties', icon: Building },
          { id: 'owners', label: 'Unit Owners', icon: Users },
          { id: 'bookings', label: 'Bookings', icon: Calendar },
          { id: 'concerns', label: 'Concerns', icon: AlertTriangle },
          { id: 'jobs', label: 'Job Orders', icon: Wrench },
          { id: 'forms', label: 'Form Templates', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      case 'unit_owner':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'properties', label: 'My Properties', icon: Building },
          { id: 'bookings', label: 'Bookings', icon: Calendar },
          { id: 'concerns', label: 'Concerns', icon: AlertTriangle },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      case 'customer':
        return [
          { id: 'browse', label: 'Browse Properties', icon: Home },
          { id: 'bookings', label: 'My Bookings', icon: Calendar },
          { id: 'concerns', label: 'Report Issues', icon: AlertTriangle }
        ];
      default:
        return [];
    }
  };

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

  const navigationItems = getNavigationItems();

  return (
    <div className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="text-xl font-bold text-gray-900">
              HotelPlatform
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                    ? `${getRoleColor()} text-white`
                    : 'text-gray-600 hover:bg-gray-100'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${getRoleColor()} rounded-full flex items-center justify-center`}>
              <span className="text-white font-semibold text-sm">
                {user?.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{user?.name}</div>
              <div className="text-sm text-gray-500 capitalize truncate">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;