import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const savedUser = localStorage.getItem('hotelUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('hotelUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = usersData.users.find(u => 
      u.email === email && u.password === password
    );

    if (foundUser) {
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
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setUser(null);
    localStorage.removeItem('hotelUser');
    setIsLoading(false);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading
  }), [user, login, logout, isLoading]);
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};