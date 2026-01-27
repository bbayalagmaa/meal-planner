// Track weight and meals eaten

const Progress = {
  _weightKey: "weight_log",
  _mealLogKey: "meal_log",

  // --- Weight tracking ---
  getWeightLog() {
    return JSON.parse(localStorage.getItem(this._weightKey) || "[]");
  },

  logWeight(kg, date) {
    const log = this.getWeightLog();
    const d = date || new Date().toISOString().split("T")[0];
    const existing = log.findIndex(e => e.date === d);
    if (existing >= 0) {
      log[existing].kg = kg;
    } else {
      log.push({ date: d, kg });
    }
    log.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(this._weightKey, JSON.stringify(log));

    // Update current weight in nutrition profile
    const profile = Nutrition.getProfile();
    profile.currentKg = kg;
    Nutrition.saveProfile(profile);
  },

  getLatestWeight() {
    const log = this.getWeightLog();
    return log.length ? log[log.length - 1] : null;
  },

  getWeightChange() {
    const log = this.getWeightLog();
    if (log.length < 2) return null;
    const first = log[0];
    const last = log[log.length - 1];
    return {
      start: first.kg, current: last.kg,
      change: Math.round((last.kg - first.kg) * 10) / 10,
      days: Math.ceil((new Date(last.date) - new Date(first.date)) / 86400000)
    };
  },

  // --- Meal logging ---
  getMealLog() {
    return JSON.parse(localStorage.getItem(this._mealLogKey) || "{}");
  },

  logMeal(date, slot, recipe) {
    const log = this.getMealLog();
    if (!log[date]) log[date] = {};
    log[date][slot] = {
      recipeId: recipe.id, name: recipe.name,
      calories: recipe.calories, protein: recipe.protein,
      carbs: recipe.carbs, fat: recipe.fat,
      loggedAt: new Date().toISOString()
    };
    localStorage.setItem(this._mealLogKey, JSON.stringify(log));
  },

  removeMeal(date, slot) {
    const log = this.getMealLog();
    if (log[date]) {
      delete log[date][slot];
      localStorage.setItem(this._mealLogKey, JSON.stringify(log));
    }
  },

  getDayLog(date) {
    const log = this.getMealLog();
    return log[date] || {};
  },

  getDayTotals(date) {
    const day = this.getDayLog(date);
    const meals = Object.values(day);
    return {
      calories: meals.reduce((s, m) => s + m.calories, 0),
      protein: meals.reduce((s, m) => s + m.protein, 0),
      carbs: meals.reduce((s, m) => s + m.carbs, 0),
      fat: meals.reduce((s, m) => s + m.fat, 0),
      mealCount: meals.length
    };
  },

  // Get last N days of calorie data for chart
  getRecentCalories(days) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const totals = this.getDayTotals(key);
      result.push({ date: key, calories: totals.calories });
    }
    return result;
  }
};
