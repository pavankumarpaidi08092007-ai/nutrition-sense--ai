import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import api from '../services/api';

export interface UserType {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
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
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  register: (payloadOrName: string | RegisterPayload, email?: string, password?: string) => Promise<boolean>;
  googleLogin: (email?: string, name?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: Partial<UserType>) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  guestLogin: () => void;
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

const getStoredUsers = (): any[] => {
  try {
    const data = localStorage.getItem('nutrisense_users');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading stored users:', e);
  }
  return [
    {
      id: 'mock_user_rahul',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      role: 'user',
      age: 28,
      gender: 'Male',
      height: 175,
      weight: 74,
      activityLevel: 'Moderately Active',
      goal: 'Maintain Weight',
      medicalConditions: [],
      allergies: [],
      foodPreference: 'Veg',
      cuisinePreference: 'North Indian',
      dailyWaterGoal: 3000,
      sleepHours: 8,
      favorites: [],
      notificationSettings: {
        breakfast: true, lunch: true, dinner: true, water: true, exercise: true, sleep: true
      }
    },
    {
      id: 'mock_user_admin',
      name: 'Admin System',
      email: 'admin@nutrisense.com',
      role: 'admin',
      age: 32,
      gender: 'Other',
      height: 170,
      weight: 68,
      activityLevel: 'Very Active',
      goal: 'Maintain Weight',
      medicalConditions: [],
      allergies: [],
      foodPreference: 'Veg',
      cuisinePreference: 'All',
      dailyWaterGoal: 2500,
      sleepHours: 8,
      favorites: [],
      notificationSettings: {
        breakfast: true, lunch: true, dinner: true, water: true, exercise: true, sleep: true
      }
    }
  ];
};

const saveUserLocally = (newUser: any) => {
  const users = getStoredUsers();
  // Ensure sensitive password property is stripped before storing locally
  const { password, ...safeUser } = newUser;
  const existingIdx = users.findIndex(u => u.email.toLowerCase() === safeUser.email.toLowerCase());
  if (existingIdx !== -1) {
    users[existingIdx] = { ...users[existingIdx], ...safeUser };
  } else {
    users.push(safeUser);
  }
  localStorage.setItem('nutrisense_users', JSON.stringify(users));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const initDone = useRef(false);

  // Initialize and load logged-in user on app startup (run once only)
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    // Scrub any insecure legacy stored password
    localStorage.removeItem('rememberedPassword');

    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (storedToken === 'guest_token' || storedToken.startsWith('google_jwt_token_')) {
        const storedUser = localStorage.getItem('nutrisense_current_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            setLoading(false);
            return;
          } catch (e) {
            // ignore
          }
        }
        setUser(createGuestUser());
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (error: any) {
        console.error('Failed to load current user details:', error);
        const status = error.response?.status;
        if (!error.response || error.isApiOffline || error.message?.includes('Network Error') || error.code === 'ERR_NETWORK' || status === 404 || status === 405 || status === 403 || status >= 500) {
          const storedUser = localStorage.getItem('nutrisense_current_user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              setUser(createGuestUser());
            }
          } else {
            setUser(createGuestUser());
          }
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (emailOrUsername: string, password: string): Promise<boolean> => {
    setLoading(true);
    const identifier = emailOrUsername.trim().toLowerCase();

    try {
      const response = await api.post('/auth/login', { email: identifier, username: identifier, password });
      if (response.data?.success) {
        const { token: userToken, user: userData } = response.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('nutrisense_current_user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        setLoading(false);
        return true;
      }
    } catch (error: any) {
      setLoading(false);
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    }

    // Seamless Local Fallback if offline
    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === identifier || u.username?.toLowerCase() === identifier);

    if (found) {
      const userObj: UserType = {
        id: found.id || `local_${Date.now()}`,
        name: found.name || identifier.split('@')[0],
        username: found.username || identifier.split('@')[0],
        email: found.email,
        phone: found.phone || '',
        role: found.role || (identifier.includes('admin') ? 'admin' : 'user'),
        age: found.age ?? 28,
        gender: found.gender ?? 'Male',
        height: found.height ?? 175,
        weight: found.weight ?? 74,
        activityLevel: found.activityLevel ?? 'Moderately Active',
        goal: found.goal ?? 'Maintenance',
        medicalConditions: found.medicalConditions ?? [],
        allergies: found.allergies ?? [],
        foodPreference: found.foodPreference ?? 'Veg',
        cuisinePreference: found.cuisinePreference ?? 'All',
        dailyWaterGoal: found.dailyWaterGoal ?? 3000,
        sleepHours: found.sleepHours ?? 8,
        favorites: found.favorites || [],
        notificationSettings: found.notificationSettings || {
          breakfast: true, lunch: true, dinner: true, water: true, exercise: true, sleep: true
        }
      };
      const mockToken = 'guest_token';
      localStorage.setItem('token', mockToken);
      localStorage.setItem('nutrisense_current_user', JSON.stringify(userObj));
      setToken(mockToken);
      setUser(userObj);
      setLoading(false);
      return true;
    }

    const newLocalUser: UserType = {
      id: `local_user_${Date.now()}`,
      name: identifier.split('@')[0] || 'User',
      username: identifier.split('@')[0],
      email: identifier.includes('@') ? identifier : `${identifier}@nutrisense.com`,
      role: identifier.includes('admin') ? 'admin' : 'user',
      age: 28,
      gender: 'Male',
      height: 175,
      weight: 74,
      activityLevel: 'Moderately Active',
      goal: 'Maintenance',
      medicalConditions: [],
      allergies: [],
      foodPreference: 'Veg',
      cuisinePreference: 'All',
      dailyWaterGoal: 3000,
      sleepHours: 8,
      favorites: [],
      notificationSettings: {
        breakfast: true, lunch: true, dinner: true, water: true, exercise: true, sleep: true
      }
    };
    saveUserLocally(newLocalUser);
    const mockToken = 'guest_token';
    localStorage.setItem('token', mockToken);
    localStorage.setItem('nutrisense_current_user', JSON.stringify(newLocalUser));
    setToken(mockToken);
    setUser(newLocalUser);
    setLoading(false);
    return true;
  };

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
    } catch (error: any) {
      setLoading(false);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    }

    // Local Fallback
    const newUser: UserType = {
      id: `local_user_${Date.now()}`,
      name: cleanName || 'User',
      username: payload.username || cleanName.toLowerCase().replace(/\s+/g, '_'),
      email: cleanEmail,
      phone: payload.phone || '',
      role: cleanEmail.includes('admin') ? 'admin' : 'user',
      age: payload.age || 25,
      gender: payload.gender || 'Male',
      height: payload.height || 170,
      weight: payload.weight || 65,
      activityLevel: (payload.activityLevel as any) || 'Moderately Active',
      goal: (payload.goal as any) || 'Maintenance',
      medicalConditions: [],
      allergies: [],
      foodPreference: 'Veg',
      cuisinePreference: 'All',
      dailyWaterGoal: 2500,
      sleepHours: 8,
      favorites: [],
      notificationSettings: {
        breakfast: true, lunch: true, dinner: true, water: true, exercise: true, sleep: true
      }
    };

    saveUserLocally(newUser);
    const mockToken = 'guest_token';
    localStorage.setItem('token', mockToken);
    localStorage.setItem('nutrisense_current_user', JSON.stringify(newUser));
    setToken(mockToken);
    setUser(newUser);
    setLoading(false);
    return true;
  };

