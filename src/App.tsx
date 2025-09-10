import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import LandingPage from './components/LandingPage';
import SearchResultsPage from './components/SearchResultsPage';
import ListingDetailsPage from './components/ListingDetailsPage';
import AppLayout from './components/layout/AppLayout';
import PropertyManagerDashboard from './components/PropertyManagerDashboard';
import PropertyManagerProperties from './components/PropertyManagerProperties';
import PropertyManagerOwners from './components/PropertyManagerOwners';
import PropertyManagerBookings from './components/PropertyManagerBookings';
import CalendarView from './components/CalendarView';
import UnitOwnerDashboard from './components/UnitOwnerDashboard';
import UnitOwnerProperties from './components/UnitOwnerProperties';
import UnitOwnerBookings from './components/UnitOwnerBookings';
import CustomerDashboard from './components/CustomerDashboard';
import CustomerBookings from './components/CustomerBookings';
import ConcernSystem from './components/ConcernSystem';
import JobOrderSystem from './components/JobOrderSystem';
import FormTemplateSystem from './components/FormTemplateSystem';
import AnalyticsDashboard from './components/AnalyticsDashboard';

interface SearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

/**
 * Main App Content Component
 * 
 * Handles route rendering based on user role and current view.
 * This is the central routing logic that determines which component
 * to render based on the user's role and selected navigation item.
 * 
 * Data Flow:
 * 1. Gets authenticated user from AuthContext
 * 2. Determines current view from state
 * 3. Renders appropriate component based on role + view combination
 * 4. Wraps everything in AppLayout for consistent UI structure
 */
const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Handle search from landing page
  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    setCurrentView('search-results');
  };

  // Handle property selection from search results
  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setCurrentView('listing-details');
  };

  // Handle booking attempt - redirect to login if not authenticated
  const handleBookingAttempt = () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return false;
    }
    return true;
  };

  // Show login modal if requested
  if (showLogin) {
    return <LoginForm onClose={() => setShowLogin(false)} />;
  }

  // Landing page for non-authenticated users or when explicitly requested
  if (!isAuthenticated || currentView === 'landing') {
    return (
      <LandingPage 
        onSearch={handleSearch}
        onLogin={() => setShowLogin(true)}
        isAuthenticated={isAuthenticated}
        user={user}
      />
    );
  }

  // Search results page
  if (currentView === 'search-results' && searchParams) {
    return (
      <SearchResultsPage
        searchParams={searchParams}
        onPropertySelect={handlePropertySelect}
        onBackToLanding={() => setCurrentView('landing')}
        onLogin={() => setShowLogin(true)}
        isAuthenticated={isAuthenticated}
        user={user}
      />
    );
  }

  // Individual listing details page
  if (currentView === 'listing-details' && selectedPropertyId) {
    return (
      <>
      
        <ListingDetailsPage
          propertyId={selectedPropertyId}
          onBack={() => setCurrentView("search-results")}
          onBookingAttempt={handleBookingAttempt}
          onLogin={() => setShowLogin(true)}
          isAuthenticated={isAuthenticated}
          user={user}
        />
      </>
    );
  }

  /**
   * Route Rendering Logic
   * 
   * Maps view IDs to their corresponding components based on user role.
   * Each role has access to different views as defined in config/routes.ts
   */
  const renderContent = () => {
    // Property Manager Routes
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
        case 'calendar':
          return <CalendarView />;
        case 'concerns':
          return <ConcernSystem />;
        case 'jobs':
          return <JobOrderSystem />;
        case 'forms':
          return <FormTemplateSystem />;
        case 'analytics':
          return <AnalyticsDashboard />;
        default:
          return <PropertyManagerDashboard />;
      }
    }

    // Unit Owner Routes
    if (user?.role === 'unit_owner') {
      switch (currentView) {
        case 'dashboard':
          return <UnitOwnerDashboard />;
        case 'properties':
          return <UnitOwnerProperties />;
        case 'bookings':
          return <UnitOwnerBookings />;
        case 'calendar':
          return <CalendarView />;
        case 'concerns':
          return <ConcernSystem />;
        case 'analytics':
          return <AnalyticsDashboard />;
        default:
          return <UnitOwnerDashboard />;
      }
    }

    // Customer Routes
    if (user?.role === 'customer') {
      switch (currentView) {
        case 'landing':
          return (
            <LandingPage 
              onSearch={handleSearch}
              onLogin={() => setShowLogin(true)}
              isAuthenticated={isAuthenticated}
              user={user}
            />
          );
        case 'browse':
          return <CustomerDashboard />;
        case 'bookings':
          return <CustomerBookings />;
        case 'concerns':
          return <ConcernSystem />;
        default:
          return (
            <LandingPage 
              onSearch={handleSearch}
              onLogin={() => setShowLogin(true)}
              isAuthenticated={isAuthenticated}
              user={user}
            />
          );
      }
    }

    return <div>Unknown user role</div>;
  };

  return (
    <AppLayout 
      currentView={currentView} 
      onViewChange={setCurrentView}
    >
      {renderContent()}
    </AppLayout>
  );
};

/**
 * Root App Component
 * 
 * Wraps the entire application with necessary providers.
 * The AuthProvider manages user authentication state and provides
 * it to all child components through React Context.
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;