import React, { useMemo } from "react";
import {
  Home,
  Building,
  Users,
  Calendar,
  AlertTriangle,
  Wrench,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../contexts/AuthContext";

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
  const { user, logout, isLoading } = useAuth();

  const navigationItems = useMemo(() => {
    switch (user?.role) {
      case "property_manager":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "properties", label: "Properties", icon: Building },
          { id: "owners", label: "Unit Owners", icon: Users },
          { id: "bookings", label: "Bookings", icon: Calendar },
          { id: "concerns", label: "Concerns", icon: AlertTriangle },
          { id: "jobs", label: "Job Orders", icon: Wrench },
          { id: "forms", label: "Form Templates", icon: FileText },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
        ];
      case "unit_owner":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "properties", label: "My Properties", icon: Building },
          { id: "bookings", label: "Bookings", icon: Calendar },
          { id: "concerns", label: "Concerns", icon: AlertTriangle },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
        ];
      case "customer":
        return [
          { id: "browse", label: "Browse Properties", icon: Home },
          { id: "bookings", label: "My Bookings", icon: Calendar },
          { id: "concerns", label: "Report Issues", icon: AlertTriangle },
        ];
      default:
        return [];
    }
  }, [user?.role]);

  const getRoleVariant = () => {
    switch (user?.role) {
      case "property_manager":
        return "default";
      case "unit_owner":
        return "secondary";
      case "customer":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div
      className={`bg-background shadow-lg border-r transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } flex flex-col h-full`}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="text-xl font-bold">HotelPlatform</div>
          )}
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <Button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                variant={isActive ? getRoleVariant() : "ghost"}
                className={`w-full justify-start ${
                  isCollapsed ? "px-2" : "px-3"
                }`}
                title={isCollapsed ? item.label : undefined}
                disabled={isLoading}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      <Separator />

      {/* Auth & User Info Section */}
      <div className="p-4">
        {user ? (
          <>
            {/* User Info */}
            {!isCollapsed && (
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {user?.name}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {user?.role?.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              disabled={isLoading}
              variant="ghost"
              className={`w-full justify-start ${
                isCollapsed ? "px-2" : "px-3"
              }`}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && (
                <span className="ml-3 font-medium">
                  {isLoading ? 'Logging out...' : 'Logout'}
                </span>
              )}
            </Button>
          </>
        ) : (
          /* Login Button */
          <Button
            onClick={() => onViewChange("login")}
            className={`w-full justify-start ${
              isCollapsed ? "px-2" : "px-3"
            }`}
          >
            {isCollapsed ? (
              <span role="img" aria-label="login">
                🔑
              </span>
            ) : (
              <span className="font-medium">Login</span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;