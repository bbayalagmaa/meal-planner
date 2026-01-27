const RECIPES = [
  // === BREAKFAST ===
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
  {
    id: 4, name: "Protein Smoothie", category: "breakfast",
    calories: 290, protein: 25, carbs: 38, fat: 5, cookTime: 5,
    ingredients: ["banana 1", "milk 200ml", "protein powder 1 scoop", "spinach 30g"],
    instructions: "Blend all ingredients until smooth."
  },
  {
    id: 5, name: "Avocado Toast", category: "breakfast",
    calories: 320, protein: 12, carbs: 30, fat: 18, cookTime: 5,
    ingredients: ["bread 1 slice", "avocado 1/2", "egg 1", "lemon juice", "chili flakes"],
    instructions: "Toast bread, mash avocado with lemon, top with fried egg and chili flakes."
  },

  // === LUNCH ===
  {
    id: 10, name: "Chicken Breast & Rice", category: "lunch",
    calories: 450, protein: 40, carbs: 45, fat: 10, cookTime: 25,
    ingredients: ["chicken breast 150g", "rice 100g", "broccoli 100g", "soy sauce 1 tbsp", "garlic 2 cloves"],
    instructions: "Cook rice. Grill seasoned chicken 6-7 min per side. Steam broccoli. Serve together."
  },
  {
    id: 11, name: "Tuna Salad", category: "lunch",
    calories: 350, protein: 35, carbs: 20, fat: 14, cookTime: 10,
    ingredients: ["canned tuna 150g", "lettuce 100g", "tomato 1", "cucumber 1/2", "olive oil 1 tbsp", "lemon juice"],
    instructions: "Drain tuna, chop vegetables, mix together. Dress with olive oil and lemon."
  },
  {
    id: 12, name: "Beef & Vegetable Soup", category: "lunch",
    calories: 380, protein: 30, carbs: 35, fat: 12, cookTime: 40,
    ingredients: ["beef 150g", "potato 1", "carrot 1", "onion 1", "salt", "pepper"],
    instructions: "Brown beef cubes. Add diced vegetables and water. Simmer 30 min until tender."
  },
  {
    id: 13, name: "Chicken Wrap", category: "lunch",
    calories: 400, protein: 32, carbs: 38, fat: 12, cookTime: 15,
    ingredients: ["tortilla 1", "chicken breast 120g", "lettuce 50g", "tomato 1/2", "yogurt sauce 2 tbsp"],
    instructions: "Grill sliced chicken, warm tortilla, fill with chicken, veggies, and sauce. Roll tight."
  },
  {
    id: 14, name: "Lentil Soup", category: "lunch",
    calories: 340, protein: 22, carbs: 50, fat: 6, cookTime: 35,
    ingredients: ["red lentils 100g", "onion 1", "carrot 1", "garlic 2 cloves", "cumin 1 tsp", "olive oil 1 tsp"],
    instructions: "Sauté onion and garlic. Add lentils, carrot, cumin, and water. Simmer 25 min."
  },

  // === DINNER ===
  {
    id: 20, name: "Grilled Salmon & Veggies", category: "dinner",
    calories: 420, protein: 38, carbs: 15, fat: 24, cookTime: 20,
    ingredients: ["salmon fillet 150g", "zucchini 1", "bell pepper 1", "olive oil 1 tbsp", "lemon"],
    instructions: "Season salmon with lemon. Grill 4-5 min per side. Roast sliced vegetables at 200°C for 15 min."
  },
  {
    id: 21, name: "Stir-Fry Tofu & Vegetables", category: "dinner",
    calories: 320, protein: 20, carbs: 30, fat: 14, cookTime: 15,
    ingredients: ["tofu 200g", "bell pepper 1", "broccoli 100g", "soy sauce 2 tbsp", "garlic 2 cloves", "sesame oil 1 tsp"],
    instructions: "Press and cube tofu. Stir-fry tofu until golden, add vegetables and sauce, cook 5 min."
  },
  {
    id: 22, name: "Turkey Meatballs", category: "dinner",
    calories: 380, protein: 35, carbs: 25, fat: 15, cookTime: 25,
    ingredients: ["ground turkey 200g", "egg 1", "breadcrumbs 30g", "onion 1/2", "tomato sauce 100ml"],
    instructions: "Mix turkey, egg, breadcrumbs, diced onion. Form balls, bake at 190°C 20 min. Serve with sauce."
  },
  {
    id: 23, name: "Egg & Veggie Stir-Fry", category: "dinner",
    calories: 300, protein: 20, carbs: 18, fat: 16, cookTime: 10,
    ingredients: ["eggs 3", "spinach 100g", "mushrooms 80g", "onion 1/2", "olive oil 1 tsp"],
    instructions: "Sauté onion and mushrooms. Add spinach until wilted. Push aside, scramble eggs, mix together."
  },
  {
    id: 24, name: "Chicken Salad Bowl", category: "dinner",
    calories: 370, protein: 35, carbs: 22, fat: 16, cookTime: 15,
    ingredients: ["chicken breast 150g", "mixed greens 100g", "cherry tomatoes 80g", "feta cheese 30g", "olive oil 1 tbsp"],
    instructions: "Grill and slice chicken. Toss greens, tomatoes, feta. Top with chicken and drizzle oil."
  },

  // === SNACKS ===
  {
    id: 30, name: "Apple & Peanut Butter", category: "snack",
    calories: 200, protein: 6, carbs: 25, fat: 10, cookTime: 2,
    ingredients: ["apple 1", "peanut butter 1 tbsp"],
    instructions: "Slice apple, serve with peanut butter."
  },
  {
    id: 31, name: "Boiled Eggs", category: "snack",
    calories: 140, protein: 12, carbs: 1, fat: 10, cookTime: 10,
    ingredients: ["eggs 2"],
    instructions: "Boil eggs 8-10 min for hard-boiled. Cool in cold water."
  },
  {
    id: 32, name: "Carrot Sticks & Hummus", category: "snack",
    calories: 150, protein: 5, carbs: 18, fat: 7, cookTime: 2,
    ingredients: ["carrots 2", "hummus 50g"],
    instructions: "Cut carrots into sticks. Serve with hummus."
  },
  {
    id: 33, name: "Mixed Nuts", category: "snack",
    calories: 180, protein: 6, carbs: 8, fat: 16, cookTime: 0,
    ingredients: ["mixed nuts 30g"],
    instructions: "Portion out 30g of mixed nuts."
  }
];

function getRecipesByCategory(category) {
  return RECIPES.filter(r => r.category === category);
}

function getRecipeById(id) {
  return RECIPES.find(r => r.id === id);
}

function searchRecipes(query) {
  const q = query.toLowerCase();
  return RECIPES.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.ingredients.some(i => i.toLowerCase().includes(q))
  );
}
