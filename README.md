# Meal Planner

A single-page web app for daily meal planning, calorie tracking, and weight management. No frameworks, no build tools — just HTML, CSS, and JavaScript with localStorage.

## Features

1. **Meal Plan Generation** — Auto-generates daily meals (breakfast, lunch, dinner, 2 snacks) fitted to your calorie target
2. **Recipe Search** — Search all recipes by name, ingredient, or category
3. **Grocery List** — Combined 2-day shopping list, categorized (Produce, Protein, Dairy, Pantry), with checkboxes
4. **Progress Tracking** — Weight log with chart, 14-day calorie history, weekly nutrition summary
5. **User Profile** — Personalized calorie targets via BMR/TDEE calculation based on your stats and goals
6. **Dark Mode** — Toggle light/dark theme, persisted in localStorage
7. **Favorites** — Star recipes so they appear more often in generated plans
8. **Cook Time Filter** — Filter daily meals by max prep time
9. **Custom Recipes** — Create your own recipes with full nutrition info; they integrate with plan generation, search, and grocery lists
10. **Water Intake Tracker** — Track daily water glasses with visual progress and 7-day history

## How to Use

Open `index.html` in a browser. No server needed.

## Tech

- Vanilla HTML/CSS/JavaScript (single-file capable)
- All data stored in `localStorage`
- Responsive design, works on mobile
- Print-friendly grocery list
