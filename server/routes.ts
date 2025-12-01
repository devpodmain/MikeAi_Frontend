import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { AdminAuth, requireAdminAuth, requireSuperAdmin } from "./adminAuth";
import cookieParser from 'cookie-parser';
import { eq, sql, and, or, desc, inArray, isNull, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  insertUserProfileSchema,
  insertUserPreferencesSchema,
  insertRecipeSchema,
  insertMealPlanSchema,
  insertMealPlanItemSchema,
  insertMealLogSchema,
  insertHabitSchema,
  insertHabitLogSchema,
  insertWaterLogSchema,
  insertCoachClientSchema,
  insertMessageSchema,
  insertCommunityPostSchema,
  insertOrganizationSchema,
  insertOrgCoachSchema,
  insertOrgClientSchema,
  insertOrgMealPlanSchema,
  insertOrgWorkoutPlanSchema,
  insertPlanAssignmentSchema,
  insertOrgMessageSchema,
  users,
  adminAccounts,
  systemReports,
  coachVerifications,
  workoutPlans,
  orgClients,
  orgUsers,
  planAssignments,
  orgMealPlans,
  orgWorkoutPlans,
  orgMessages,
  payments,
} from "@shared/schema";
import Stripe from "stripe";
import { registerProfileRoutes } from "./routes/profile";
import {
  getUserId,
  requireOrgMembership,
  requireOrgOwner,
  requireCoach,
  requireOrgClient,
  requireCoachOrOwner,
  checkClientAccess,
  securityHeaders,
  logSecurityViolation,
  validateOrgId,
  getUserOrgPermissions,
  requireOrgActiveSubscription,
  requireOrgPaidSubscription,
  getOrgBillingStatus
} from "./auth-middleware";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia" as any,
});

// Utility function to format time ago
function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return past.toLocaleDateString();
}

// Utility function to format ingredient quantities and units
function formatIngredient(ingredient: any): any {
  if (!ingredient || typeof ingredient !== 'object') return ingredient;
  
  const formatted = { ...ingredient };
  
  // Format quantity: convert floats ending in .0 to integers
  if (formatted.amount || formatted.quantity) {
    const quantity = formatted.amount || formatted.quantity;
    if (typeof quantity === 'string') {
      const num = parseFloat(quantity);
      if (!isNaN(num)) {
        // If it's a whole number (ends in .0), convert to integer
        formatted.amount = formatted.amount ? (num % 1 === 0 ? num.toString().replace('.0', '') : quantity) : formatted.amount;
        formatted.quantity = formatted.quantity ? (num % 1 === 0 ? num.toString().replace('.0', '') : quantity) : formatted.quantity;
      }
    } else if (typeof quantity === 'number') {
      // If it's a whole number, remove decimal
      const formattedNum = quantity % 1 === 0 ? Math.round(quantity).toString() : quantity.toString();
      if (formatted.amount !== undefined) formatted.amount = formattedNum;
      if (formatted.quantity !== undefined) formatted.quantity = formattedNum;
    }
  }
  
  // Format unit: remove duplicate letters (e.g., "gg" -> "g", "mml" -> "ml")
  if (formatted.unit && typeof formatted.unit === 'string') {
    let unit = formatted.unit.toLowerCase().trim();
    
    // Remove duplicate consecutive letters
    unit = unit.replace(/(.)\1+/g, '$1');
    
    // Handle common duplicates that might not be consecutive
    const unitMappings: { [key: string]: string } = {
      'gg': 'g',
      'mml': 'ml',
      'tsp': 'tsp', // already correct
      'tbsp': 'tbsp', // already correct
      'oz': 'oz', // already correct
      'lb': 'lb', // already correct
      'kg': 'kg', // already correct
      'cup': 'cup', // already correct
      'cups': 'cups', // already correct
      'liter': 'liter',
      'litre': 'litre',
    };
    
    formatted.unit = unitMappings[unit] || unit;
  }
  
  return formatted;
}

// Function to format ingredients array
function formatIngredientsArray(ingredients: any[]): any[] {
  if (!Array.isArray(ingredients)) return ingredients;
  return ingredients.map(formatIngredient);
}

// Function to format recipe data including ingredients
function formatRecipeData(recipe: any): any {
  if (!recipe) return recipe;
  
  const formatted = { ...recipe };
  
  // Handle ingredients array
  if (formatted.ingredients && Array.isArray(formatted.ingredients)) {
    formatted.ingredients = formatIngredientsArray(formatted.ingredients);
  }
  
  return formatted;
}

// Function to format meal plan data including ingredients
function formatMealPlanData(mealPlan: any): any {
  if (!mealPlan) return mealPlan;
  
  if (Array.isArray(mealPlan)) {
    return mealPlan.map(formatMealPlanData);
  }
  
  const formatted = { ...mealPlan };
  
  // Handle direct ingredients array
  if (formatted.ingredients && Array.isArray(formatted.ingredients)) {
    formatted.ingredients = formatIngredientsArray(formatted.ingredients);
  }
  
  // Handle recipe data within meal plan
  if (formatted.recipe) {
    formatted.recipe = formatRecipeData(formatted.recipe);
  }
  
  // Handle meals array in day plans
  if (formatted.meals && Array.isArray(formatted.meals)) {
    formatted.meals = formatted.meals.map((meal: any) => {
      const formattedMeal = { ...meal };
      if (formattedMeal.ingredients) {
        formattedMeal.ingredients = formatIngredientsArray(formattedMeal.ingredients);
      }
      if (formattedMeal.recipe) {
        formattedMeal.recipe = formatRecipeData(formattedMeal.recipe);
      }
      return formattedMeal;
    });
  }
  
  // Handle days array in meal plans
  if (formatted.days && Array.isArray(formatted.days)) {
    formatted.days = formatted.days.map((day: any) => formatMealPlanData(day));
  }
  
  return formatted;
}

// Mock state removed - using real Passport authentication

// getUserId function is now imported from auth-middleware.ts

// Authentication middleware using Passport
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check subscription status (only for individual users)
async function requireActiveSubscription(req: any, res: any, next: any) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if this is an org member (coach/client) - they bypass individual trial system
  const sessionUser = req.user;
  if (sessionUser && sessionUser.authProvider === 'org_member') {
    return next(); // Organization members use org billing, not individual trials
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Organization users (org_owner, coach, org_client) bypass individual trial system
  // They have their own org billing/payment system
  if (['org_owner', 'coach', 'org_client', 'member'].includes(user.userType)) {
    return next(); // Organization users are handled by org billing
  }

  // For individual users, check trial/subscription status
  // Check if user is still in trial period
  if (user.subscriptionStatus === "trial" && user.trialEndsAt) {
    const now = new Date();
    if (now < user.trialEndsAt) {
      return next(); // Trial still active
    }
  }

  // Check if user has active subscription
  if (user.subscriptionStatus === "active") {
    return next(); // Subscription is active
  }

  // Individual user needs to subscribe
  return res.status(402).json({ 
    message: "Subscription required",
    trialExpired: user.subscriptionStatus === "trial" && user.trialEndsAt && new Date() >= user.trialEndsAt
  });
}

// Middleware to check organization member access and soft-locking
async function checkOrgMemberAccess(req: any, res: any, next: any) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if this is an org member (coach/client) or regular user (org_owner)
  const sessionUser = req.user;
  
  if (sessionUser && sessionUser.authProvider === 'org_member') {
    // This is a coach or client - fetch from org_users table
    const orgMemberId = parseInt(userId);
    const orgMember = await storage.getOrgUser(orgMemberId);
    
    if (!orgMember) {
      return res.status(404).json({ message: "Organization member not found" });
    }
    
    // Check entitlement/soft-locking
    const entitlement = await storage.getMemberEntitlement(orgMember.organizationId, userId);
    
    if (entitlement && entitlement.status.startsWith('locked_')) {
      return res.status(403).json({
        locked: true,
        reason: entitlement.lockedReason || 'Your access has been paused. Please contact your organization owner.'
      });
    }
    
    return next();
  }
  
  // Regular user (org_owner) - fetch from users table
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  if (user.userType === 'org_owner') {
    return next();
  }
  
  if (['coach', 'org_client'].includes(user.userType)) {
    if (!user.currentOrgId) {
      return res.status(400).json({ message: "No organization associated with this user" });
    }

    const entitlement = await storage.getMemberEntitlement(user.currentOrgId, userId);
    
    if (entitlement && entitlement.status.startsWith('locked_')) {
      return res.status(403).json({
        locked: true,
        reason: entitlement.lockedReason || 'Your access has been paused. Please contact your organization owner.'
      });
    }
  }
  
  next();
}

