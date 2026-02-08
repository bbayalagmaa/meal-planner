// Calorie calculator for weight management
// Profile is loaded from localStorage — set by user in profile setup

function getProfile() {
  return JSON.parse(localStorage.getItem("profile") || "null");
}

function hasProfile() {
  return !!getProfile();
}

function saveProfile(profile) {
  localStorage.setItem("profile", JSON.stringify(profile));
  // Clear custom calorie target so it recalculates from new profile
  localStorage.removeItem("custom_calorie_target");
}

function calcDailyCalories() {
  const profile = getProfile() || {
    age: 25, gender: "female", heightCm: 165,
    currentKg: 70, goalKg: 60, months: 5, activity: "moderate"
  };

  // Mifflin-St Jeor BMR
  let bmr;
  if (profile.gender === "female") {
    bmr = 10 * profile.currentKg + 6.25 * profile.heightCm - 5 * profile.age - 161;
  } else {
    bmr = 10 * profile.currentKg + 6.25 * profile.heightCm - 5 * profile.age + 5;
  }

  // Activity multiplier
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  const tdee = Math.round(bmr * (multipliers[profile.activity] || 1.55));

  // Deficit calculation
  const kgToLose = profile.currentKg - profile.goalKg;
  const days = profile.months * 30;
  const dailyDeficit = days > 0 ? Math.round((kgToLose * 7700) / days) : 0;
  let target = tdee - dailyDeficit;

  // Safety: minimum calories
  const minCal = profile.gender === "female" ? 1200 : 1500;
  if (target < minCal) target = minCal;

  const kgPerWeek = days > 0 ? Math.round(((kgToLose / days) * 7) * 10) / 10 : 0;

  return {
    bmr: Math.round(bmr),
    tdee,
    target: Math.round(target),
    deficit: dailyDeficit,
    kgPerWeek,
    profile,
    warning: kgPerWeek > 1.0
      ? "Losing " + kgPerWeek + " kg/week is aggressive. 0.5-1.0 kg/week is safer."
      : null
  };
}
