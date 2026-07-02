import fs from 'fs';
import path from 'path';
import { isUsingMockDB } from '../config/db';
import { User } from '../models/User';
import { Food } from '../models/Food';
import { WaterHistory } from '../models/WaterHistory';
import { WeightHistory } from '../models/WeightHistory';
import { MealPlan } from '../models/MealPlan';
import { Notification } from '../models/Notification';

// --- IN-MEMORY FALLBACK DATABASE STORE ---
const memoryStore = {
  users: [] as any[],
  foods: [] as any[],
  waterHistory: [] as any[],
  weightHistory: [] as any[],
  mealPlans: [] as any[],
  notifications: [] as any[],
};

// Initialize memoryStore foods from static file
const initMemoryStoreFoods = () => {
  try {
    const staticPath = path.join(__dirname, '..', 'seed', 'foodStaticDB.json');
    if (fs.existsSync(staticPath)) {
      const data = fs.readFileSync(staticPath, 'utf8');
      memoryStore.foods = JSON.parse(data);
      console.log(`Initialized in-memory store with ${memoryStore.foods.length} foods from static file.`);
    } else {
      // Fallback if the file does not exist yet (before seed script runs)
      // We import from seed file arrays
      const { completeFoodList } = require('../seed/foodSeed');
      memoryStore.foods = completeFoodList || [];
      console.log(`Initialized in-memory store with ${memoryStore.foods.length} default foods.`);
    }
  } catch (error) {
    console.error('Failed to initialize mock foods memory store:', error);
  }
};

// Call initialization
setTimeout(initMemoryStoreFoods, 1000);

// --- DB MANAGER ABSTRACT IMPLEMENTATIONS ---