// Function to create sample recipes with dietary tags
async function createSampleRecipesWithTags() {
  try {
    const existingRecipes = await storage.getRecipes({ limit: 1 });
    if (existingRecipes.length > 0) {
      return;
    }
    
    const sampleRecipes = [
      {
        name: "Quinoa Buddha Bowl",
        description: "A nutritious vegan bowl with quinoa, roasted vegetables, and tahini dressing",
        cuisine: "Mediterranean",
        mealType: "lunch" as const,
        cookingTime: 30,
        servings: 2,
        calories: 450,
        protein: "15",
        carbs: "65",
        fats: "18",
        ingredients: [
          { name: "Quinoa", amount: "1", unit: "cup" },
          { name: "Sweet potato", amount: "1", unit: "medium" },
          { name: "Chickpeas", amount: "1", unit: "can" },
          { name: "Spinach", amount: "2", unit: "cups" },
          { name: "Tahini", amount: "3", unit: "tbsp" }
        ],
        instructions: [
          "Cook quinoa according to package instructions",
          "Roast sweet potato and chickpeas at 400°F for 25 minutes",
          "Mix tahini with lemon juice and water for dressing",
          "Assemble bowl with quinoa, vegetables, and dressing"
        ],
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop",
        tags: ["Vegan", "Gluten-Free", "High Protein", "Healthy"],
        difficulty: "easy" as const,
        rating: "4.8",
        createdBy: "system"
      },
      {
        name: "Avocado Toast Supreme",
        description: "Classic avocado toast with hemp seeds and nutritional yeast",
        cuisine: "American",
        mealType: "breakfast" as const,
        cookingTime: 10,
        servings: 1,
        calories: 320,
        protein: "12",
        carbs: "35",
        fats: "18",
        ingredients: [
          { name: "Whole grain bread", amount: "2", unit: "slices" },
          { name: "Avocado", amount: "1", unit: "medium" },
          { name: "Hemp seeds", amount: "1", unit: "tbsp" },
          { name: "Nutritional yeast", amount: "1", unit: "tbsp" },
          { name: "Lemon juice", amount: "1", unit: "tsp" }
        ],
        instructions: [
          "Toast bread until golden brown",
          "Mash avocado with lemon juice and salt",
          "Spread avocado on toast",
          "Sprinkle with hemp seeds and nutritional yeast"
        ],
        imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop",
        tags: ["Vegan", "Quick", "Easy", "Healthy"],
        difficulty: "easy" as const,
        rating: "4.5",
        createdBy: "system"
      },
      {
        name: "Lentil Curry",
        description: "Hearty red lentil curry with coconut milk and spices",
        cuisine: "Indian",
        mealType: "dinner" as const,
        cookingTime: 25,
        servings: 4,
        calories: 380,
        protein: "18",
        carbs: "45",
        fats: "12",
        ingredients: [
          { name: "Red lentils", amount: "1", unit: "cup" },
          { name: "Coconut milk", amount: "1", unit: "can" },
          { name: "Onion", amount: "1", unit: "medium" },
          { name: "Garlic", amount: "3", unit: "cloves" },
          { name: "Curry powder", amount: "2", unit: "tsp" }
        ],
        instructions: [
          "Sauté onion and garlic until fragrant",
          "Add curry powder and cook for 1 minute",
          "Add lentils and coconut milk",
          "Simmer for 20 minutes until lentils are tender"
        ],
        imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop",
        tags: ["Vegan", "Gluten-Free", "High Protein"],
        difficulty: "medium" as const,
        rating: "4.7",
        createdBy: "system"
      },
      {
        name: "Green Smoothie Bowl",
        description: "Refreshing spinach and mango smoothie bowl with superfood toppings",
        cuisine: "American",
        mealType: "breakfast" as const,
        cookingTime: 5,
        servings: 1,
        calories: 280,
        protein: "8",
        carbs: "58",
        fats: "6",
        ingredients: [
          { name: "Frozen mango", amount: "1", unit: "cup" },
          { name: "Spinach", amount: "1", unit: "cup" },
          { name: "Banana", amount: "1", unit: "medium" },
          { name: "Almond milk", amount: "1/2", unit: "cup" },
          { name: "Chia seeds", amount: "1", unit: "tbsp" }
        ],
        instructions: [
          "Blend all ingredients until smooth",
          "Pour into bowl",
          "Top with fresh fruit and chia seeds"
        ],
        imageUrl: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop",
        tags: ["Vegan", "Gluten-Free", "Quick", "Easy"],
        difficulty: "easy" as const,
        rating: "4.6",
        createdBy: "system"
      },
      {
        name: "Chickpea Salad Sandwich",
        description: "Protein-packed chickpea salad with herbs and vegetables",
        cuisine: "American",
        mealType: "lunch" as const,
        cookingTime: 15,
        servings: 2,
        calories: 350,
        protein: "16",
        carbs: "52",
        fats: "8",
        ingredients: [
          { name: "Chickpeas", amount: "1", unit: "can" },
          { name: "Celery", amount: "2", unit: "stalks" },
          { name: "Red onion", amount: "1/4", unit: "cup" },
          { name: "Vegan mayo", amount: "3", unit: "tbsp" },
          { name: "Bread", amount: "4", unit: "slices" }
        ],
        instructions: [
          "Mash chickpeas with fork",
          "Mix in diced celery and onion",
          "Add vegan mayo and seasonings",
          "Serve on bread with lettuce"
        ],
        imageUrl: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&h=300&fit=crop",
        tags: ["Vegan", "High Protein", "Easy"],
        difficulty: "easy" as const,
        rating: "4.4",
        createdBy: "system"
      }
    ];

    for (const recipe of sampleRecipes) {
      await storage.createRecipe(recipe);
    }
  } catch (error) {
    // Silent error handling
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security headers to all responses
  app.use(securityHeaders);
  
  // Cookie parser middleware for admin sessions
  app.use(cookieParser());
  
  // Public routes that don't require authentication
  // Note: org-member-login endpoint is in server/auth.ts
  
  app.get('/api/recipes', async (req, res) => {
    try {
      const { cuisine, mealType, tags, search, limit, offset } = req.query;
      const filters = {
        cuisine: cuisine as string,
        mealType: mealType as string,
        tags: tags ? (tags as string).split(',') : undefined,
        search: search as string,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      };
      
      const recipes = await storage.getRecipes(filters);
      
      // Format ingredients in all recipes before sending response
      const formattedRecipes = recipes.map(formatRecipeData);
      
      res.json(formattedRecipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get('/api/recipes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Format ingredients before sending response
      const formattedRecipe = formatRecipeData(recipe);
      res.json(formattedRecipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Recipe favorite endpoint
  app.post('/api/recipes/:id/favorite', requireAuth, async (req: any, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (isNaN(recipeId)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }
      
      // For now, just return success - can implement favorite storage later
      res.json({ 
        success: true, 
        message: "Recipe favorited successfully",
        recipeId: recipeId,
        userId: userId
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to favorite recipe" });
    }
  });

  // Coach profile endpoint
  app.post('/api/coach-profile', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const coachProfileData = {
        userId,
        ...req.body,
      };
      
      // For now, return success response
      // In production, this would save to database via storage.createCoachProfile()
      res.json({
        success: true,
        message: "Coach profile created successfully",
        profile: coachProfileData
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create coach profile" });
    }
  });

  // Logout endpoint - destroys session and redirects to landing page
  app.get('/api/logout', (req, res) => {
    // Destroy session and redirect to landing page
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        // Clear session cookie with all possible options
        res.clearCookie('connect.sid', { 
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
        res.redirect('/');
      });
    } else {
      res.clearCookie('connect.sid', { 
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      res.redirect('/');
    }
  });

  // Setup email/password authentication
  try {
    await setupAuth(app);
  } catch (error) {
    // Silent error handling
  }
  
  // Workout Plans API routes (protected - require active subscription for individual users)
  app.post('/api/workout-plans', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const { name, goal, weeks, daysPerWeek, split, planData, progressionNotes, warmupNotes, deloadNotes } = req.body;

      // First, delete any existing workout plan for this user
      await db.delete(workoutPlans).where(eq(workoutPlans.userId, userId));

      // Insert new workout plan
      const [newPlan] = await db.insert(workoutPlans).values({
        userId,
        name,
        goal,
        weeks,
        daysPerWeek,
        split,
        planData,
        progressionNotes,
        warmupNotes,
        deloadNotes,
      }).returning();

      res.json({ success: true, plan: newPlan });
    } catch (error) {
      res.status(500).json({ message: "Failed to save workout plan" });
    }
  });

  app.post('/api/workout-plans/preview', requireAuth, requireActiveSubscription, async (req: any, res) => {
    // Disable timeouts for AI generation - these can take several minutes for larger plans
    req.setTimeout(0);
    res.setTimeout(0);
    
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const { profile, prefs, weeks = 8 } = req.body;
      
      if (!profile || !prefs) {
        return res.status(400).json({ message: "Missing required fields: profile, prefs" });
      }

      const AI_API_BASE = process.env.VITE_API_BASE_URL || "http://localhost:8000";
      
      const requestBody = {
        profile,
        prefs,
        weeks
      };

      const aiResponse = await fetch(`${AI_API_BASE}/ai/workouts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI service error:', errorText);
        return res.status(aiResponse.status).json({ 
          message: "Failed to generate workout plan preview",
          error: errorText 
        });
      }

      const aiData = await aiResponse.json();
      
      if (!aiData.success || !aiData.data) {
        return res.status(500).json({ message: "AI service returned invalid response" });
      }

      res.json({
        success: true,
        data: aiData.data,
        preview: true
      });
    } catch (error: any) {
      console.error('Workout plan preview error:', error);
      res.status(500).json({ 
        message: "Failed to generate workout plan preview",
        error: error.message 
      });
    }
  });

  app.get('/api/workout-plans/:userId', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const { userId: requestedUserId } = req.params;
      const currentUserId = getUserId(req);
      
      if (!currentUserId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      // For now, allow users to access their own plans only
      if (currentUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const [plan] = await db.select().from(workoutPlans).where(eq(workoutPlans.userId, requestedUserId)).limit(1);
      
      if (!plan) {
        return res.status(404).json({ message: "No workout plan found" });
      }

      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout plan" });
    }
  });

  app.delete('/api/workout-plans/:userId', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const { userId: requestedUserId } = req.params;
      const currentUserId = getUserId(req);
      
      if (!currentUserId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      // For now, allow users to delete their own plans only
      if (currentUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await db.delete(workoutPlans).where(eq(workoutPlans.userId, requestedUserId));
      
      res.json({ success: true, message: "Workout plan deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workout plan" });
    }
  });

  // API to get all meal plans for recipes page
  app.get('/api/db/all-meal-plans', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      // Get all meal plans from localStorage/database
      const allPlans: any[] = []; // This would fetch from database in production
      // For now, return empty array as meal plans are stored in localStorage
      res.json(allPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  // Workout Progress Routes
  app.post('/api/workout-progress', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const { user_id, exercise_name, workout_name, date, sets_data, best_weight, best_reps, total_volume, notes } = req.body;
      
      // Verify user can only save their own progress
      if (userId !== user_id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Insert or update progress (upsert)
      await db.execute(sql`
        INSERT INTO workout_progress (user_id, exercise_name, workout_name, date, sets_data, best_weight, best_reps, total_volume, notes, updated_at)
        VALUES (${user_id}, ${exercise_name}, ${workout_name}, ${date}, ${JSON.stringify(sets_data)}, ${best_weight}, ${best_reps}, ${total_volume}, ${notes}, NOW())
        ON CONFLICT (user_id, exercise_name, date) 
        DO UPDATE SET 
          sets_data = ${JSON.stringify(sets_data)},
          best_weight = ${best_weight},
          best_reps = ${best_reps},
          total_volume = ${total_volume},
          notes = ${notes},
          updated_at = NOW()
      `);

      // Update workout streaks only once per day (not per exercise)
      const existingStreakResult = await db.execute(sql`
        SELECT * FROM workout_streaks WHERE user_id = ${user_id}
      `);

      if (existingStreakResult.rows.length > 0) {
        const currentStreak = existingStreakResult.rows[0] as any;
        const lastWorkoutDate = new Date(currentStreak.last_workout_date);
        lastWorkoutDate.setHours(0, 0, 0, 0);
        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);
        const daysDifference = Math.floor((currentDate.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));

        // Only update if this is a new workout day (not the same day)
        if (daysDifference > 0) {
          let newCurrentStreak = currentStreak.current_streak;
          if (daysDifference === 1) {
            newCurrentStreak = currentStreak.current_streak + 1;
          } else {
            newCurrentStreak = 1;
          }

          const newLongestStreak = Math.max(currentStreak.longest_streak, newCurrentStreak);

          await db.execute(sql`
            UPDATE workout_streaks
            SET current_streak = ${newCurrentStreak},
                longest_streak = ${newLongestStreak},
                total_workouts = ${currentStreak.total_workouts + 1},
                last_workout_date = ${date}
            WHERE user_id = ${user_id}
          `);
          
          // Award points only once per workout day
          await storage.awardPoints(user_id, 10);
        }
      } else {
        // First workout ever - create streak record and award points
        await db.execute(sql`
          INSERT INTO workout_streaks (user_id, current_streak, longest_streak, total_workouts, last_workout_date)
          VALUES (${user_id}, 1, 1, 1, ${date})
        `);
        await storage.awardPoints(user_id, 10);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to save workout progress" });
    }
  });

  app.get('/api/workout-progress/:userId/:exerciseName/best', requireAuth, async (req: any, res) => {
    try {
      const { userId: requestedUserId, exerciseName } = req.params;
      const currentUserId = getUserId(req);
      
      if (!currentUserId || currentUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await db.execute(sql`
        SELECT best_weight as weight, best_reps as reps, date::text
        FROM workout_progress 
        WHERE user_id = ${requestedUserId} AND exercise_name = ${decodeURIComponent(exerciseName)}
        ORDER BY best_weight DESC, best_reps DESC, date DESC
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ message: "No previous data found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch previous best" });
    }
  });

  // Get all workout progress for a specific date
  app.get('/api/workout-logs/:userId/:date', requireAuth, async (req: any, res) => {
    try {
      const { userId: requestedUserId, date } = req.params;
      const currentUserId = getUserId(req);
      
      if (!currentUserId || currentUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await db.execute(sql`
        SELECT exercise_name, sets_data, workout_name, notes
        FROM workout_progress 
        WHERE user_id = ${requestedUserId} AND date = ${date}
        ORDER BY exercise_name
      `);

      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout logs" });
    }
  });

  // Workout Streaks Routes
  app.post('/api/workout-streaks', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const { user_id, workout_date } = req.body;
      
      if (userId !== user_id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Award points for workout completion
      await storage.awardPoints(userId, 10);

      // Get current streak data
      const existingResult = await db.execute(sql`
        SELECT * FROM workout_streaks WHERE user_id = ${user_id}
      `);

      const today = new Date(workout_date);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (existingResult.rows.length === 0) {
        // First workout
        await db.execute(sql`
          INSERT INTO workout_streaks (user_id, current_streak, longest_streak, last_workout_date, total_workouts)
          VALUES (${user_id}, 1, 1, ${workout_date}, 1)
        `);
      } else {
        const current = existingResult.rows[0] as any;
        const lastWorkoutDate = new Date(current.last_workout_date);
        const daysDiff = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = current.current_streak;
        
        if (daysDiff === 1) {
          // Consecutive day
          newStreak = current.current_streak + 1;
        } else if (daysDiff > 1) {
          // Streak broken
          newStreak = 1;
        }
        // Same day = keep current streak

        const newLongest = Math.max(newStreak, current.longest_streak);

        await db.execute(sql`
          UPDATE workout_streaks 
          SET current_streak = ${newStreak}, 
              longest_streak = ${newLongest},
              last_workout_date = ${workout_date},
              total_workouts = ${current.total_workouts + 1},
              updated_at = NOW()
          WHERE user_id = ${user_id}
        `);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update workout streaks" });
    }
  });

  app.get('/api/workout-streaks/:userId', requireAuth, async (req: any, res) => {
    try {
      const { userId: requestedUserId } = req.params;
      const currentUserId = getUserId(req);
      
      if (!currentUserId || currentUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await db.execute(sql`
        SELECT current_streak, longest_streak, total_workouts 
        FROM workout_streaks 
        WHERE user_id = ${requestedUserId}
      `);

      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.json({ current_streak: 0, longest_streak: 0, total_workouts: 0 });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout streaks" });
    }
  });

  // Create sample recipes with dietary tags
  await createSampleRecipesWithTags();

  // Test endpoint to check session (disabled for production)
  // app.get('/api/test-session', (req: any, res) => {
  //   res.json({
  //     isAuthenticated: req.isAuthenticated(),
  //     user: req.user,
  //     sessionId: req.session.id,
  //     cookies: req.headers.cookie
  //   });
  // });

  // Get authenticated user info
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(200).json({ user: null, isAuthenticated: false });
      }

      const user = req.user;
      if (!user || !user.id) {
        return res.status(200).json({ user: null, isAuthenticated: false });
      }

      // Handle org members (coaches/clients) differently
      if (user.authProvider === 'org_member') {
        // Return the session data directly for org members
        return res.json(user);
      }

      // Get full user data from database for regular users
      const dbUser = await storage.getUser(user.id);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get organization info if user is in an org
      let orgInfo: any = null;
      if (dbUser.currentOrgId) {
        const org = await storage.getOrganization(dbUser.currentOrgId);
        if (org) {
          orgInfo = {
            id: org.id,
            name: org.name,
            logoUrl: org.logoUrl,
            ownerId: org.ownerId
          };

          // If user is org_client, get their coach info
          if (dbUser.userType === 'org_client') {
            const clients = await storage.getOrgClients(org.id);
            const clientData = clients.find(c => c.userId === user.id);
            if (clientData && clientData.coachId) {
              const coach = await storage.getUser(clientData.coachId);
              if (coach) {
                orgInfo.coachId = coach.id;
                orgInfo.coachName = `${coach.firstName} ${coach.lastName}`;
                orgInfo.coachEmail = coach.email;
              }
            }
          }
        }
      }

      // For individual users, check for active payments to determine true subscription status
      // This ensures existing paid subscribers are recognized even if webhook didn't update the users table
      let effectiveSubscriptionStatus = dbUser.subscriptionStatus;
      let effectiveSubscriptionTier = dbUser.subscriptionTier;
      
      if (dbUser.userType === 'individual' || !dbUser.userType) {
        const activePayment = await storage.getUserActivePayment(dbUser.id);
        if (activePayment && activePayment.expiresAt && new Date() < activePayment.expiresAt) {
          // User has a valid active payment - they are a subscriber
          effectiveSubscriptionStatus = 'active';
          effectiveSubscriptionTier = 'plus';
          
          // Auto-heal: update the users table if it's out of sync
          if (dbUser.subscriptionStatus !== 'active') {
            try {
              await storage.updateUserSubscription(dbUser.id, {
                subscriptionStatus: 'active',
                subscriptionTier: 'plus'
              });
            } catch (updateError) {
              console.error('Failed to auto-heal user subscription:', updateError);
            }
          }
        } else {
          // No active payment - check if user ever had a payment (to distinguish from trial users)
          const allPayments = await storage.getUserPayments(dbUser.id);
          const hadPreviousPayment = allPayments && allPayments.length > 0;
          
          if (hadPreviousPayment) {
            // User had a payment that expired - set to canceled/free
            effectiveSubscriptionStatus = 'canceled';
            effectiveSubscriptionTier = 'free';
            
            // Auto-heal: update the users table if it's out of sync
            if (dbUser.subscriptionStatus !== 'canceled' || dbUser.subscriptionTier !== 'free') {
              try {
                await storage.updateUserSubscription(dbUser.id, {
                  subscriptionStatus: 'canceled',
                  subscriptionTier: 'free'
                });
                console.log(`[EXPIRY SYNC] Updated user ${dbUser.id} to canceled/free on login`);
              } catch (updateError) {
                console.error('Failed to auto-heal expired subscription:', updateError);
              }
            }
          }
          // If no previous payment, user is still on trial - keep their current status
        }
      }
      
      const isTrialExpired = effectiveSubscriptionStatus === "trial" && dbUser.trialEndsAt && new Date() >= dbUser.trialEndsAt;
      
      const responseData: any = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        userType: dbUser.userType,
        subscriptionStatus: effectiveSubscriptionStatus,
        subscriptionTier: effectiveSubscriptionTier,
        trialEndsAt: dbUser.trialEndsAt,
        trialExpired: isTrialExpired,
        trialDaysRemaining: dbUser.trialEndsAt ? Math.max(0, Math.ceil((dbUser.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
      };

      if (orgInfo) {
        responseData.currentOrgId = dbUser.currentOrgId;
        responseData.organizationId = orgInfo.id;
        responseData.organizationName = orgInfo.name;
        responseData.organizationLogo = orgInfo.logoUrl;
        if (orgInfo.ownerId === dbUser.id) {
          responseData.ownerId = dbUser.id;
        }
        if (orgInfo.coachId) {
          responseData.coachId = orgInfo.coachId;
          responseData.coachName = orgInfo.coachName;
          responseData.coachEmail = orgInfo.coachEmail;
        }
      }

      res.json(responseData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Forgot password - generate reset token and send email
  app.post('/api/auth/forgot-password', async (req: any, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Import schema
      const { passwordResetTokens, orgUsers, organizations } = await import("@shared/schema");
      const crypto = await import('crypto');
      const { sendPasswordResetEmail } = await import('./email');

      // Check if email belongs to a regular user (individual/org_owner)
      const user = await storage.getUserByEmail(email);
      let resetToken: any = null;
      let firstName = '';

      if (user) {
        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Save token to database
        const [tokenRecord] = await db.insert(passwordResetTokens).values({
          token,
          userId: user.id,
          orgUserId: null,
          userType: user.userType as any,
          expiresAt,
        }).returning();

        resetToken = tokenRecord;
        firstName = user.firstName || email.split('@')[0];
      } else {
        // Check if email belongs to an org member (coach/client)
        const orgMember = await db.query.orgUsers.findFirst({
          where: eq(orgUsers.email, email)
        });

        if (orgMember) {
          // Generate reset token
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

          // Save token to database
          const [tokenRecord] = await db.insert(passwordResetTokens).values({
            token,
            userId: null,
            orgUserId: orgMember.id,
            userType: orgMember.role === 'coach' ? 'coach' : 'org_client',
            expiresAt,
          }).returning();

          resetToken = tokenRecord;
          firstName = orgMember.firstName || email.split('@')[0];
        }
      }

      if (!resetToken) {
        // For security, don't reveal if email exists or not
        return res.json({ 
          success: true, 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }

      // Send password reset email
      const resetUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}/reset-password?token=${resetToken.token}` 
        : `http://localhost:5000/reset-password?token=${resetToken.token}`;

      await sendPasswordResetEmail({
        to: email,
        firstName,
        resetLink: resetUrl,
      });

      res.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Failed to process forgot password request" });
    }
  });

  // Reset password - validate token and update password
  app.post('/api/auth/reset-password', async (req: any, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Import schema
      const { passwordResetTokens, orgUsers } = await import("@shared/schema");

      // Find and validate token
      const tokenRecord = await db.query.passwordResetTokens.findFirst({
        where: eq(passwordResetTokens.token, token)
      });

      if (!tokenRecord) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expiresAt) {
        // Delete expired token
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in appropriate table
      if (tokenRecord.userId) {
        // Regular user (individual/org_owner)
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, tokenRecord.userId));
      } else if (tokenRecord.orgUserId) {
        // Org member (coach/client)
        await db.update(orgUsers)
          .set({ password: hashedPassword })
          .where(eq(orgUsers.id, tokenRecord.orgUserId));
      }

      // Delete used token
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

      res.json({ 
        success: true, 
        message: "Password has been reset successfully" 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Contact form submission (public endpoint)
  app.post('/api/contact', async (req: any, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      // Validate field lengths
      if (name.length > 100) {
        return res.status(400).json({ message: "Name is too long (max 100 characters)" });
      }
      if (subject.length > 200) {
        return res.status(400).json({ message: "Subject is too long (max 200 characters)" });
      }
      if (message.length > 5000) {
        return res.status(400).json({ message: "Message is too long (max 5000 characters)" });
      }

      const { sendContactFormEmail } = await import('./email');

      const result = await sendContactFormEmail({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      });

      if (!result.success) {
        console.error('Failed to send contact form email:', result.error);
        return res.status(500).json({ message: "Failed to send message. Please try again." });
      }

      res.json({ 
        success: true, 
        message: "Your message has been sent successfully. We'll get back to you soon!" 
      });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ message: "Failed to send message. Please try again." });
    }
  });

  // Org member change personal password
  app.post('/api/org-member/change-password', requireAuth, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Check if user is an org member
      if (user.authProvider !== 'org_member') {
        return res.status(400).json({ message: "This endpoint is only for organization members" });
      }

      // Import schema
      const { orgUsers, organizations } = await import("@shared/schema");

      // Get org member from database
      const orgMemberId = parseInt(user.id);
      const orgMember = await db.query.orgUsers.findFirst({
        where: eq(orgUsers.id, orgMemberId)
      });

      if (!orgMember) {
        return res.status(404).json({ message: "Organization member not found" });
      }

      // Get organization for common password
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgMember.organizationId)
      });

      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Verify current password (personal OR common)
      let isValidCurrentPassword = false;

      if (orgMember.password) {
        // Try personal password first
        isValidCurrentPassword = await bcrypt.compare(currentPassword, orgMember.password);
      }

      if (!isValidCurrentPassword && org.commonPassword) {
        // Try org common password
        isValidCurrentPassword = await bcrypt.compare(currentPassword, org.commonPassword);
      }

      if (!isValidCurrentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash and save new personal password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.update(orgUsers)
        .set({ password: hashedPassword })
        .where(eq(orgUsers.id, orgMemberId));

      res.json({ 
        success: true, 
        message: "Personal password has been set successfully" 
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Get user's organizations
  app.get('/api/user/organizations', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get organizations where user is owner
      const ownedOrgs = await storage.getUserOrganizations(userId);
      const orgsAsOwner = ownedOrgs.map(org => ({
        ...org,
        role: 'owner'
      }));

      // Get organizations where user is a coach
      const coachOrgs = await storage.getOrgsWhereUserIsCoach(userId);
      const orgsAsCoach = coachOrgs.map((rel: any) => ({
        id: rel.organization.id,
        name: rel.organization.name,
        logoUrl: rel.organization.logoUrl,
        role: 'coach'
      }));

      // Get organizations where user is a client
      const clientOrgs = await storage.getOrgsWhereUserIsClient(userId);
      const orgsAsClient = clientOrgs.map((rel: any) => ({
        id: rel.organization.id,
        name: rel.organization.name,
        logoUrl: rel.organization.logoUrl,
        role: 'client'
      }));

      // Combine all organizations
      const allOrgs = [...orgsAsOwner, ...orgsAsCoach, ...orgsAsClient];

      res.json(allOrgs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Switch between individual and organization mode
  app.post('/api/auth/switch-mode', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { mode, orgId } = req.body;
      
      if (mode === 'individual') {
        // Switch to individual mode
        await storage.updateUserOrgSettings(userId, {
          userType: 'individual',
          currentOrgId: null,
        });
        
        res.json({ 
          success: true, 
          userType: 'individual',
          message: "Switched to individual mode"
        });
      } else if (mode === 'organization' && orgId) {
        // Verify user has access to this organization
        const org = await storage.getOrganization(orgId);
        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Determine user's role in the organization
        let userType = 'individual';
        let hasAccess = false;

        if (org.ownerId === userId) {
          userType = 'org_owner';
          hasAccess = true;
        } else {
          // Check if user is a coach
          const coaches = await storage.getOrgCoaches(orgId);
          const isCoach = coaches.some(coach => coach.userId === userId);
          
          if (isCoach) {
            userType = 'coach';
            hasAccess = true;
          } else {
            // Check if user is a client
            const clients = await storage.getOrgClients(orgId);
            const isClient = clients.some(client => client.userId === userId);
            
            if (isClient) {
              userType = 'org_client';
              hasAccess = true;
            }
          }
        }

        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have access to this organization" });
        }

        // Update user's current organization and type
        await storage.updateUserOrgSettings(userId, {
          userType,
          currentOrgId: orgId,
        });

        res.json({ 
          success: true, 
          userType,
          organizationId: orgId,
          organizationName: org.name,
          message: `Switched to ${org.name}`
        });
      } else {
        res.status(400).json({ message: "Invalid mode or missing orgId" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to switch mode" });
    }
  });


  // Chatbot API endpoint
  app.post('/api/chatbot/message', async (req, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Enhanced system prompt for more intelligent responses
      const systemPrompt = `You are MikeAI, an expert nutrition and meal planning assistant. Provide personalized, evidence-based dietary guidance with practical actionable steps.

Context: ${context?.userType || 'individual'} user on ${context?.screenContext || 'the app'}

Core expertise:
- Personalized meal planning based on goals, preferences, and restrictions
- Nutrition science and macro/micronutrient guidance
- Habit formation psychology and behavior change
- Recipe modifications and cooking techniques
- Professional coaching strategies (for coaches)

Response guidelines:
- Provide specific, actionable advice with measurable steps
- Include nutritional reasoning behind recommendations
- Suggest portion sizes, timing, and preparation methods when relevant
- Ask clarifying questions about dietary preferences, allergies, and goals
- Be encouraging and supportive while maintaining scientific accuracy
- Keep responses focused but comprehensive (3-5 sentences)
- For coaches: Include professional insights and client management strategies
- For individuals: Focus on personal implementation and motivation

Always prioritize health, safety, and sustainable practices.`;

      // Call Perplexity API with improved configuration
      const requestBody = {
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
        top_p: 0.9,
        stream: false
      };
      
      // Add fallback response for testing while debugging API issues
      if (!process.env.PERPLEXITY_API_KEY) {
        const fallbackMessage = `Hello! I'm your MikeAI assistant. I can help you with meal planning, habit tracking, and navigation. I'm currently in test mode, but I can still provide guidance about the ${context?.screenContext || 'current'} page. What would you like to know?`;
        return res.json({ message: fallbackMessage });
      }

      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!perplexityResponse.ok) {
        const errorText = await perplexityResponse.text();
        
        // Provide a helpful fallback response instead of generic error
        const fallbackMessage = getFallbackResponse(message, context);
        return res.json({ message: fallbackMessage });
      }

      const data = await perplexityResponse.json();
      const aiMessage = data.choices[0]?.message?.content || "I'm sorry, I couldn't process your request right now. Please try again.";

      res.json({ message: aiMessage });
    } catch (error) {
      // Provide helpful fallback instead of generic error
      const fallbackMessage = getFallbackResponse(req.body.message, req.body.context);
      res.json({ message: fallbackMessage });
    }
  });

  // Enhanced helper function to provide intelligent contextual responses
  function getFallbackResponse(message: string, context: any) {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced weight loss and health goals with specific advice
    if (lowerMessage.includes('weight') && lowerMessage.includes('lose')) {
      return `For healthy weight loss: Start with a 500-calorie daily deficit through portion control and increased activity. Focus on protein (1g per lb body weight), fiber-rich vegetables, and whole grains. Track your meals in MikeAI to monitor progress. Aim for 1-2 lbs per week loss for sustainable results.`;
    }
    
    if (lowerMessage.includes('muscle') || lowerMessage.includes('gain') || lowerMessage.includes('protein')) {
      return `For muscle building: Consume 1.6-2.2g protein per kg body weight daily. Include lean sources like chicken, fish, eggs, and legumes. Eat in a slight caloric surplus (200-500 calories). Time protein intake around workouts for optimal recovery. MikeAI can help track your macros automatically.`;
    }
    
    // Enhanced meal planning with specific strategies
    if (lowerMessage.includes('meal prep') || lowerMessage.includes('meal planning')) {
      return `Effective meal prep strategy: Plan 3-4 recipes for the week, shop on weekends, batch cook proteins and grains. Prep vegetables fresh every 2-3 days. Use glass containers for food safety. Start with 2-3 days of meals if you're new to prep. Our recipe database has prep-friendly options!`;
    }
    
    if (lowerMessage.includes('breakfast') || lowerMessage.includes('morning')) {
      return `Quick healthy breakfasts: Greek yogurt with berries and nuts (20g protein), overnight oats with protein powder, or scrambled eggs with vegetables. Aim for 20-30g protein and fiber to stay full. Prep overnight oats in batches for busy mornings.`;
    }
    
    if (lowerMessage.includes('snack') || lowerMessage.includes('hungry')) {
      return `Smart snacking: Combine protein + fiber for satiety. Try apple with almond butter, Greek yogurt with berries, or hummus with vegetables. Keep portions to 150-200 calories. Drink water first - thirst often feels like hunger.`;
    }
    
    // Enhanced nutrition-specific responses
    if (lowerMessage.includes('calorie') || lowerMessage.includes('macros') || lowerMessage.includes('tracking')) {
      return `Calorie and macro tracking: Start by logging everything for a week to understand your baseline. Use the 40/30/30 rule (carbs/protein/fat) as a starting point. Focus on whole foods over processed. MikeAI automatically calculates your needs based on your goals and activity level.`;
    }
    
    if (lowerMessage.includes('water') || lowerMessage.includes('hydration')) {
      return `Optimal hydration: Aim for half your body weight in ounces daily, plus 16-24oz per hour of exercise. Start your day with 16-20oz of water. Add electrolytes during intense workouts. Track in MikeAI's habit section to build consistency.`;
    }
    
    // Diet-specific guidance
    if (lowerMessage.includes('keto') || lowerMessage.includes('ketogenic')) {
      return `Keto guidelines: Keep carbs under 20-25g daily, moderate protein (1g per lb lean mass), fill remaining calories with healthy fats. Focus on avocados, nuts, olive oil, fatty fish. Track ketones for first few weeks. Stay hydrated and supplement electrolytes.`;
    }
    
    if (lowerMessage.includes('vegan') || lowerMessage.includes('plant based')) {
      return `Plant-based nutrition: Combine proteins (rice+beans, quinoa+nuts) for complete amino acids. Focus on B12, iron, omega-3, and vitamin D supplements. Include dark leafy greens, legumes, nuts, and seeds daily. Our vegan recipe collection has balanced meal ideas.`;
    }
    
    if (lowerMessage.includes('intermittent fasting') || lowerMessage.includes('if ')) {
      return `Intermittent fasting: Start with 16:8 (16hr fast, 8hr eating window). Break your fast with balanced meals including protein and fiber. Stay hydrated during fasting periods. Listen to your body and adjust timing as needed. Track in MikeAI's habit section.`;
    }
    
    // Enhanced coaching responses
    if (context?.userType === 'coach') {
      if (lowerMessage.includes('client') && lowerMessage.includes('progress')) {
        return `Client progress tracking: Monitor weight trends (not daily fluctuations), body measurements, energy levels, and adherence to meal plans. Use progress photos monthly. Focus on non-scale victories like improved sleep and energy. Document everything in client profiles for pattern recognition.`;
      }
      
      if (lowerMessage.includes('meal plan') && context?.userType === 'coach') {
        return `Creating client meal plans: Start with their preferences, allergies, and cooking skills. Provide 3-4 options per meal for flexibility. Include prep instructions and shopping lists. Adjust portions based on their goals and activity level. Use our template system for consistency.`;
      }
    }
    
    // Enhanced habit tracking with psychology
    if (lowerMessage.includes('habit') || lowerMessage.includes('consistency')) {
      return `Building lasting habits: Start small (1% better daily), stack new habits onto existing ones, and track completion immediately. Aim for 80% consistency rather than perfection. Celebrate small wins. Use MikeAI's point system for motivation and streak tracking.`;
    }
    
    // Recipe and cooking help
    if (lowerMessage.includes('recipe') || lowerMessage.includes('cook')) {
      return `Recipe suggestions: Filter by your dietary preferences, cooking time, and skill level in our recipe database. Start with 5-ingredient meals if you're new to cooking. Batch cook versatile ingredients like grilled chicken or quinoa for multiple meals.`;
    }
    
    // Login and getting started (enhanced)
    if (lowerMessage.includes('login') || lowerMessage.includes('start') || lowerMessage.includes('account')) {
      return `Getting started with MikeAI: Create your profile with accurate stats and goals. Complete the initial assessment for personalized recommendations. Set up 2-3 simple habits to begin with. Explore the recipe database and community features. ${context?.userType === 'coach' ? 'As a coach, you can immediately start adding clients and creating meal plans.' : 'Start with our 10-day trial to explore all features.'}`;
    }
    
    // Greetings (enhanced)
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.includes('how are you')) {
      return `Hello! I'm MikeAI, your nutrition and wellness companion. I can help you create personalized meal plans, build healthy habits, track nutrition goals, and provide evidence-based dietary guidance. What would you like to work on today?`;
    }
    
    // Navigation and help (enhanced)
    if (lowerMessage.includes('help') || lowerMessage.includes('navigate') || lowerMessage.includes('find')) {
      const userTypeHelp = context?.userType === 'coach' 
        ? 'manage clients, create meal plans, track client progress, and access coaching tools'
        : 'track habits, browse recipes, create meal plans, and connect with the community';
      return `I'm here to help you navigate MikeAI! You can ${userTypeHelp}. The main sections are: Dashboard (overview), Recipes (meal ideas), ${context?.userType === 'coach' ? 'Clients (management tools)' : 'Habits (tracking)'}, and Community (support). What specific feature would you like help with?`;
    }
    
    // Default enhanced contextual response
    if (context?.screenContext) {
      return `You're currently on ${context.screenContext}. I can provide specific guidance for this section, help with navigation, answer nutrition questions, or assist with meal planning. What would you like to know?`;
    }
    
    // Enhanced final fallback
    return `I'm MikeAI, your intelligent nutrition assistant! I can help with meal planning, habit tracking, nutrition guidance, recipe suggestions, and wellness coaching. ${context?.userType === 'coach' ? 'As a coach, I can also assist with client management and professional guidance.' : ''} What specific area would you like help with today?`;
  }

  // One-time payment routes
  app.post('/api/create-payment-intent', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const { planId, price, billingAddress, shippingAddress } = req.body;
      
      if (!planId || !price || !billingAddress) {
        return res.status(400).json({ message: "Missing required fields: planId, price, or billingAddress" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or retrieve Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      
      // If we have a customer ID, verify it exists in Stripe (handles test/live mode switches)
      if (stripeCustomerId) {
        try {
          await stripe.customers.retrieve(stripeCustomerId);
        } catch (error: any) {
          // Customer doesn't exist (likely switched from live to test mode or vice versa)
          console.log(`Customer ${stripeCustomerId} not found in current Stripe mode, creating new one`);
          stripeCustomerId = null; // Will create a new one below
        }
      }
      
      // Create new customer if needed
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName} ${user.lastName}`.trim() || undefined,
          address: billingAddress,
          metadata: {
            userId: userId,
            userType: user.userType || 'individual'
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserSubscription(userId, { stripeCustomerId });
      }

      // Plan name mapping
      const planNames: Record<string, string> = {
        'ai-coach': 'AI Coach',
        'personal-coach': 'Personal Coach',
        'coach-use': 'Coach Use'
      };

      // Create one-time PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Convert to cents
        currency: 'usd',
        customer: stripeCustomerId,
        payment_method_options: {
          card: {
            request_three_d_secure: 'any' // Force 3D Secure (OTP) authentication on all transactions
          }
        },
        metadata: {
          userId,
          planId,
          planName: planNames[planId] || planId,
          userEmail: user.email || '',
          userName: `${user.firstName} ${user.lastName}`.trim(),
          billingAddress: JSON.stringify(billingAddress),
          shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : ''
        },
        description: `${planNames[planId] || planId} - 2 Day Access`,
        receipt_email: user.email || undefined,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create payment: " + error.message });
    }
  });

  // Create Stripe Checkout Session for 30-day access
  app.post('/api/create-checkout-session', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const { planId } = req.body;
      
      // Only PLUS plan available at $4.99 for 30 days
      if (planId !== 'plus') {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or retrieve Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      
      // If we have a customer ID, verify it exists in Stripe (handles test/live mode switches)
      if (stripeCustomerId) {
        try {
          await stripe.customers.retrieve(stripeCustomerId);
        } catch (error: any) {
          // Customer doesn't exist (likely switched from live to test mode or vice versa)
          console.log(`Customer ${stripeCustomerId} not found in current Stripe mode, creating new one`);
          stripeCustomerId = null; // Will create a new one below
        }
      }
      
      // Create new customer if needed
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName} ${user.lastName}`.trim() || undefined,
          metadata: {
            userId: userId,
            userType: user.userType || 'individual'
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserSubscription(userId, { stripeCustomerId });
      }

      // Get the base URL for redirects
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const baseUrl = `${protocol}://${host}`;

      // Create Checkout Session - Stripe handles the payment page
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'MikeAI Plus - 30 Day Access',
                description: 'Full access to all premium features for 30 days',
              },
              unit_amount: 499, // $4.99 in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/subscription`,
        metadata: {
          userId,
          planId,
          planName: 'PLUS - 30 Day Access',
          userEmail: user.email || '',
          userName: `${user.firstName} ${user.lastName}`.trim()
        },
        payment_method_options: {
          card: {
            request_three_d_secure: 'any'
          }
        },
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: 'MikeAI Plus - 30 Day Access',
            metadata: {
              userId,
              planName: 'PLUS - 30 Day Access'
            }
          }
        },
        payment_intent_data: {
          metadata: {
            userId,
            planId,
            planName: 'PLUS - 30 Day Access',
            userEmail: user.email || '',
            userName: `${user.firstName} ${user.lastName}`.trim()
          },
          receipt_email: user.email || undefined,
        },
      });

      res.json({
        url: session.url,
        sessionId: session.id
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create checkout session: " + error.message });
    }
  });

  // Organization One-Time Payment Checkout Session (30-day billing period)
  app.post('/api/org/create-checkout-session', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      // SECURITY: Never trust organizationId from request body - always use authenticated user's org
      const { tier, addonCoachQty, addonClientQty } = req.body;
      
      // Validate tier
      if (!['basic', 'pro'].includes(tier)) {
        return res.status(400).json({ message: "Invalid tier. Choose 'basic' or 'pro'" });
      }

      // Get user and their organization (ALWAYS from authenticated session)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify user is an organization owner
      if (user.userType !== 'org_owner') {
        return res.status(403).json({ message: "Access denied: Only organization owners can purchase subscriptions" });
      }

      if (!user.currentOrgId) {
        return res.status(404).json({ message: "No organization found for this user" });
      }

      // SECURITY: Organization ID always derived from authenticated user session
      const org = await storage.getOrganization(user.currentOrgId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verify user owns this organization
      if (org.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied: You are not the owner of this organization" });
      }

      // MID-CYCLE UPGRADE PREVENTION: Block purchases if active billing period exists
      const activePeriod = await storage.getActiveBillingPeriod(org.id);
      if (activePeriod && activePeriod.currentPeriodEndsAt) {
        const periodEndsAt = new Date(activePeriod.currentPeriodEndsAt);
        const daysRemaining = Math.ceil((periodEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        return res.status(400).json({ 
          message: "Cannot purchase or upgrade while an active subscription exists",
          activePeriodExists: true,
          currentTier: activePeriod.tier,
          periodEndsAt: activePeriod.currentPeriodEndsAt,
          daysRemaining,
          instructions: `Your current ${activePeriod.tier.toUpperCase()} subscription is active until ${periodEndsAt.toLocaleDateString()}. Please wait ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} for your current period to expire before purchasing a new subscription.`
        });
      }

      // Check if new tier can accommodate current usage
      // Base allowances match the new pricing model (BASIC: 2/20, PRO: 5/50)
      const tierLimits = {
        'basic': { coaches: 2, clients: 20 },
        'pro': { coaches: 5, clients: 50 }
      };
      
      const newTierLimits = tierLimits[tier as 'basic' | 'pro'];
      
      // Get current active counts
      const orgWithCounts = await storage.getOrganizationWithCounts(org.id);
      if (!orgWithCounts) {
        return res.status(500).json({ message: "Failed to fetch organization data" });
      }
      
      // Calculate what the new tier would allow
      const newAllowedCoaches = newTierLimits.coaches + (addonCoachQty || 0);
      const newAllowedClients = newTierLimits.clients + (addonClientQty || 0);
      
      const exceededResources: string[] = [];
      
      if (orgWithCounts.coachCount > newAllowedCoaches) {
        exceededResources.push(`${orgWithCounts.coachCount - newAllowedCoaches} coach${orgWithCounts.coachCount - newAllowedCoaches > 1 ? 'es' : ''}`);
      }
      
      if (orgWithCounts.clientCount > newAllowedClients) {
        exceededResources.push(`${orgWithCounts.clientCount - newAllowedClients} client${orgWithCounts.clientCount - newAllowedClients > 1 ? 's' : ''}`);
      }
      
      if (exceededResources.length > 0) {
        return res.status(400).json({ 
          message: `Cannot purchase ${tier.toUpperCase()} tier with current add-ons. You have more active resources than this plan allows.`,
          downgradeBlocked: true,
          currentUsage: {
            coaches: orgWithCounts.coachCount,
            clients: orgWithCounts.clientCount
          },
          newTierLimits: {
            coaches: newAllowedCoaches,
            clients: newAllowedClients
          },
          exceededResources,
          instructions: `To proceed, either:\n1. Remove ${exceededResources.join(' and ')} from your organization, OR\n2. Purchase enough add-on slots to cover your current usage (${orgWithCounts.coachCount} coaches, ${orgWithCounts.clientCount} clients)`
        });
      }

      // Get the base URL for redirects
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const baseUrl = `${protocol}://${host}`;

      // Dynamic pricing configuration (in cents) - Easy to change!
      const PRICING = {
        basic: {
          base: 7900,        // $79.00
          coachAddon: 2500,  // $25.00 per coach
          clientAddon: 300,  // $3.00 per client
          baseCoaches: 2,
          baseClients: 20
        },
        pro: {
          base: 14900,       // $149.00
          coachAddon: 2000,  // $20.00 per coach
          clientAddon: 200,  // $2.00 per client
          baseCoaches: 5,
          baseClients: 50
        }
      };

      // Type-safe pricing lookup (already validated tier above)
      const pricing = PRICING[tier as 'basic' | 'pro'];
      
      if (!pricing) {
        return res.status(400).json({ message: "Invalid tier pricing configuration" });
      }

      // Build line items for one-time payment using dynamic price_data
      const lineItems: any[] = [];
      
      // Add base plan (BASIC or PRO) - one-time payment
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tier.toUpperCase()} Tier - 30 Days`,
            description: `${pricing.baseCoaches} coaches, ${pricing.baseClients} clients included`
          },
          unit_amount: pricing.base
        },
        quantity: 1
      });

      // Add extra coach add-ons if requested
      if (addonCoachQty && addonCoachQty > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Extra Coach Slot',
              description: `Additional coach access for 30 days`
            },
            unit_amount: pricing.coachAddon
          },
          quantity: addonCoachQty
        });
      }

      // Add extra client add-ons if requested
      if (addonClientQty && addonClientQty > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Extra Client Slot',
              description: `Additional client access for 30 days`
            },
            unit_amount: pricing.clientAddon
          },
          quantity: addonClientQty
        });
      }

      // Calculate total amount for logging
      const totalAmount = pricing.base + 
        (addonCoachQty * pricing.coachAddon) + 
        (addonClientQty * pricing.clientAddon);

      // Log the checkout session request for debugging
      console.log('[ORG CHECKOUT] Creating session:', {
        organizationId: org.id,
        tier,
        addonCoachQty: addonCoachQty || 0,
        addonClientQty: addonClientQty || 0,
        pricing: {
          baseTier: `$${(pricing.base / 100).toFixed(2)}`,
          coachAddon: `$${(pricing.coachAddon / 100).toFixed(2)}`,
          clientAddon: `$${(pricing.clientAddon / 100).toFixed(2)}`,
          total: `$${(totalAmount / 100).toFixed(2)}`
        },
        customerEmail: user.email
      });

      // Create Checkout Session for ONE-TIME payment (not subscription)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/org-subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/org-subscription`,
        metadata: {
          organizationId: org.id.toString(),
          ownerId: userId,
          tier,
          addonCoachQty: addonCoachQty || 0,
          addonClientQty: addonClientQty || 0,
          organizationName: org.name || '',
          userEmail: user.email || ''
        },
        customer_email: user.email || undefined,
        payment_method_options: {
          card: {
            request_three_d_secure: 'any'
          }
        },
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: `MikeAI Organization ${tier.toUpperCase()} Tier - 30 Day Access`,
            metadata: {
              organizationId: org.id.toString(),
              tier,
              organizationName: org.name || ''
            }
          }
        },
        payment_intent_data: {
          metadata: {
            organizationId: org.id.toString(),
            ownerId: userId,
            tier,
            addonCoachQty: addonCoachQty || 0,
            addonClientQty: addonClientQty || 0
          }
        }
      });

      console.log('[ORG CHECKOUT] Session created successfully:', {
        sessionId: session.id,
        url: session.url ? 'URL generated' : 'NO URL'
      });

      res.json({
        url: session.url,
        sessionId: session.id
      });
    } catch (error: any) {
      console.error("[ORG CHECKOUT ERROR] Failed to create checkout session:", {
        error: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        details: error.raw || error
      });
      res.status(500).json({ 
        message: "Failed to create checkout session: " + error.message,
        errorType: error.type,
        errorCode: error.code
      });
    }
  });

  // Get organization billing period information
  app.get('/api/org/:id/billing', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orgId = parseInt(req.params.id);
      if (isNaN(orgId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      await storage.checkAndUpdateExpiredPeriods(orgId);

      // Get the organization and verify access
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Verify user has access (is owner, coach, or client of this org)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isOwner = user.userType === 'org_owner' && user.currentOrgId === orgId;
      const isCoach = user.userType === 'coach' && user.currentOrgId === orgId;
      const isOrgClient = user.userType === 'org_client' && user.currentOrgId === orgId;

      if (!isOwner && !isCoach && !isOrgClient) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      // Fetch active billing period
      const billingPeriod = await storage.getActiveBillingPeriod(orgId);
      if (!billingPeriod) {
        return res.status(404).json({ message: "No active billing period found" });
      }

      // Calculate total allowances
      const totalCoachAllowance = billingPeriod.baseCoachAllowance + billingPeriod.addonCoachQty;
      const totalClientAllowance = billingPeriod.baseClientAllowance + billingPeriod.addonClientQty;

      res.json({
        tier: billingPeriod.tier,
        baseCoachAllowance: billingPeriod.baseCoachAllowance,
        baseClientAllowance: billingPeriod.baseClientAllowance,
        addonCoachQty: billingPeriod.addonCoachQty,
        addonClientQty: billingPeriod.addonClientQty,
        totalCoachAllowance,
        totalClientAllowance,
        currentPeriodStartsAt: billingPeriod.currentPeriodStartsAt,
        currentPeriodEndsAt: billingPeriod.currentPeriodEndsAt,
        status: billingPeriod.status,
        amountPaid: billingPeriod.amountPaid,
        currency: billingPeriod.currency
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch billing information: " + error.message });
    }
  });

  // Get organization billing history (all billing periods)
  app.get('/api/org/:id/billing-history', requireAuth, requireOrgOwner, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orgId = parseInt(req.params.id);
      if (isNaN(orgId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      // Get all billing periods for this organization, ordered by most recent first
      const billingPeriods = await db.select()
        .from(organizationBillingPeriods)
        .where(eq(organizationBillingPeriods.organizationId, orgId))
        .orderBy(desc(organizationBillingPeriods.createdAt));

      // Format the response to match payment invoice structure
      const formattedHistory = billingPeriods.map(period => ({
        id: period.id,
        tier: period.tier,
        amountPaid: period.amountPaid,
        currency: period.currency || 'usd',
        purchasedAt: period.purchasedAt,
        currentPeriodStartsAt: period.currentPeriodStartsAt,
        currentPeriodEndsAt: period.currentPeriodEndsAt,
        status: period.status,
        baseCoachAllowance: period.baseCoachAllowance,
        baseClientAllowance: period.baseClientAllowance,
        addonCoachQty: period.addonCoachQty,
        addonClientQty: period.addonClientQty,
        stripeCheckoutSessionId: period.stripeCheckoutSessionId,
        stripePaymentIntentId: period.stripePaymentIntentId
      }));

      res.json({ success: true, billingHistory: formattedHistory });
    } catch (error: any) {
      console.error('Error fetching billing history:', error);
      res.status(500).json({ message: "Failed to fetch billing history: " + error.message });
    }
  });

  // Get organization usage stats with billing period comparison
  app.get('/api/org/:id/usage', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orgId = parseInt(req.params.id);
      if (isNaN(orgId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      await storage.checkAndUpdateExpiredPeriods(orgId);

      // Get the organization and verify access
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Verify user has access (is owner, coach, or client of this org)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isOwner = user.userType === 'org_owner' && user.currentOrgId === orgId;
      const isCoach = user.userType === 'coach' && user.currentOrgId === orgId;
      const isOrgClient = user.userType === 'org_client' && user.currentOrgId === orgId;

      if (!isOwner && !isCoach && !isOrgClient) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      // Fetch usage counts
      const orgWithCounts = await storage.getOrganizationWithCounts(orgId);
      if (!orgWithCounts) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Fetch active billing period for limits
      const billingPeriod = await storage.getActiveBillingPeriod(orgId);
      
      if (!billingPeriod) {
        // No active billing period
        return res.json({
          coachesUsed: orgWithCounts.coachCount,
          coachesAllowed: 0,
          clientsUsed: orgWithCounts.clientCount,
          clientsAllowed: 0,
          daysRemaining: 0,
          hasActiveBilling: false
        });
      }

      // Calculate total allowances
      const coachesAllowed = billingPeriod.baseCoachAllowance + billingPeriod.addonCoachQty;
      const clientsAllowed = billingPeriod.baseClientAllowance + billingPeriod.addonClientQty;

      // Calculate days remaining
      const now = new Date();
      const endsAt = new Date(billingPeriod.currentPeriodEndsAt);
      const msRemaining = endsAt.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

      res.json({
        coachesUsed: orgWithCounts.coachCount,
        coachesAllowed,
        clientsUsed: orgWithCounts.clientCount,
        clientsAllowed,
        daysRemaining,
        hasActiveBilling: true,
        periodEndsAt: billingPeriod.currentPeriodEndsAt
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch usage stats: " + error.message });
    }
  });

  // Add slots (mid-cycle add-on purchase)
  app.post('/api/org/:id/add-slots', requireOrgOwner, validateOrgId, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orgId = parseInt(req.params.id);
      const { extraCoaches, extraClients } = req.body;

      if (!extraCoaches && !extraClients) {
        return res.status(400).json({ message: 'Must specify extraCoaches or extraClients' });
      }

      const activePeriod = await storage.getActiveBillingPeriod(orgId);
      if (!activePeriod) {
        return res.status(400).json({ message: 'No active billing period. Please purchase a tier first.' });
      }

      if (new Date() > activePeriod.currentPeriodEndsAt) {
        return res.status(400).json({ message: 'Billing period expired. Please renew access first.' });
      }

      const lineItems = [];
      if (extraCoaches > 0 && process.env.STRIPE_PRICE_COACH_ADDON) {
        lineItems.push({ price: process.env.STRIPE_PRICE_COACH_ADDON, quantity: extraCoaches });
      }
      if (extraClients > 0 && process.env.STRIPE_PRICE_CLIENT_ADDON) {
        lineItems.push({ price: process.env.STRIPE_PRICE_CLIENT_ADDON, quantity: extraClients });
      }

      if (lineItems.length === 0) {
        return res.status(400).json({ message: 'No valid add-ons to purchase' });
      }

      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `http://localhost:${process.env.PORT || 5000}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/org-subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/org-subscription`,
        metadata: {
          organizationId: orgId.toString(),
          isAddonPurchase: 'true',
          billingPeriodId: activePeriod.id.toString(),
          extraCoaches: extraCoaches || 0,
          extraClients: extraClients || 0
        },
        payment_method_options: {
          card: {
            request_three_d_secure: 'any'
          }
        },
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: 'MikeAI Organization Add-on Slots',
            metadata: {
              organizationId: orgId.toString(),
              extraCoaches: extraCoaches || 0,
              extraClients: extraClients || 0
            }
          }
        }
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Failed to create add-slots checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session: " + error.message });
    }
  });

  // Get payment by payment intent ID
  app.get('/api/payment/:paymentIntentId', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { paymentIntentId } = req.params;
      const payment = await storage.getPayment(paymentIntentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Verify the payment belongs to the current user
      if (payment.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch payment: " + error.message });
    }
  });

  // Get user's active payment
  app.get('/api/user/active-payment', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const activePayment = await storage.getUserActivePayment(userId);
      if (!activePayment) {
        return res.status(404).json({ message: "No active payment found" });
      }

      res.json(activePayment);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch active payment: " + error.message });
    }
  });

  // Get comprehensive subscription info
  app.get('/api/user/subscription-info', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let subscriptionStatus = user.subscriptionStatus || 'trial';
      let subscriptionTier = user.subscriptionTier || 'free';
      let daysRemaining = 0;
      let isExpired = false;
      let expiresAt = null;
      let activePayment = null;

      // For organization owners, get subscription info from organization billing period
      if (user.userType === 'org_owner' && user.currentOrgId) {
        const activePeriod = await storage.getActiveBillingPeriod(user.currentOrgId);
        
        if (activePeriod) {
          subscriptionTier = activePeriod.tier;
          subscriptionStatus = activePeriod.status;
          expiresAt = activePeriod.currentPeriodEndsAt;
          
          const now = new Date();
          const expiry = new Date(activePeriod.currentPeriodEndsAt);
          const diffTime = expiry.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          isExpired = daysRemaining <= 0;
          
          activePayment = {
            tier: activePeriod.tier,
            status: activePeriod.status,
            expiresAt: activePeriod.currentPeriodEndsAt
          };
        }
      } else {
        // For individual users, get active payment (existing logic)
        activePayment = await storage.getUserActivePayment(userId);
        
        if (activePayment && activePayment.expiresAt) {
          expiresAt = activePayment.expiresAt;
          const now = new Date();
          const expiry = new Date(activePayment.expiresAt);
          const diffTime = expiry.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          isExpired = daysRemaining <= 0;
          
          // AUTO-HEALING: If user has non-expired payment, they should be 'active' with 'plus' tier
          // Individual users only have one tier: 'plus' ($4.99 for 30 days)
          if (!isExpired) {
            subscriptionStatus = 'active';
            subscriptionTier = 'plus';
            
            // Sync user record if it's out of date (only update to known valid values)
            // Wrapped in try-catch to prevent endpoint crash if update fails
            if (user.subscriptionStatus !== 'active' || user.subscriptionTier !== 'plus') {
              try {
                await storage.updateUserSubscription(userId, {
                  subscriptionStatus: 'active',
                  subscriptionTier: 'plus'
                });
              } catch (updateError) {
                console.error('Failed to auto-heal user subscription record:', updateError);
                // Continue anyway - we still return correct status based on payment
              }
            }
          }
        } else {
          // EXPIRY AUTO-HEALING: No active payment found for individual user
          // If user record shows active/plus but they have no active payment, they've expired
          // Check if they ever had a payment (to distinguish from trial users)
          const allPayments = await storage.getUserPayments(userId);
          const hadPreviousPayment = allPayments && allPayments.length > 0;
          
          if (hadPreviousPayment) {
            // User had a payment that expired - set to canceled/free
            subscriptionStatus = 'canceled';
            subscriptionTier = 'free';
            isExpired = true;
            
            // Find the most recent payment to show when it expired
            const sortedPayments = allPayments.sort((a, b) => 
              new Date(b.expiresAt || 0).getTime() - new Date(a.expiresAt || 0).getTime()
            );
            if (sortedPayments[0]?.expiresAt) {
              expiresAt = sortedPayments[0].expiresAt;
            }
            
            // Sync user record if it's out of date
            if (user.subscriptionStatus !== 'canceled' || user.subscriptionTier !== 'free') {
              try {
                await storage.updateUserSubscription(userId, {
                  subscriptionStatus: 'canceled',
                  subscriptionTier: 'free'
                });
                console.log(`[EXPIRY SYNC] Updated user ${userId} to canceled/free (payment expired)`);
              } catch (updateError) {
                console.error('Failed to auto-heal expired subscription:', updateError);
              }
            }
          }
          // If no previous payment, user is still on trial - keep their current status
        }
      }

      res.json({
        subscriptionStatus,
        subscriptionTier,
        expiresAt,
        daysRemaining,
        isExpired,
        activePayment: activePayment || null
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch subscription info: " + error.message });
    }
  });

  // Get user's payment history
  app.get('/api/user/payments', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payments = await storage.getUserPayments(userId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch payments: " + error.message });
    }
  });

  // Admin endpoint: Sync all users with active payments to have correct subscription status
  // This is a one-time fix for users who have payments but incorrect subscription status
  // Requires admin authentication
  app.post('/api/admin/sync-subscriptions', requireAdminAuth, async (req: any, res) => {
    try {
      // Get all active payments (non-expired)
      const now = new Date();
      const activePayments = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.status, 'succeeded'),
            gte(payments.expiresAt, now)
          )
        );

      let syncedCount = 0;
      let alreadyCorrectCount = 0;
      const errors: string[] = [];

      for (const payment of activePayments) {
        try {
          const user = await storage.getUser(payment.userId);
          if (user) {
            if (user.subscriptionStatus !== 'active' || user.subscriptionTier !== 'plus') {
              await storage.updateUserSubscription(payment.userId, {
                subscriptionStatus: 'active',
                subscriptionTier: 'plus'
              });
              syncedCount++;
              console.log(`[SYNC] Updated user ${payment.userId} to active/plus`);
            } else {
              alreadyCorrectCount++;
            }
          }
        } catch (err: any) {
          errors.push(`User ${payment.userId}: ${err.message}`);
        }
      }

      res.json({
        success: true,
        message: `Synced ${syncedCount} users, ${alreadyCorrectCount} already correct`,
        totalActivePayments: activePayments.length,
        syncedCount,
        alreadyCorrectCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error('Sync subscriptions error:', error);
      res.status(500).json({ message: "Failed to sync subscriptions: " + error.message });
    }
  });

  // Verify checkout session and get payment details
  app.get('/api/checkout-session/:sessionId', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { sessionId } = req.params;
      
      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Verify the session belongs to the current user
      // Handle three cases: individual purchase (userId), organization purchase (ownerId), or add-on purchase (organizationId)
      const isIndividualPurchase = session.metadata?.userId === userId;
      const isOrgOwnerPurchase = session.metadata?.ownerId === userId;
      const isAddonPurchase = session.metadata?.isAddonPurchase === 'true';
      
      // For add-on purchases, verify user owns the organization
      if (isAddonPurchase && session.metadata?.organizationId) {
        const orgId = parseInt(session.metadata.organizationId);
        const org = await storage.getOrganization(orgId);
        if (!org || org.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied: Not the organization owner" });
        }
      } else if (!isIndividualPurchase && !isOrgOwnerPurchase) {
        // If not an add-on purchase, must be either individual or org owner purchase
        return res.status(403).json({ message: "Access denied: Session does not belong to you" });
      }

      // Return native Stripe fields without transformation
      // Stripe checkout sessions have:
      // - status: 'complete' | 'expired' | 'open'
      // - payment_status: 'paid' | 'unpaid' | 'no_payment_required'
      res.json({
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_email,
        paymentIntentId: session.payment_intent,
        metadata: session.metadata
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch session: " + error.message });
    }
  });

  // Stripe webhook for payment verification
  app.post('/api/stripe/webhook', async (req: any, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).send('Webhook secret not configured');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout.session.completed event (Stripe Checkout)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      
      try {
        const { userId, planId, planName, organizationId, tier, addonCoachQty, addonClientQty, isAddonPurchase, billingPeriodId, extraCoaches, extraClients } = session.metadata;
        
        // Handle add-on purchase (mid-cycle)
        if (isAddonPurchase === 'true' && billingPeriodId) {
          const periodId = parseInt(billingPeriodId);
          const orgId = parseInt(organizationId);
          
          const period = await storage.getActiveBillingPeriod(orgId);
          if (!period) {
            return res.status(400).send('No active billing period found');
          }
          
          const newCoachQty = period.addonCoachQty + parseInt(extraCoaches || '0');
          const newClientQty = period.addonClientQty + parseInt(extraClients || '0');
          
          await storage.updateBillingPeriod(periodId, {
            addonCoachQty: newCoachQty,
            addonClientQty: newClientQty
          });
          
          return res.json({ received: true, message: 'Add-on purchase processed' });
        }
        
        // Handle organization billing period creation
        if (organizationId && tier) {
          const orgId = parseInt(organizationId);
          
          // Retrieve the payment intent to get full payment details
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          
          // Define tier limits and swap budgets (updated: BASIC=4, PRO=6)
          const tierLimits = {
            'basic': { coaches: 2, clients: 20, swapBudgetCoach: 4, swapBudgetClient: 4 },
            'pro': { coaches: 5, clients: 50, swapBudgetCoach: 6, swapBudgetClient: 6 }
          };
          
          const baseLimits = tierLimits[tier as keyof typeof tierLimits];
          
          // Check for existing active period to handle repurchase extension
          const existingPeriod = await storage.getActiveBillingPeriod(orgId);
          let currentPeriodStartsAt: Date;
          let currentPeriodEndsAt: Date;
          
          if (existingPeriod && new Date() < existingPeriod.currentPeriodEndsAt) {
            currentPeriodStartsAt = existingPeriod.currentPeriodEndsAt;
            currentPeriodEndsAt = new Date(currentPeriodStartsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            await storage.updateBillingPeriod(existingPeriod.id, { status: 'expired' });
          } else {
            currentPeriodStartsAt = new Date();
            currentPeriodEndsAt = new Date(currentPeriodStartsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
          }
          
          // Check if this checkout session has already been processed (webhook replay protection)
          const existingPeriodWithSession = await storage.getBillingPeriodByCheckoutSession(session.id);
          
          if (existingPeriodWithSession) {
            // Webhook replay - period already created, just acknowledge
            return res.json({ received: true, message: 'Billing period already processed' });
          }

          // Create billing period record with tier-based swap budgets
          const newPeriod = await storage.createBillingPeriod({
            organizationId: orgId,
            tier: tier as 'basic' | 'pro',
            baseCoachAllowance: baseLimits.coaches,
            baseClientAllowance: baseLimits.clients,
            addonCoachQty: parseInt(addonCoachQty) || 0,
            addonClientQty: parseInt(addonClientQty) || 0,
            swapBudgetCoach: baseLimits.swapBudgetCoach,
            swapBudgetClient: baseLimits.swapBudgetClient,
            currentPeriodStartsAt,
            currentPeriodEndsAt,
            status: 'active',
            stripePaymentIntentId: paymentIntent.id,
            stripeCheckoutSessionId: session.id,
            amountPaid: (session.amount_total / 100).toString(),
            currency: session.currency
          });

          // Reset swap tracking ONLY for truly new billing period (not webhook replays)
          await storage.resetSwapTrackingForNewPeriod(orgId);

          // Enforce capacity limits: auto-lock excess members if downgrade occurred
          // AND auto-unlock locked members if capacity is now available (renewal from expired)
          const coachQuota = baseLimits.coaches + (parseInt(addonCoachQty) || 0);
          const clientQuota = baseLimits.clients + (parseInt(addonClientQty) || 0);
          
          // First unlock members that were locked due to expiry/downgrade (since we have new capacity)
          const unlockResult = await storage.autoUnlockWhenCapacityAvailable(orgId, coachQuota, clientQuota, newPeriod.id);
          if (unlockResult.coachesUnlocked > 0 || unlockResult.clientsUnlocked > 0) {
            console.log(`[SUBSCRIPTION RENEWAL] Unlocked ${unlockResult.coachesUnlocked} coaches and ${unlockResult.clientsUnlocked} clients for org ${orgId}`);
          }
          
          // Then lock any excess members if still over capacity
          const lockResult = await storage.autoLockExcessMembers(orgId, coachQuota, clientQuota, newPeriod.id);
          if (lockResult.coachesLocked > 0 || lockResult.clientsLocked > 0) {
            console.log(`[SUBSCRIPTION RENEWAL] Locked ${lockResult.coachesLocked} coaches and ${lockResult.clientsLocked} clients for org ${orgId}`);
          }
          
          return res.json({ received: true });
        }
        
        // Handle individual user payment (existing logic)
        if (!userId || !planId) {
          return res.status(400).send('Missing required metadata');
        }

        // Retrieve the payment intent to get full payment details
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        
        // Calculate expiry date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Get billing details from the charge
        const charge = paymentIntent.charges?.data[0];
        const billingDetails = charge?.billing_details || {};
        const billingAddressData = {
          name: billingDetails.name || '',
          line1: billingDetails.address?.line1 || '',
          line2: billingDetails.address?.line2 || '',
          city: billingDetails.address?.city || '',
          state: billingDetails.address?.state || '',
          postal_code: billingDetails.address?.postal_code || '',
          country: billingDetails.address?.country || ''
        };

        // Generate Stripe Invoice (as a receipt, not a new charge)
        let invoiceUrl = null;
        try {
          // Create invoice item
          await stripe.invoiceItems.create({
            customer: session.customer,
            amount: session.amount_total,
            currency: session.currency,
            description: `${planName || planId} - 30 Day Access`,
          });

          // Create invoice (collection_method: 'send_invoice' prevents auto-charging)
          const invoice = await stripe.invoices.create({
            customer: session.customer,
            collection_method: 'send_invoice',
            days_until_due: 0,
            description: `Payment for ${planName || planId} - 30 Day Access`,
            metadata: {
              userId,
              planId,
              sessionId: session.id,
              paymentIntentId: paymentIntent.id
            }
          });

          // Finalize invoice to generate PDF
          if (invoice.id) {
            const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
            
            // Mark invoice as paid since payment already succeeded
            if (finalizedInvoice.id) {
              await stripe.invoices.pay(finalizedInvoice.id, {
                paid_out_of_band: true
              });
            }
            
            invoiceUrl = finalizedInvoice.invoice_pdf;
          }
        } catch (invoiceError: any) {
          console.error('Invoice generation error:', invoiceError);
          // Continue without invoice - don't fail the payment
        }

        // Create payment record in database
        await storage.createPayment({
          userId,
          stripePaymentIntentId: paymentIntent.id,
          planId,
          planName: planName || planId,
          amount: (session.amount_total / 100).toString(), // Convert cents to dollars
          currency: session.currency,
          status: 'succeeded',
          billingAddress: billingAddressData,
          shippingAddress: null,
          metadata: session.metadata,
          invoiceUrl: invoiceUrl,
          receiptUrl: charge?.receipt_url || null,
          expiresAt,
        });

        // Update user subscription status to active
        await storage.updateUserSubscription(userId, {
          subscriptionStatus: 'active',
          subscriptionTier: 'plus'
        });

        res.json({ received: true });
      } catch (error: any) {
        console.error('Webhook processing error:', error);
        res.status(500).send(`Webhook Error: ${error.message}`);
      }
    }
    // Handle the payment_intent.succeeded event (legacy support)
    else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      
      try {
        const { userId, planId, planName, billingAddress, shippingAddress } = paymentIntent.metadata;
        
        if (!userId || !planId) {
          return res.status(400).send('Missing required metadata');
        }

        // Calculate expiry date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Collect billing address from payment intent
        const charge = paymentIntent.charges?.data[0];
        const billingDetails = charge?.billing_details || {};
        const billingAddressData = {
          name: billingDetails.name || '',
          line1: billingDetails.address?.line1 || '',
          line2: billingDetails.address?.line2 || '',
          city: billingDetails.address?.city || '',
          state: billingDetails.address?.state || '',
          postal_code: billingDetails.address?.postal_code || '',
          country: billingDetails.address?.country || ''
        };

        // Generate Stripe Invoice (as a receipt, not a new charge)
        let invoiceUrl = null;
        try {
          // Create invoice item
          await stripe.invoiceItems.create({
            customer: paymentIntent.customer,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            description: `${planName || planId} - 30 Day Access`,
          });

          // Create invoice (collection_method: 'send_invoice' prevents auto-charging)
          const invoice = await stripe.invoices.create({
            customer: paymentIntent.customer,
            collection_method: 'send_invoice',
            days_until_due: 0,
            description: `Payment for ${planName || planId} - 30 Day Access`,
            metadata: {
              userId,
              planId,
              paymentIntentId: paymentIntent.id
            }
          });

          // Finalize invoice to generate PDF
          if (invoice.id) {
            const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
            
            // Mark invoice as paid since payment already succeeded
            if (finalizedInvoice.id) {
              await stripe.invoices.pay(finalizedInvoice.id, {
                paid_out_of_band: true
              });
            }
            
            invoiceUrl = finalizedInvoice.invoice_pdf;
          }
        } catch (invoiceError: any) {
          console.error('Invoice generation error:', invoiceError);
          // Continue without invoice - don't fail the payment
        }

        // Create payment record in database
        await storage.createPayment({
          userId,
          stripePaymentIntentId: paymentIntent.id,
          planId,
          planName: planName || planId,
          amount: (paymentIntent.amount / 100).toString(), // Convert cents to dollars
          currency: paymentIntent.currency,
          status: 'succeeded',
          billingAddress: billingAddressData,
          shippingAddress: null,
          metadata: paymentIntent.metadata,
          invoiceUrl: invoiceUrl,
          receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null,
          expiresAt,
        });

        res.json({ received: true });
      } catch (error: any) {
        res.status(500).send(`Database Error: ${error.message}`);
      }
    }
    // Handle subscription lifecycle events (for individual users only, not organizations)
    else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any;
      const userId = subscription.metadata?.userId;
      const subscriptionTier = subscription.metadata?.subscriptionTier || 'free';

      // Only handle individual user subscriptions (organizations use one-time payments)
      if (userId) {
        try {
          await storage.updateUserSubscription(userId, {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionTier: subscriptionTier,
          });
          res.json({ received: true });
        } catch (error: any) {
          res.status(500).send(`Database Error: ${error.message}`);
        }
      } else {
        res.json({ received: true });
      }
    }
    // Handle subscription deletion/cancellation (for individual users only)
    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const userId = subscription.metadata?.userId;

      // Only handle individual user subscriptions (organizations use one-time payments)
      if (userId) {
        try {
          await storage.updateUserSubscription(userId, {
            subscriptionStatus: 'canceled',
            subscriptionTier: 'free',
          });
          res.json({ received: true });
        } catch (error: any) {
          res.status(500).send(`Database Error: ${error.message}`);
        }
      } else {
        res.json({ received: true });
      }
    }
    // Handle successful payment (for individual user subscriptions only)
    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      
      if (subscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;
          const subscriptionTier = subscription.metadata?.subscriptionTier || 'free';
          
          // Only handle individual user subscriptions (organizations use one-time payments)
          if (userId) {
            await storage.updateUserSubscription(userId, {
              subscriptionStatus: 'active',
              subscriptionTier: subscriptionTier,
            });
          }
          res.json({ received: true });
        } catch (error: any) {
          res.status(500).send(`Database Error: ${error.message}`);
        }
      } else {
        res.json({ received: true });
      }
    }
    // Handle failed payment (for individual user subscriptions only)
    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      
      if (subscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;
          
          // Only handle individual user subscriptions (organizations use one-time payments)
          if (userId) {
            await storage.updateUserSubscription(userId, {
              subscriptionStatus: 'past_due',
            });
          }
          res.json({ received: true });
        } catch (error: any) {
          res.status(500).send(`Database Error: ${error.message}`);
        }
      } else {
        res.json({ received: true });
      }
    }
    else {
      res.json({ received: true });
    }
  });

  // Simple database sync endpoint - no complex logic
  // Only updates fields that have actual values - empty strings are skipped to preserve existing data
  app.post('/api/db/sync-profile', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const profileData = req.body;
      
      // Validate that fullName is not empty (required field)
      if (!profileData.fullName || profileData.fullName.trim() === '') {
        return res.status(400).json({ message: "Full name is required" });
      }
      
      // Helper function to check if value should be included
      // Only include non-empty values to avoid overwriting existing data with empty strings
      const hasValue = (val: any): boolean => {
        if (val === undefined || val === null) return false;
        if (typeof val === 'string' && val.trim() === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
      };
      
      // Build dbData object only with fields that have actual values
      const dbData: Record<string, any> = {
        userId: userId,
      };
      
      // Required field - always include
      dbData.fullName = profileData.fullName.trim();
      
      // Optional fields - only include if they have actual values
      if (hasValue(profileData.dateOfBirth)) dbData.dateOfBirth = profileData.dateOfBirth;
      if (hasValue(profileData.gender)) dbData.gender = profileData.gender;
      if (hasValue(profileData.height)) dbData.height = parseFloat(profileData.height).toString();
      if (hasValue(profileData.weight)) dbData.weight = parseFloat(profileData.weight).toString();
      if (hasValue(profileData.activityLevel)) dbData.activityLevel = profileData.activityLevel;
      if (hasValue(profileData.fitnessGoal)) dbData.fitnessGoal = profileData.fitnessGoal;
      if (hasValue(profileData.targetWeight)) dbData.targetWeight = parseFloat(profileData.targetWeight).toString();
      if (hasValue(profileData.dailyCalorieGoal)) dbData.dailyCalorieGoal = parseInt(profileData.dailyCalorieGoal);
      if (hasValue(profileData.dietType)) dbData.dietType = profileData.dietType;
      if (hasValue(profileData.allergies)) dbData.allergies = profileData.allergies;
      if (hasValue(profileData.dislikedFoods)) dbData.dislikedFoods = profileData.dislikedFoods;
      if (hasValue(profileData.preferredCuisines)) dbData.preferredCuisines = profileData.preferredCuisines;
      if (hasValue(profileData.mealsPerDay)) dbData.mealsPerDay = profileData.mealsPerDay;
      if (profileData.intermittentFasting !== undefined) dbData.intermittentFasting = profileData.intermittentFasting;
      if (hasValue(profileData.breakfastTime)) dbData.breakfastTime = profileData.breakfastTime;
      if (hasValue(profileData.lunchTime)) dbData.lunchTime = profileData.lunchTime;
      if (hasValue(profileData.dinnerTime)) dbData.dinnerTime = profileData.dinnerTime;
      if (hasValue(profileData.chronicConditions)) dbData.chronicConditions = profileData.chronicConditions;
      if (hasValue(profileData.supplementsTaken)) dbData.supplementsTaken = profileData.supplementsTaken;
      if (hasValue(profileData.stressLevel)) dbData.stressLevel = profileData.stressLevel;
      if (hasValue(profileData.sleepDuration)) dbData.sleepDuration = parseFloat(profileData.sleepDuration).toString();
      if (hasValue(profileData.waterIntakeGoal)) dbData.waterIntakeGoal = parseFloat(profileData.waterIntakeGoal).toString();

      // Check if profile exists
      const existingProfile = await storage.getUserProfile(userId);
      
      if (existingProfile) {
        // Update existing profile - only with fields that have values
        await storage.updateUserProfile(userId, dbData);
      } else {
        // Create new profile
        await storage.createUserProfile(dbData);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Profile sync error:', error);
      res.status(500).json({ message: "Sync failed" });
    }
  });

  // Get profile data from database
  app.get('/api/db/get-profile', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const result = await db.execute(sql`
        SELECT * FROM user_profiles WHERE user_id = ${userId} LIMIT 1
      `);
      
      const profile = result.rows[0];
      res.json(profile || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  // Legacy endpoints for compatibility
  app.post('/api/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const profileData = insertUserProfileSchema.parse({ ...req.body, userId });
      
      const existingProfile = await storage.getUserProfile(userId);
      if (existingProfile) {
        const updatedProfile = await storage.updateUserProfile(userId, profileData);
        res.json(updatedProfile);
      } else {
        const newProfile = await storage.createUserProfile(profileData);
        res.json(newProfile);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to create/update profile" });
    }
  });

  app.get('/api/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Recipe routes (POST requires auth for creating recipes)

  app.post('/api/recipes', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const recipeData = insertRecipeSchema.parse({ ...req.body, createdBy: userId });
      const newRecipe = await storage.createRecipe(recipeData);
      res.json(newRecipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  // Meal plan routes (protected - require active subscription for individual users)
  app.get('/api/meal-plans', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const mealPlans = await storage.getMealPlans(userId);
      res.json(mealPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  app.get('/api/meal-plans/:id', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const mealPlan = await storage.getMealPlan(id);
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      const items = await storage.getMealPlanItems(id);
      
      // Format ingredients in meal plan and items before sending response
      const formattedMealPlan = formatMealPlanData({ ...mealPlan, items });
      res.json(formattedMealPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plan" });
    }
  });

  app.post('/api/meal-plans', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const mealPlanData = insertMealPlanSchema.parse({ ...req.body, userId, createdBy: userId });
      const newMealPlan = await storage.createMealPlan(mealPlanData);
      res.json(newMealPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to create meal plan" });
    }
  });

  app.post('/api/meal-plans/preview', requireAuth, requireActiveSubscription, async (req: any, res) => {
    // Disable timeouts for AI generation - these can take several minutes for larger plans
    req.setTimeout(0);
    res.setTimeout(0);
    
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const { profile, days = 7, mealsPerDay = 5 } = req.body;
      
      if (!profile) {
        return res.status(400).json({ message: "Missing required field: profile" });
      }

      const AI_API_BASE = process.env.VITE_API_BASE_URL || "http://localhost:8000";
      
      const requestBody = {
        profile,
        days,
        mealsPerDay,
        provider: "openai",
        model: "gpt-4.1-mini",
      };

      const aiResponse = await fetch(`${AI_API_BASE}/ai/meal-plans/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI service error:', errorText);
        return res.status(aiResponse.status).json({ 
          message: "Failed to generate meal plan preview",
          error: errorText 
        });
      }

      const aiData = await aiResponse.json();
      
      if (!aiData.success || !aiData.plan) {
        return res.status(500).json({ message: "AI service returned invalid response" });
      }

      res.json({
        success: true,
        plan: aiData.plan,
        preview: true
      });
    } catch (error: any) {
      console.error('Meal plan preview error:', error);
      res.status(500).json({ 
        message: "Failed to generate meal plan preview",
        error: error.message 
      });
    }
  });

  app.delete('/api/meal-plans/:id', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const id = parseInt(req.params.id);
      
      // Verify the meal plan belongs to the user before deleting
      const mealPlan = await storage.getMealPlan(id);
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      if (mealPlan.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this meal plan" });
      }

      await storage.deleteMealPlan(userId, id);
      res.json({ message: "Meal plan deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meal plan" });
    }
  });

  app.delete('/api/meal-plans', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      console.log('DELETE /api/meal-plans called for user:', userId);
      await storage.deleteAllMealPlans(userId);
      res.json({ message: "All meal plans deleted successfully" });
    } catch (error) {
      console.error('Error deleting all meal plans:', error);
      res.status(500).json({ message: "Failed to delete all meal plans" });
    }
  });

  // Get today's meal plan items with cycling logic
  app.get('/api/meal-plans/today', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      // Get the user's active meal plan
      const activePlans = await storage.getMealPlans(userId);
      const activePlan = activePlans.find(plan => plan.isActive);
      
      if (!activePlan) {
        return res.json([]);
      }
      
      // Calculate which day of the plan cycle we're on
      const startDate = new Date(activePlan.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get all items to determine plan duration
      const items = await storage.getMealPlanItems(activePlan.id);
      if (items.length === 0) {
        return res.json([]);
      }
      
      // Extract day numbers - storage returns nested structure from Drizzle join
      const days = items.map((item: any) => {
        // Check both possible structures returned by Drizzle
        return item.day || item.meal_plan_items?.day || item.mealPlanItems?.day;
      }).filter(Boolean);
      
      if (days.length === 0) {
        return res.json([]);
      }
      
      // Find the maximum day number in the plan (e.g., 7 for a 7-day plan)
      const maxDay = Math.max(...days);
      
      // Calculate current day in cycle (1-indexed, cycles after maxDay)
      // Handle negative daysSinceStart (plan starts in future)
      const currentDay = daysSinceStart < 0 ? 1 : (daysSinceStart % maxDay) + 1;
      
      // Filter items for today
      const todayItems = items.filter((item: any) => {
        const itemDay = item.day || item.meal_plan_items?.day || item.mealPlanItems?.day;
        return itemDay === currentDay;
      });
      
      res.json(todayItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's meal plan" });
    }
  });

  app.post('/api/meal-plans/current/items', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      // Get the user's active meal plan
      const activePlans = await storage.getMealPlans(userId);
      let activePlan = activePlans.find(plan => plan.isActive);
      
      if (!activePlan) {
        // If no active plan exists, create a quick plan for the user
        activePlan = await storage.createMealPlan({
          userId,
          name: "My Meal Plan",
          description: "Auto-created plan for adding recipes",
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalCalories: 0,
          isActive: true,
          createdBy: userId
        });
      }
      
      const itemData = insertMealPlanItemSchema.parse({ 
        ...req.body, 
        mealPlanId: activePlan.id 
      });
      
      const newItem = await storage.addMealPlanItem(itemData);
      
      res.json({ success: true, item: newItem, message: "Recipe added to meal plan!" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to add meal plan item", error: error.message });
    }
  });

  app.post('/api/meal-plans/:id/items', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const mealPlanId = parseInt(req.params.id);
      
      // Validate that mealPlanId is a valid number
      if (isNaN(mealPlanId) || mealPlanId <= 0) {
        return res.status(400).json({ message: "Invalid meal plan ID" });
      }
      
      const itemData = insertMealPlanItemSchema.parse({ ...req.body, mealPlanId });
      const newItem = await storage.addMealPlanItem(itemData);
      res.json(newItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to add meal plan item" });
    }
  });

  // Meal logging routes
  app.get('/api/meal-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const { date } = req.query;
      const logs = await storage.getMealLogs(userId, date as string);
      
      // Format any recipe data that might be included in logs
      const formattedLogs = logs.map((log: any) => {
        if (log.recipe) {
          return { ...log, recipe: formatRecipeData(log.recipe) };
        }
        return log;
      });
      
      res.json(formattedLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal logs" });
    }
  });

  app.post('/api/meal-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const logData = insertMealLogSchema.parse({ ...req.body, userId });
      const newLog = await storage.createMealLog(logData);
      
      // Award points for meal logging
      await storage.awardPoints(userId, 5);
      
      res.json(newLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to create meal log" });
    }
  });

  app.delete('/api/meal-logs/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const logId = parseInt(req.params.id);
      await storage.deleteMealLog(logId, userId);
      
      res.json({ message: "Meal log deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meal log" });
    }
  });

  app.delete('/api/meal-logs/:mealType/:date', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const { mealType, date } = req.params;
      const deletedCount = await storage.deleteMealLogByTypeAndDate(userId, mealType, date);
      
      res.json({ message: "Meal log(s) deleted successfully", deletedCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meal log" });
    }
  });

  // Habit routes (basic auth for now)
  app.get('/api/habits', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const habits = await storage.getHabits(userId);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  app.post('/api/habits', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      // Check if user already has 5 habits (maximum limit)
      const existingHabits = await storage.getHabits(userId);
      if (existingHabits.length >= 5) {
        return res.status(400).json({ message: "Maximum of 5 habits allowed. Please delete an existing habit to add a new one." });
      }
      
      const habitData = insertHabitSchema.parse({ ...req.body, userId });
      const newHabit = await storage.createHabit(habitData);
      res.json(newHabit);
    } catch (error) {
      console.error("Error creating habit:", error);
      res.status(500).json({ message: "Failed to create habit" });
    }
  });

  app.delete('/api/habits/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const habitId = parseInt(req.params.id);
      if (isNaN(habitId)) {
        return res.status(400).json({ message: "Invalid habit ID" });
      }
      
      await storage.deleteHabit(userId, habitId);
      res.json({ success: true, message: "Habit deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });

  app.get('/api/habit-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const { date } = req.query;
      const logs = await storage.getHabitLogs(userId, date as string);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habit logs" });
    }
  });

  app.post('/api/habit-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      // Validate and parse request body first for security
      let logData;
      try {
        logData = insertHabitLogSchema.parse({ ...req.body, userId });
      } catch (parseError: any) {
        console.error('Error parsing habit log data for userId:', userId, 'body:', req.body, parseError);
        return res.status(400).json({ message: "Invalid habit log data", error: parseError.message });
      }
      
      const { habitId, logDate } = logData;
      
      // Check if a log already exists for this habit on this date
      let existingLogs;
      try {
        existingLogs = await storage.getHabitLogs(userId, logDate);
      } catch (fetchError: any) {
        console.error('Error fetching existing habit logs for userId:', userId, 'habitId:', habitId, 'logDate:', logDate, fetchError);
        return res.status(500).json({ message: "Failed to fetch existing habit logs", error: fetchError.message });
      }
      
      const existingLog = existingLogs.find(log => log.habitId === habitId);
      
      if (existingLog) {
        // Log exists - delete it (untoggle)
        try {
          await storage.deleteHabitLog(userId, habitId, logDate);
          
          // Recalculate habit streak after deletion
          try {
            const allLogs = await storage.getHabitLogs(userId);
            const habitLogs = allLogs
              .filter(log => log.habitId === habitId && log.completed)
              .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());
            
            let streak = 0;
            if (habitLogs.length > 0) {
              const mostRecentDate = new Date(habitLogs[0].logDate);
              mostRecentDate.setHours(0, 0, 0, 0);
              
              for (let i = 0; i < habitLogs.length; i++) {
                const logDateObj = new Date(habitLogs[i].logDate);
                logDateObj.setHours(0, 0, 0, 0);
                
                const expectedDate = new Date(mostRecentDate);
                expectedDate.setDate(mostRecentDate.getDate() - i);
                expectedDate.setHours(0, 0, 0, 0);
                
                if (logDateObj.getTime() === expectedDate.getTime()) {
                  streak++;
                } else {
                  break;
                }
              }
            }
            
            await db.execute(sql`UPDATE habits SET streak = ${streak} WHERE id = ${habitId} AND user_id = ${userId}`);
          } catch (streakError) {
            console.error('Error updating habit streak after deletion:', streakError);
          }
          
          res.json({ deleted: true, habitId, logDate });
        } catch (deleteError: any) {
          console.error('Error deleting habit log for userId:', userId, 'habitId:', habitId, 'logDate:', logDate, deleteError);
          return res.status(500).json({ message: "Failed to delete habit log", error: deleteError.message });
        }
      } else {
        // No log exists - create one (toggle on)
        try {
          const newLog = await storage.createHabitLog({ ...logData, completed: true });
          
          // Award points for habit completion
          try {
            await storage.awardPoints(userId, 5);
          } catch (pointsError) {
            console.error('Error awarding points for habit completion:', pointsError);
          }

          // Update habit streak
          try {
            const allLogs = await storage.getHabitLogs(userId);
            const habitLogs = allLogs
              .filter(log => log.habitId === habitId && log.completed)
              .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());
            
            let streak = 0;
            const today = new Date(logDate);
            today.setHours(0, 0, 0, 0);
            
            for (let i = 0; i < habitLogs.length; i++) {
              const logDateObj = new Date(habitLogs[i].logDate);
              logDateObj.setHours(0, 0, 0, 0);
              
              const expectedDate = new Date(today);
              expectedDate.setDate(today.getDate() - i);
              expectedDate.setHours(0, 0, 0, 0);
              
              if (logDateObj.getTime() === expectedDate.getTime()) {
                streak++;
              } else {
                break;
              }
            }
            
            await db.execute(sql`UPDATE habits SET streak = ${streak} WHERE id = ${habitId} AND user_id = ${userId}`);
          } catch (streakError) {
            console.error('Error updating habit streak:', streakError);
          }
          
          res.json(newLog);
        } catch (createError: any) {
          console.error('Error creating habit log for userId:', userId, 'habitId:', habitId, 'logDate:', logDate, 'logData:', logData, createError);
          return res.status(500).json({ message: "Failed to create habit log", error: createError.message });
        }
      }
    } catch (error: any) {
      console.error('Unexpected error in /api/habit-logs POST for userId:', getUserId(req), error);
      res.status(500).json({ message: "Failed to toggle habit log", error: error.message });
    }
  });

  app.get('/api/habits/:id/streak', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const habitId = parseInt(req.params.id);
      const streak = await storage.getHabitStreak(userId, habitId);
      res.json({ streak });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habit streak" });
    }
  });

  // Water logging routes
  app.get('/api/water-logs/today', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const { date } = req.query;
      const today = date || new Date().toISOString().split('T')[0];
      const glasses = await storage.getTodayWaterIntake(userId, today);
      res.json({ glasses, date: today });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch water intake" });
    }
  });

  app.post('/api/water-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const logData = insertWaterLogSchema.parse({ ...req.body, userId });
      const newLog = await storage.logWaterIntake(logData);
      res.json(newLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to log water intake" });
    }
  });

  // Reset water log for today (delete all entries)
  app.delete('/api/water-logs/today', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const today = new Date().toISOString().split('T')[0];
      await storage.resetTodayWaterIntake(userId, today);
      res.json({ message: "Water log reset successfully", glasses: 0, date: today });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset water log" });
    }
  });

  // User preferences routes
  app.get('/api/user-preferences', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      let prefs = await storage.getUserPreferences(userId);
      
      // If no preferences exist, create defaults
      // Note: Glass size is FIXED at 250ml (not stored in DB)
      if (!prefs) {
        try {
          prefs = await storage.upsertUserPreferences({
            userId,
            waterDailyGoalGlasses: 8,
          });
        } catch (createError: any) {
          console.error('Error creating user preferences for userId:', userId, createError);
          return res.status(500).json({ message: "Failed to create user preferences", error: createError.message });
        }
      }
      
      res.json(prefs);
    } catch (error: any) {
      console.error('Error in /api/user-preferences for userId:', getUserId(req), error);
      res.status(500).json({ message: "Failed to fetch user preferences", error: error.message });
    }
  });

  app.put('/api/user-preferences', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const prefsData = insertUserPreferencesSchema.parse({ ...req.body, userId });
      const updated = await storage.upsertUserPreferences(prefsData);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating user preferences for userId:', getUserId(req), error);
      res.status(500).json({ message: "Failed to update user preferences", error: error.message });
    }
  });

  app.post('/api/user-preferences', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const prefsData = insertUserPreferencesSchema.parse({ ...req.body, userId });
      const updated = await storage.upsertUserPreferences(prefsData);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating user preferences for userId:', getUserId(req), error);
      res.status(500).json({ message: "Failed to update user preferences", error: error.message });
    }
  });

  // Coach-client routes
  app.get('/api/coach/clients', requireAuth, async (req: any, res) => {
    try {
      const coachId = getUserId(req);
      if (!coachId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      // Verify user is a coach
      const user = await storage.getUser(coachId);
      if (user?.userType !== "coach") {
        return res.status(403).json({ message: "Access denied. Coach access required." });
      }
      
      const clients = await storage.getCoachClients(coachId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coach clients" });
    }
  });

  app.post('/api/coach/clients', requireAuth, async (req: any, res) => {
    try {
      const coachId = getUserId(req);
      if (!coachId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      // Verify user is a coach
      const user = await storage.getUser(coachId);
      if (user?.userType !== "coach") {
        return res.status(403).json({ message: "Access denied. Coach access required." });
      }
      
      const { clientEmail } = req.body;
      if (!clientEmail) {
        return res.status(400).json({ message: "Client email is required" });
      }
      
      // Find client by email
      const client = await storage.getUserByEmail(clientEmail);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (client.userType !== "individual") {
        return res.status(400).json({ message: "Only individuals can be added as clients" });
      }
      
      const relationData = insertCoachClientSchema.parse({
        coachId: coachId,
        clientId: client.id,
        status: "pending"
      });
      
      const newRelation = await storage.createCoachClient(relationData);
      res.json(newRelation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create coach-client relation" });
    }
  });

  app.patch('/api/coach/clients/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const updated = await storage.updateCoachClientStatus(id, status);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update coach-client status" });
    }
  });

  // Coach client progress routes
  app.get('/api/coach/clients/:clientId/progress', requireAuth, async (req: any, res) => {
    try {
      const coachId = getUserId(req);
      if (!coachId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const { clientId } = req.params;
      
      // Verify coach has access to this client
      const clients = await storage.getCoachClients(coachId);
      const hasAccess = clients.some(relation => relation.clientId === clientId && relation.status === "active");
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this client" });
      }
      
      // Get client progress data
      const [mealLogs, habitLogs, habits, profile] = await Promise.all([
        storage.getMealLogs(clientId),
        storage.getHabitLogs(clientId),
        storage.getHabits(clientId),
        storage.getUserProfile(clientId)
      ]);
      
      res.json({
        mealLogs,
        habitLogs,
        habits,
        profile,
        clientId
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client progress" });
    }
  });

  app.post('/api/coach/clients/:clientId/meal-plan', requireAuth, async (req: any, res) => {
    try {
      const coachId = getUserId(req);
      if (!coachId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const { clientId } = req.params;
      
      // Verify coach has access to this client
      const clients = await storage.getCoachClients(coachId);
      const hasAccess = clients.some(relation => relation.clientId === clientId && relation.status === "active");
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this client" });
      }
      
      const mealPlanData = insertMealPlanSchema.parse({
        ...req.body,
        userId: clientId,
        createdBy: coachId
      });
      
      const newMealPlan = await storage.createMealPlan(mealPlanData);
      res.json(newMealPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to create meal plan" });
    }
  });

  app.post('/api/coach/clients/:clientId/habit', requireAuth, async (req: any, res) => {
    try {
      const coachId = getUserId(req);
      if (!coachId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const { clientId } = req.params;
      
      // Verify coach has access to this client
      const clients = await storage.getCoachClients(coachId);
      const hasAccess = clients.some(relation => relation.clientId === clientId && relation.status === "active");
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this client" });
      }
      
      const habitData = insertHabitSchema.parse({
        ...req.body,
        userId: clientId
      });
      
      const newHabit = await storage.createHabit(habitData);
      res.json(newHabit);
    } catch (error) {
      res.status(500).json({ message: "Failed to create habit" });
    }
  });

  // Message routes
  app.get('/api/messages', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', requireAuth, async (req: any, res) => {
    try {
      const senderId = getUserId(req);
      if (!senderId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const messageData = insertMessageSchema.parse({ ...req.body, senderId });
      const newMessage = await storage.createMessage(messageData);
      res.json(newMessage);
    } catch (error) {
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch('/api/messages/:id/read', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.markMessageAsRead(id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Community routes
  app.get('/api/community/posts', requireAuth, async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const posts = await storage.getCommunityPosts(
        limit ? parseInt(limit as string) : 20,
        offset ? parseInt(offset as string) : 0
      );
      
      // Transform the response to match frontend expectations
      const transformedPosts = posts.map(post => ({
        id: post.id,
        userId: post.userId,
        content: post.content,
        imageUrl: post.imageUrl,
        tags: post.tags,
        likes: post.likes,
        comments: post.comments,
        createdAt: post.createdAt,
        user: post.user
      }));
      
      res.json(transformedPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  app.post('/api/community/posts', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const postData = insertCommunityPostSchema.parse({ ...req.body, userId });
      const newPost = await storage.createCommunityPost(postData);
      
      // Award points for community engagement
      await storage.awardPoints(userId, 10);
      
      res.json(newPost);
    } catch (error) {
      res.status(500).json({ message: "Failed to create community post" });
    }
  });

  app.post('/api/community/posts/:id/like', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const postId = parseInt(req.params.id);
      const result = await storage.togglePostLike(postId, userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle post like" });
    }
  });

  // Comment routes
  app.get('/api/community/posts/:id/comments', requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/community/posts/:id/comments', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const postId = parseInt(req.params.id);
      const { content, parentCommentId } = req.body;
      
      const newComment = await storage.createComment({
        postId,
        userId,
        content,
        parentCommentId: parentCommentId || null
      });
      
      res.json(newComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.post('/api/community/comments/:id/like', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const commentId = parseInt(req.params.id);
      const result = await storage.toggleCommentLike(commentId, userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle comment like" });
    }
  });

  // Leaderboard and points routes
  app.get('/api/leaderboard', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.get('/api/points/my-rank', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const rank = await storage.getUserRank(userId);
      const points = await storage.getUserPoints(userId);
      
      res.json({ rank, points });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user rank" });
    }
  });

  app.post('/api/admin/reset-weekly-points', async (req, res) => {
    try {
      // In production, add admin auth check here
      await storage.resetWeeklyPoints();
      res.json({ message: "Weekly points reset successfully" });
    } catch (error) {
      console.error('Error resetting weekly points:', error);
      res.status(500).json({ message: "Failed to reset weekly points" });
    }
  });

  app.get('/api/leaderboard/history', requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await storage.getWeeklyLeaderboardHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard history" });
    }
  });

  // AI meal plan generation (protected - require active subscription)
  app.post('/api/ai/meal-plan', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const { duration, preferences } = req.body;
      
      // Mock AI meal plan generation - in production, this would call an AI service
      const sampleRecipes = await storage.getRecipes({ limit: 21 }); // 7 days * 3 meals
      
      if (sampleRecipes.length === 0) {
        return res.status(400).json({ message: "No recipes available for meal plan generation" });
      }
      
      const mealTypes = ['breakfast', 'lunch', 'dinner'];
      const mealPlan = [];
      
      for (let day = 1; day <= duration; day++) {
        for (const mealType of mealTypes) {
          const filteredRecipes = sampleRecipes.filter(r => r.mealType === mealType);
          if (filteredRecipes.length > 0) {
            const randomRecipe = filteredRecipes[Math.floor(Math.random() * filteredRecipes.length)];
            mealPlan.push({
              day,
              mealType,
              recipe: randomRecipe,
              servings: 1
            });
          }
        }
      }

      // Save the generated meal plan to storage
      const totalCalories = mealPlan.reduce((sum, item) => sum + (item.recipe.calories || 0), 0);
      const planName = `AI Generated Plan - ${duration} Days`;
      const planDescription = `Personalized meal plan for ${duration} days with ${mealPlan.length} meals`;
      
      // Calculate start and end dates
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + (duration - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      try {
        const savedPlan = await storage.createMealPlan({
          userId,
          name: planName,
          description: planDescription,
          startDate,
          endDate,
          totalCalories,
          isActive: true,
          createdBy: userId
        });
        
        // Save individual meal plan items
        for (const meal of mealPlan) {
          await storage.addMealPlanItem({
            mealPlanId: savedPlan.id,
            recipeId: meal.recipe.id,
            day: meal.day,
            mealType: meal.mealType as "breakfast" | "lunch" | "dinner" | "snack",
            servings: meal.servings
          });
        }
        
        // Format ingredients in meal plan before sending response
        const formattedMealPlan = formatMealPlanData(mealPlan);
        
        res.json({ 
          mealPlan: formattedMealPlan,
          totalCalories,
          savedPlan: savedPlan,
          message: "Meal plan generated and saved successfully!"
        });
      } catch (saveError) {
        // Still return the meal plan even if saving fails
        // Format ingredients in meal plan before sending response
        const formattedMealPlan = formatMealPlanData(mealPlan);
        
        res.json({ 
          mealPlan: formattedMealPlan,
          totalCalories,
          message: "Meal plan generated successfully!"
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI meal plan" });
    }
  });

  // AI Fitness Chat Proxy (protected - require active subscription)
  app.post('/api/ai/fitness/chat', requireAuth, requireActiveSubscription, async (req: any, res) => {
    // Disable timeouts for AI generation - responses can take several minutes
    req.setTimeout(0);
    res.setTimeout(0);
    
    try {
      const AI_BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${AI_BACKEND}/ai/fitness/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'AI service unavailable' }));
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('AI fitness chat proxy error:', error);
      res.status(500).json({ message: "Failed to connect to AI service" });
    }
  });

  // AI Supplements Suggest Proxy (protected - require active subscription)
  app.post('/api/ai/supplements/suggest', requireAuth, requireActiveSubscription, async (req: any, res) => {
    // Disable timeouts for AI generation - responses can take several minutes
    req.setTimeout(0);
    res.setTimeout(0);
    
    try {
      const AI_BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${AI_BACKEND}/ai/supplements/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'AI service unavailable' }));
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('AI supplements proxy error:', error);
      res.status(500).json({ message: "Failed to connect to AI service" });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      // Trim whitespace from inputs
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      const admin = await AdminAuth.validateAdmin(trimmedUsername, trimmedPassword);
      
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const sessionId = await AdminAuth.createSession(admin.id);
      
      // Set cookie with explicit domain and path
      res.cookie('adminSession', sessionId, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({ 
        success: true, 
        admin: { 
          id: admin.id, 
          username: admin.username, 
          email: admin.email,
          role: admin.role 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/logout", requireAdminAuth, async (req, res) => {
    try {
      const sessionId = req.cookies?.adminSession;
      if (sessionId) {
        await AdminAuth.deleteSession(sessionId);
      }
      res.clearCookie('adminSession');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/create-admin", requireAdminAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, role } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password required" });
      }

      const admin = await AdminAuth.createAdminAccount({
        username,
        email,
        password,
        firstName,
        lastName,
        role: role || 'admin',
      });

      res.json({ 
        success: true, 
        admin: { 
          id: admin.id, 
          username: admin.username, 
          email: admin.email, 
          role: admin.role 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create admin account" });
    }
  });

  // Admin dashboard routes
  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const totalUsers = await db.select().from(users);
      const totalCoaches = totalUsers.filter(user => user.userType === 'coach');
      const activeSubscriptions = totalUsers.filter(user => user.subscriptionStatus === 'active');
      const trialUsers = totalUsers.filter(user => user.subscriptionStatus === 'trial');
      
      // Calculate real monthly revenue based on subscription plans
      const monthlyRevenue = activeSubscriptions.reduce((total, user) => {
        // Real pricing: $9.99/year AI Coach, $25/year Personal Coach, $35/year Coach Use
        // Monthly equivalent: $0.83, $2.08, $2.92
        const userType = user.userType || 'individual';
        if (userType === 'coach') {
          return total + 2.92; // Coach Use plan monthly
        } else {
          // Check if they have personal coach features (for now, assume Personal Coach plan)
          return total + 2.08; // Personal Coach plan monthly
        }
      }, 0);
      
      // Calculate this month's new users
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const newUsersThisMonth = totalUsers.filter(user => {
        return user.createdAt && new Date(user.createdAt) >= startOfMonth;
      }).length;
      
      // Calculate this week's new users
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const newUsersThisWeek = totalUsers.filter(user => {
        return user.createdAt && new Date(user.createdAt) > weekAgo;
      }).length;
      
      // Calculate conversion rate (trial to paid)
      const totalTrialAndPaid = activeSubscriptions.length + trialUsers.length;
      const conversionRate = totalTrialAndPaid > 0 ? 
        Math.round((activeSubscriptions.length / totalTrialAndPaid) * 100) : 0;
      
      // Get coach verifications count
      const verifications = await db.select().from(coachVerifications);
      const pendingVerifications = verifications.filter(v => v.verificationStatus === 'pending').length;
      
      const stats = {
        totalUsers: totalUsers.length,
        totalCoaches: totalCoaches.length,
        activeSubscriptions: activeSubscriptions.length,
        trialUsers: trialUsers.length,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100, // Round to 2 decimal places
        annualRevenue: Math.round(monthlyRevenue * 12 * 100) / 100,
        newUsersThisWeek,
        newUsersThisMonth,
        conversionRate,
        pendingVerifications,
        totalVerifications: verifications.length,
        // Additional metrics
        averageRevenuePerUser: totalUsers.length > 0 ? 
          Math.round((monthlyRevenue / totalUsers.length) * 100) / 100 : 0,
        churnRate: 0, // For now, since we don't track cancellations over time
        growthRate: newUsersThisMonth, // Simplified growth metric
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", requireAdminAuth, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/coaches", requireAdminAuth, async (req, res) => {
    try {
      const coaches = await db.select().from(users).where(eq(users.userType, 'coach'));
      res.json(coaches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coaches" });
    }
  });

  app.get("/api/admin/subscriptions", requireAdminAuth, async (req, res) => {
    try {
      const subscriptions = await db.select().from(users);
      
      // Calculate subscription metrics with real data
      const now = new Date();
      const stats = {
        active: subscriptions.filter(u => u.subscriptionStatus === 'active').length,
        trial: subscriptions.filter(u => u.subscriptionStatus === 'trial').length,
        cancelled: subscriptions.filter(u => u.subscriptionStatus === 'canceled').length,
        expired: subscriptions.filter(u => u.subscriptionStatus === 'past_due').length,
        // Additional subscription insights
        trialExpiredToday: subscriptions.filter(u => {
          if (!u.trialEndsAt) return false;
          const trialEnd = new Date(u.trialEndsAt);
          return trialEnd.toDateString() === now.toDateString();
        }).length,
        newTrialsThisWeek: subscriptions.filter(u => {
          if (u.subscriptionStatus !== 'trial') return false;
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return u.createdAt && new Date(u.createdAt) > weekAgo;
        }).length,
        // Revenue breakdown by plan type
        revenueBreakdown: {
          aiCoach: subscriptions.filter(u => u.subscriptionStatus === 'active' && u.userType === 'individual').length * 2.08,
          personalCoach: subscriptions.filter(u => u.subscriptionStatus === 'active' && u.userType === 'individual').length * 2.08,
          coachUse: subscriptions.filter(u => u.subscriptionStatus === 'active' && u.userType === 'coach').length * 2.92,
        }
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription stats" });
    }
  });

  app.put("/api/admin/users/:userId/status", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      
      await db.update(users)
        .set({ subscriptionStatus: status })
        .where(eq(users.id, userId));
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.get("/api/admin/reports", requireAdminAuth, async (req, res) => {
    try {
      // For now, return mock reports since systemReports table might not exist
      const mockReports = [
        {
          id: 1,
          reportType: 'user_stats',
          createdAt: new Date().toISOString(),
          data: { totalUsers: 0 }
        },
        {
          id: 2,
          reportType: 'subscription_stats',
          createdAt: new Date().toISOString(),
          data: { active: 0 }
        }
      ];
      
      res.json(mockReports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/admin/generate-report", requireAdminAuth, async (req, res) => {
    try {
      const { reportType } = req.body;
      const admin = (req as any).admin;
      
      let data = {};
      
      switch (reportType) {
        case 'user_stats':
          const allUsers = await db.select().from(users);
          data = {
            totalUsers: allUsers.length,
            usersByType: {
              individual: allUsers.filter(u => u.userType === 'individual').length,
              coach: allUsers.filter(u => u.userType === 'coach').length,
            },
            registrationsByMonth: {} // Would implement actual grouping logic
          };
          break;
        case 'subscription_stats':
          const subscriptions = await db.select().from(users);
          data = {
            byStatus: {
              active: subscriptions.filter(u => u.subscriptionStatus === 'active').length,
              trial: subscriptions.filter(u => u.subscriptionStatus === 'trial').length,
              cancelled: subscriptions.filter(u => u.subscriptionStatus === 'canceled').length,
            }
          };
          break;
        case 'revenue':
          const activeUsers = await db.select().from(users).where(eq(users.subscriptionStatus, 'active'));
          data = {
            totalRevenue: activeUsers.length * 29.99,
            monthlyRecurring: activeUsers.length * 29.99,
            userCount: activeUsers.length,
          };
          break;
        default:
          return res.status(400).json({ message: "Invalid report type" });
      }

      const [report] = await db.insert(systemReports).values({
        reportType,
        data,
        generatedBy: admin.id,
      }).returning();

      res.json({ success: true, report });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Download report endpoint
  app.get("/api/admin/reports/:id/download", requireAdminAuth, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const [report] = await db.select().from(systemReports).where(eq(systemReports.id, reportId));
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Return the report data and metadata for client-side CSV generation
      res.json({
        success: true,
        data: report.data,
        reportType: report.reportType,
        createdAt: report.createdAt,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // Coach verification routes
  app.post('/api/coach/verification', async (req, res) => {
    try {
      const { validationReport, ...verificationData } = req.body;
      
      // Insert verification record
      const [verification] = await db.insert(coachVerifications).values({
        ...verificationData,
        validationReport,
        verificationStatus: validationReport.validationStatus || 'pending',
      }).returning();
      
      res.json({ 
        success: true, 
        verification,
        message: 'Verification submitted successfully' 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit verification" });
    }
  });

  app.get('/api/coach/verifications', requireAdminAuth, async (req, res) => {
    try {
      const verifications = await db.select().from(coachVerifications).orderBy(desc(coachVerifications.createdAt));
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.put('/api/coach/verification/:id', requireAdminAuth, async (req, res) => {
    try {
      const verificationId = parseInt(req.params.id);
      const { verificationStatus, reviewNotes } = req.body;
      const admin = (req as any).admin;
      
      const [updatedVerification] = await db
        .update(coachVerifications)
        .set({
          verificationStatus,
          reviewNotes,
          reviewedBy: admin.username,
          reviewedAt: new Date(),
        })
        .where(eq(coachVerifications.id, verificationId))
        .returning();
      
      res.json({ 
        success: true, 
        verification: updatedVerification 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update verification" });
    }
  });

  // Workout routes
  app.post('/api/workouts/ai', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const { ownerId, profile, prefs, weeks } = req.body;

      // Validate input
      if (!profile || !prefs) {
        return res.status(400).json({ message: "Profile and preferences are required" });
      }

      // For now, return a mock AI-generated workout plan
      // In production, this would call FastAPI
      const mockPlan = {
        name: `${prefs.goal.charAt(0).toUpperCase() + prefs.goal.slice(1)} Training Plan`,
        goal: prefs.goal,
        weeks: weeks || 8,
        days_per_week: prefs.days_per_week,
        split: prefs.desired_split === "auto" ? 
          (prefs.days_per_week <= 3 ? "full-body" : "push/pull/legs") : 
          prefs.desired_split,
        days: generateMockWorkoutDays(prefs),
        progression_notes: "Increase weight by 2.5-5lbs when you can complete all sets with good form",
        warmup_notes: "Start with 5-10 minutes of light cardio and dynamic stretching",
        deload: "Week 8: reduce volume by 30-40% while maintaining intensity"
      };

      // Save workout to database with optional fields
      const savedWorkout = await storage.createWorkout({
        ownerId: userId,
        name: mockPlan.name,
        goal: mockPlan.goal,
        weeks: mockPlan.weeks,
        daysPerWeek: mockPlan.days_per_week,
        sessionMinutes: prefs.session_minutes || null, // Make optional
        split: mockPlan.split,
        equipment: prefs.equipment || null, // Make optional  
        injuries: prefs.injuries || null,
        progressionNotes: mockPlan.progression_notes,
        warmupNotes: mockPlan.warmup_notes,
        deloadNotes: mockPlan.deload,
        isActive: true
      });

      // Save workout items
      for (const day of mockPlan.days) {
        for (let i = 0; i < day.items.length; i++) {
          const item = day.items[i];
          
          // Find or create exercise
          let exercise = await storage.getExerciseByName(item.exercise);
          if (!exercise) {
            exercise = await storage.createExercise({
              name: item.exercise,
              equipment: item.equipment,
              primaryMuscles: [],
              secondaryMuscles: []
            });
          }

          // Create workout item
          await storage.createWorkoutItem({
            workoutId: savedWorkout.id,
            exerciseId: exercise.id,
            dayIndex: day.dayIndex,
            orderIndex: i,
            sets: item.sets,
            reps: item.reps,
            rir: item.rir,
            restSec: item.restSec,
            notes: item.notes
          });
        }
      }

      res.json({
        success: true,
        data: {
          workoutId: savedWorkout.id,
          plan_meta: {
            name: mockPlan.name,
            goal: mockPlan.goal,
            weeks: mockPlan.weeks,
            split: mockPlan.split
          }
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create workout plan" });
    }
  });

  app.get('/api/workouts', requireAuth, requireActiveSubscription, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const { ownerId } = req.query;
      const targetUserId = ownerId || userId;

      const workouts = await storage.getWorkouts(targetUserId);
      res.json({ success: true, data: workouts });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  app.get('/api/workouts/:id/items', requireAuth, async (req: any, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const items = await storage.getWorkoutItems(workoutId);
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout items" });
    }
  });

  app.get('/api/workouts/:id/full', requireAuth, async (req: any, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const workout = await storage.getWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }

      const items = await storage.getWorkoutItemsWithExercises(workoutId);
      
      // Group by day
      const days: any[] = [];
      const dayMap = new Map();

      items.forEach(item => {
        if (!dayMap.has(item.dayIndex)) {
          dayMap.set(item.dayIndex, {
            dayIndex: item.dayIndex,
            name: getDayName(item.dayIndex),
            items: []
          });
          days.push(dayMap.get(item.dayIndex));
        }
        
        dayMap.get(item.dayIndex).items.push({
          name: item.exerciseName,
          sets: item.sets,
          reps: item.reps,
          rir: item.rir,
          restSec: item.restSec,
          notes: item.notes,
          equipment: item.equipment
        });
      });

      // Sort days and items
      days.sort((a, b) => a.dayIndex - b.dayIndex);
      days.forEach(day => {
        day.items.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
      });

      res.json({
        success: true,
        data: {
          workout,
          days
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout details" });
    }
  });

  // Helper functions
  function generateMockWorkoutDays(prefs: any) {
    const days = [];
    const daysPerWeek = prefs.days_per_week;
    const availableEquipment = prefs.equipment || ['bodyweight', 'dumbbell', 'barbell']; // Default if not specified
    
    // Exercise alternatives based on available equipment
    const exerciseAlternatives = {
      'Squats': {
        'barbell': { exercise: "Barbell Squats", equipment: "barbell" },
        'dumbbell': { exercise: "Dumbbell Squats", equipment: "dumbbell" },
        'bodyweight': { exercise: "Bodyweight Squats", equipment: "bodyweight" },
        'default': { exercise: "Squats", equipment: "any" }
      },
      'Bench Press': {
        'barbell': { exercise: "Barbell Bench Press", equipment: "barbell" },
        'dumbbell': { exercise: "Dumbbell Bench Press", equipment: "dumbbell" },
        'bodyweight': { exercise: "Push-ups", equipment: "bodyweight" },
        'default': { exercise: "Push-ups", equipment: "bodyweight" }
      },
      'Rows': {
        'barbell': { exercise: "Barbell Rows", equipment: "barbell" },
        'dumbbell': { exercise: "Dumbbell Rows", equipment: "dumbbell" },
        'cable': { exercise: "Cable Rows", equipment: "cable" },
        'bodyweight': { exercise: "Inverted Rows", equipment: "bodyweight" },
        'default': { exercise: "Bent-over Rows", equipment: "any" }
      },
      'Overhead Press': {
        'barbell': { exercise: "Barbell Overhead Press", equipment: "barbell" },
        'dumbbell': { exercise: "Dumbbell Overhead Press", equipment: "dumbbell" },
        'bodyweight': { exercise: "Pike Push-ups", equipment: "bodyweight" },
        'default': { exercise: "Overhead Press", equipment: "any" }
      }
    };

    const getExerciseVariant = (baseName: string) => {
      const alternatives = exerciseAlternatives[baseName as keyof typeof exerciseAlternatives];
      if (!alternatives) return { exercise: baseName, equipment: "any" };
      
      // Try to find the best match from available equipment
      for (const equipmentType of availableEquipment) {
        if (alternatives[equipmentType as keyof typeof alternatives]) {
          return alternatives[equipmentType as keyof typeof alternatives];
        }
      }
      
      return alternatives['default'] || { exercise: baseName, equipment: "any" };
    };

    if (prefs.desired_split === "full-body" || daysPerWeek <= 3) {
      // Full body workout adapted to equipment
      for (let i = 0; i < daysPerWeek; i++) {
        const squatVariant = getExerciseVariant('Squats');
        const benchVariant = getExerciseVariant('Bench Press');
        const rowVariant = getExerciseVariant('Rows');
        
        days.push({
          dayIndex: i,
          name: "Full Body",
          items: [
            { ...squatVariant, sets: 3, reps: "8-12", rir: "1-2", restSec: 180, notes: "" },
            { ...benchVariant, sets: 3, reps: "8-15", rir: "1-2", restSec: 120, notes: "" },
            { ...rowVariant, sets: 3, reps: "8-12", rir: "1-2", restSec: 120, notes: "" },
            { exercise: "Plank", equipment: "bodyweight", sets: 3, reps: "30-60s", rir: "1-2", restSec: 60, notes: "" }
          ]
        });
      }
    } else {
      // Push/Pull/Legs split adapted to equipment
      const workouts = [
        {
          name: "Push",
          exercises: [
            { ...getExerciseVariant('Bench Press'), sets: 4, reps: "6-8", rir: "1-2", restSec: 180 },
            { ...getExerciseVariant('Overhead Press'), sets: 3, reps: "8-12", rir: "1-2", restSec: 120 },
            { exercise: "Dips", equipment: availableEquipment.includes('bodyweight') ? "bodyweight" : "any", sets: 3, reps: "8-15", rir: "1-2", restSec: 120 }
          ]
        },
        {
          name: "Pull",
          exercises: [
            { exercise: "Pull-ups", equipment: availableEquipment.includes('bodyweight') ? "bodyweight" : "any", sets: 4, reps: "6-10", rir: "1-2", restSec: 180 },
            { ...getExerciseVariant('Rows'), sets: 3, reps: "8-12", rir: "1-2", restSec: 120 },
            { exercise: "Bicep Curls", equipment: availableEquipment.includes('dumbbell') ? "dumbbell" : "any", sets: 3, reps: "10-15", rir: "1-2", restSec: 90 }
          ]
        },
        {
          name: "Legs",
          exercises: [
            { ...getExerciseVariant('Squats'), sets: 4, reps: "6-8", rir: "1-2", restSec: 180 },
            { exercise: "Romanian Deadlifts", equipment: availableEquipment.includes('dumbbell') ? "dumbbell" : "any", sets: 3, reps: "8-12", rir: "1-2", restSec: 120 },
            { exercise: "Calf Raises", equipment: "bodyweight", sets: 3, reps: "15-20", rir: "1-2", restSec: 60 }
          ]
        }
      ];

      for (let i = 0; i < daysPerWeek; i++) {
        const workout = workouts[i % workouts.length];
        days.push({
          dayIndex: i,
          name: workout.name,
          items: workout.exercises.map(ex => ({ ...ex, notes: "" }))
        });
      }
    }

    return days;
  }

  function getDayName(dayIndex: number): string {
    const names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return names[dayIndex] || `Day ${dayIndex + 1}`;
  }

  // ===== ORGANIZATION MANAGEMENT ROUTES =====
  // Middleware functions are now imported from auth-middleware.ts

  // 1. POST /api/organizations/create - Create organization
  app.post('/api/organizations/create', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate request body excluding ownerId (which we'll add from the authenticated user)
      const { name, logoUrl, subscriptionPlan, maxCoaches, maxClients, commonPassword } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Organization name is required" });
      }

      // Hash common password if provided
      let hashedPassword = null;
      let hasCommonPassword = false;
      
      if (commonPassword) {
        if (commonPassword.length < 6) {
          return res.status(400).json({ message: "Common password must be at least 6 characters" });
        }
        hashedPassword = await bcrypt.hash(commonPassword, 10);
        hasCommonPassword = true;
      }

      // Create organization with hashed common password
      const org = await storage.createOrganization({
        name,
        logoUrl: logoUrl || null,
        commonPassword: hashedPassword,
        hasCommonPassword,
        subscriptionPlan: subscriptionPlan || 'free',
        maxCoaches: maxCoaches || 2,
        maxClients: maxClients || 40,
        ownerId: userId,
      });

      // Update user type to org_owner
      await storage.updateUserOrgSettings(userId, {
        userType: 'org_owner',
        currentOrgId: org.id,
      });

      // Create FREE tier billing period (expired immediately so user can purchase subscription)
      const now = new Date();
      
      await storage.createBillingPeriod({
        organizationId: org.id,
        tier: 'free',
        baseCoachAllowance: 0,
        baseClientAllowance: 0,
        addonCoachQty: 0,
        addonClientQty: 0,
        currentPeriodStartsAt: now,
        currentPeriodEndsAt: now,
        status: 'expired',
        stripePaymentIntentId: null,
        stripeCheckoutSessionId: null,
        amountPaid: '0',
        currency: 'usd'
      });

      res.json({
        success: true,
        organization: org,
      });
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ 
        message: "Failed to create organization",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 2. GET /api/organizations/:id - Get organization details with counts
  app.get('/api/organizations/:id', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.id);
      
      await storage.checkAndUpdateExpiredPeriods(orgId);
      
      const orgWithCounts = await storage.getOrganizationWithCounts(orgId);
      
      if (!orgWithCounts) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get billing period for correct capacity limits (not legacy max fields)
      const billingPeriod = await storage.getActiveBillingPeriod(orgId);
      
      let maxCoaches = 0;
      let maxClients = 0;
      
      if (billingPeriod) {
        maxCoaches = billingPeriod.baseCoachAllowance + billingPeriod.addonCoachQty;
        maxClients = billingPeriod.baseClientAllowance + billingPeriod.addonClientQty;
      }

      res.json({
        success: true,
        organization: {
          ...orgWithCounts,
          // Override legacy max fields with billing period data
          maxCoaches,
          maxClients,
        },
        userRole: req.orgRole || req.userOrgRole,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // 2b. GET /api/organizations/:id/analytics - Get organization analytics and statistics
  app.get('/api/organizations/:id/analytics', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.id);
      
      // Get counts using raw SQL to avoid Drizzle issues
      const totalCoaches = await db.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int as count FROM org_users 
            WHERE organization_id = ${orgId} 
            AND role = 'coach' 
            AND is_active = true 
            AND (is_test = false OR is_test IS NULL)`
      ).then(r => r.rows[0]?.count || 0);

      const totalClients = await db.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int as count FROM org_users 
            WHERE organization_id = ${orgId} 
            AND role = 'client' 
            AND is_active = true 
            AND (is_test = false OR is_test IS NULL)`
      ).then(r => r.rows[0]?.count || 0);

      const totalMealPlans = await db.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int as count FROM org_meal_plans WHERE org_id = ${orgId}`
      ).then(r => r.rows[0]?.count || 0);

      const totalWorkoutPlans = await db.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int as count FROM org_workout_plans WHERE org_id = ${orgId}`
      ).then(r => r.rows[0]?.count || 0);

      const totalActivePlans = await db.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int as count FROM plan_assignments 
            WHERE is_active = true 
            AND plan_id IN (
              SELECT id FROM org_meal_plans WHERE org_id = ${orgId}
              UNION
              SELECT id FROM org_workout_plans WHERE org_id = ${orgId}
            )`
      ).then(r => r.rows[0]?.count || 0);

      const messagesResult = await db.execute<{
        id: number;
        sender_id: string;
        sender_first_name: string | null;
        sender_last_name: string | null;
        content: string;
        message_type: string;
        created_at: Date | null;
      }>(
        sql`SELECT m.id, m.sender_id, u.first_name as sender_first_name, 
                   u.last_name as sender_last_name, m.content, m.message_type, m.created_at
            FROM org_messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.org_id = ${orgId}
            ORDER BY m.created_at DESC
            LIMIT 5`
      );
      const recentMessages = messagesResult.rows.map(r => ({
        id: r.id,
        senderId: r.sender_id,
        senderFirstName: r.sender_first_name,
        senderLastName: r.sender_last_name,
        content: r.content,
        messageType: r.message_type,
        createdAt: r.created_at,
      }));

      let mostActiveClients = [];
      try {
        mostActiveClients = await storage.getMostActiveClients(orgId, 5);
      } catch (e) {
        console.error('Error in getMostActiveClients:', e);
      }

      let coachPerformance = [];
      try {
        coachPerformance = await storage.getCoachPerformance(orgId);
      } catch (e) {
        console.error('Error in getCoachPerformance:', e);
      }

      let progressMetrics = { completionRate: 0, excellent: 0, good: 0, needsHelp: 100 };
      try {
        progressMetrics = await storage.getClientProgressMetrics(orgId);
      } catch (e) {
        console.error('Error in getClientProgressMetrics:', e);
      }

      let completionRates = { mealAdherence: 0, workoutCompletion: 0 };
      try {
        completionRates = await storage.getPlanCompletionRates(orgId);
      } catch (e) {
        console.error('Error in getPlanCompletionRates:', e);
      }

      // Get new analytics data
      let activityTrend = [];
      try {
        activityTrend = await storage.getActivityTrend(orgId);
      } catch (e) {
        console.error('Error in getActivityTrend:', e);
      }

      let teamCapacity = { coachesUsed: 0, coachesAllowed: 0, clientsUsed: 0, clientsAllowed: 0 };
      try {
        teamCapacity = await storage.getTeamCapacity(orgId);
      } catch (e) {
        console.error('Error in getTeamCapacity:', e);
      }

      // Use real metrics from tracking data
      const completionRate = progressMetrics.completionRate;
      const workoutCompletion = completionRates.workoutCompletion;
      const mealAdherence = completionRates.mealAdherence;
      const excellent = progressMetrics.excellent;
      const good = progressMetrics.good;
      const needsHelp = progressMetrics.needsHelp;

      // Format recent activity
      const recentActivity = recentMessages.map(msg => ({
        type: msg.messageType === 'community' ? 'message' : 'dm',
        description: `${msg.senderFirstName || 'Unknown'} ${msg.senderLastName || 'User'} posted: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`,
        timestamp: msg.createdAt,
        timeAgo: getTimeAgo(msg.createdAt)
      }));

      res.json({
        success: true,
        analytics: {
          totalCoaches,
          totalClients,
          totalMealPlans,
          totalWorkoutPlans,
          activePlans: totalActivePlans,
          completionRate,
          workoutCompletion,
          mealAdherence,
          clientDistribution: {
            excellent,
            good,
            needsHelp
          },
          recentActivity,
          mostActiveClients: mostActiveClients,
          coachPerformance: coachPerformance,
          activityTrend,
          teamCapacity
        }
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // 2c. GET /api/organizations/:id/low-activity-clients - Get clients needing attention
  app.get('/api/organizations/:id/low-activity-clients', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const coachId = req.query.coachId as string | undefined;
      
      const lowActivityClients = await storage.getLowActivityClients(orgId, coachId);
      
      res.json({
        success: true,
        clients: lowActivityClients
      });
    } catch (error) {
      console.error('Low activity clients error:', error);
      res.status(500).json({ message: "Failed to fetch low activity clients" });
    }
  });

  // 2d. GET /api/organizations/:id/habit-water-compliance - Get habit and water compliance
  app.get('/api/organizations/:id/habit-water-compliance', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const coachId = req.query.coachId as string | undefined;
      
      const compliance = await storage.getHabitWaterCompliance(orgId, coachId);
      
      res.json({
        success: true,
        compliance
      });
    } catch (error) {
      console.error('Habit water compliance error:', error);
      res.status(500).json({ message: "Failed to fetch habit and water compliance" });
    }
  });

  // 3. PUT /api/organizations/:id - Update organization
  app.put('/api/organizations/:id', requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const updates = req.body;
      
      // Remove fields that shouldn't be updated
      delete updates.id;
      delete updates.ownerId;
      delete updates.createdAt;

      const updatedOrg = await storage.updateOrganization(orgId, updates);
      
      res.json({
        success: true,
        organization: updatedOrg,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  // 4. POST /api/organizations/:id/set-common-password - Set/update organization common password
  app.post('/api/organizations/:id/set-common-password', requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const { newPassword, currentPassword, sendNotifications, notifyMembers } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Fetch fresh org data from database to avoid stale cached data
      const org = await storage.getOrganization(orgId);
      
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // If org already has a password, verify current password
      if (org.hasCommonPassword && org.commonPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required" });
        }
        const isValid = await bcrypt.compare(currentPassword, org.commonPassword);
        if (!isValid) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update organization password
      await storage.updateOrganization(orgId, {
        commonPassword: hashedPassword,
        hasCommonPassword: true
      });

      // Send email notifications if requested
      if (sendNotifications && notifyMembers && notifyMembers.length > 0) {
        const { sendCommonPasswordChangedEmail } = await import('./email');
        const orgUsers = await storage.getOrgUsers(orgId, null as any);
        
        for (const memberId of notifyMembers) {
          const member = orgUsers.find(u => u.id === parseInt(memberId));
          if (member) {
            await sendCommonPasswordChangedEmail({
              to: member.email,
              firstName: member.firstName || member.email.split('@')[0],
              organizationName: org.name,
              newPassword: newPassword,
            });
          }
        }
      }

      res.json({
        success: true,
        message: "Organization password updated successfully"
      });
    } catch (error) {
      console.error("Set common password error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // 4b. POST /api/organizations/:id/generate-common-password - Generate random common password
  app.post('/api/organizations/:id/generate-common-password', requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.id);
      
      // Generate random password (12 characters with letters and numbers)
      const randomPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase();

      // Hash new password
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Update organization password
      await storage.updateOrganization(orgId, {
        commonPassword: hashedPassword,
        hasCommonPassword: true
      });

      res.json({
        success: true,
        message: "Random password generated successfully",
        password: randomPassword
      });
    } catch (error) {
      console.error("Generate password error:", error);
      res.status(500).json({ message: "Failed to generate password" });
    }
  });

  // 5. DELETE /api/organizations/:id - Soft delete organization
  app.delete('/api/organizations/:id', requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const deletedOrg = await storage.softDeleteOrganization(orgId);
      
      res.json({
        success: true,
        message: "Organization deactivated successfully",
        organization: deletedOrg,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  // DELETE organization and convert owner to individual user
  app.post('/api/organizations/:orgId/delete-and-convert', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const orgId = parseInt(req.params.orgId);
      if (isNaN(orgId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      // Get user and verify they're the owner
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.userType !== 'org_owner') {
        return res.status(403).json({ message: "Only organization owners can delete organizations" });
      }

      if (user.currentOrgId !== orgId) {
        return res.status(403).json({ message: "You can only delete your own organization" });
      }

      // Soft delete the organization
      await storage.softDeleteOrganization(orgId);

      // Convert user from org_owner to individual
      await db.update(users)
        .set({ 
          userType: 'individual',
          currentOrgId: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({
        success: true,
        message: "Organization deleted and account converted to individual",
      });
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  // 5. POST /api/organizations/:orgId/members - Add organization member (coach or client)
  app.post('/api/organizations/:orgId/members', requireOrgActiveSubscription, requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const { email, role, firstName, lastName, commonPassword } = req.body;

      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }

      if (role !== 'coach' && role !== 'client') {
        return res.status(400).json({ message: "Role must be 'coach' or 'client'" });
      }

      // Check if common password is set
      const org = req.organization;
      if (!org.hasCommonPassword || !org.commonPassword) {
        return res.status(400).json({ 
          message: "Please set an organization common password in Settings before adding members" 
        });
      }

      // Require common password in request body for email
      if (!commonPassword) {
        return res.status(400).json({ 
          message: "Common password is required to send invitation email" 
        });
      }

      // Verify the provided common password matches the org's hashed password
      const isValidPassword = await bcrypt.compare(commonPassword, org.commonPassword);
      if (!isValidPassword) {
        return res.status(400).json({ 
          message: "Invalid common password provided" 
        });
      }

      // Check billing period limits - FREE tier has 0 capacity
      const billingStatus = await getOrgBillingStatus(orgId);
      
      // FREE tier or expired orgs have 0 capacity - must upgrade to add members
      const totalAllowedCoaches = billingStatus.locked || billingStatus.tier === 'free' 
        ? 0 
        : billingStatus.totalCoachAllowance;
      
      const totalAllowedClients = billingStatus.locked || billingStatus.tier === 'free' 
        ? 0 
        : billingStatus.totalClientAllowance;

      // For FREE tier, provide a clear upgrade message
      const isFreeOrLocked = billingStatus.locked || billingStatus.tier === 'free';
      
      const orgWithCounts = await storage.getOrganizationWithCounts(orgId);
      if (!orgWithCounts) {
        return res.status(500).json({ message: "Failed to fetch organization data" });
      }

      if (role === 'coach') {
        if (orgWithCounts.coachCount >= totalAllowedCoaches) {
          const errorMessage = isFreeOrLocked
            ? "Subscription required: Please upgrade to a paid plan to add team members."
            : `Maximum coach limit (${totalAllowedCoaches}) reached. Upgrade your subscription or purchase additional coach slots to add more.`;
          
          return res.status(isFreeOrLocked ? 402 : 400).json({ 
            message: errorMessage,
            limitReached: true,
            requiresUpgrade: isFreeOrLocked,
            currentCount: orgWithCounts.coachCount,
            maxAllowed: totalAllowedCoaches
          });
        }
      } else {
        if (orgWithCounts.clientCount >= totalAllowedClients) {
          const errorMessage = isFreeOrLocked
            ? "Subscription required: Please upgrade to a paid plan to add clients."
            : `Maximum client limit (${totalAllowedClients}) reached. Upgrade your subscription or purchase additional client slots to add more.`;
          
          return res.status(isFreeOrLocked ? 402 : 400).json({ 
            message: errorMessage,
            limitReached: true,
            requiresUpgrade: isFreeOrLocked,
            currentCount: orgWithCounts.clientCount,
            maxAllowed: totalAllowedClients
          });
        }
      }

      // Use ensureOrgUserActive to create new user or reactivate archived user
      const result = await storage.ensureOrgUserActive(
        orgId,
        email,
        role as 'coach' | 'client',
        firstName,
        lastName
      );

      // Handle error cases
      if (!result.success) {
        if (result.errorCode === 'LOCKED_MANUAL') {
          return res.status(409).json({ 
            message: result.error,
            errorCode: result.errorCode
          });
        }
        
        if (result.errorCode === 'LOCKED_DOWNGRADE') {
          return res.status(409).json({ 
            message: result.error,
            errorCode: result.errorCode
          });
        }
        
        if (result.errorCode === 'SWAP_LIMIT') {
          return res.status(422).json({ 
            message: result.error,
            errorCode: result.errorCode
          });
        }
        
        // Generic error handling
        return res.status(400).json({ 
          message: result.error || 'Failed to add member',
          errorCode: result.errorCode
        });
      }

      const orgUser = result.user!;

      // Send invitation email with login credentials
      try {
        const { sendOrgInvitationEmail } = await import('./email');
        
        await sendOrgInvitationEmail({
          to: email,
          firstName: firstName || email.split('@')[0],
          organizationName: org.name,
          role: role as 'coach' | 'client',
          loginEmail: email,
          commonPassword: commonPassword,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }

      res.json({
        success: true,
        message: `${role === 'coach' ? 'Coach' : 'Client'} added successfully. Invitation email sent with login credentials.`,
        member: orgUser,
      });
    } catch (error) {
      console.error('Error adding org member:', error);
      res.status(500).json({ message: "Failed to add organization member" });
    }
  });

  // 6. GET /api/organizations/:orgId/coaches - List coaches
  app.get('/api/organizations/:orgId/coaches', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const coaches = await storage.getOrgUsers(orgId, 'coach');
      
      res.json({
        success: true,
        coaches: coaches || [],
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coaches" });
    }
  });

  // 7. DELETE /api/organizations/:orgId/members/:memberId - Remove organization member
  app.delete('/api/organizations/:orgId/members/:memberId', requireOrgActiveSubscription, requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const memberId = parseInt(req.params.memberId);
      
      // Check if the member is active - only allow deleting locked members
      const member = await storage.getOrgUser(memberId);
      if (member && (member.status === 'active' || member.status === null)) {
        return res.status(400).json({ 
          message: "Cannot delete active members. Please swap them out first, then delete the locked member." 
        });
      }
      
      await storage.removeOrgUser(memberId);
      
      res.json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // 7a. GET /api/organizations/:orgId/members/activation-summary - Get activation summary (owner only)
  app.get('/api/organizations/:orgId/members/activation-summary', requireOrgActiveSubscription, requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);

      // Enforce capacity limits before returning data (catches manual DB changes)
      await storage.enforceCapacityLimits(orgId);

      // Get billing status to determine quotas
      const billingStatus = await getOrgBillingStatus(orgId);
      const billingPeriod = await storage.getActiveBillingPeriod(orgId);
      
      // Get all org members
      const allMembers = await storage.getOrgUsers(orgId);
      
      // Separate into coaches and clients with status
      const coaches = allMembers.filter(m => m.role === 'coach');
      const clients = allMembers.filter(m => m.role === 'client');
      
      // Count active members
      const activeCoaches = coaches.filter(m => (m.status || 'active') === 'active').length;
      const activeClients = clients.filter(m => (m.status || 'active') === 'active').length;
      
      // Calculate swap budget usage and cooldown status
      const now = new Date();
      
      // Determine swap budget based on tier: FREE=2, BASIC=4, PRO=6
      const getTierSwapBudget = (tier: string): number => {
        if (tier === 'basic') return 4;
        if (tier === 'pro') return 6;
        return 2; // FREE tier defaults to 2
      };
      
      const swapBudgetStatus = billingPeriod ? {
        coaches: {
          total: getTierSwapBudget(billingPeriod.tier),
          used: getTierSwapBudget(billingPeriod.tier) - billingPeriod.swapBudgetCoach,
          remaining: billingPeriod.swapBudgetCoach
        },
        clients: {
          total: getTierSwapBudget(billingPeriod.tier),
          used: getTierSwapBudget(billingPeriod.tier) - billingPeriod.swapBudgetClient,
          remaining: billingPeriod.swapBudgetClient
        }
      } : null;

      const cooldownStatus = billingPeriod ? {
        coaches: billingPeriod.lastSwapTimestampCoach 
          ? (() => {
              const hoursSinceLastSwap = (now.getTime() - billingPeriod.lastSwapTimestampCoach!.getTime()) / (1000 * 60 * 60);
              const hoursRemaining = 48 - hoursSinceLastSwap;
              return {
                active: hoursRemaining > 0,
                hoursRemaining: hoursRemaining > 0 ? Math.ceil(hoursRemaining) : 0
              };
            })()
          : { active: false, hoursRemaining: 0 },
        clients: billingPeriod.lastSwapTimestampClient
          ? (() => {
              const hoursSinceLastSwap = (now.getTime() - billingPeriod.lastSwapTimestampClient!.getTime()) / (1000 * 60 * 60);
              const hoursRemaining = 48 - hoursSinceLastSwap;
              return {
                active: hoursRemaining > 0,
                hoursRemaining: hoursRemaining > 0 ? Math.ceil(hoursRemaining) : 0
              };
            })()
          : { active: false, hoursRemaining: 0 }
      } : null;
      
      // Get activation events for history (call once and filter by role)
      const allEvents = billingPeriod 
        ? await storage.getActivationEventsWithMemberInfo(orgId, billingPeriod.id)
        : [];
      
      // Separate events by role
      const coachEvents = allEvents.filter(e => e.memberRole === 'coach');
      const clientEvents = allEvents.filter(e => e.memberRole === 'client');

      res.json({
        success: true,
        quotas: {
          coaches: {
            active: activeCoaches,
            allowed: billingPeriod ? (billingPeriod.baseCoachAllowance + billingPeriod.addonCoachQty) : 0,
            total: coaches.length
          },
          clients: {
            active: activeClients,
            allowed: billingPeriod ? (billingPeriod.baseClientAllowance + billingPeriod.addonClientQty) : 0,
            total: clients.length
          }
        },
        members: {
          coaches: coaches.map(c => ({
            id: c.id,
            email: c.email,
            firstName: c.firstName,
            lastName: c.lastName,
            status: c.status || 'active',
            swappedInThisCycle: c.swappedInThisCycle || false, // Anti-exploitation: flag already-swapped members
            createdAt: c.createdAt
          })),
          clients: clients.map(c => ({
            id: c.id,
            email: c.email,
            firstName: c.firstName,
            lastName: c.lastName,
            status: c.status || 'active',
            swappedInThisCycle: c.swappedInThisCycle || false,
            createdAt: c.createdAt
          }))
        },
        swapBudget: swapBudgetStatus, // New: Track swap budget usage per role
        cooldownStatus: cooldownStatus, // New: Track 48hr cooldown status per role
        activationHistory: {
          coaches: coachEvents,
          clients: clientEvents
        },
        billingPeriod: billingPeriod ? {
          id: billingPeriod.id,
          tier: billingPeriod.tier,
          startsAt: billingPeriod.currentPeriodStartsAt,
          endsAt: billingPeriod.currentPeriodEndsAt
        } : null
      });
    } catch (error) {
      console.error('Error fetching activation summary:', error);
      res.status(500).json({ message: "Failed to fetch activation summary" });
    }
  });

  // 7b. POST /api/organizations/:orgId/members/swap-activation - Swap member activation status (owner only)
  app.post('/api/organizations/:orgId/members/swap-activation', requireOrgActiveSubscription, requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const { activateMemberId, deactivateMemberId } = req.body;

      if (!activateMemberId || !deactivateMemberId) {
        return res.status(400).json({ message: "Both activateMemberId and deactivateMemberId are required" });
      }

      const result = await storage.swapMemberActivation(
        orgId,
        parseInt(activateMemberId),
        parseInt(deactivateMemberId),
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Swap activation error:', error);
      res.status(500).json({ message: "Failed to swap member activation" });
    }
  });

  // 8. POST /api/organizations/:orgId/clients/add - Add client (coaches and owners only)
  app.post('/api/organizations/:orgId/clients/add', requireOrgActiveSubscription, requireCoachOrOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const { email, coachId } = req.body;
      
      if (req.orgRole === 'client') {
        return res.status(403).json({ message: "Clients cannot add other clients" });
      }

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check billing period client limit (default to FREE tier if no billing period)
      const billingPeriod = await storage.getActiveBillingPeriod(orgId);
      
      // Default to FREE tier limits if no billing period exists
      const defaultFreeClients = 5;
      
      const totalAllowedClients = billingPeriod 
        ? billingPeriod.baseClientAllowance + billingPeriod.addonClientQty
        : defaultFreeClients;
      
      const orgWithCounts = await storage.getOrganizationWithCounts(orgId);
      if (!orgWithCounts) {
        return res.status(500).json({ message: "Failed to fetch organization data" });
      }
      
      if (orgWithCounts.clientCount >= totalAllowedClients) {
        return res.status(400).json({ 
          message: `Maximum client limit (${totalAllowedClients}) reached. Upgrade your subscription or purchase additional client slots to add more.`,
          limitReached: true,
          currentCount: orgWithCounts.clientCount,
          maxAllowed: totalAllowedClients
        });
      }

      // Check if user exists
      let clientUser = await storage.getUserByEmail(email);
      if (!clientUser) {
        // Create user for client
        clientUser = await storage.upsertUser({
          id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email,
          userType: 'org_client',
          currentOrgId: orgId,
        });
      }

      // Add client to organization
      const client = await storage.addOrgClient({
        orgId,
        userId: clientUser.id,
        coachId: coachId || null,
        isActive: true,
      });

      res.json({
        success: true,
        message: "Client added successfully",
        client,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add client" });
    }
  });

  // 9. GET /api/organizations/:orgId/clients - List clients
  app.get('/api/organizations/:orgId/clients', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const clients = await storage.getOrgUsersWithMetrics(orgId, 'client');
      
      res.json({
        success: true,
        clients: clients || [],
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // 9a. GET /api/organizations/:orgId/users - Get all organization users (owner, coaches, clients)
  app.get('/api/organizations/:orgId/users', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get organization details to find the owner
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Get owner info
      const [ownerUser] = await db.select().from(users).where(eq(users.id, org.ownerId));
      
      // Get coaches
      const coaches = await storage.getOrgCoaches(orgId);
      
      // Get clients
      let clients = await storage.getOrgClients(orgId);
      
      // Filter based on user role
      if (req.userOrgRole === 'coach') {
        // Coaches can only see their assigned clients
        clients = clients.filter((client: any) => client.coachId === userId);
      } else if (req.userOrgRole === 'client') {
        // Clients can only see their assigned coach and owner
        clients = [];
      }
      
      // Build users array
      const orgUsers = [];
      
      // Add owner
      if (ownerUser) {
        orgUsers.push({
          id: ownerUser.id,
          name: `${ownerUser.firstName || ''} ${ownerUser.lastName || ''}`.trim() || ownerUser.email,
          email: ownerUser.email,
          userType: 'org_owner',
          avatar: ownerUser.profileImageUrl,
          isOnline: true, // You can implement real online status later
        });
      }
      
      // Add coaches (owner and client can see coaches, coaches see other coaches too)
      coaches.forEach((coach: any) => {
        if (req.userOrgRole !== 'client' || coach.userId === userId) {
          orgUsers.push({
            id: coach.user.id,
            name: `${coach.user.firstName || ''} ${coach.user.lastName || ''}`.trim() || coach.user.email,
            email: coach.user.email,
            userType: 'coach',
            avatar: coach.user.profileImageUrl,
            isOnline: false,
          });
        }
      });
      
      // Add clients (filtered based on role above)
      clients.forEach((client: any) => {
        orgUsers.push({
          id: client.user.id,
          name: `${client.user.firstName || ''} ${client.user.lastName || ''}`.trim() || client.user.email,
          email: client.user.email,
          userType: 'org_client',
          avatar: client.user.profileImageUrl,
          isOnline: false,
        });
      });
      
      // If client, add their assigned coach
      if (req.userOrgRole === 'client') {
        const clientData = await db.select().from(orgClients)
          .where(and(eq(orgClients.orgId, orgId), eq(orgClients.userId, userId)))
          .limit(1);
        
        if (clientData.length > 0 && clientData[0].coachId) {
          const [coachUser] = await db.select().from(users).where(eq(users.id, clientData[0].coachId));
          if (coachUser) {
            orgUsers.push({
              id: coachUser.id,
              name: `${coachUser.firstName || ''} ${coachUser.lastName || ''}`.trim() || coachUser.email,
              email: coachUser.email,
              userType: 'coach',
              avatar: coachUser.profileImageUrl,
              isOnline: false,
            });
          }
        }
      }
      
      res.json({
        success: true,
        users: orgUsers,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  // 10. PUT /api/organizations/:orgId/clients/:clientId/assign-coach - Assign coach (owner only)
  app.put('/api/organizations/:orgId/clients/:clientId/assign-coach', requireOrgActiveSubscription, requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const clientId = req.params.clientId;
      const { coachId } = req.body;
      
      if (req.orgRole === 'client') {
        return res.status(403).json({ message: "Clients cannot assign coaches" });
      }

      const updatedClient = await storage.assignClientCoach(orgId, clientId, coachId);
      
      res.json({
        success: true,
        message: "Coach assigned successfully",
        client: updatedClient,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign coach" });
    }
  });

  // 11. DELETE /api/organizations/:orgId/coaches/:coachId - Remove coach (owner only)
  app.delete('/api/organizations/:orgId/coaches/:coachId', requireOrgActiveSubscription, requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const coachId = req.params.coachId;
      
      if (req.orgRole === 'client') {
        return res.status(403).json({ message: "Clients cannot remove coaches" });
      }

      // Check if the coach is active - only allow deleting locked members
      const coach = await storage.getOrgUser(parseInt(coachId));
      if (coach && (coach.status === 'active' || coach.status === null)) {
        return res.status(400).json({ 
          message: "Cannot delete active members. Please swap them out first, then delete the locked member." 
        });
      }

      await storage.removeOrgCoach(orgId, coachId);
      
      res.json({
        success: true,
        message: "Coach removed successfully",
      });
    } catch (error: any) {
      console.error('Error removing coach:', error);
      res.status(500).json({ message: "Failed to remove coach", error: error.message });
    }
  });

  // 12. DELETE /api/organizations/:orgId/clients/:clientId - Remove client (owner only)
  app.delete('/api/organizations/:orgId/clients/:clientId', requireOrgActiveSubscription, requireOrgOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const clientId = req.params.clientId;
      
      if (req.orgRole === 'client') {
        return res.status(403).json({ message: "Clients cannot remove other clients" });
      }

      // Check if the client is active - only allow deleting locked members
      const client = await storage.getOrgUser(parseInt(clientId));
      if (client && (client.status === 'active' || client.status === null)) {
        return res.status(400).json({ 
          message: "Cannot delete active members. Please swap them out first, then delete the locked member." 
        });
      }

      await storage.removeOrgClient(orgId, clientId);
      
      res.json({
        success: true,
        message: "Client removed successfully",
      });
    } catch (error: any) {
      console.error('Error removing client:', error);
      res.status(500).json({ message: "Failed to remove client", error: error.message });
    }
  });

  // 12. POST /api/organizations/:orgId/meal-plans - Create meal plan (coaches and owners only)
  // Uses requireOrgPaidSubscription to block FREE tier/expired orgs from creating plans
  app.post('/api/organizations/:orgId/meal-plans', requireOrgPaidSubscription, requireCoachOrOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      
      if (req.orgRole === 'client') {
        return res.status(403).json({ message: "Clients cannot create meal plans" });
      }

      const validation = insertOrgMealPlanSchema.safeParse({
        ...req.body,
        orgId,
        createdBy: userId,
      });

      if (!validation.success) {
        console.error('Meal plan validation error:', validation.error.errors);
        return res.status(400).json({ message: "Invalid input", errors: validation.error.errors });
      }

      const mealPlan = await storage.createOrgMealPlan(validation.data);
      
      res.json({
        success: true,
        mealPlan,
      });
    } catch (error: any) {
      console.error('Error creating org meal plan:', error);
      res.status(500).json({ message: "Failed to create meal plan", error: error.message });
    }
  });

  // Org member set personal password endpoint
  app.post('/api/org-member/set-password', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.authProvider !== 'org_member') {
        return res.status(403).json({ error: "Only organization members can set personal passwords" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const { db } = await import("./db");
      const { orgUsers, organizations } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Get org member
      const orgMember = await db.query.orgUsers.findFirst({
        where: eq(orgUsers.id, parseInt(req.user.id))
      });

      if (!orgMember) {
        return res.status(404).json({ error: "Organization member not found" });
      }

      // Get organization for common password
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgMember.organizationId)
      });

      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Verify current password (personal OR org common)
      let isValid = false;
      
      if (orgMember.password) {
        isValid = await bcrypt.compare(currentPassword, orgMember.password);
      }
      
      if (!isValid && org.commonPassword) {
        isValid = await bcrypt.compare(currentPassword, org.commonPassword);
      }

      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update org member with personal password
      await db.update(orgUsers)
        .set({ password: hashedPassword })
        .where(eq(orgUsers.id, parseInt(req.user.id)));

      // Update session to reflect password change
      req.user.hasPersonalPassword = true;

      res.json({ 
        success: true,
        message: "Password updated successfully" 
      });
    } catch (error) {
      console.error("Set password error:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // 13. POST /api/organizations/:orgId/workout-plans - Create workout plan (coaches and owners only)
  // Uses requireOrgPaidSubscription to block FREE tier/expired orgs from creating plans
  app.post('/api/organizations/:orgId/workout-plans', requireOrgPaidSubscription, requireCoachOrOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      
      if (req.orgRole === 'client') {
        return res.status(403).json({ message: "Clients cannot create workout plans" });
      }

      const validation = insertOrgWorkoutPlanSchema.safeParse({
        ...req.body,
        orgId,
        createdBy: userId,
      });

      if (!validation.success) {
        console.error('Workout plan validation error:', validation.error.errors);
        return res.status(400).json({ message: "Invalid input", errors: validation.error.errors });
      }

      const workoutPlan = await storage.createOrgWorkoutPlan(validation.data);
      
      res.json({
        success: true,
        workoutPlan,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create workout plan" });
    }
  });

  // 14. GET /api/organizations/:orgId/plans - List all plans
  app.get('/api/organizations/:orgId/plans', requireOrgActiveSubscription, requireOrgMembership, checkOrgMemberAccess, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      
      const [mealPlans, workoutPlans] = await Promise.all([
        storage.getOrgMealPlansWithCounts(orgId),
        storage.getOrgWorkoutPlansWithCounts(orgId)
      ]);
      
      res.json({
        success: true,
        mealPlans: mealPlans || [],
        workoutPlans: workoutPlans || [],
        totalPlans: (mealPlans?.length || 0) + (workoutPlans?.length || 0),
      });
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ message: "Failed to fetch plans", error: error.message });
    }
  });

  // 15. POST /api/organizations/:orgId/plans/assign - Assign plan to clients (coaches and owners only)
  // Uses requireOrgPaidSubscription to block FREE tier/expired orgs from assigning plans
  app.post('/api/organizations/:orgId/plans/assign', requireOrgPaidSubscription, requireCoachOrOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      const { planId, planType, clientIds, startsAt, endsAt, dayMapping } = req.body;
      
      console.log('[PLAN ASSIGN] Request:', { orgId, userId, planId, planType, clientIds, startsAt, dayMapping });
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!planId || !planType || !clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
        return res.status(400).json({ 
          message: "planId, planType, and clientIds array are required" 
        });
      }

      if (!['meal', 'workout'].includes(planType)) {
        return res.status(400).json({ message: "planType must be 'meal' or 'workout'" });
      }

      // For coaches, validate they can only assign plans to clients in their org
      if (req.userOrgRole === 'coach') {
        // For org_users system, get all clients in the organization
        const orgUsers = await storage.getOrgUsers(orgId);
        const orgClientIds = orgUsers
          .filter(u => u.role === 'client')
          .map(u => String(u.id)); // Convert to string for comparison
        
        // Check legacy org_clients table as well
        const legacyClients = await storage.getOrgClients(orgId);
        const legacyClientIds = legacyClients.map(c => c.userId); // Already strings (UUIDs)
        
        const allValidClientIds = [...orgClientIds, ...legacyClientIds];
        
        // Check if all requested clients are in this organization
        // clientIds come from frontend as strings (either "1", "2" or UUID strings)
        const unauthorizedClients = clientIds.filter(id => !allValidClientIds.includes(String(id)));
        if (unauthorizedClients.length > 0) {
          return res.status(403).json({ 
            message: "You can only assign plans to clients in your organization",
            unauthorizedClients 
          });
        }
      }
      // Owners can assign to any client (no validation needed)

      // Log which plan is being assigned
      if (planType === 'meal') {
        const [plan] = await db.select().from(orgMealPlans).where(eq(orgMealPlans.id, parseInt(planId))).limit(1);
        console.log('[PLAN ASSIGN] Meal plan being assigned:', { id: plan?.id, name: plan?.name });
      } else {
        const [plan] = await db.select().from(orgWorkoutPlans).where(eq(orgWorkoutPlans.id, parseInt(planId))).limit(1);
        console.log('[PLAN ASSIGN] Workout plan being assigned:', { id: plan?.id, name: plan?.name });
      }

      // UPSERT logic: Delete any existing assignments, then create new one (prevents duplicates)
      const results = [];
      
      for (const clientId of clientIds) {
        // Delete ALL existing assignments for this client + plan + type (cleans up any duplicates)
        const deleted = await db
          .delete(planAssignments)
          .where(
            and(
              eq(planAssignments.clientId, clientId),
              eq(planAssignments.planId, parseInt(planId)),
              eq(planAssignments.planType, planType as 'meal' | 'workout')
            )
          )
          .returning();
        
        if (deleted.length > 0) {
          console.log(`[PLAN ASSIGN] Deleted ${deleted.length} existing assignment(s) for cleanup`);
        }
        
        // CREATE new assignment (always fresh, no duplicates possible)
        const [created] = await db
          .insert(planAssignments)
          .values({
            planId: parseInt(planId),
            planType: planType as 'meal' | 'workout',
            clientId,
            assignedBy: userId,
            startsAt: new Date(startsAt || Date.now()),
            endsAt: endsAt ? new Date(endsAt) : null,
            isActive: true,
            dayMapping: dayMapping || null,
          })
          .returning();
        
        console.log('[PLAN ASSIGN] Created new assignment:', created);
        results.push(created);
      }
      
      res.json({
        success: true,
        message: `Plan assigned to ${clientIds.length} client(s)`,
        assignments: results,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign plans" });
    }
  });

  // PATCH /api/organizations/plan-assignments/:assignmentId/day-mapping - Update day mapping for an assignment
  app.patch('/api/organizations/plan-assignments/:assignmentId/day-mapping', requireCoachOrOwner, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const { dayMapping } = req.body;
      
      if (!dayMapping) {
        return res.status(400).json({ message: "dayMapping is required" });
      }
      
      // Update the assignment's day mapping
      const [updated] = await db
        .update(planAssignments)
        .set({ dayMapping })
        .where(eq(planAssignments.id, assignmentId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.json({
        success: true,
        message: "Day mapping updated successfully",
        assignment: updated
      });
    } catch (error: any) {
      console.error('Error updating day mapping:', error);
      res.status(500).json({ message: "Failed to update day mapping", error: error.message });
    }
  });

  // DELETE /api/organizations/:orgId/plans/:planId - Delete a plan (creator or org owner only)
  app.delete('/api/organizations/:orgId/plans/:planId', requireOrgActiveSubscription, requireCoachOrOwner, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      const userType = (req.user as any)?.userType;
      
      if (!planId || isNaN(planId)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      // Determine if this is a meal plan or workout plan
      const [mealPlan] = await db.select().from(orgMealPlans)
        .where(and(eq(orgMealPlans.id, planId), eq(orgMealPlans.orgId, orgId)))
        .limit(1);
      
      const [workoutPlan] = await db.select().from(orgWorkoutPlans)
        .where(and(eq(orgWorkoutPlans.id, planId), eq(orgWorkoutPlans.orgId, orgId)))
        .limit(1);

      const plan = mealPlan || workoutPlan;
      
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Check ownership: only creator or org owner can delete
      const isOrgOwner = userType === 'org_owner';
      const isCreator = plan.createdBy === userId;
      
      if (!isOrgOwner && !isCreator) {
        return res.status(403).json({ 
          message: "Only the plan creator or organization owner can delete this plan" 
        });
      }

      if (mealPlan) {
        await storage.deleteOrgMealPlan(planId);
      } else if (workoutPlan) {
        await storage.deleteOrgWorkoutPlan(planId);
      }

      res.json({
        success: true,
        message: "Plan deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  // PATCH /api/organizations/:orgId/plan-assignments/:assignmentId/day-mapping - Update day mapping for an assignment
  app.patch('/api/organizations/:orgId/plan-assignments/:assignmentId/day-mapping', requireOrgActiveSubscription, requireCoachOrOwner, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const orgId = parseInt(req.params.orgId);
      const { dayMapping } = req.body;
      
      if (!assignmentId || isNaN(assignmentId)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }

      if (!dayMapping || typeof dayMapping !== 'object') {
        return res.status(400).json({ message: "dayMapping object is required" });
      }

      // Update only the dayMapping field
      await db
        .update(planAssignments)
        .set({ dayMapping: dayMapping })
        .where(eq(planAssignments.id, assignmentId));

      res.json({
        success: true,
        message: "Day mapping updated successfully"
      });
    } catch (error) {
      console.error('Error updating day mapping:', error);
      res.status(500).json({ message: "Failed to update day mapping" });
    }
  });

  // GET /api/organizations/:orgId/plan-assignments - Get all plan assignments for an organization
  app.get('/api/organizations/:orgId/plan-assignments', requireOrgActiveSubscription, requireCoachOrOwner, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      
      // Get all org clients
      const orgUsers = await storage.getOrgUsers(orgId);
      const clientIds = orgUsers.filter(u => u.role === 'client').map(u => String(u.id));
      
      if (clientIds.length === 0) {
        return res.json([]);
      }

      // Get all active plan assignments for these clients
      const assignments = await db
        .select()
        .from(planAssignments)
        .where(
          and(
            inArray(planAssignments.clientId, clientIds),
            eq(planAssignments.isActive, true)
          )
        )
        .orderBy(desc(planAssignments.assignedAt));

      // Enrich with plan and client details
      const enrichedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const client = orgUsers.find(u => String(u.id) === assignment.clientId);
          const clientName = client 
            ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email
            : 'Unknown Client';

          let planName = 'Unknown Plan';
          if (assignment.planType === 'meal') {
            const [plan] = await db
              .select()
              .from(orgMealPlans)
              .where(eq(orgMealPlans.id, assignment.planId))
              .limit(1);
            planName = plan?.name || 'Unknown Plan';
          } else {
            const [plan] = await db
              .select()
              .from(orgWorkoutPlans)
              .where(eq(orgWorkoutPlans.id, assignment.planId))
              .limit(1);
            planName = plan?.name || 'Unknown Plan';
          }

          return {
            ...assignment,
            clientName,
            planName
          };
        })
      );

      res.json(enrichedAssignments);
    } catch (error) {
      console.error('Error fetching plan assignments:', error);
      res.status(500).json({ message: "Failed to fetch plan assignments" });
    }
  });

  // 16. GET /api/organizations/:orgId/clients/:clientId/plans - Get client's plans
  app.get('/api/organizations/:orgId/clients/:clientId/plans', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const clientId = req.params.clientId;
      const plans = await storage.getClientPlanAssignments(clientId);
      
      res.json({
        success: true,
        plans,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client plans" });
    }
  });

  // 17. POST /api/organizations/:orgId/messages - Send community message (all org members)
  app.post('/api/organizations/:orgId/messages', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      const { content, attachments } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Determine sender type: org_members (coaches and org clients) vs users (owners)
      const senderType = (req.userOrgRole === 'coach' || req.userOrgRole === 'client') ? 'org_member' : 'user';
      
      const message = await storage.createOrgMessage({
        orgId,
        senderId: userId,
        senderType,
        recipientId: null, // Always null for community messages
        recipientType: null,
        messageType: 'community',
        content,
        attachments: attachments || null,
        isRead: false,
      });
      
      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error('[MESSAGE ERROR]', error);
      res.status(500).json({ message: "Failed to send message", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 18. GET /api/organizations/:orgId/messages - Get community messages
  app.get('/api/organizations/:orgId/messages', requireOrgActiveSubscription, requireOrgMembership, checkOrgMemberAccess, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      const { limit = 50, offset = 0 } = req.query;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only fetch community messages
      const filters: any = {
        messageType: 'community',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const messages = await storage.getOrgMessages(orgId, filters);
      
      res.json({
        success: true,
        messages,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // 19. POST /api/organizations/:orgId/messages/dm - Send direct message
  app.post('/api/organizations/:orgId/messages/dm', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      const { recipientId, recipientType, content, attachments } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!content || !recipientId || !recipientType) {
        return res.status(400).json({ message: "Recipient and content are required" });
      }
      
      // Determine sender type
      const senderType = (req.userOrgRole === 'coach' || req.userOrgRole === 'client') ? 'org_member' : 'user';
      
      const message = await storage.createOrgMessage({
        orgId,
        senderId: userId,
        senderType,
        recipientId,
        recipientType,
        messageType: 'dm',
        content,
        attachments: attachments || null,
        isRead: false,
      });
      
      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error('[DM ERROR]', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // 20. GET /api/organizations/:orgId/messages/dm - Get DM conversations list
  app.get('/api/organizations/:orgId/messages/dm', requireOrgActiveSubscription, requireOrgMembership, checkOrgMemberAccess, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Determine user type
      const userType = (req.userOrgRole === 'coach' || req.userOrgRole === 'client') ? 'org_member' : 'user';
      
      const conversations = await storage.getDirectMessageConversations(orgId, userId, userType);
      
      res.json({
        success: true,
        conversations,
      });
    } catch (error) {
      console.error('[DM CONVERSATIONS ERROR]', error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // 21. GET /api/organizations/:orgId/messages/dm/:participantId - Get DM thread with specific participant
  app.get('/api/organizations/:orgId/messages/dm/:participantId', requireOrgActiveSubscription, requireOrgMembership, checkOrgMemberAccess, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const userId = getUserId(req);
      const participantId = req.params.participantId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Determine user type
      const userType = (req.userOrgRole === 'coach' || req.userOrgRole === 'client') ? 'org_member' : 'user';
      
      const messages = await storage.getDirectMessageThread(orgId, userId, participantId, userType);
      
      res.json({
        success: true,
        messages,
      });
    } catch (error) {
      console.error('[DM THREAD ERROR]', error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // 22. PATCH /api/organizations/:orgId/messages/read - Mark messages as read
  app.patch('/api/organizations/:orgId/messages/read', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const { messageIds } = req.body;
      
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ message: "Message IDs are required" });
      }
      
      await storage.markMessagesAsRead(messageIds);
      
      res.json({
        success: true,
      });
    } catch (error) {
      console.error('[MARK READ ERROR]', error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // 23. GET /api/organizations/:orgId/members - Get all organization members
  app.get('/api/organizations/:orgId/members', requireOrgActiveSubscription, requireOrgMembership, async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      
      const members = await storage.getOrganizationMembers(orgId);
      
      res.json({
        success: true,
        members,
      });
    } catch (error) {
      console.error('[GET MEMBERS ERROR]', error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // 24. GET /api/organizations/:orgId/client-info/:userId - Get client's organization info
  app.get('/api/organizations/:orgId/client-info/:userId', requireOrgActiveSubscription, requireAuth, async (req: any, res) => {
    try {
      const orgUserId = parseInt(req.params.userId);
      const requestingUserId = getUserId(req);
      const orgUser = await storage.getOrgUser(orgUserId);
      
      if (!orgUser) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Authorization: Only the client themselves, their coach, or org owner can access this
      if (requestingUserId !== orgUserId.toString()) {
        const requestingOrgUser = await storage.getOrgUserByEmail(req.user?.email);
        const isCoach = requestingOrgUser?.role === 'coach' && requestingOrgUser.organizationId === orgUser.organizationId;
        const org = await storage.getOrganization(orgUser.organizationId);
        const isOwner = org?.ownerId === requestingUserId;
        
        if (!isCoach && !isOwner) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const org = await storage.getOrganization(orgUser.organizationId);
      
      // Note: org_users don't have coachId field - that's in legacy org_clients table
      const response: any = {
        organizationId: org?.id,
        organizationName: org?.name,
        organizationLogo: org?.logoUrl,
        ownerId: org?.ownerId,
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Error fetching client info:', error);
      res.status(500).json({ message: "Failed to fetch client info", error: error.message });
    }
  });

  // 20. GET /api/organizations/:orgId/assigned-meal-plan/:userId - Get client's assigned meal plan
  app.get('/api/organizations/:orgId/assigned-meal-plan/:userId', requireOrgActiveSubscription, requireAuth, async (req: any, res) => {
    try {
      const orgUserId = parseInt(req.params.userId);
      const requestingUserId = getUserId(req);
      const orgUser = await storage.getOrgUser(orgUserId);
      
      if (!orgUser) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Authorization: Only the client themselves, their coach, or org owner can access this
      if (requestingUserId !== orgUserId.toString()) {
        const requestingOrgUser = await storage.getOrgUserByEmail(req.user?.email);
        const isCoach = requestingOrgUser?.role === 'coach' && requestingOrgUser.organizationId === orgUser.organizationId;
        const org = await storage.getOrganization(orgUser.organizationId);
        const isOwner = org?.ownerId === requestingUserId;
        
        if (!isCoach && !isOwner) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      // Get active meal plan assignment
      // Note: planAssignments.clientId is varchar, orgUser.id is integer
      const assignments = await db
        .select()
        .from(planAssignments)
        .where(
          and(
            eq(planAssignments.clientId, String(orgUser.id)),
            eq(planAssignments.planType, 'meal'),
            eq(planAssignments.isActive, true)
          )
        )
        .limit(1);
      
      if (assignments.length === 0) {
        return res.json({});
      }
      
      const assignment = assignments[0];
      
      // Get the meal plan directly from database
      const [plan] = await db
        .select()
        .from(orgMealPlans)
        .where(eq(orgMealPlans.id, assignment.planId))
        .limit(1);
      
      if (!plan) {
        return res.json({});
      }
      
      // Get assigner info
      let assignedBy = 'Unknown';
      if (assignment.assignedBy) {
        // assignedBy might be org_user.id (integer as string)
        const assignerOrgUser = await storage.getOrgUser(parseInt(assignment.assignedBy));
        if (assignerOrgUser) {
          assignedBy = `${assignerOrgUser.firstName} ${assignerOrgUser.lastName}`;
        }
      }
      
      // Transform planData to add day names to each day object
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      let transformedPlanData: any = plan.planData;
      if (transformedPlanData && Array.isArray(transformedPlanData)) {
        transformedPlanData = transformedPlanData.map((day: any, index: number) => ({
          ...day,
          day: dayNames[index % 7]
        }));
      } else if (transformedPlanData && typeof transformedPlanData === 'object' && (transformedPlanData as any).days && Array.isArray((transformedPlanData as any).days)) {
        transformedPlanData = {
          ...transformedPlanData,
          days: (transformedPlanData as any).days.map((day: any, index: number) => ({
            ...day,
            day: dayNames[index % 7]
          }))
        };
      }
      
      res.json({
        name: plan.name,
        assignedBy,
        weekNumber: plan.weekNumber,
        planData: transformedPlanData,
        dayMapping: assignment.dayMapping || null
      });
    } catch (error: any) {
      console.error('Error fetching assigned meal plan:', error);
      res.status(500).json({ message: "Failed to fetch assigned meal plan", error: error.message });
    }
  });

  // 21. GET /api/organizations/:orgId/assigned-workout-plan/:userId - Get client's assigned workout plan
  app.get('/api/organizations/:orgId/assigned-workout-plan/:userId', requireOrgActiveSubscription, requireAuth, async (req: any, res) => {
    try {
      const orgUserId = parseInt(req.params.userId);
      const requestingUserId = getUserId(req);
      const orgUser = await storage.getOrgUser(orgUserId);
      
      if (!orgUser) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Authorization: Only the client themselves, their coach, or org owner can access this
      if (requestingUserId !== orgUserId.toString()) {
        const requestingOrgUser = await storage.getOrgUserByEmail(req.user?.email);
        const isCoach = requestingOrgUser?.role === 'coach' && requestingOrgUser.organizationId === orgUser.organizationId;
        const org = await storage.getOrganization(orgUser.organizationId);
        const isOwner = org?.ownerId === requestingUserId;
        
        if (!isCoach && !isOwner) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      // Get active workout plan assignment
      // Note: planAssignments.clientId is varchar, orgUser.id is integer
      const assignments = await db
        .select()
        .from(planAssignments)
        .where(
          and(
            eq(planAssignments.clientId, String(orgUser.id)),
            eq(planAssignments.planType, 'workout'),
            eq(planAssignments.isActive, true)
          )
        )
        .limit(1);
      
      if (assignments.length === 0) {
        return res.json({});
      }
      
      const assignment = assignments[0];
      
      // Get the workout plan directly from database
      const [plan] = await db
        .select()
        .from(orgWorkoutPlans)
        .where(eq(orgWorkoutPlans.id, assignment.planId))
        .limit(1);
      
      if (!plan) {
        return res.json({});
      }
      
      // Get assigner info
      let assignedBy = 'Unknown';
      if (assignment.assignedBy) {
        // assignedBy might be org_user.id (integer as string)
        const assignerOrgUser = await storage.getOrgUser(parseInt(assignment.assignedBy));
        if (assignerOrgUser) {
          assignedBy = `${assignerOrgUser.firstName} ${assignerOrgUser.lastName}`;
        }
      }
      
      // Transform planData to convert numeric fields to strings for frontend display
      let transformedPlanData: any = plan.planData;
      if (transformedPlanData && typeof transformedPlanData === 'object') {
        if (Array.isArray(transformedPlanData)) {
          // If planData is an array of days
          transformedPlanData = transformedPlanData.map((day: any) => {
            if (day.exercises && Array.isArray(day.exercises)) {
              return {
                ...day,
                exercises: day.exercises.map((exercise: any) => ({
                  ...exercise,
                  sets: exercise.sets !== undefined ? String(exercise.sets) : exercise.sets,
                  reps: exercise.reps !== undefined ? String(exercise.reps) : exercise.reps,
                  rest: exercise.rest !== undefined ? String(exercise.rest) : exercise.rest
                }))
              };
            }
            return day;
          });
        } else if ((transformedPlanData as any).days && Array.isArray((transformedPlanData as any).days)) {
          // If planData has a days property
          transformedPlanData = {
            ...transformedPlanData,
            days: (transformedPlanData as any).days.map((day: any) => {
              if (day.exercises && Array.isArray(day.exercises)) {
                return {
                  ...day,
                  exercises: day.exercises.map((exercise: any) => ({
                    ...exercise,
                    sets: exercise.sets !== undefined ? String(exercise.sets) : exercise.sets,
                    reps: exercise.reps !== undefined ? String(exercise.reps) : exercise.reps,
                    rest: exercise.rest !== undefined ? String(exercise.rest) : exercise.rest
                  }))
                };
              }
              return day;
            })
          };
        }
      }
      
      res.json({
        name: plan.name,
        assignedBy,
        weekNumber: plan.weekNumber,
        planData: transformedPlanData,
        dayMapping: assignment.dayMapping || null
      });
    } catch (error: any) {
      console.error('Error fetching assigned workout plan:', error);
      res.status(500).json({ message: "Failed to fetch assigned workout plan", error: error.message });
    }
  });

  // 22. GET /api/user/dashboard-type - Get user's dashboard type
  app.get('/api/user/dashboard-type', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        success: true,
        userType: user.userType,
        currentOrgId: user.currentOrgId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard type" });
    }
  });

  // 20. POST /api/user/switch-mode - Switch between individual and org mode
  app.post('/api/user/switch-mode', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { mode, orgId } = req.body;
      
      if (!mode || !['individual', 'organization'].includes(mode)) {
        return res.status(400).json({ 
          message: "Mode must be 'individual' or 'organization'" 
        });
      }

      const updates: any = {};
      
      if (mode === 'individual') {
        updates.currentOrgId = null;
      } else if (mode === 'organization') {
        if (!orgId) {
          return res.status(400).json({ 
            message: "Organization ID required when switching to organization mode" 
          });
        }
        
        // Verify user has access to this organization
        const org = await storage.getOrganization(orgId);
        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }
        
        // Check if user is member of organization
        const isOwner = org.ownerId === userId;
        const coaches = await storage.getOrgCoaches(orgId);
        const isCoach = coaches.some(c => c.userId === userId && c.isActive);
        const clients = await storage.getOrgClients(orgId);
        const isClient = clients.some(c => c.userId === userId && c.isActive);
        
        if (!isOwner && !isCoach && !isClient) {
          return res.status(403).json({ 
            message: "You are not a member of this organization" 
          });
        }
        
        updates.currentOrgId = orgId;
      }

      const updatedUser = await storage.updateUserOrgSettings(userId, updates);
      
      res.json({
        success: true,
        message: `Switched to ${mode} mode`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          userType: updatedUser.userType,
          currentOrgId: updatedUser.currentOrgId,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to switch mode" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
