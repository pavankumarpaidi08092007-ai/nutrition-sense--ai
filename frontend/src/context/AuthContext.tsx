import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import api from '../services/api';

export interface UserType {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  authProvider?: 'local' | 'google';
  picture?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number;
  weight: number;
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Athlete' | 'Extra Active';
  goal: 'Weight Loss' | 'Weight Gain' | 'Muscle Gain' | 'Maintenance' | 'Healthy Lifestyle' | 'Mild Weight Loss' | 'Maintain Weight' | 'Mild Weight Gain';
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
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface RegisterPayload {
  name: string;
  username?: string;
  email: string;
  phone?: string;
  password: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  height?: number;
  weight?: number;
  goal?: string;
  activityLevel?: string;
}

interface AuthContextType {
  user: UserType | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payloadOrName: string | RegisterPayload, email?: string, password?: string) => Promise<boolean>;
  googleLogin: (googleTokenOrPayload: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<UserType>) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const initDone = useRef(false);

  // Initialize and load authenticated user from real backend API
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    localStorage.removeItem('rememberedPassword');

    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data?.success && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('nutrisense_current_user', JSON.stringify(response.data.user));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('nutrisense_current_user');
          setToken(null);
          setUser(null);
        }
      } catch (error: any) {
        console.error('Failed to authenticate session:', error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('nutrisense_current_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Real Email & Password Login
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await api.post('/auth/login', { email: cleanEmail, password });
      if (response.data?.success) {
        const { token: userToken, user: userData } = response.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('nutrisense_current_user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        setLoading(false);
        return true;
      }
      throw new Error(response.data?.message || 'Invalid email address or password');
    } catch (error: any) {
      setLoading(false);
      const message = error.response?.data?.message || error.message || 'Login failed. Please check credentials.';
      throw new Error(message);
    }
  };

  // Real User Registration
  const register = async (
    payloadOrName: string | RegisterPayload,
    emailParam?: string,
    passwordParam?: string
  ): Promise<boolean> => {
    setLoading(true);

    let payload: RegisterPayload;
    if (typeof payloadOrName === 'object') {
      payload = payloadOrName;
    } else {
      payload = {
        name: payloadOrName,
        email: emailParam || '',
        password: passwordParam || '',
      };
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.name.trim();

    try {
      const response = await api.post('/auth/register', {
        ...payload,
        name: cleanName,
        email: cleanEmail,
      });

      if (response.data?.success) {
        const { token: userToken, user: userData } = response.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('nutrisense_current_user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        setLoading(false);
        return true;
      }
      throw new Error(response.data?.message || 'Registration failed');
    } catch (error: any) {
      setLoading(false);
      const message = error.response?.data?.message || error.message || 'Registration failed due to server error.';
      throw new Error(message);
    }
  };

  // Real Google OAuth 2.0 Login
  const googleLogin = async (googleTokenOrPayload: any): Promise<boolean> => {
    setLoading(true);

    try {
      let requestData = {};
      if (typeof googleTokenOrPayload === 'string') {
        requestData = { idToken: googleTokenOrPayload };
      } else if (typeof googleTokenOrPayload === 'object') {
        requestData = googleTokenOrPayload;
      }

      const response = await api.post('/auth/google', requestData);
      if (response.data?.success) {
        const { token: userToken, user: userData } = response.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('nutrisense_current_user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        setLoading(false);
        return true;
      }
      throw new Error(response.data?.message || 'Google Sign-In failed');
    } catch (error: any) {
      setLoading(false);
      const message = error.response?.data?.message || error.message || 'Google Sign-In authentication failed.';
      throw new Error(message);
    }
  };

  // Real Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('nutrisense_current_user');
      localStorage.removeItem('rememberedPassword');
      setToken(null);
      setUser(null);
    }
  };

  // Update Profile
  const updateProfile = async (profileData: Partial<UserType>): Promise<boolean> => {
    try {
      const response = await api.put('/auth/me', profileData);
      if (response.data?.success) {
        setUser(response.data.user);
        localStorage.setItem('nutrisense_current_user', JSON.stringify(response.data.user));
        return true;
      }
      return false;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update user profile.';
      throw new Error(msg);
    }
  };

  // Delete Account
  const deleteAccount = async (): Promise<boolean> => {
    try {
      const response = await api.delete('/auth/me');
      if (response.data?.success) {
        await logout();
        return true;
      }
      return false;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete account.';
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout, updateProfile, deleteAccount }}>
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
