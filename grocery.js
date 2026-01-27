// Auto-generate shopping lists from meal plans

const Grocery = {
  _key: "grocery_lists",

  getLists() {
    return JSON.parse(localStorage.getItem(this._key) || "{}");
  },

  saveLists(lists) {
    localStorage.setItem(this._key, JSON.stringify(lists));
  },

  // Generate grocery list from a date range of meal plans
  generateFromPlans(startDate, days) {
    const ingredients = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const plan = MealPlan.getPlan(key);
      if (!plan) continue;

      Object.values(plan.meals).filter(Boolean).forEach(meal => {
        meal.ingredients.forEach(ing => {
          const normalized = ing.toLowerCase().trim();
          if (ingredients[normalized]) {
            ingredients[normalized].count++;
            ingredients[normalized].meals.push(meal.name);
          } else {
            ingredients[normalized] = {
              name: ing, count: 1, checked: false, meals: [meal.name]
            };
          }
        });
      });
    }

    return Object.values(ingredients).sort((a, b) => a.name.localeCompare(b.name));
  },

  // Generate from a single day's plan
  generateFromPlan(plan) {
    const ingredients = {};
    Object.values(plan.meals).filter(Boolean).forEach(meal => {
      meal.ingredients.forEach(ing => {
        const normalized = ing.toLowerCase().trim();
        if (ingredients[normalized]) {
          ingredients[normalized].count++;
        } else {
          ingredients[normalized] = { name: ing, count: 1, checked: false };
        }
      });
    });
    return Object.values(ingredients).sort((a, b) => a.name.localeCompare(b.name));
  },

  // Save a grocery list with checked state
  saveList(id, items) {
    const lists = this.getLists();
    lists[id] = { items, updatedAt: new Date().toISOString() };
    this.saveLists(lists);
  },

  getList(id) {
    return this.getLists()[id]?.items || [];
  },

  toggleItem(listId, index) {
    const lists = this.getLists();
    if (lists[listId]?.items[index]) {
      lists[listId].items[index].checked = !lists[listId].items[index].checked;
      this.saveLists(lists);
    }
  }
};
