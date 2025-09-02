/**
 * Data Service
 * 
 * This service handles all data persistence operations using localStorage.
 * It provides a consistent interface for CRUD operations and manages
 * data synchronization across components.
 * 
 * Data Flow:
 * 1. Components call service methods
 * 2. Service reads/writes to localStorage
 * 3. Service triggers storage events for real-time updates
 * 4. Other components listening to storage events update automatically
 */

import { STORAGE_KEYS } from '../config/constants';

/**
 * Generic data service for localStorage operations
 */
class DataService {
  /**
   * Get data from localStorage with fallback
   */
  getData<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return fallback;
    }
  }

  /**
   * Set data in localStorage and trigger storage event
   */
  setData<T>(key: string, data: T): void {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      
      // Trigger storage event for cross-component updates
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: serializedData
      }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }

  /**
   * Update specific item in array by ID
   */
  updateItemById<T extends { id: string }>(key: string, itemId: string, updates: Partial<T>, fallback: T[]): void {
    const items = this.getData(key, fallback);
    const updatedItems = items.map((item: T) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    this.setData(key, updatedItems);
  }

  /**
   * Add new item to array
   */
  addItem<T>(key: string, item: T, fallback: T[]): void {
    const items = this.getData(key, fallback);
    this.setData(key, [...items, item]);
  }

  /**
   * Remove item from array by ID
   */
  removeItemById<T extends { id: string }>(key: string, itemId: string, fallback: T[]): void {
    const items = this.getData(key, fallback);
    const filteredItems = items.filter((item: T) => item.id !== itemId);
    this.setData(key, filteredItems);
  }

  /**
   * Clear all data (for testing/reset purposes)
   */
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

// Export singleton instance
export const dataService = new DataService();

// ===== SPECIFIC DATA OPERATIONS =====

/**
 * Property data operations
 */
export const propertyDataService = {
  getAll: () => dataService.getData(STORAGE_KEYS.PROPERTIES, []),
  save: (properties: any[]) => dataService.setData(STORAGE_KEYS.PROPERTIES, properties),
  add: (property: any) => dataService.addItem(STORAGE_KEYS.PROPERTIES, property, []),
  update: (propertyId: string, updates: any) => 
    dataService.updateItemById(STORAGE_KEYS.PROPERTIES, propertyId, updates, []),
  remove: (propertyId: string) => 
    dataService.removeItemById(STORAGE_KEYS.PROPERTIES, propertyId, []),
};

/**
 * Booking data operations
 */
export const bookingDataService = {
  getAll: () => dataService.getData(STORAGE_KEYS.BOOKINGS, []),
  save: (bookings: any[]) => dataService.setData(STORAGE_KEYS.BOOKINGS, bookings),
  add: (booking: any) => dataService.addItem(STORAGE_KEYS.BOOKINGS, booking, []),
  update: (bookingId: string, updates: any) => 
    dataService.updateItemById(STORAGE_KEYS.BOOKINGS, bookingId, updates, []),
  remove: (bookingId: string) => 
    dataService.removeItemById(STORAGE_KEYS.BOOKINGS, bookingId, []),
};

/**
 * Contract data operations
 */
export const contractDataService = {
  getAll: () => dataService.getData(STORAGE_KEYS.CONTRACTS, []),
  save: (contracts: any[]) => dataService.setData(STORAGE_KEYS.CONTRACTS, contracts),
  add: (contract: any) => dataService.addItem(STORAGE_KEYS.CONTRACTS, contract, []),
  update: (contractId: string, updates: any) => 
    dataService.updateItemById(STORAGE_KEYS.CONTRACTS, contractId, updates, []),
};

/**
 * User data operations
 */
export const userDataService = {
  getAll: () => dataService.getData(STORAGE_KEYS.USERS, []),
  save: (users: any[]) => dataService.setData(STORAGE_KEYS.USERS, users),
  add: (user: any) => dataService.addItem(STORAGE_KEYS.USERS, user, []),
  update: (userId: string, updates: any) => 
    dataService.updateItemById(STORAGE_KEYS.USERS, userId, updates, []),
};

/**
 * Concern data operations
 */
export const concernDataService = {
  getAll: () => dataService.getData(STORAGE_KEYS.CONCERNS, []),
  save: (concerns: any[]) => dataService.setData(STORAGE_KEYS.CONCERNS, concerns),
  add: (concern: any) => dataService.addItem(STORAGE_KEYS.CONCERNS, concern, []),
  update: (concernId: string, updates: any) => 
    dataService.updateItemById(STORAGE_KEYS.CONCERNS, concernId, updates, []),
};

/**
 * Job order data operations
 */
export const jobOrderDataService = {
  getAll: () => dataService.getData(STORAGE_KEYS.JOB_ORDERS, []),
  save: (jobOrders: any[]) => dataService.setData(STORAGE_KEYS.JOB_ORDERS, jobOrders),
  add: (jobOrder: any) => dataService.addItem(STORAGE_KEYS.JOB_ORDERS, jobOrder, []),
  update: (jobOrderId: string, updates: any) => 
    dataService.updateItemById(STORAGE_KEYS.JOB_ORDERS, jobOrderId, updates, []),
};

/**
 * Review data operations
 */
export const reviewDataService = {
  getAll: () => dataService.getData(STORAGE_KEYS.REVIEWS, []),
  save: (reviews: any[]) => dataService.setData(STORAGE_KEYS.REVIEWS, reviews),
  add: (review: any) => dataService.addItem(STORAGE_KEYS.REVIEWS, review, []),
};