import React from 'react';
import { LogOut, Home, Building, Users, Settings, AlertTriangle, Wrench, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const getRoleVariant = () => {
    switch (user?.role) {
      case 'property_manager':
        return 'default';
      case 'unit_owner':
        return 'secondary';
      case 'customer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <nav className="bg-background shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold">
              HotelPlatform
            </div>
            
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    variant={currentView === item.id ? getRoleVariant() : "ghost"}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-medium">{user?.name}</div>
              <Badge variant="secondary" className="text-xs">
                {user?.role?.replace('_', ' ')}
              </Badge>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;