// Calorie & macro calculator for weight loss
// Default profile: Female, 24, 78kg → 55kg, 5 months

const Nutrition = {
  getProfile() {
    const defaults = {
      age: 24, gender: "female", heightCm: 165,
      currentKg: 78, goalKg: 55, monthsToGoal: 5,
      activityLevel: "moderate" // light, moderate, active
    };
    const saved = localStorage.getItem("nutrition_profile");
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  },

  saveProfile(profile) {
    localStorage.setItem("nutrition_profile", JSON.stringify(profile));
  },

  // Mifflin-St Jeor BMR
  calcBMR(profile) {
    const p = profile || this.getProfile();
    if (p.gender === "female") {
      return 10 * p.currentKg + 6.25 * p.heightCm - 5 * p.age - 161;
    }
    return 10 * p.currentKg + 6.25 * p.heightCm - 5 * p.age + 5;
  },

  activityMultiplier(level) {
    const m = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    return m[level] || 1.55;
  },

  calcTDEE(profile) {
    const p = profile || this.getProfile();
    return Math.round(this.calcBMR(p) * this.activityMultiplier(p.activityLevel));
  },

  // Daily calorie target for weight loss
  calcDailyTarget(profile) {
    const p = profile || this.getProfile();
    const kgToLose = p.currentKg - p.goalKg;
    const days = p.monthsToGoal * 30;
    const kgPerWeek = (kgToLose / days) * 7;

    // 1 kg fat ≈ 7700 cal
    const dailyDeficit = Math.round((kgToLose * 7700) / days);
    const tdee = this.calcTDEE(p);
    let target = tdee - dailyDeficit;

    // Safety floor: never below 1200 for women, 1500 for men
    const floor = p.gender === "female" ? 1200 : 1500;
    if (target < floor) target = floor;

    return {
      tdee,
      target: Math.round(target),
      deficit: dailyDeficit,
      kgPerWeek: Math.round(kgPerWeek * 10) / 10,
      bmr: Math.round(this.calcBMR(p)),
      safe: kgPerWeek <= 1.0,
      warning: kgPerWeek > 1.0
        ? `Losing ${kgPerWeek.toFixed(1)} kg/week is aggressive. 0.5-1.0 kg/week is recommended.`
        : null
    };
  },

  // Macro split (balanced for weight loss)
  calcMacros(calories) {
    const protein = Math.round((calories * 0.30) / 4); // 30% protein, 4 cal/g
    const carbs = Math.round((calories * 0.40) / 4);   // 40% carbs
    const fat = Math.round((calories * 0.30) / 9);     // 30% fat, 9 cal/g
    return { protein, carbs, fat };
  },

  getSummary() {
    const p = this.getProfile();
    const calc = this.calcDailyTarget(p);
    const macros = this.calcMacros(calc.target);
    return { profile: p, ...calc, macros };
  }
};
