import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, ChevronLeft, ChevronRight, Apple, HelpCircle, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const NutritionSearch: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [foods, setFoods] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<any>(null);

  useEffect(() => {
    api.get('/foods/categories').then(res => {
      if (res.data?.success) setCategories(res.data.categories);
    }).catch(console.error);
  }, []);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      if (showFavsOnly) {
        // Fetch a larger batch of foods to filter locally by user favorites
        const res = await api.get('/foods', { params: { limit: 100 } });
        if (res.data?.success) {
          const favNames = user?.favorites || [];
          const filtered = res.data.foods.filter((f: any) => 
            favNames.includes(f.name) && 
            (search ? f.name.toLowerCase().includes(search.toLowerCase()) : true) &&
            (selectedFilter === 'high-protein' ? f.protein >= 8 : true) &&
            (selectedFilter === 'low-carb' ? f.carbs <= 15 : true) &&
            (selectedFilter === 'low-calorie' ? f.calories <= 100 : true) &&
            (selectedFilter === 'low-fat' ? f.fat <= 3 : true) &&
            (selectedFilter === 'high-fiber' ? f.fiber >= 3 : true)
          );
          
          setFoods(filtered.slice((page - 1) * 8, page * 8));
          setTotalCount(filtered.length);
          setTotalPages(Math.ceil(filtered.length / 8));
          if (filtered.length > 0) {
            setSelectedFood(filtered[0]);
          } else {
            setSelectedFood(null);
          }
        }
      } else {
        const params: any = { page, limit: 8 };
        if (search) params.name = search;
        if (selectedCategory !== 'All') params.category = selectedCategory;
        if (selectedFilter) params.filter = selectedFilter;
        const res = await api.get('/foods', { params });
        if (res.data?.success) {
          setFoods(res.data.foods);
          setTotalPages(res.data.pagination.pages);
          setTotalCount(res.data.pagination.total);
          if (res.data.foods.length > 0) setSelectedFood(res.data.foods[0]);
        }
      }
    } catch (err) {
      console.error('Food search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFoods(); }, [search, selectedCategory, selectedFilter, showFavsOnly, page, user]);

  return (
    <div className="flex-1 bg-gradient-nutri p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Indian Food Database
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-2">Nutrition Search</h2>
          <p className="text-xs text-slate-500 mt-1">Browse 200+ Indian foods with detailed FDA-style nutrition facts labels.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* LEFT: Search + Food List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search: Paneer, Roti, Chicken Breast..."
                className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold self-center mr-1">Filter:</span>
              {[
                { label: 'High Protein', val: 'high-protein' },
                { label: 'Low Carbs', val: 'low-carb' },
                { label: 'Low Calorie', val: 'low-calorie' },
                { label: 'Low Fat', val: 'low-fat' },
                { label: 'High Fiber', val: 'high-fiber' },
              ].map(f => (
                <button key={f.val} onClick={() => { setSelectedFilter((prev: string) => prev === f.val ? '' : f.val); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${selectedFilter === f.val ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Category Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200/50 dark:border-slate-800/50">
              <button
                onClick={() => { setShowFavsOnly(false); setSelectedCategory('All'); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${!showFavsOnly && selectedCategory === 'All' ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-100 dark:text-slate-950' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'}`}
              >
                All
              </button>
              {user?.favorites && user.favorites.length > 0 && (
                <button
                  onClick={() => { setShowFavsOnly(true); setSelectedCategory(''); setPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${showFavsOnly ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 text-rose-500 hover:bg-rose-50 dark:bg-slate-900 dark:border-slate-800'}`}
                >
                  ❤️ Favorites ({user.favorites.length})
                </button>
              )}
              {categories.map((c: string) => (
                <button key={c} onClick={() => { setShowFavsOnly(false); setSelectedCategory(c); setPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${!showFavsOnly && selectedCategory === c ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-100 dark:text-slate-950' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'}`}>
                  {c}
                </button>
              ))}
            </div>

            {/* Food List */}
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>)}</div>
            ) : foods.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300">No foods found</h4>
                <p className="text-xs text-slate-400 mt-1">Try different search terms or clear filters.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {foods.map((food: any) => {
                  const isFav = user?.favorites?.includes(food.name);
                  return (
                    <div key={food._id || food.name} className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${selectedFood?._id === food._id || selectedFood?.name === food.name ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white border-slate-200/50 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800'}`}>
                      <button className="text-left flex-1 min-w-0" onClick={() => setSelectedFood(food)}>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">{food.name}</h4>
                        <span className="text-[10px] text-slate-400">{food.category} · {food.servingSize}</span>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{food.calories} kcal</span>
                        <button
                          onClick={async () => {
                            const currentFavs = user?.favorites || [];
                            const updatedFavs = isFav
                              ? currentFavs.filter(f => f !== food.name)
                              : [...currentFavs, food.name];
                            try {
                              await updateProfile({ favorites: updatedFavs });
                              showToast(isFav ? `Removed ${food.name} from favorites` : `Added ${food.name} to favorites! ❤️`, isFav ? 'info' : 'success');
                            } catch (err) {
                              showToast('Failed to update favorites', 'error');
                            }
                          }}
                          className={`p-1.5 rounded-xl transition-all ${isFav ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-slate-400">{totalCount} total items</span>
                <div className="flex gap-2 items-center">
                  <button disabled={page === 1} onClick={() => setPage((p: number) => Math.max(p - 1, 1))}
                    className="p-1.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{page} / {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage((p: number) => Math.min(p + 1, totalPages))}
                    className="p-1.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Nutrition Facts Label */}
          <div className="lg:col-span-3">
            {selectedFood ? (
              <div className="glass-panel p-6 rounded-[2.5rem] border border-white/20 shadow-xl space-y-4 sticky top-20">
                <div className="border-b-4 border-slate-900 dark:border-white pb-2.5">
                  <p className="text-xs font-black tracking-widest uppercase text-slate-400">Nutrition Facts</p>
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedFood.name}</h2>
                      <p className="text-xs text-slate-500">{selectedFood.category}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const isFav = user?.favorites?.includes(selectedFood.name);
                        const currentFavs = user?.favorites || [];
                        const updatedFavs = isFav
                          ? currentFavs.filter((f: string) => f !== selectedFood.name)
                          : [...currentFavs, selectedFood.name];
                        try {
                          await updateProfile({ favorites: updatedFavs });
                          showToast(isFav ? `Removed from favorites` : `Added to favorites! ❤️`, isFav ? 'info' : 'success');
                        } catch (err) {
                          showToast('Failed to update favorites', 'error');
                        }
                      }}
                      className={`p-2.5 rounded-2xl mt-0.5 border transition-all flex-shrink-0 ${user?.favorites?.includes(selectedFood.name) ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-300'}`}
                    >
                      <Heart className={`w-5 h-5 ${user?.favorites?.includes(selectedFood.name) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="text-xs space-y-1 border-b-8 border-slate-900 dark:border-white pb-2">
                  <div className="flex justify-between font-bold py-1">
                    <span>Serving Size</span>
                    <span>{selectedFood.servingSize}</span>
                  </div>
                  <div className="flex justify-between font-black text-xl border-b border-slate-300 dark:border-slate-700 pb-2">
                    <span>Calories</span>
                    <span className="text-gradient-premium">{selectedFood.calories}</span>
                  </div>
                  <p className="text-right text-[10px] text-slate-400">% Daily Value*</p>
                  {[
                    { label: 'Total Fat', val: `${selectedFood.fat}g`, pct: Math.round((selectedFood.fat / 65) * 100) },
                    { label: 'Total Carbohydrates', val: `${selectedFood.carbs}g`, pct: Math.round((selectedFood.carbs / 300) * 100) },
                    { label: '  Dietary Fiber', val: `${selectedFood.fiber || 0}g`, pct: Math.round(((selectedFood.fiber || 0) / 25) * 100) },
                    { label: '  Sugars', val: `${selectedFood.sugar || 0}g`, pct: null },
                    { label: 'Protein', val: `${selectedFood.protein}g`, pct: Math.round((selectedFood.protein / 50) * 100) },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 py-1">
                      <span className="font-semibold">{row.label} <span className="font-normal text-slate-500">{row.val}</span></span>
                      <span className="font-bold">{row.pct !== null ? `${row.pct}%` : '—'}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] space-y-1.5 border-b-4 border-slate-900 dark:border-white pb-3">
                  <div className="flex justify-between"><span>Sodium</span><span className="font-semibold">{selectedFood.sodium || 0}mg · {Math.round(((selectedFood.sodium || 0) / 2300) * 100)}%</span></div>
                  <div className="flex justify-between"><span>Calcium</span><span className="font-semibold">{selectedFood.calcium || 0}mg · {Math.round(((selectedFood.calcium || 0) / 1000) * 100)}%</span></div>
                  <div className="flex justify-between"><span>Iron</span><span className="font-semibold">{selectedFood.iron || 0}mg · {Math.round(((selectedFood.iron || 0) / 18) * 100)}%</span></div>
                  <div className="flex justify-between text-slate-400"><span>Vitamins</span><span className="text-right max-w-[60%]">{selectedFood.vitamins?.join(', ') || 'N/A'}</span></div>
                  <div className="flex justify-between text-slate-400"><span>Minerals</span><span className="text-right max-w-[60%]">{selectedFood.minerals?.join(', ') || 'N/A'}</span></div>
                </div>

                {selectedFood.healthBenefits && (
                  <div className="flex gap-2.5 p-3 rounded-2xl bg-emerald-500/10 text-xs">
                    <Apple className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Health Benefits:</h4>
                      <p className="mt-0.5 leading-normal text-slate-600 dark:text-slate-300">{selectedFood.healthBenefits}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 bg-white/40 dark:bg-slate-900/30 rounded-[2.5rem] min-h-[400px]">
                <Apple className="w-16 h-16 text-slate-300 mb-3 animate-pulse" />
                <p className="text-xs text-slate-400 font-semibold text-center">Select a food item from the list to view detailed nutrition facts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
