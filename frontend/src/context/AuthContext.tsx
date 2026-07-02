import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import api from '../services/api';

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number;
  weight: number;
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';
  goal: 'Weight Loss' | 'Mild Weight Loss' | 'Maintain Weight' | 'Mild Weight Gain' | 'Weight Gain';
  medicalConditions: string[];
  allergies: string[];
  foodPreference: 'Veg' | 'Non-Veg' | 'Eggitarian' | 'Vegan';
  cuisinePreference: string;
  dailyWaterGoal: number;
  sleepHours: number;
  favorites?: string[];
  notificationSettings?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    water: boolean;
    exercise: boolean;
    sleep: boolean;
  };
}

interface AuthContextType {
  user: UserType | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: Partial<UserType>) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createGuestUser = (): UserType => ({
  id: 'guest',
  name: 'Guest',
  email: 'guest@nutrisense.com',
  role: 'user',
  age: 30,
  gender: 'Other',
  height: 170,
  weight: 70,
  activityLevel: 'Moderately Active',
  goal: 'Maintain Weight',
  medicalConditions: [],
  allergies: [],
  foodPreference: 'Veg',
  cuisinePreference: '',
  dailyWaterGoal: 2500,
  sleepHours: 7,
  notificationSettings: {
    breakfast: true,
    lunch: true,
    dinner: true,
    water: true,
    exercise: true,
    sleep: true,
  },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const initDone = useRef(false);

  // Initialize and load logged-in user on app startup (run once only)
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setUser(createGuestUser());
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.user);
        } else {
          // Token expired or invalid — clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (error) {
        console.error('Failed to load current user details:', error);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.success) {
        const { token: userToken, user: userData } = response.data;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data?.success) {
        const { token: userToken, user: userData } = response.data;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed.';
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(createGuestUser());
  };

  const updateProfile = async (profileData: Partial<UserType>): Promise<boolean> => {
    try {
      const response = await api.put('/auth/me', profileData);
      if (response.data?.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update health profile.';
      throw new Error(msg);
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const response = await api.delete('/auth/me');
      if (response.data?.success) {
        logout();
        return true;
      }
      return false;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete account.';
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