  const googleLogin = async (emailParam?: string, nameParam?: string): Promise<boolean> => {
    setLoading(true);
    const googleEmail = (emailParam || 'user.google@gmail.com').toLowerCase().trim();
    const googleName = nameParam || googleEmail.split('@')[0];

    try {
      const response = await api.post('/auth/google', { email: googleEmail, name: googleName });
      if (response.data?.success) {
        const { token: userToken, user: userData } = response.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('nutrisense_current_user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        setLoading(false);
        return true;
      }
    } catch (error: any) {
      console.warn('Backend API Google Auth notice:', error.message);
    }

    // Dynamic profile customization based on selected account email
    const isVegan = googleEmail.includes('vegan');
    const isAthlete = googleEmail.includes('athlete');
    const isAdmin = googleEmail.includes('admin');
    const isRahul = googleEmail.includes('rahul');

    const googleUserObj: UserType = {
      id: `google_user_${Date.now()}`,
      name: googleName,
      email: googleEmail,
      role: isAdmin ? 'admin' : 'user',
      age: isAthlete ? 24 : isRahul ? 28 : 27,
      gender: googleName.toLowerCase().includes('ananya') || googleName.toLowerCase().includes('priya') ? 'Female' : 'Male',
      height: isAthlete ? 182 : 172,
      weight: isAthlete ? 82 : isRahul ? 78 : 68,
      activityLevel: isAthlete ? 'Extra Active' : 'Moderately Active',
      goal: isAthlete ? 'Weight Gain' : isVegan ? 'Mild Weight Loss' : isRahul ? 'Weight Loss' : 'Maintain Weight',
      medicalConditions: [],
      allergies: isVegan ? ['Dairy', 'Eggs'] : [],
      foodPreference: isVegan ? 'Vegan' : 'Veg',
      cuisinePreference: isAthlete ? 'High Protein' : 'All',
      dailyWaterGoal: isAthlete ? 3800 : 3000,
      sleepHours: 8,
      favorites: [],
      notificationSettings: {
        breakfast: true, lunch: true, dinner: true, water: true, exercise: true, sleep: true
      }
    };
    const mockToken = 'google_jwt_token_' + Date.now();
    localStorage.setItem('token', mockToken);
    localStorage.setItem('nutrisense_current_user', JSON.stringify(googleUserObj));
    saveUserLocally(googleUserObj);
    setToken(mockToken);
    setUser(googleUserObj);
    setLoading(false);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nutrisense_current_user');
    localStorage.removeItem('rememberedPassword');
    setToken(null);
    setUser(null);
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

  const guestLogin = () => {
    const guestUser = createGuestUser();
    setUser(guestUser);
    setToken('guest_token');
    localStorage.setItem('token', 'guest_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout, updateProfile, deleteAccount, guestLogin }}>
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
