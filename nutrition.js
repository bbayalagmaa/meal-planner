// Calorie calculator for weight loss
// Profile: Female, 24, 78kg -> 55kg, 5 months, moderate activity (gym Mon-Sat)

function calcDailyCalories() {
  const profile = JSON.parse(localStorage.getItem("profile") || "null") || {
    age: 24, gender: "female", heightCm: 165,
    currentKg: 78, goalKg: 55, months: 5, activity: "moderate"
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
  const dailyDeficit = Math.round((kgToLose * 7700) / days); // 7700 cal per kg fat
  let target = tdee - dailyDeficit;

  // Safety: never below 1200 cal for women
  if (target < 1200) target = 1200;

  const kgPerWeek = Math.round(((kgToLose / days) * 7) * 10) / 10;

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
