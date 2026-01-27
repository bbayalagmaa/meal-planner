// Generate daily meal plans within calorie budget

const MealPlan = {
  _key: "meal_plans",

  getPlans() {
    return JSON.parse(localStorage.getItem(this._key) || "{}");
  },

  savePlans(plans) {
    localStorage.setItem(this._key, JSON.stringify(plans));
  },

  // Get plan for a specific date (YYYY-MM-DD)
  getPlan(date) {
    return this.getPlans()[date] || null;
  },

  savePlan(date, plan) {
    const plans = this.getPlans();
    plans[date] = plan;
    this.savePlans(plans);
  },

  deletePlan(date) {
    const plans = this.getPlans();
    delete plans[date];
    this.savePlans(plans);
  },

  // Auto-generate a meal plan within calorie budget
  generate(calorieTarget) {
    const breakfast = pickRandom(getRecipesByCategory("breakfast"));
    const lunch = pickRandom(getRecipesByCategory("lunch"));
    const dinner = pickRandom(getRecipesByCategory("dinner"));

    const mealCals = breakfast.calories + lunch.calories + dinner.calories;
    const remaining = calorieTarget - mealCals;

    let snack = null;
    if (remaining >= 120) {
      const snacks = getRecipesByCategory("snack").filter(s => s.calories <= remaining);
      if (snacks.length) snack = pickRandom(snacks);
    }

    const meals = { breakfast, lunch, dinner };
    if (snack) meals.snack = snack;

    const totalCals = mealCals + (snack ? snack.calories : 0);
    const totalProtein = [breakfast, lunch, dinner, snack].reduce((s, m) => s + (m ? m.protein : 0), 0);
    const totalCarbs = [breakfast, lunch, dinner, snack].reduce((s, m) => s + (m ? m.carbs : 0), 0);
    const totalFat = [breakfast, lunch, dinner, snack].reduce((s, m) => s + (m ? m.fat : 0), 0);

    return {
      meals,
      totals: { calories: totalCals, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
      calorieTarget,
      withinBudget: totalCals <= calorieTarget
    };
  },

  // Regenerate just one meal slot
  swapMeal(plan, slot) {
    const category = slot === "snack" ? "snack" : slot;
    const options = getRecipesByCategory(category).filter(r => r.id !== plan.meals[slot]?.id);
    if (!options.length) return plan;

    plan.meals[slot] = pickRandom(options);
    // Recalculate totals
    const all = Object.values(plan.meals).filter(Boolean);
    plan.totals = {
      calories: all.reduce((s, m) => s + m.calories, 0),
      protein: all.reduce((s, m) => s + m.protein, 0),
      carbs: all.reduce((s, m) => s + m.carbs, 0),
      fat: all.reduce((s, m) => s + m.fat, 0)
    };
    plan.withinBudget = plan.totals.calories <= plan.calorieTarget;
    return plan;
  },

  todayKey() {
    return new Date().toISOString().split("T")[0];
  }
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
