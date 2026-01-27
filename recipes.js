const RECIPES = [
  // BREAKFAST (3)
  {
    id: 1, name: "Oatmeal with Banana", category: "breakfast",
    calories: 310, protein: 10, carbs: 55, fat: 6, cookTime: 10,
    ingredients: ["oats 80g", "banana 1", "milk 150ml", "honey 1 tsp"],
    instructions: "Boil milk, add oats, cook 5 min. Top with sliced banana and honey."
  },
  {
    id: 2, name: "Scrambled Eggs & Toast", category: "breakfast",
    calories: 350, protein: 22, carbs: 28, fat: 16, cookTime: 10,
    ingredients: ["eggs 3", "bread 1 slice", "butter 1 tsp", "salt", "pepper"],
    instructions: "Scramble eggs in butter over medium heat. Serve with toasted bread."
  },
  {
    id: 3, name: "Greek Yogurt Bowl", category: "breakfast",
    calories: 280, protein: 20, carbs: 35, fat: 8, cookTime: 5,
    ingredients: ["greek yogurt 200g", "mixed berries 100g", "granola 30g", "honey 1 tsp"],
    instructions: "Layer yogurt, berries, and granola. Drizzle with honey."
  },

  // LUNCH (3)
  {
    id: 4, name: "Chicken Breast & Rice", category: "lunch",
    calories: 450, protein: 40, carbs: 45, fat: 10, cookTime: 25,
    ingredients: ["chicken breast 150g", "rice 100g", "broccoli 100g", "soy sauce 1 tbsp", "garlic 2 cloves"],
    instructions: "Cook rice. Grill seasoned chicken 6-7 min per side. Steam broccoli. Serve together."
  },
  {
    id: 5, name: "Tuna Salad", category: "lunch",
    calories: 350, protein: 35, carbs: 20, fat: 14, cookTime: 10,
    ingredients: ["canned tuna 150g", "lettuce 100g", "tomato 1", "cucumber 1/2", "olive oil 1 tbsp", "lemon juice"],
    instructions: "Drain tuna, chop vegetables, mix together. Dress with olive oil and lemon."
  },
  {
    id: 6, name: "Beef & Vegetable Soup", category: "lunch",
    calories: 380, protein: 30, carbs: 35, fat: 12, cookTime: 40,
    ingredients: ["beef 150g", "potato 1", "carrot 1", "onion 1", "salt", "pepper"],
    instructions: "Brown beef cubes. Add diced vegetables and water. Simmer 30 min until tender."
  },

  // DINNER (2)
  {
    id: 7, name: "Grilled Salmon & Veggies", category: "dinner",
    calories: 420, protein: 38, carbs: 15, fat: 24, cookTime: 20,
    ingredients: ["salmon fillet 150g", "zucchini 1", "bell pepper 1", "olive oil 1 tbsp", "lemon"],
    instructions: "Season salmon with lemon. Grill 4-5 min per side. Roast sliced vegetables at 200C for 15 min."
  },
  {
    id: 8, name: "Egg & Veggie Stir-Fry", category: "dinner",
    calories: 300, protein: 20, carbs: 18, fat: 16, cookTime: 10,
    ingredients: ["eggs 3", "spinach 100g", "mushrooms 80g", "onion 1/2", "olive oil 1 tsp"],
    instructions: "Saute onion and mushrooms. Add spinach until wilted. Push aside, scramble eggs, mix together."
  },

  // SNACKS (2)
  {
    id: 9, name: "Apple & Peanut Butter", category: "snack",
    calories: 200, protein: 6, carbs: 25, fat: 10, cookTime: 2,
    ingredients: ["apple 1", "peanut butter 1 tbsp"],
    instructions: "Slice apple, serve with peanut butter."
  },
  {
    id: 10, name: "Boiled Eggs", category: "snack",
    calories: 140, protein: 12, carbs: 1, fat: 10, cookTime: 10,
    ingredients: ["eggs 2"],
    instructions: "Boil eggs 8-10 min for hard-boiled. Cool in cold water."
  }
];

function getRecipesByCategory(category) {
  return RECIPES.filter(r => r.category === category);
}

function getRecipeById(id) {
  return RECIPES.find(r => r.id === id);
}
