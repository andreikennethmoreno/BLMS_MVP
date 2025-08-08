import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Navigation from './components/Navigation';
import PropertyManagerDashboard from './components/PropertyManagerDashboard';
import PropertyManagerProperties from './components/PropertyManagerProperties';
import PropertyManagerOwners from './components/PropertyManagerOwners';
import PropertyManagerBookings from './components/PropertyManagerBookings';
import UnitOwnerDashboard from './components/UnitOwnerDashboard';
import UnitOwnerProperties from './components/UnitOwnerProperties';
import UnitOwnerBookings from './components/UnitOwnerBookings';
import CustomerDashboard from './components/CustomerDashboard';
import CustomerBookings from './components/CustomerBookings';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    if (user?.role === 'property_manager') {
      switch (currentView) {
        case 'dashboard':
          return <PropertyManagerDashboard />;
        case 'properties':
          return <PropertyManagerProperties />;
        case 'owners':
          return <PropertyManagerOwners />;
        case 'bookings':
          return <PropertyManagerBookings />;
        default:
          return <PropertyManagerDashboard />;
      }
    }

    if (user?.role === 'unit_owner') {
      switch (currentView) {
        case 'dashboard':
          return <UnitOwnerDashboard />;
        case 'properties':
          return <UnitOwnerProperties />;
        case 'bookings':
          return <UnitOwnerBookings />;
        default:
          return <UnitOwnerDashboard />;
      }
    }

    if (user?.role === 'customer') {
      switch (currentView) {
        case 'browse':
          return <CustomerDashboard />;
        case 'bookings':
          return <CustomerBookings />;
        default:
          return <CustomerDashboard />;
      }
    }

    return <div>Unknown user role</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {renderContent()}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;