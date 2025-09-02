/**
 * Local Storage Hook
 * 
 * Custom React hook for managing localStorage with real-time synchronization.
 * Provides automatic updates across components when data changes.
 * 
 * Features:
 * - Automatic JSON serialization/deserialization
 * - Cross-component synchronization via storage events
 * - Error handling for localStorage operations
 * - TypeScript support with generics
 * 
 * Data Flow:
 * 1. Component calls setValue() -> updates localStorage
 * 2. Hook triggers storage event -> other components listening update automatically
 * 3. All components stay in sync with latest data
 * 
 * Usage:
 * const [data, setData] = useLocalStorage('key', defaultValue);
 */
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  /**
   * Initialize state with value from localStorage or fallback to initialValue
   */
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Cross-Component Synchronization
   * 
   * Listen for storage events to automatically sync data changes
   * across all components using the same localStorage key
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  /**
   * Update Value Function
   * 
   * Process:
   * 1. Calculate new value (supports function updates)
   * 2. Update local state
   * 3. Store in localStorage
   * 4. Trigger storage event for cross-component sync
   */
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Trigger custom storage event for real-time updates across components
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(valueToStore)
      }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}