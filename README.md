# Hotel Booking Platform - Complete System Documentation

## System Overview

A comprehensive hotel booking platform built with React, TypeScript, and Tailwind CSS that supports three distinct user roles with role-based access control, property management, booking systems, and advanced features like contract management, job orders, and analytics.

## 🏗️ Architecture Overview

### Code Organization
The codebase is organized into logical modules for better maintainability:

```
src/
├── components/           # UI Components
│   ├── layout/          # Layout components (Sidebar, Navigation)
│   ├── common/          # Reusable UI components (Modal, StatusBadge)
│   ├── features/        # Feature-specific components
│   │   ├── property/    # Property-related components
│   │   ├── booking/     # Booking-related components
│   │   └── contract/    # Contract-related components
│   └── [pages]/         # Page-level components (Dashboards, etc.)
├── config/              # Configuration and constants
│   ├── constants.ts     # Business rules, UI config, validation rules
│   ├── routes.ts        # Route definitions and permissions
│   └── permissions.ts   # Role-based access control
├── services/            # Business logic and data operations
│   ├── dataService.ts   # localStorage operations
│   ├── authService.ts   # Authentication logic
│   ├── propertyService.ts # Property management
│   ├── bookingService.ts  # Booking operations
│   └── contractService.ts # Contract management
├── utils/               # Utility functions
│   ├── calculations.ts  # Financial calculations
│   ├── dateHelpers.ts   # Date operations
│   ├── formatters.ts    # Data formatting
│   └── validators.ts    # Input validation
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
├── contexts/            # React Context providers
└── data/                # Initial JSON data files
```

### Data Flow Architecture

#### 1. Authentication Flow
```
LoginForm -> AuthService.login() -> Validate against users.json -> 
Store in localStorage -> AuthContext updates -> App re-renders with user role
```

#### 2. Property Lifecycle
```
Unit Owner submits -> PropertyService.submitProperty() -> 
Status: pending_review -> Property Manager reviews -> 
If approved: ContractService.createContract() -> Contract sent -> 
Owner accepts -> Property status: approved -> Live for bookings
```

#### 3. Booking Flow
```
Customer searches -> Filter approved properties -> Select dates -> 
BookingService.checkAvailability() -> Checkout -> 
BookingService.createBooking() -> Confirmation
```

#### 4. Data Persistence
```
Component updates -> useLocalStorage hook -> localStorage -> 
Storage event triggered -> Other components auto-update
```

## Architecture & Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Context API with localStorage persistence
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Data Storage**: JSON files with localStorage persistence and real-time sync

## 🔄 Data Management System

### Storage Strategy
- **Initial Data**: Static JSON files in `/src/data/` provide seed data
- **Runtime Storage**: localStorage maintains current state with real-time sync
- **Cross-Component Sync**: Custom storage events ensure all components stay updated

### Key Data Entities
1. **Users** (`users.json`) - Authentication and role management
2. **Properties** (`properties.json`) - Property listings and status
3. **Bookings** (`bookings.json`) - Reservation records
4. **Contracts** (`contracts.json`) - Property rental agreements
5. **Concerns** (`concerns.json`) - Guest issue reports
6. **Reviews** (`reviews.json`) - Property ratings and feedback

### Data Flow Patterns
- **Read**: Component -> useLocalStorage -> localStorage (with JSON fallback)
- **Write**: Component -> useLocalStorage -> localStorage -> Storage event -> Other components update
- **Validation**: All data changes go through service layer validation
- **Persistence**: Changes persist across browser sessions via localStorage
## User Roles & Access Control

### 1. Property Manager (Admin)
**Email**: `manager@hotelplatform.com` | **Password**: `manager123`

**Core Responsibilities:**
- **Property Review & Approval**: Review submitted properties, approve/reject with custom rates
- **Unit Owner Management**: Verify new unit owners, manage owner relationships
- **Contract Management**: Create and send contracts using customizable templates
- **System Oversight**: Monitor all bookings, concerns, and job orders across the platform
- **Analytics**: Access platform-wide analytics and performance metrics
- **Job Order Creation**: Convert concerns into actionable job orders for maintenance teams

**Key Features:**
- Property approval workflow with rate adjustment capabilities
- Contract template system with dynamic field generation
- Comprehensive dashboard with pending items and system stats
- Advanced filtering and search across all entities
- CSV export functionality for analytics data

### 2. Unit Owner (Merchant)
**Email**: `owner1@example.com` / `owner2@example.com` | **Password**: `owner123`

**Core Responsibilities:**
- **Property Management**: Add, edit, and manage property listings
- **Booking Oversight**: Monitor bookings for their properties
- **Contract Review**: Review and accept/reject contracts from property managers
- **Guest Communication**: Handle guest concerns and issues
- **Performance Tracking**: View analytics specific to their properties

