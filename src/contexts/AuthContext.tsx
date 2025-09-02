/**
 * Authentication Context
 * 
 * Manages user authentication state throughout the application.
 * Provides login/logout functionality and persists user session.
 * 
 * Data Flow:
 * 1. Login: Validates credentials against users.json -> stores user in localStorage
 * 2. Session restore: Checks localStorage on app load -> restores user state
 * 3. Logout: Clears localStorage -> resets user state
 * 
 * Storage: Uses localStorage key 'hotelUser' for session persistence
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import usersData from '../data/users.json';

export type UserRole = 'property_manager' | 'unit_owner' | 'customer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  verified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  /**
   * Session Restoration
   * 
   * On app load, check if user session exists in localStorage
   * and restore the authenticated state
   */
  useEffect(() => {
    const savedUser = localStorage.getItem('hotelUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  /**
   * User Login
   * 
   * Process:
   * 1. Find user in users.json with matching email/password
   * 2. Remove password from user object for security
   * 3. Store user in localStorage and state
   * 4. Return success/failure status
   */
  const login = (email: string, password: string): boolean => {
    const foundUser = usersData.users.find(u => 
      u.email === email && u.password === password
    );

    if (foundUser) {
      // Create user object without password for security
      const userWithoutPassword = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role as UserRole,
        name: foundUser.name,
        verified: foundUser.verified,
        createdAt: foundUser.createdAt
      };
      
      setUser(userWithoutPassword);
      localStorage.setItem('hotelUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  /**
   * User Logout
   * 
   * Clears user state and removes session from localStorage
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('hotelUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};