export const dbUsers = {
  find: async (query: any = {}) => {
    if (isUsingMockDB) {
      return memoryStore.users.filter(u => {
        for (const key in query) {
          if (u[key] !== query[key]) return false;
        }
        return true;
      });
    }
    return User.find(query);
  },

  findOne: async (query: any = {}) => {
    if (isUsingMockDB) {
      return memoryStore.users.find(u => {
        for (const key in query) {
          if (u[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    }
    return User.findOne(query);
  },

  findById: async (id: string) => {
    if (isUsingMockDB) {
      return memoryStore.users.find(u => u._id === id) || null;
    }
    return User.findById(id);
  },

  create: async (data: any) => {
    if (isUsingMockDB) {
      const newUser = {
        _id: `mock_user_${Date.now()}`,
        favorites: [],
        notificationSettings: {
          breakfast: true,
          lunch: true,
          dinner: true,
          water: true,
          exercise: true,
          sleep: true
        },
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.users.push(newUser);
      
      // Seed default trackings for the mock user to make dashboard interesting
      dbWater.create({ userId: newUser._id, date: new Date().toISOString().split('T')[0], amount: 1500 });
      dbWeight.create({ userId: newUser._id, date: new Date().toISOString().split('T')[0], weight: newUser.weight || 70, bmi: 24.2 });
      
      return newUser;
    }
    const user = new User(data);
    await user.save();
    return user;
  },

  updateById: async (id: string, update: any) => {
    if (isUsingMockDB) {
      const index = memoryStore.users.findIndex(u => u._id === id);
      if (index === -1) return null;
      memoryStore.users[index] = {
        ...memoryStore.users[index],
        ...update,
        updatedAt: new Date(),
      };
      return memoryStore.users[index];
    }
    return User.findByIdAndUpdate(id, update, { new: true });
  },

  deleteById: async (id: string) => {
    if (isUsingMockDB) {
      const index = memoryStore.users.findIndex(u => u._id === id);
      if (index === -1) return null;
      const deleted = memoryStore.users.splice(index, 1);
      return deleted[0];
    }
    return User.findByIdAndDelete(id);
  }
};

export const dbFoods = {
  find: async (query: any = {}) => {
    if (isUsingMockDB) {
      // Basic match logic
      return memoryStore.foods.filter(f => {
        if (query.category && f.category !== query.category) return false;
        if (query.name) {
          const matchName = typeof query.name === 'string' 
            ? query.name 
            : (query.name.$regex ? query.name.$regex : '');
          if (matchName && !f.name.toLowerCase().includes(matchName.toLowerCase())) return false;
        }
        return true;
      });
    }
    return Food.find(query);
  },

  findById: async (id: string) => {
    if (isUsingMockDB) {
      return memoryStore.foods.find(f => f._id === id || f.name === id) || null;
    }
    return Food.findById(id);
  },

  create: async (data: any) => {
    if (isUsingMockDB) {
      const newFood = {
        _id: `mock_food_${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.foods.push(newFood);
      return newFood;
    }
    const food = new Food(data);
    await food.save();
    return food;
  },

  updateById: async (id: string, update: any) => {
    if (isUsingMockDB) {
      const index = memoryStore.foods.findIndex(f => f._id === id);
      if (index === -1) return null;
      memoryStore.foods[index] = {
        ...memoryStore.foods[index],
        ...update,
        updatedAt: new Date()
      };
      return memoryStore.foods[index];
    }
    return Food.findByIdAndUpdate(id, update, { new: true });
  },

  deleteById: async (id: string) => {
    if (isUsingMockDB) {
      const index = memoryStore.foods.findIndex(f => f._id === id);
      if (index === -1) return null;
      return memoryStore.foods.splice(index, 1)[0];
    }
    return Food.findByIdAndDelete(id);
  }
};

export const dbWater = {
  find: async (query: any = {}) => {
    if (isUsingMockDB) {
      return memoryStore.waterHistory.filter(w => {
        if (query.userId && w.userId !== query.userId) return false;
        if (query.date && w.date !== query.date) return false;
        return true;
      });
    }
    return WaterHistory.find(query);
  },

  create: async (data: any) => {
    if (isUsingMockDB) {
      // Find if record already exists
      const existingIndex = memoryStore.waterHistory.findIndex(
        w => w.userId === data.userId && w.date === data.date
      );
      if (existingIndex !== -1) {
        memoryStore.waterHistory[existingIndex].amount = data.amount;
        return memoryStore.waterHistory[existingIndex];
      }

      const newRecord = {
        _id: `mock_water_${Date.now()}`,
        ...data,
        createdAt: new Date()
      };
      memoryStore.waterHistory.push(newRecord);
      return newRecord;
    }
    return WaterHistory.findOneAndUpdate(
      { userId: data.userId, date: data.date },
      { amount: data.amount },
      { upsert: true, new: true }
    );
  }
};

export const dbWeight = {
  find: async (query: any = {}) => {
    if (isUsingMockDB) {
      return memoryStore.weightHistory
        .filter(w => {
          if (query.userId && w.userId !== query.userId) return false;
          return true;
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    return WeightHistory.find(query).sort({ date: 1 });
  },

  create: async (data: any) => {
    if (isUsingMockDB) {
      const existingIndex = memoryStore.weightHistory.findIndex(
        w => w.userId === data.userId && w.date === data.date
      );
      if (existingIndex !== -1) {
        memoryStore.weightHistory[existingIndex].weight = data.weight;
        memoryStore.weightHistory[existingIndex].bmi = data.bmi;
        return memoryStore.weightHistory[existingIndex];
      }

      const newRecord = {
        _id: `mock_weight_${Date.now()}`,
        ...data,
        createdAt: new Date()
      };
      memoryStore.weightHistory.push(newRecord);
      return newRecord;
    }
    return WeightHistory.findOneAndUpdate(
      { userId: data.userId, date: data.date },
      { weight: data.weight, bmi: data.bmi },
      { upsert: true, new: true }
    );
  }
};

export const dbMealPlans = {
  find: async (query: any = {}) => {
    if (isUsingMockDB) {
      return memoryStore.mealPlans.filter(m => {
        if (query.userId && m.userId !== query.userId) return false;
        if (query.isBookmarked !== undefined && m.isBookmarked !== query.isBookmarked) return false;
        return true;
      });
    }
    return MealPlan.find(query);
  },

  create: async (data: any) => {
    if (isUsingMockDB) {
      const newPlan = {
        _id: `mock_mealplan_${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.mealPlans.push(newPlan);
      return newPlan;
    }
    const plan = new MealPlan(data);
    await plan.save();
    return plan;
  },

  updateById: async (id: string, update: any) => {
    if (isUsingMockDB) {
      const index = memoryStore.mealPlans.findIndex(m => m._id === id);
      if (index === -1) return null;
      memoryStore.mealPlans[index] = {
        ...memoryStore.mealPlans[index],
        ...update,
        updatedAt: new Date()
      };
      return memoryStore.mealPlans[index];
    }
    return MealPlan.findByIdAndUpdate(id, update, { new: true });
  },

  deleteById: async (id: string) => {
    if (isUsingMockDB) {
      const index = memoryStore.mealPlans.findIndex(m => m._id === id);
      if (index === -1) return null;
      return memoryStore.mealPlans.splice(index, 1)[0];
    }
    return MealPlan.findByIdAndDelete(id);
  }
};

export const dbNotifications = {
  find: async (query: any = {}) => {
    if (isUsingMockDB) {
      const results = memoryStore.notifications.filter(n => {
        if (query.userId && n.userId !== query.userId) return false;
        if (query.isRead !== undefined && n.isRead !== query.isRead) return false;
        return true;
      });
      // Sort mock notifications by createdAt desc
      return [...results].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return Notification.find(query).sort({ createdAt: -1 });
  },

  create: async (data: any) => {
    if (isUsingMockDB) {
      const newNotif = {
        _id: `mock_notification_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        ...data,
        isRead: false,
        createdAt: new Date()
      };
      memoryStore.notifications.push(newNotif);
      return newNotif;
    }
    const notif = new Notification(data);
    await notif.save();
    return notif;
  },

  updateMany: async (query: any, update: any) => {
    if (isUsingMockDB) {
      let count = 0;
      memoryStore.notifications.forEach(n => {
        if (query.userId && n.userId !== query.userId) return;
        if (query.isRead !== undefined && n.isRead !== query.isRead) return;
        if (update.$set) {
          for (const key in update.$set) {
            n[key] = update.$set[key];
          }
          count++;
        }
      });
      return { modifiedCount: count };
    }
    return Notification.updateMany(query, update);
  },

  deleteById: async (id: string) => {
    if (isUsingMockDB) {
      const index = memoryStore.notifications.findIndex(n => n._id === id);
      if (index === -1) return null;
      const deleted = memoryStore.notifications.splice(index, 1);
      return deleted[0];
    }
    return Notification.findByIdAndDelete(id);
  },

  clearAll: async (userId: string) => {
    if (isUsingMockDB) {
      memoryStore.notifications = memoryStore.notifications.filter(n => n.userId !== userId);
      return { deletedCount: memoryStore.notifications.length };
    }
    return Notification.deleteMany({ userId });
  }
};
