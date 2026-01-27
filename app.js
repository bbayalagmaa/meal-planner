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
        '<button class="btn btn-primary" id="gen-btn">Generate Meal Plan</button></div>';
      document.getElementById("gen-btn").addEventListener("click", () => {
        this.savePlan(this.date, this.generatePlan(info.target));
        this.renderMeals();
      });
      return;
    }

    const eaten = this.getEaten(this.date);
    const eatenCals = Object.values(eaten).reduce((s, m) => s + m.calories, 0);
    const pct = Math.min(100, (eatenCals / info.target) * 100);

    let html = '<div class="calorie-bar"><div class="row">' +
      "<span>Target: <strong>" + info.target + " cal</strong></span>" +
      "<span>Eaten: <strong>" + eatenCals + " cal</strong></span></div>" +
      '<div class="bar-track"><div class="bar-fill' + (pct > 100 ? " over" : "") +
      '" style="width:' + pct + '%"></div></div></div>';

    ["breakfast", "lunch", "dinner", "snack"].forEach(slot => {
      const meal = plan[slot];
      if (!meal) return;
      const isEaten = !!eaten[slot];
      html += '<div class="meal-card' + (isEaten ? " eaten" : "") + '">' +
        '<span class="slot">' + slot + '</span><span class="cals">' + meal.calories + ' cal</span>' +
        "<h3>" + meal.name + "</h3>" +
        '<div class="meta">P: ' + meal.protein + "g | C: " + meal.carbs + "g | F: " + meal.fat + "g | " + meal.cookTime + " min</div>" +
        "<details><summary>Ingredients & Instructions</summary>" +
        "<ul>" + meal.ingredients.map(i => "<li>" + i + "</li>").join("") + "</ul>" +
        "<p>" + meal.instructions + "</p></details>" +
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
        const cat = slot === "snack" ? "snack" : slot;
        const opts = getRecipesByCategory(cat).filter(r => r.id !== plan[slot].id);
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
    const b = pick(getRecipesByCategory("breakfast"));
    const l = pick(getRecipesByCategory("lunch"));
    const d = pick(getRecipesByCategory("dinner"));
    const plan = { breakfast: b, lunch: l, dinner: d };
    const remaining = calorieTarget - b.calories - l.calories - d.calories;
    if (remaining >= 100) {
      const snacks = getRecipesByCategory("snack").filter(s => s.calories <= remaining);
      if (snacks.length) plan.snack = pick(snacks);
    }
    return plan;
  },

  // === GROCERY LIST ===
  renderGrocery() {
    const el = document.getElementById("grocery-content");
    const plan = this.getPlan(this.date);
    if (!plan) {
      el.innerHTML = '<p class="empty">Generate a meal plan first in Today\'s Meals tab.</p>';
      return;
    }

    const items = [];
    const seen = {};
    Object.values(plan).forEach(meal => {
      meal.ingredients.forEach(ing => {
        const key = ing.toLowerCase();
        if (seen[key]) { seen[key].count++; }
        else { seen[key] = { name: ing, count: 1, checked: false }; items.push(seen[key]); }
      });
    });

    const saved = JSON.parse(localStorage.getItem("grocery_" + this.date) || "{}");
    items.forEach(item => { if (saved[item.name]) item.checked = true; });

    let html = "<h2>Shopping List</h2>";
    items.sort((a, b) => a.name.localeCompare(b.name));
    items.forEach((item, i) => {
      html += '<label class="grocery-item' + (item.checked ? " checked" : "") + '">' +
        '<input type="checkbox"' + (item.checked ? " checked" : "") + ' data-idx="' + i + '">' +
        "<span>" + item.name + (item.count > 1 ? " (x" + item.count + ")" : "") + "</span></label>";
    });
    const done = items.filter(i => i.checked).length;
    html += '<p class="grocery-count">' + done + "/" + items.length + " items</p>";

    el.innerHTML = html;

    el.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        items[cb.dataset.idx].checked = cb.checked;
        const state = {};
        items.forEach(i => { if (i.checked) state[i.name] = true; });
        localStorage.setItem("grocery_" + this.date, JSON.stringify(state));
        this.renderGrocery();
      });
    });
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
