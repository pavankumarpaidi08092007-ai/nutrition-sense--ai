import { Router, Response } from 'express';
import { dbFoods } from '../utils/dbManager';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

// @route   GET api/foods
// @desc    Get all foods with search, filters and sorting
router.get('/', async (req: any, res: Response) => {
  try {
    const { name, category, filter, page = 1, limit = 12 } = req.query;
    
    // 1. Build Query
    let query: any = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    // 2. Fetch all matching foods
    let foods = await dbFoods.find(query);

    // 3. Apply custom nutritional filter presets
    if (filter) {
      const type = filter.toString().toLowerCase();
      if (type === 'high-protein') {
        foods = foods.filter(f => f.protein >= 8); // 8g or more per serving
      } else if (type === 'low-carb') {
        foods = foods.filter(f => f.carbs <= 15);  // 15g or less per serving
      } else if (type === 'low-fat') {
        foods = foods.filter(f => f.fat <= 3);     // 3g or less per serving
      } else if (type === 'low-calorie') {
        foods = foods.filter(f => f.calories <= 100); // 100 kcal or less
      } else if (type === 'high-fiber') {
        foods = foods.filter(f => f.fiber >= 3);   // 3g or more fiber
      }
    }

    // 4. Paginate
    const totalCount = foods.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedFoods = foods.slice(startIndex, startIndex + Number(limit));

    res.json({
      success: true,
      foods: paginatedFoods,
      pagination: {
        total: totalCount,
        page: Number(page),
        pages: Math.ceil(totalCount / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/foods/categories
// @desc    Get all food category names
router.get('/categories', async (req: any, res: Response) => {
  try {
    // Unique list of categories
    const allFoods = await dbFoods.find({});
    const categories = Array.from(new Set(allFoods.map(f => f.category)));
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/foods/:id
// @desc    Get detailed food nutrition label
router.get('/:id', async (req: any, res: Response) => {
  try {
    const food = await dbFoods.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    res.json({ success: true, food });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/foods
// @desc    Create new food item (Admin only)
router.post('/', protect, adminOnly, async (req: any, res: Response) => {
  try {
    const newFood = await dbFoods.create(req.body);
    res.status(201).json({ success: true, food: newFood });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT api/foods/:id
// @desc    Update a food item (Admin only)
router.put('/:id', protect, adminOnly, async (req: any, res: Response) => {
  try {
    const updated = await dbFoods.updateById(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    res.json({ success: true, food: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/foods/:id
// @desc    Delete a food item (Admin only)
router.delete('/:id', protect, adminOnly, async (req: any, res: Response) => {
  try {
    const deleted = await dbFoods.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    res.json({ success: true, message: 'Food item removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
