// Main application logic

const App = {
  currentTab: "planner",
  currentDate: new Date().toISOString().split("T")[0],
  currentPlan: null,

  init() {
    this.setupTabs();
    this.loadPlanner();
    this.setupDateNav();
    document.getElementById("date-display").textContent = this.formatDate(this.currentDate);
  },

  // --- Tab navigation ---
  setupTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
        this.currentTab = btn.dataset.tab;

        if (btn.dataset.tab === "planner") this.loadPlanner();
        else if (btn.dataset.tab === "grocery") this.loadGrocery();
        else if (btn.dataset.tab === "progress") this.loadProgress();
        else if (btn.dataset.tab === "settings") this.loadSettings();
      });
    });
  },

  // --- Date navigation ---
  setupDateNav() {
    document.getElementById("prev-day").addEventListener("click", () => this.changeDate(-1));
    document.getElementById("next-day").addEventListener("click", () => this.changeDate(1));
    document.getElementById("today-btn").addEventListener("click", () => {
      this.currentDate = new Date().toISOString().split("T")[0];
      document.getElementById("date-display").textContent = this.formatDate(this.currentDate);
      this.loadPlanner();
    });
  },

  changeDate(delta) {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() + delta);
    this.currentDate = d.toISOString().split("T")[0];
    document.getElementById("date-display").textContent = this.formatDate(this.currentDate);
    this.loadPlanner();
  },

  formatDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    const today = new Date().toISOString().split("T")[0];
    const label = dateStr === today ? " (Today)" : "";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + label;
  },

  // === PLANNER TAB ===
  loadPlanner() {
    const container = document.getElementById("planner-content");
    const saved = MealPlan.getPlan(this.currentDate);
    const summary = Nutrition.getSummary();

    if (saved) {
      this.currentPlan = saved;
      this.renderPlan(container, saved, summary);
    } else {
      container.innerHTML = `
        <div class="calorie-summary">
          <p>Daily target: <strong>${summary.target} cal</strong></p>
        </div>
        <button class="btn btn-primary" id="generate-btn">Generate Meal Plan</button>
        <div id="plan-display"></div>
      `;
      document.getElementById("generate-btn").addEventListener("click", () => {
        const plan = MealPlan.generate(summary.target);
        MealPlan.savePlan(this.currentDate, plan);
        this.currentPlan = plan;
        this.renderPlan(container, plan, summary);
      });
    }
  },

  renderPlan(container, plan, summary) {
    const logged = Progress.getDayLog(this.currentDate);
    const dayTotals = Progress.getDayTotals(this.currentDate);

    let html = `
      <div class="calorie-summary">
        <div class="cal-row">
          <span>Target: <strong>${plan.calorieTarget} cal</strong></span>
          <span>Planned: <strong>${plan.totals.calories} cal</strong></span>
          <span>Eaten: <strong>${dayTotals.calories} cal</strong></span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${plan.withinBudget ? '' : 'over-budget'}"
               style="width: ${Math.min(100, (dayTotals.calories / plan.calorieTarget) * 100)}%"></div>
        </div>
        <div class="macros-row">
          <span>P: ${plan.totals.protein}g</span>
          <span>C: ${plan.totals.carbs}g</span>
          <span>F: ${plan.totals.fat}g</span>
        </div>
      </div>
    `;

    const slots = ["breakfast", "lunch", "dinner", "snack"];
    slots.forEach(slot => {
      const meal = plan.meals[slot];
      if (!meal) return;
      const isLogged = !!logged[slot];
      html += `
        <div class="meal-card ${isLogged ? 'logged' : ''}">
          <div class="meal-header">
            <span class="meal-slot">${slot}</span>
            <span class="meal-cals">${meal.calories} cal</span>
          </div>
          <h3>${meal.name}</h3>
          <div class="meal-macros">P: ${meal.protein}g | C: ${meal.carbs}g | F: ${meal.fat}g | ${meal.cookTime} min</div>
          <details>
            <summary>Ingredients & Instructions</summary>
            <ul>${meal.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
            <p>${meal.instructions}</p>
          </details>
          <div class="meal-actions">
            <button class="btn btn-sm ${isLogged ? 'btn-done' : 'btn-log'}" data-slot="${slot}" data-action="log">
              ${isLogged ? '✓ Eaten' : 'Mark Eaten'}
            </button>
            <button class="btn btn-sm btn-swap" data-slot="${slot}" data-action="swap">Swap</button>
          </div>
        </div>
      `;
    });

    html += `
      <div class="plan-actions">
        <button class="btn btn-secondary" id="regenerate-btn">Regenerate All</button>
        <button class="btn btn-danger" id="clear-plan-btn">Clear Plan</button>
      </div>
    `;

    container.innerHTML = html;

    // Event listeners
    container.querySelectorAll("[data-action='log']").forEach(btn => {
      btn.addEventListener("click", () => {
        const slot = btn.dataset.slot;
        const meal = plan.meals[slot];
        if (logged[slot]) {
          Progress.removeMeal(this.currentDate, slot);
        } else {
          Progress.logMeal(this.currentDate, slot, meal);
        }
        this.loadPlanner();
      });
    });

    container.querySelectorAll("[data-action='swap']").forEach(btn => {
      btn.addEventListener("click", () => {
        MealPlan.swapMeal(plan, btn.dataset.slot);
        MealPlan.savePlan(this.currentDate, plan);
        this.loadPlanner();
      });
    });

    document.getElementById("regenerate-btn").addEventListener("click", () => {
      const newPlan = MealPlan.generate(summary.target);
      MealPlan.savePlan(this.currentDate, newPlan);
      this.loadPlanner();
    });

    document.getElementById("clear-plan-btn").addEventListener("click", () => {
      MealPlan.deletePlan(this.currentDate);
      this.loadPlanner();
    });
  },

  // === GROCERY TAB ===
  loadGrocery() {
    const container = document.getElementById("grocery-content");
    const plan = MealPlan.getPlan(this.currentDate);

    if (!plan) {
      container.innerHTML = `<p class="empty-msg">No meal plan for today. Generate one in the Planner tab first.</p>`;
      return;
    }

    const items = Grocery.generateFromPlan(plan);
    const savedItems = Grocery.getList(this.currentDate);
    if (savedItems.length) {
      items.forEach((item, i) => {
        const saved = savedItems.find(s => s.name === item.name);
        if (saved) item.checked = saved.checked;
      });
    }

    let html = `<h2>Shopping List</h2><p class="subtitle">For ${this.formatDate(this.currentDate)}</p>`;
    html += `<div class="grocery-list">`;
    items.forEach((item, i) => {
      html += `
        <label class="grocery-item ${item.checked ? 'checked' : ''}">
          <input type="checkbox" ${item.checked ? 'checked' : ''} data-idx="${i}">
          <span>${item.name}${item.count > 1 ? ` (x${item.count})` : ''}</span>
        </label>
      `;
    });
    html += `</div>`;

    const checkedCount = items.filter(i => i.checked).length;
    html += `<p class="grocery-count">${checkedCount}/${items.length} items checked</p>`;

    container.innerHTML = html;

    container.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        items[parseInt(cb.dataset.idx)].checked = cb.checked;
        Grocery.saveList(this.currentDate, items);
        this.loadGrocery();
      });
    });
  },

  // === PROGRESS TAB ===
  loadProgress() {
    const container = document.getElementById("progress-content");
    const profile = Nutrition.getProfile();
    const weightLog = Progress.getWeightLog();
    const change = Progress.getWeightChange();
    const recentCals = Progress.getRecentCalories(7);
    const summary = Nutrition.getSummary();

    let html = `
      <div class="progress-section">
        <h2>Weight Tracker</h2>
        <div class="weight-input-row">
          <input type="number" id="weight-input" placeholder="Weight (kg)" step="0.1" min="30" max="200">
          <button class="btn btn-primary" id="log-weight-btn">Log Weight</button>
        </div>
        <div class="weight-stats">
          <div class="stat"><span class="stat-label">Start</span><span class="stat-value">${profile.currentKg} kg</span></div>
          <div class="stat"><span class="stat-label">Goal</span><span class="stat-value">${profile.goalKg} kg</span></div>
          <div class="stat"><span class="stat-label">Current</span><span class="stat-value">${change ? change.current : profile.currentKg} kg</span></div>
          <div class="stat"><span class="stat-label">Lost</span><span class="stat-value">${change ? Math.abs(change.change) : 0} kg</span></div>
        </div>
    `;

    if (weightLog.length > 0) {
      html += `<div class="weight-chart" id="weight-chart"></div>`;
      html += `<div class="weight-history"><h3>History</h3><ul>`;
      weightLog.slice().reverse().slice(0, 10).forEach(e => {
        html += `<li>${e.date}: <strong>${e.kg} kg</strong></li>`;
      });
      html += `</ul></div>`;
    }

    html += `</div>`;

    // Calorie history
    html += `<div class="progress-section"><h2>Last 7 Days - Calories</h2><div class="cal-history">`;
    recentCals.forEach(d => {
      const pct = summary.target > 0 ? Math.min(100, (d.calories / summary.target) * 100) : 0;
      const over = d.calories > summary.target;
      const dateLabel = d.date.slice(5);
      html += `
        <div class="cal-day">
          <span class="cal-day-label">${dateLabel}</span>
          <div class="cal-day-bar">
            <div class="cal-day-fill ${over ? 'over-budget' : ''}" style="width:${pct}%"></div>
          </div>
          <span class="cal-day-val">${d.calories || '-'}</span>
        </div>
      `;
    });
    html += `</div></div>`;

    // Nutrition info
    if (summary.warning) {
      html += `<div class="warning-box">${summary.warning}</div>`;
    }

    html += `
      <div class="progress-section">
        <h2>Your Numbers</h2>
        <div class="info-grid">
          <div>BMR: ${summary.bmr} cal</div>
          <div>TDEE: ${summary.tdee} cal</div>
          <div>Daily Target: ${summary.target} cal</div>
          <div>Weekly Loss: ${summary.kgPerWeek} kg/week</div>
          <div>Macros: P ${summary.macros.protein}g / C ${summary.macros.carbs}g / F ${summary.macros.fat}g</div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    document.getElementById("log-weight-btn").addEventListener("click", () => {
      const input = document.getElementById("weight-input");
      const kg = parseFloat(input.value);
      if (kg && kg > 30 && kg < 200) {
        Progress.logWeight(kg);
        input.value = "";
        this.loadProgress();
      }
    });
  },

  // === SETTINGS TAB ===
  loadSettings() {
    const container = document.getElementById("settings-content");
    const p = Nutrition.getProfile();

    container.innerHTML = `
      <h2>Profile Settings</h2>
      <div class="settings-form">
        <label>Age <input type="number" id="s-age" value="${p.age}" min="15" max="80"></label>
        <label>Gender
          <select id="s-gender">
            <option value="female" ${p.gender === 'female' ? 'selected' : ''}>Female</option>
            <option value="male" ${p.gender === 'male' ? 'selected' : ''}>Male</option>
          </select>
        </label>
        <label>Height (cm) <input type="number" id="s-height" value="${p.heightCm}" min="100" max="250"></label>
        <label>Current Weight (kg) <input type="number" id="s-current" value="${p.currentKg}" step="0.1"></label>
        <label>Goal Weight (kg) <input type="number" id="s-goal" value="${p.goalKg}" step="0.1"></label>
        <label>Months to Goal <input type="number" id="s-months" value="${p.monthsToGoal}" min="1" max="24"></label>
        <label>Activity Level
          <select id="s-activity">
            <option value="sedentary" ${p.activityLevel === 'sedentary' ? 'selected' : ''}>Sedentary</option>
            <option value="light" ${p.activityLevel === 'light' ? 'selected' : ''}>Light</option>
            <option value="moderate" ${p.activityLevel === 'moderate' ? 'selected' : ''}>Moderate (gym 3-5x/week)</option>
            <option value="active" ${p.activityLevel === 'active' ? 'selected' : ''}>Active (gym 6-7x/week)</option>
          </select>
        </label>
        <button class="btn btn-primary" id="save-settings">Save Settings</button>
      </div>
      <hr>
      <div class="danger-zone">
        <h3>Data</h3>
        <button class="btn btn-danger" id="clear-all-btn">Clear All Data</button>
      </div>
    `;

    document.getElementById("save-settings").addEventListener("click", () => {
      Nutrition.saveProfile({
        age: parseInt(document.getElementById("s-age").value),
        gender: document.getElementById("s-gender").value,
        heightCm: parseInt(document.getElementById("s-height").value),
        currentKg: parseFloat(document.getElementById("s-current").value),
        goalKg: parseFloat(document.getElementById("s-goal").value),
        monthsToGoal: parseInt(document.getElementById("s-months").value),
        activityLevel: document.getElementById("s-activity").value
      });
      alert("Settings saved!");
      this.loadSettings();
    });

    document.getElementById("clear-all-btn").addEventListener("click", () => {
      if (confirm("Delete ALL data? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
