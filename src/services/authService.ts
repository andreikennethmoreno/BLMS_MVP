/**
 * Authentication Service
 * 
 * This service handles all authentication-related operations including
 * login, logout, user verification, and session management.
 * 
 * Data Flow:
 * 1. Login attempt -> validate credentials against users.json
 * 2. Success -> store user in localStorage -> update auth context
 * 3. Logout -> clear localStorage -> update auth context
 */

import { STORAGE_KEYS } from '../config/constants';
import { dataService, userDataService } from './dataService';
import type { User, UserRole } from '../types';
import usersData from '../data/users.json';

/**
 * Authentication service class
 */
class AuthService {
  /**
   * Authenticate user with email and password
   * Returns user data without password if successful
   */
  login(email: string, password: string): User | null {
    const users = userDataService.getAll();
    const foundUser = users.find((u: any) => 
      u.email === email && u.password === password
    );

    if (foundUser) {
      // Remove password from user object for security
      const { password: _, ...userWithoutPassword } = foundUser;
      const authenticatedUser = userWithoutPassword as User;
      
      // Store authenticated user
      dataService.setData(STORAGE_KEYS.USER, authenticatedUser);
      return authenticatedUser;
    }
    
    return null;
  }

  /**
   * Log out current user
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    
    // Trigger storage event to update auth context
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.USER,
      newValue: null
    }));
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return dataService.getData(STORAGE_KEYS.USER, null);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Register new user (for unit owners)
   */
  registerUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      verified: false, // Unit owners need verification
    };

    userDataService.add(newUser);
    return newUser;
  }

  /**
   * Verify user (property manager action)
   */
  verifyUser(userId: string): void {
    userDataService.update(userId, { verified: true });
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: User | null, role: UserRole): boolean {
    return user?.role === role;
  }

  /**
   * Check if user is verified
   */
  isUserVerified(user: User | null): boolean {
    return user?.verified === true;
  }
}

// Export singleton instance
export const authService = new AuthService();