**Key Features:**
- Property submission with comprehensive details (images, amenities, rates)
- Appeal system for rejected properties with edit capabilities
- Contract review interface with detailed terms and commission structure
- Property-specific booking and revenue analytics
- Guest concern management system

### 3. Customer (Guest)
**Email**: `customer@example.com` / `alice@example.com` | **Password**: `customer123`

**Core Responsibilities:**
- **Property Discovery**: Browse and search available properties
- **Booking Management**: Make reservations and manage existing bookings
- **Review System**: Leave reviews and ratings for completed stays
- **Issue Reporting**: Report concerns during active stays

**Key Features:**
- Advanced property search with date availability checking
- Interactive booking calendar with conflict prevention
- Comprehensive booking history with status tracking
- Review system with photo uploads and verification badges
- Real-time concern reporting during active stays

## Core System Features

### 1. Property Management System
- **Multi-step Approval Process**: Pending Review → Contract Negotiation → Live & Bookable
- **Dynamic Pricing**: Property managers can adjust proposed rates during approval
- **Appeal System**: Rejected properties can be appealed with modifications
- **Status Tracking**: Real-time status updates with detailed history
- **Image Gallery**: Multiple image support with URL-based uploads
- **Amenity Management**: Flexible amenity system with custom additions

### 2. Advanced Booking System
- **Date Availability Engine**: Real-time conflict checking prevents double bookings
- **Interactive Calendar**: Visual date selection with availability indicators
- **Booking Validation**: Comprehensive validation for dates, guests, and availability
- **Status Management**: Confirmed, Pending, Cancelled, Completed status tracking
- **Payment Integration**: Payment status tracking (currently simulated)
- **Guest Capacity Validation**: Automatic validation against property limits

### 3. Contract Management System
- **Template Engine**: Customizable contract templates with dynamic fields
- **Commission Structure**: Flexible commission rates (typically 15-22%)
- **Digital Workflow**: Electronic contract sending and acceptance
- **Field Validation**: Required and optional field management
- **Status Tracking**: Sent, Agreed, Disagreed status with timestamps
- **Disagreement Handling**: Reason tracking for contract rejections

### 4. Concern & Job Order System
- **Real-time Reporting**: Guests can report issues during active stays
- **Priority Classification**: High, Medium, Low priority levels
- **Status Workflow**: Pending → In Progress → Resolved
- **Communication Thread**: Multi-party messaging between guests, owners, and managers
- **Job Order Creation**: Convert concerns into actionable maintenance tasks
- **Team Assignment**: Assign specific teams/contractors to job orders
- **Progress Tracking**: Estimated completion times and status updates

### 5. Review & Rating System
- **Verified Reviews**: Only guests with completed stays can review
- **Photo Reviews**: Support for image uploads in reviews
- **Rating Aggregation**: Automatic average rating calculation
- **Review Reminders**: Automated reminders for recent guests
- **Filtering System**: Filter reviews by rating level
- **Review Validation**: Prevents duplicate reviews per booking

### 6. Analytics & Reporting
- **Revenue Analytics**: Comprehensive revenue tracking and projections
- **Occupancy Metrics**: Property utilization and performance tracking
- **User Analytics**: Platform growth and user engagement metrics
- **Export Functionality**: CSV export for detailed analysis
- **Performance Dashboards**: Role-specific analytics views
- **Trend Analysis**: Month-over-month performance comparisons

### 7. User Registration & Authentication
- **Multi-role Registration**: Customer and Merchant registration options
- **Email Validation**: Duplicate email prevention
- **Password Security**: Minimum security requirements
- **Account Verification**: Merchant accounts require admin approval
- **Session Management**: Persistent login with localStorage
- **Role-based Routing**: Automatic redirection based on user role

## Technical Implementation Details

### Configuration Management
All reusable values are centralized in `/src/config/`:
- **Business Rules**: Commission rates, fees, limits in `constants.ts`
- **UI Configuration**: Colors, animations, styling in `constants.ts`
- **Route Definitions**: Navigation structure in `routes.ts`
- **Permissions**: Role-based access control in `permissions.ts`

### State Management
- **AuthContext**: Manages user authentication state globally
- **useLocalStorage Hook**: Provides persistent storage with real-time sync
- **Service Layer**: Handles business logic and data validation
- **Component State**: Local UI state for forms and interactions

### Component Architecture
- **Layout Components**: Consistent navigation and page structure
- **Common Components**: Reusable UI elements (StatusBadge, Modal, etc.)
- **Feature Components**: Domain-specific components (PropertyCard, BookingCard)
- **Page Components**: Complete page implementations for each route
- **Service Integration**: Components use services for data operations

### Data Flow
1. **Authentication**: Login → AuthService → Context Update → Route Access
2. **Property Management**: Submit → PropertyService → Review → ContractService → Live
3. **Booking Process**: Search → BookingService.checkAvailability → Create → Confirm
4. **Real-time Updates**: Data Change → localStorage → Storage Event → Component Sync

