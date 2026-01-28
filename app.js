// Meal Planner - main app logic
// All data stored in localStorage

const App = {
  date: new Date().toISOString().split("T")[0],

  cookTimeFilter: "all", // "all", "15", "30", "45"

  init() {
    const info = calcDailyCalories();
    document.getElementById("calorie-target").textContent =
      "Daily target: " + info.target + " cal";

    this.setupThemeToggle();
    this.setupTabs();
    this.setupDateNav();
    this.renderMeals();
  },

  // --- Theme toggle ---
  setupThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    btn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.removeItem("theme");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      }
    });
  },

  // --- Favorites ---
  getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  },
  toggleFavorite(recipeId) {
    let favs = this.getFavorites();
    if (favs.includes(recipeId)) {
      favs = favs.filter(id => id !== recipeId);
    } else {
      favs.push(recipeId);
    }
    localStorage.setItem("favorites", JSON.stringify(favs));
  },
  isFavorite(recipeId) {
    return this.getFavorites().includes(recipeId);
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

    // Cook time filter
    let filterHtml = '<div class="filter-row">' +
      '<label>Cook time:</label>' +
      '<select id="cook-filter">' +
      '<option value="all"' + (this.cookTimeFilter === "all" ? " selected" : "") + '>All</option>' +
      '<option value="15"' + (this.cookTimeFilter === "15" ? " selected" : "") + '>&le; 15 min</option>' +
      '<option value="30"' + (this.cookTimeFilter === "30" ? " selected" : "") + '>&le; 30 min</option>' +
      '<option value="45"' + (this.cookTimeFilter === "45" ? " selected" : "") + '>&le; 45 min</option>' +
      '</select></div>';
    el.innerHTML = filterHtml;
    document.getElementById("cook-filter").addEventListener("change", (e) => {
      this.cookTimeFilter = e.target.value;
      this.renderMeals();
    });

    if (!plan) {
      el.innerHTML += '<div class="generate-row">' +
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
    const maxTime = this.cookTimeFilter === "all" ? Infinity : parseInt(this.cookTimeFilter);

    slots.forEach(slot => {
      const meal = plan[slot];
      if (!meal) return;
      if (meal.cookTime > maxTime) return;
      const isEaten = !!eaten[slot];
      const isFav = this.isFavorite(meal.id);
      html += '<div class="meal-card' + (isEaten ? " eaten" : "") + '">' +
        '<span class="slot">' + slotLabels[slot] + '</span><span class="cals">' + meal.calories + ' cal</span>' +
        '<h3>' + meal.name +
        (isFav ? ' <span class="fav-indicator">&#9733;</span>' : '') +
        '</h3>' +
        '<div class="meta">Cook time: ' + meal.cookTime + ' min | P: ' + meal.protein + "g | C: " + meal.carbs + "g | F: " + meal.fat + "g</div>" +
        '<div class="ingredients"><strong>Ingredients:</strong><ul>' +
        meal.ingredients.map(i => "<li>" + i + "</li>").join("") + "</ul></div>" +
        '<div class="steps"><strong>Steps:</strong><p>' + meal.instructions + "</p></div>" +
        '<div class="meal-actions">' +
        '<button class="btn btn-sm ' + (isEaten ? "btn-eaten" : "btn-outline") +
        '" data-slot="' + slot + '" data-action="eat">' + (isEaten ? "Eaten" : "Mark Eaten") + "</button>" +
        '<button class="btn btn-sm btn-outline" data-slot="' + slot + '" data-action="swap">Swap</button>' +
        '<button class="fav-btn' + (isFav ? " active" : "") +
        '" data-id="' + meal.id + '" title="' + (isFav ? "Unfavorite" : "Favorite") + '">&#9733;</button>' +
        "</div></div>";
    });

    html += '<div class="meal-actions" style="margin-top:8px">' +
      '<button class="btn btn-sm btn-outline" id="regen-btn">Regenerate</button>' +
      '<button class="btn btn-sm btn-danger" id="clear-btn">Clear</button></div>';

    el.innerHTML = filterHtml + html;

    // Re-attach filter listener after innerHTML replacement
    document.getElementById("cook-filter").addEventListener("change", (e) => {
      this.cookTimeFilter = e.target.value;
      this.renderMeals();
    });

    // Favorite toggles
    el.querySelectorAll(".fav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.toggleFavorite(parseInt(btn.dataset.id));
        this.renderMeals();
      });
    });

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
    // Weighted pick: favorites appear 3x more often
    const favs = this.getFavorites();
    const pick = arr => {
      const weighted = [];
      arr.forEach(r => {
        const times = favs.includes(r.id) ? 3 : 1;
        for (let i = 0; i < times; i++) weighted.push(r);
      });
      return weighted[Math.floor(Math.random() * weighted.length)];
    };
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
      '<button class="btn btn-sm btn-outline" id="uncheck-all-btn">Uncheck All</button> ' +
      '<button class="btn btn-sm btn-primary" id="print-btn">Print List</button></div>';

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
    // Print grocery list
    const printBtn = document.getElementById("print-btn");
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }
  },

  // === TRACK PROGRESS ===
  renderProgress() {
    const el = document.getElementById("progress-content");
    const info = calcDailyCalories();
    const weights = JSON.parse(localStorage.getItem("weight_log") || "[]");
    const latest = weights.length ? weights[weights.length - 1] : null;
    const currentKg = latest ? latest.kg : info.profile.currentKg;
    const totalToLose = info.profile.currentKg - info.profile.goalKg;
    const lost = Math.round((info.profile.currentKg - currentKg) * 10) / 10;
    const remaining = Math.round((currentKg - info.profile.goalKg) * 10) / 10;
    const goalPct = totalToLose > 0 ? Math.min(100, Math.round((lost / totalToLose) * 100)) : 0;

    let html = "";

    // --- Goal progress ring ---
    const ringSize = 140;
    const ringStroke = 10;
    const ringRadius = (ringSize - ringStroke) / 2;
    const ringCircum = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircum - (goalPct / 100) * ringCircum;
    const ringColor = goalPct >= 100 ? "var(--primary)" : "var(--primary-light)";

    html += '<div class="section goal-section"><h2>Goal Progress</h2>' +
      '<div class="goal-row">' +
      '<div class="goal-ring">' +
      '<svg width="' + ringSize + '" height="' + ringSize + '" viewBox="0 0 ' + ringSize + " " + ringSize + '">' +
      '<circle cx="' + ringSize/2 + '" cy="' + ringSize/2 + '" r="' + ringRadius + '" fill="none" stroke="var(--border)" stroke-width="' + ringStroke + '"/>' +
      '<circle cx="' + ringSize/2 + '" cy="' + ringSize/2 + '" r="' + ringRadius + '" fill="none" stroke="' + ringColor + '" stroke-width="' + ringStroke + '"' +
      ' stroke-dasharray="' + ringCircum + '" stroke-dashoffset="' + ringOffset + '" stroke-linecap="round" transform="rotate(-90 ' + ringSize/2 + " " + ringSize/2 + ')"/>' +
      '</svg>' +
      '<div class="goal-ring-text"><span class="goal-pct">' + goalPct + '%</span><span class="goal-sub">complete</span></div></div>' +
      '<div class="goal-stats">' +
      '<div class="goal-stat"><span class="goal-num">' + currentKg + '</span><span class="goal-label">Current kg</span></div>' +
      '<div class="goal-stat"><span class="goal-num">' + info.profile.goalKg + '</span><span class="goal-label">Goal kg</span></div>' +
      '<div class="goal-stat"><span class="goal-num ' + (lost > 0 ? "good" : "") + '">' + (lost > 0 ? "-" : "") + Math.abs(lost) + '</span><span class="goal-label">Lost kg</span></div>' +
      '<div class="goal-stat"><span class="goal-num">' + Math.max(0, remaining) + '</span><span class="goal-label">To go</span></div>' +
      "</div></div></div>";

    // --- Weight input ---
    html += '<div class="section"><h2>Log Today\'s Weight</h2>' +
      '<div class="input-row">' +
      '<input type="number" id="weight-in" placeholder="e.g. 76.5" step="0.1" min="30" max="200">' +
      '<button class="btn btn-primary" id="log-w-btn">Log</button></div>';
    if (latest) {
      html += '<p class="last-logged">Last: ' + latest.kg + " kg on " + latest.date + "</p>";
    }
    html += "</div>";

    // --- Weight chart (canvas) ---
    html += '<div class="section"><h2>Weight Over Time</h2>';
    if (weights.length >= 2) {
      html += '<canvas id="weight-chart" width="460" height="200"></canvas>';
    } else {
      html += '<p class="empty-sm">Log at least 2 weights to see the chart.</p>';
    }
    html += "</div>";

    // --- Calorie history (14 days) ---
    html += '<div class="section"><h2>Calorie History</h2><div class="cal-bars">';
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const eaten = this.getEaten(key);
      const cals = Object.values(eaten).reduce((s, m) => s + m.calories, 0);
      if (cals === 0 && i > 6) continue; // skip empty old days
      const pct = info.target > 0 ? Math.min(120, (cals / info.target) * 100) : 0;
      const over = cals > info.target;
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      html += '<div class="cal-row"><span class="label">' + dayName + '</span>' +
        '<div class="track"><div class="fill ' + (over ? "over" : "good") +
        '" style="width:' + Math.min(100, pct) + '%"></div></div>' +
        '<span class="val ' + (cals > 0 ? (over ? "text-red" : "text-green") : "") + '">' + (cals || "-") + "</span></div>";
    }
    html += "</div></div>";

    // --- Meals eaten log ---
    html += '<div class="section"><h2>Recent Meals Eaten</h2>';
    const mealDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const eaten = this.getEaten(key);
      const meals = Object.entries(eaten);
      if (meals.length) mealDays.push({ date: key, meals });
    }
    if (mealDays.length) {
      mealDays.forEach(day => {
        const dayCals = day.meals.reduce((s, m) => s + m[1].calories, 0);
        const over = dayCals > info.target;
        const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        html += '<div class="meal-log-day">' +
          '<div class="meal-log-header"><span>' + dayLabel + '</span>' +
          '<span class="' + (over ? "text-red" : "text-green") + '">' + dayCals + ' / ' + info.target + ' cal</span></div>';
        day.meals.forEach(([slot, m]) => {
          html += '<div class="meal-log-item"><span class="meal-log-slot">' + slot + '</span>' +
            '<span>' + m.name + '</span><span class="meal-log-cal">' + m.calories + '</span></div>';
        });
        html += "</div>";
      });
    } else {
      html += '<p class="empty-sm">No meals logged yet. Mark meals as eaten in the Meals tab.</p>';
    }
    html += "</div>";

    // --- Your numbers ---
    if (info.warning) {
      html += '<div class="warning">' + info.warning + "</div>";
    }
    html += '<div class="section"><h2>Your Numbers</h2><div class="info-grid">' +
      "<div>BMR: " + info.bmr + " cal</div>" +
      "<div>TDEE: " + info.tdee + " cal</div>" +
      "<div>Daily Target: " + info.target + " cal</div>" +
      "<div>Rate: " + info.kgPerWeek + " kg/week</div>" +
      "</div></div>";

    el.innerHTML = html;

    // --- Event: log weight ---
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

    // --- Draw weight chart ---
    if (weights.length >= 2) {
      this.drawWeightChart(weights, info.profile.goalKg);
    }
  },

  drawWeightChart(weights, goalKg) {
    const canvas = document.getElementById("weight-chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 15, bottom: 30, left: 40 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    // Data range
    const allKg = weights.map(w => w.kg).concat([goalKg]);
    const minKg = Math.floor(Math.min(...allKg) - 1);
    const maxKg = Math.ceil(Math.max(...allKg) + 1);
    const kgRange = maxKg - minKg;

    const toX = (i) => pad.left + (i / (weights.length - 1)) * cw;
    const toY = (kg) => pad.top + ((maxKg - kg) / kgRange) * ch;

    // Grid lines
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "right";
    const step = kgRange <= 6 ? 1 : kgRange <= 15 ? 2 : 5;
    for (let kg = minKg; kg <= maxKg; kg += step) {
      const y = toY(kg);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillText(kg + "", pad.left - 6, y + 4);
    }

    // X-axis labels (show first, last, and some middle dates)
    ctx.textAlign = "center";
    const labelCount = Math.min(weights.length, 5);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.round(i * (weights.length - 1) / (labelCount - 1));
      const x = toX(idx);
      ctx.fillText(weights[idx].date.slice(5), x, h - 6);
    }

    // Goal line
    ctx.strokeStyle = "#e63946";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    const goalY = toY(goalKg);
    ctx.beginPath(); ctx.moveTo(pad.left, goalY); ctx.lineTo(w - pad.right, goalY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#e63946";
    ctx.textAlign = "left";
    ctx.fillText("Goal: " + goalKg, w - pad.right - 50, goalY - 6);

    // Weight line
    ctx.strokeStyle = "#2d6a4f";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    weights.forEach((pt, i) => {
      const x = toX(i);
      const y = toY(pt.kg);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    ctx.fillStyle = "#2d6a4f";
    weights.forEach((pt, i) => {
      const x = toX(i);
      const y = toY(pt.kg);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
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
