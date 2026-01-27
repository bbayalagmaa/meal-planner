// Meal Planner - main app logic
// All data stored in localStorage

const App = {
  date: new Date().toISOString().split("T")[0],

  init() {
    const info = calcDailyCalories();
    document.getElementById("calorie-target").textContent =
      "Daily target: " + info.target + " cal";

    this.setupTabs();
    this.setupDateNav();
    this.renderMeals();
  },

  // --- Tabs ---
  setupTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("tab-" + btn.dataset.tab).classList.add("active");

        if (btn.dataset.tab === "meals") this.renderMeals();
        if (btn.dataset.tab === "grocery") this.renderGrocery();
        if (btn.dataset.tab === "progress") this.renderProgress();
      });
    });
  },

  // --- Date navigation ---
  setupDateNav() {
    document.getElementById("prev-day").addEventListener("click", () => this.shiftDate(-1));
    document.getElementById("next-day").addEventListener("click", () => this.shiftDate(1));
    this.showDate();
  },

  shiftDate(delta) {
    const d = new Date(this.date);
    d.setDate(d.getDate() + delta);
    this.date = d.toISOString().split("T")[0];
    this.showDate();
    this.renderMeals();
  },

  showDate() {
    const d = new Date(this.date + "T12:00:00");
    const today = new Date().toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    document.getElementById("date-display").textContent = label + (this.date === today ? " (Today)" : "");
  },

  // === TODAY'S MEALS ===
  renderMeals() {
    const el = document.getElementById("meals-content");
    const plan = this.getPlan(this.date);
    const info = calcDailyCalories();

    if (!plan) {
      el.innerHTML = '<div class="generate-row">' +
        "<p>No meals planned for this day</p>" +
        '<button class="btn btn-primary" id="gen-btn">Generate Today\'s Plan</button></div>';
      document.getElementById("gen-btn").addEventListener("click", () => {
        this.savePlan(this.date, this.generatePlan(info.target));
        this.renderMeals();
      });
      return;
    }

    const eaten = this.getEaten(this.date);
    const eatenCals = Object.values(eaten).reduce((s, m) => s + m.calories, 0);

    // Calculate plan total calories
    const slots = ["breakfast", "lunch", "dinner", "snack1", "snack2"];
    const planCals = slots.reduce((s, slot) => s + (plan[slot] ? plan[slot].calories : 0), 0);
    const planProtein = slots.reduce((s, slot) => s + (plan[slot] ? plan[slot].protein : 0), 0);
    const planCarbs = slots.reduce((s, slot) => s + (plan[slot] ? plan[slot].carbs : 0), 0);
    const planFat = slots.reduce((s, slot) => s + (plan[slot] ? plan[slot].fat : 0), 0);
    const pct = Math.min(100, (eatenCals / info.target) * 100);
    const underOver = planCals <= info.target
      ? (info.target - planCals) + " cal under budget"
      : (planCals - info.target) + " cal over budget";

    let html = '<div class="calorie-bar">' +
      '<div class="row"><span>Target: <strong>' + info.target + ' cal</strong></span>' +
      '<span>Plan: <strong>' + planCals + ' cal</strong></span></div>' +
      '<div class="row"><span>Eaten: <strong>' + eatenCals + ' cal</strong></span>' +
      '<span class="' + (planCals <= info.target ? "under" : "over") + '">' + underOver + '</span></div>' +
      '<div class="bar-track"><div class="bar-fill' + (pct > 100 ? " over" : "") +
      '" style="width:' + pct + '%"></div></div>' +
      '<div class="macro-row">P: ' + planProtein + 'g | C: ' + planCarbs + 'g | F: ' + planFat + 'g</div></div>';

    const slotLabels = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack1: "Snack 1", snack2: "Snack 2" };

    slots.forEach(slot => {
      const meal = plan[slot];
      if (!meal) return;
      const isEaten = !!eaten[slot];
      html += '<div class="meal-card' + (isEaten ? " eaten" : "") + '">' +
        '<span class="slot">' + slotLabels[slot] + '</span><span class="cals">' + meal.calories + ' cal</span>' +
        "<h3>" + meal.name + "</h3>" +
        '<div class="meta">Cook time: ' + meal.cookTime + ' min | P: ' + meal.protein + "g | C: " + meal.carbs + "g | F: " + meal.fat + "g</div>" +
        '<div class="ingredients"><strong>Ingredients:</strong><ul>' +
        meal.ingredients.map(i => "<li>" + i + "</li>").join("") + "</ul></div>" +
        '<div class="steps"><strong>Steps:</strong><p>' + meal.instructions + "</p></div>" +
        '<div class="meal-actions">' +
        '<button class="btn btn-sm ' + (isEaten ? "btn-eaten" : "btn-outline") +
        '" data-slot="' + slot + '" data-action="eat">' + (isEaten ? "Eaten" : "Mark Eaten") + "</button>" +
        '<button class="btn btn-sm btn-outline" data-slot="' + slot + '" data-action="swap">Swap</button>' +
        "</div></div>";
    });

    html += '<div class="meal-actions" style="margin-top:8px">' +
      '<button class="btn btn-sm btn-outline" id="regen-btn">Regenerate</button>' +
      '<button class="btn btn-sm btn-danger" id="clear-btn">Clear</button></div>';

    el.innerHTML = html;

    el.querySelectorAll("[data-action=eat]").forEach(btn => {
      btn.addEventListener("click", () => {
        const slot = btn.dataset.slot;
        if (eaten[slot]) { this.removeEaten(this.date, slot); }
        else { this.logEaten(this.date, slot, plan[slot]); }
        this.renderMeals();
      });
    });
    el.querySelectorAll("[data-action=swap]").forEach(btn => {
      btn.addEventListener("click", () => {
        const slot = btn.dataset.slot;
        const cat = slot.startsWith("snack") ? "snack" : slot;
        // Exclude current recipe and the other snack's recipe
        const exclude = [plan[slot]?.id];
        if (slot === "snack1" && plan.snack2) exclude.push(plan.snack2.id);
        if (slot === "snack2" && plan.snack1) exclude.push(plan.snack1.id);
        const opts = getRecipesByCategory(cat).filter(r => !exclude.includes(r.id));
        if (opts.length) {
          plan[slot] = opts[Math.floor(Math.random() * opts.length)];
          this.savePlan(this.date, plan);
          this.renderMeals();
        }
      });
    });
    document.getElementById("regen-btn").addEventListener("click", () => {
      this.savePlan(this.date, this.generatePlan(info.target));
      this.renderMeals();
    });
    document.getElementById("clear-btn").addEventListener("click", () => {
      this.deletePlan(this.date);
      this.renderMeals();
    });
  },

  generatePlan(calorieTarget) {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    // Try up to 10 times to find a combo that fits the budget
    let best = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const b = pick(getRecipesByCategory("breakfast"));
      const l = pick(getRecipesByCategory("lunch"));
      const d = pick(getRecipesByCategory("dinner"));
      const plan = { breakfast: b, lunch: l, dinner: d };
      let total = b.calories + l.calories + d.calories;

      // Pick 2 snacks
      const allSnacks = getRecipesByCategory("snack");
      const s1 = pick(allSnacks);
      plan.snack1 = s1;
      total += s1.calories;
      const s2Options = allSnacks.filter(s => s.id !== s1.id);
      if (s2Options.length) {
        const s2 = pick(s2Options);
        plan.snack2 = s2;
        total += s2.calories;
      }

      if (!best || Math.abs(total - calorieTarget) < Math.abs(best.total - calorieTarget)) {
        best = { plan, total };
      }
      if (total <= calorieTarget) break;
    }
    return best.plan;
  },

  // === GROCERY LIST ===

  // Ingredient category lookup
  classifyIngredient(name) {
    const n = name.toLowerCase();
    // Protein
    if (/chicken|beef|salmon|tuna|eggs?\b|turkey/.test(n)) return "Protein";
    // Dairy
    if (/milk|butter|yogurt|cottage cheese|feta|cheese/.test(n)) return "Dairy";
    // Produce
    if (/banana|apple|lemon|berries|broccoli|lettuce|tomato|cucumber|carrot|onion|potato|garlic|zucchini|bell pepper|spinach|mushroom|celery/.test(n)) return "Produce";
    // Everything else
    return "Pantry";
  },

  // Extract base ingredient name for dedup (strip quantities)
  baseName(ingredient) {
    return ingredient.replace(/\s+\d[\d/.*]*\s*(g|kg|ml|l|tsp|tbsp|cloves?|slice|scoop)?\s*$/i, "").trim().toLowerCase();
  },

  // Build categorized, deduplicated list from a plan
  buildGroceryList(plan) {
    const map = {};
    const slots = ["breakfast", "lunch", "dinner", "snack1", "snack2"];
    slots.forEach(slot => {
      const meal = plan[slot];
      if (!meal) return;
      meal.ingredients.forEach(ing => {
        const base = this.baseName(ing);
        if (map[base]) {
          map[base].qty.push(ing);
          if (!map[base].meals.includes(meal.name)) map[base].meals.push(meal.name);
        } else {
          map[base] = {
            base: base,
            display: ing,
            qty: [ing],
            meals: [meal.name],
            category: this.classifyIngredient(ing),
            checked: false
          };
        }
      });
    });
    return Object.values(map);
  },

  tomorrowKey() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  },

  formatDateShort(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  },

  renderGrocery() {
    const el = document.getElementById("grocery-content");
    const groceryDate = localStorage.getItem("grocery_active_date") || this.date;
    const plan = this.getPlan(groceryDate);
    const todayPlan = this.getPlan(this.date);
    const tomorrowDate = this.tomorrowKey();
    const tomorrowPlan = this.getPlan(tomorrowDate);
    const info = calcDailyCalories();

    // Header with generate button
    let html = '<div class="grocery-header">' +
      '<button class="btn btn-primary" id="gen-tomorrow-btn">' +
      "Generate Tomorrow's List</button>";
    if (todayPlan) {
      html += '<button class="btn btn-outline btn-sm" id="show-today-btn">' +
        "Today's List</button>";
    }
    html += "</div>";

    if (!plan) {
      html += '<p class="empty">No meal plan yet. Click the button above to generate ' +
        "tomorrow's plan, or create today's plan in the Meals tab.</p>";
      el.innerHTML = html;
      this.groceryListeners(el, null, groceryDate, info, tomorrowDate);
      return;
    }

    // Build categorized list
    const items = this.buildGroceryList(plan);
    const saved = JSON.parse(localStorage.getItem("grocery_checked_" + groceryDate) || "{}");
    items.forEach(item => { if (saved[item.base]) item.checked = true; });

    const categories = ["Produce", "Protein", "Dairy", "Pantry"];
    const catIcons = { Produce: "🥬", Protein: "🥩", Dairy: "🧈", Pantry: "🫙" };

    html += '<div class="grocery-date-label">Shopping list for ' +
      this.formatDateShort(groceryDate) + "</div>";

    const total = items.length;
    const done = items.filter(i => i.checked).length;
    html += '<div class="grocery-progress"><span>' + done + " / " + total +
      " items</span>" +
      '<div class="bar-track"><div class="bar-fill" style="width:' +
      (total > 0 ? Math.round((done / total) * 100) : 0) + '%"></div></div></div>';

    let idx = 0;
    categories.forEach(cat => {
      const catItems = items.filter(i => i.category === cat);
      if (!catItems.length) return;
      html += '<div class="grocery-category"><h3>' + catIcons[cat] + " " + cat +
        ' <span class="cat-count">(' + catItems.length + ")</span></h3>";
      catItems.sort((a, b) => a.base.localeCompare(b.base));
      catItems.forEach(item => {
        const dupLabel = item.qty.length > 1 ? " (x" + item.qty.length + ")" : "";
        html += '<label class="grocery-item' + (item.checked ? " checked" : "") + '">' +
          '<input type="checkbox"' + (item.checked ? " checked" : "") +
          ' data-base="' + item.base + '">' +
          "<span>" + item.display + dupLabel + "</span>" +
          '<small class="grocery-meals">' + item.meals.join(", ") + "</small></label>";
        idx++;
      });
      html += "</div>";
    });

    html += '<div class="grocery-actions">' +
      '<button class="btn btn-sm btn-outline" id="uncheck-all-btn">Uncheck All</button></div>';

    el.innerHTML = html;
    this.groceryListeners(el, items, groceryDate, info, tomorrowDate);
  },

  groceryListeners(el, items, groceryDate, info, tomorrowDate) {
    // Generate tomorrow's list
    const genBtn = document.getElementById("gen-tomorrow-btn");
    if (genBtn) {
      genBtn.addEventListener("click", () => {
        let plan = this.getPlan(tomorrowDate);
        if (!plan) {
          plan = this.generatePlan(info.target);
          this.savePlan(tomorrowDate, plan);
        }
        localStorage.setItem("grocery_active_date", tomorrowDate);
        this.renderGrocery();
      });
    }
    // Show today's list
    const todayBtn = document.getElementById("show-today-btn");
    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        localStorage.setItem("grocery_active_date", this.date);
        this.renderGrocery();
      });
    }
    // Checkboxes
    if (items) {
      el.querySelectorAll("input[type=checkbox]").forEach(cb => {
        cb.addEventListener("change", () => {
          const base = cb.dataset.base;
          const item = items.find(i => i.base === base);
          if (item) item.checked = cb.checked;
          const state = {};
          items.forEach(i => { if (i.checked) state[i.base] = true; });
          localStorage.setItem("grocery_checked_" + groceryDate, JSON.stringify(state));
          this.renderGrocery();
        });
      });
    }
    // Uncheck all
    const uncheckBtn = document.getElementById("uncheck-all-btn");
    if (uncheckBtn) {
      uncheckBtn.addEventListener("click", () => {
        localStorage.removeItem("grocery_checked_" + groceryDate);
        this.renderGrocery();
      });
    }
  },

  // === TRACK PROGRESS ===
  renderProgress() {
    const el = document.getElementById("progress-content");
    const info = calcDailyCalories();
    const weights = JSON.parse(localStorage.getItem("weight_log") || "[]");
    const latest = weights.length ? weights[weights.length - 1] : null;
    const first = weights.length ? weights[0] : null;
    const lost = first && latest ? Math.round((first.kg - latest.kg) * 10) / 10 : 0;

    let html = '<div class="section"><h2>Log Weight</h2>' +
      '<div class="input-row">' +
      '<input type="number" id="weight-in" placeholder="Weight (kg)" step="0.1" min="30" max="200">' +
      '<button class="btn btn-primary" id="log-w-btn">Log</button></div>' +
      '<div class="stats">' +
      '<div class="stat"><span class="stat-label">Start</span><span class="stat-val">' + info.profile.currentKg + ' kg</span></div>' +
      '<div class="stat"><span class="stat-label">Goal</span><span class="stat-val">' + info.profile.goalKg + ' kg</span></div>' +
      '<div class="stat"><span class="stat-label">Current</span><span class="stat-val">' + (latest ? latest.kg : info.profile.currentKg) + ' kg</span></div>' +
      '<div class="stat"><span class="stat-label">Lost</span><span class="stat-val">' + Math.abs(lost) + ' kg</span></div>' +
      "</div>";

    if (weights.length) {
      html += '<ul class="history-list">';
      weights.slice().reverse().slice(0, 10).forEach(w => {
        html += "<li>" + w.date + ": <strong>" + w.kg + " kg</strong></li>";
      });
      html += "</ul>";
    }
    html += "</div>";

    // Last 7 days calories
    html += '<div class="section"><h2>Last 7 Days - Calories</h2><div class="cal-bars">';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const eaten = this.getEaten(key);
      const cals = Object.values(eaten).reduce((s, m) => s + m.calories, 0);
      const pct = info.target > 0 ? Math.min(100, (cals / info.target) * 100) : 0;
      html += '<div class="cal-row"><span class="label">' + key.slice(5) + '</span>' +
        '<div class="track"><div class="fill' + (cals > info.target ? " over" : "") +
        '" style="width:' + pct + '%"></div></div>' +
        '<span class="val">' + (cals || "-") + "</span></div>";
    }
    html += "</div></div>";

    if (info.warning) {
      html += '<div class="warning">' + info.warning + "</div>";
    }

    html += '<div class="section"><h2>Your Numbers</h2><div class="info-grid">' +
      "<div>BMR: " + info.bmr + " cal</div>" +
      "<div>TDEE: " + info.tdee + " cal</div>" +
      "<div>Target: " + info.target + " cal</div>" +
      "<div>Rate: " + info.kgPerWeek + " kg/week</div>" +
      "</div></div>";

    el.innerHTML = html;

    document.getElementById("log-w-btn").addEventListener("click", () => {
      const kg = parseFloat(document.getElementById("weight-in").value);
      if (!kg || kg < 30 || kg > 200) return;
      const today = new Date().toISOString().split("T")[0];
      const idx = weights.findIndex(w => w.date === today);
      if (idx >= 0) weights[idx].kg = kg; else weights.push({ date: today, kg });
      weights.sort((a, b) => a.date.localeCompare(b.date));
      localStorage.setItem("weight_log", JSON.stringify(weights));
      this.renderProgress();
    });
  },

  // --- localStorage helpers ---
  getPlan(date) { return JSON.parse(localStorage.getItem("plan_" + date) || "null"); },
  savePlan(date, plan) { localStorage.setItem("plan_" + date, JSON.stringify(plan)); },
  deletePlan(date) { localStorage.removeItem("plan_" + date); },

  getEaten(date) { return JSON.parse(localStorage.getItem("eaten_" + date) || "{}"); },
  logEaten(date, slot, meal) {
    const eaten = this.getEaten(date);
    eaten[slot] = { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, name: meal.name };
    localStorage.setItem("eaten_" + date, JSON.stringify(eaten));
  },
  removeEaten(date, slot) {
    const eaten = this.getEaten(date);
    delete eaten[slot];
    localStorage.setItem("eaten_" + date, JSON.stringify(eaten));
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