### Security Features
- **Role-based Routing**: Routes filtered by user permissions
- **Data Access Control**: Services enforce role-based data access
- **Input Validation**: Comprehensive validation in utils/validators.ts
- **Secure Authentication**: Password excluded from stored user objects

## 🛠️ Development Guidelines

### Adding New Features
1. **Define Types**: Add TypeScript interfaces in `/src/types/`
2. **Create Service**: Add business logic in `/src/services/`
3. **Build Components**: Create reusable components in `/src/components/`
4. **Add Routes**: Update route configuration in `/src/config/routes.ts`
5. **Set Permissions**: Define access control in `/src/config/permissions.ts`

### Code Standards
- **Separation of Concerns**: UI components separate from business logic
- **Type Safety**: Full TypeScript coverage with strict types
- **Consistent Naming**: Clear, descriptive names for functions and variables
- **Documentation**: Inline comments explaining data flow and business logic
- **Reusability**: Common patterns extracted into reusable components

## Current System Status

### ✅ Implemented Features
- Complete user authentication and role management
- Property submission and approval workflow
- Advanced booking system with conflict prevention
- Contract management with template system
- Concern reporting and job order creation
- Review system with photo support
- Comprehensive analytics dashboards
- User registration with merchant verification
- Real-time data synchronization
- Export functionality

### 🔄 System Capabilities
- **Data Persistence**: All data persists across sessions via localStorage
- **Real-time Updates**: Changes reflect immediately across the platform
- **Conflict Prevention**: Robust validation prevents booking conflicts
- **Scalable Architecture**: Modular design supports feature expansion
- **Cross-platform Compatibility**: Works across all modern browsers

### 📊 Platform Statistics (Demo Data)
- **Properties**: 12 total (8 approved, 4 pending review)
- **Users**: 5 total (1 manager, 2 owners, 2 customers)
- **Bookings**: 5 confirmed bookings with $2,555 total revenue
- **Reviews**: Active review system with verification
- **Contracts**: 9 contracts (6 accepted, 2 pending, 1 rejected)

## 🚀 Quick Start Guide

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation
```bash
npm install
npm run dev
```

### Understanding the Codebase
1. **Start with `/src/App.tsx`** - Main routing and layout logic
2. **Review `/src/config/`** - Business rules and configuration
3. **Explore `/src/services/`** - Core business logic
4. **Check `/src/components/`** - UI component structure
5. **Study `/src/utils/`** - Helper functions and calculations

### Demo Accounts
Use these accounts to explore different user experiences:

**Property Manager**: `manager@hotelplatform.com` / `manager123`
**Unit Owner 1**: `owner1@example.com` / `owner123`  
**Unit Owner 2**: `owner2@example.com` / `owner123`
**Customer 1**: `customer@example.com` / `customer123`
**Customer 2**: `alice@example.com` / `customer123`

## 🔧 Maintenance and Extension

### Key Refactoring Improvements
1. **Centralized Configuration**: All business rules and constants in `/src/config/`
2. **Service Layer**: Business logic separated from UI components
3. **Reusable Components**: Common UI patterns extracted for consistency
4. **Type Safety**: Comprehensive TypeScript types for all data structures
5. **Clear Data Flow**: Well-documented data movement through the system

### Adding New User Roles
1. Add role to `USER_ROLES` in `constants.ts`
2. Define permissions in `permissions.ts`
3. Add routes in `routes.ts`
4. Create role-specific dashboard component
5. Update authentication and routing logic

### Extending Property Features
1. Add new fields to `Property` type in `types/index.ts`
2. Update validation rules in `utils/validators.ts`
3. Modify property forms and display components
4. Update property service methods as needed

## System Workflows

### Property Onboarding
1. Unit owner registers and awaits verification
2. Property manager verifies the owner
3. Owner submits property with details and proposed rate
4. Property manager reviews and approves with final rate
5. Contract is automatically generated and sent
6. Owner reviews and accepts contract
7. Property goes live and becomes bookable

### Booking Process
1. Customer searches properties by date and guest count
2. System shows only available properties
3. Customer selects dates using interactive calendar
4. System validates availability and prevents conflicts
5. Booking is confirmed with payment processing
6. All parties receive confirmation

### Issue Resolution
1. Guest reports concern during active stay
2. System notifies property owner and manager
3. Property manager can create job order if needed
4. Assigned team receives work order with details
5. Progress is tracked until resolution
6. Guest confirms issue resolution

This platform demonstrates a complete property management ecosystem with sophisticated workflows, real-time data management, and comprehensive user experiences for all stakeholder types. The refactored architecture provides a solid foundation for future enhancements while maintaining all existing functionality.