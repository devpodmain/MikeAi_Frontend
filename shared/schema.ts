import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
  integer,
  boolean,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { 
    enum: ["individual", "org_owner", "coach", "org_client"] 
  }).default("individual"),
  currentOrgId: integer("current_org_id"), // References organizations.id
  password: varchar("password"), // For email/password auth
  authProvider: varchar("auth_provider", { enum: ["replit", "google", "email", "mock"] }).default("replit"),
  googleId: varchar("google_id"),
  // Subscription fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status", { 
    enum: ["trial", "active", "canceled", "past_due", "unpaid", "incomplete"] 
  }).default("trial"),
  subscriptionTier: varchar("subscription_tier", { 
    enum: ["free", "plus", "pro"] 
  }).default("free"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workout Plans
export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  goal: varchar("goal", { enum: ["hypertrophy", "strength", "fat_loss", "general_fitness"] }).notNull(),
  weeks: integer("weeks").default(8),
  daysPerWeek: integer("days_per_week").notNull(),
  split: varchar("split").notNull(),
  planData: jsonb("plan_data").notNull(), // Full workout plan with exercises and video URLs
  progressionNotes: text("progression_notes"),
  warmupNotes: text("warmup_notes"),
  deloadNotes: text("deload_notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comprehensive user profiles with health and dietary information
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Personal Info
  fullName: varchar("full_name"),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { enum: ["male", "female", "other"] }),
  
  // Physical Metrics
  height: decimal("height"), // in cm
  weight: decimal("weight"), // in kg
  activityLevel: varchar("activity_level", { enum: ["sedentary", "lightly_active", "active", "very_active"] }),
  trainingAgeMonths: integer("training_age_months"), // months of consistent training experience
  
  // Goals
  fitnessGoal: varchar("fitness_goal", { enum: ["lose_weight", "maintain", "build_muscle"] }),
  targetWeight: decimal("target_weight"),
  dailyCalorieGoal: integer("daily_calorie_goal"),
  
  // Dietary Preferences
  dietType: varchar("diet_type", { enum: ["none", "vegetarian", "vegan", "keto", "paleo", "mediterranean"] }),
  allergies: text("allergies").array(), // ["dairy", "gluten", "peanuts", "shellfish", "eggs"]
  dislikedFoods: text("disliked_foods"),
  preferredCuisines: text("preferred_cuisines").array(), // ["indian", "italian", "chinese", "mexican", "japanese"]
  mealsPerDay: varchar("meals_per_day", { enum: ["3_meals", "3_meals_2_snacks"] }),
  intermittentFasting: boolean("intermittent_fasting").default(false),
  
  // Meal Timing (REMOVED: cooking difficulty, max cooking time, kitchen equipment)
  breakfastTime: varchar("breakfast_time"), // time input "08:00"
  lunchTime: varchar("lunch_time"), // time input "12:00"
  dinnerTime: varchar("dinner_time"), // time input "18:00"
  
  // Wellness & Lifestyle
  chronicConditions: text("chronic_conditions").array(), // ["diabetes", "pcos", "hypertension", "none"]
  supplementsTaken: text("supplements_taken"),
  stressLevel: varchar("stress_level", { enum: ["low", "medium", "high"] }),
  sleepDuration: decimal("sleep_duration"), // hours per night
  waterIntakeGoal: decimal("water_intake_goal"), // liters
  
  // Legacy fields for compatibility (keeping for existing data)
  age: integer("age"),
  goal: varchar("goal"),
  dietaryPreferences: text("dietary_preferences").array(),
  allergens: text("allergens"), // JSON string format for legacy compatibility
  culturalPreferences: text("cultural_preferences"), // JSON string format for legacy compatibility
  targetCalories: integer("target_calories"),
  targetProtein: integer("target_protein"),
  targetCarbs: integer("target_carbs"),
  targetFats: integer("target_fats"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User preferences for customizable features
// Note: userId can be either users.id OR org_users.id (no foreign key constraint)
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  
  // Water tracking customization
  // Note: Glass size is FIXED at 250ml (not customizable)
  // Only daily goal (number of glasses) is customizable
  waterDailyGoalGlasses: integer("water_daily_goal_glasses").default(8),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coach verification records
export const coachVerifications = pgTable("coach_verifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  coachCategory: varchar("coach_category", { enum: ["highly_qualified", "moderate"] }).notNull(),
  
  // Required for all categories
  certification: text("certification").notNull(),
  certificationFile: varchar("certification_file"),
  
  // Required for highly qualified coaches
  yearsOfExperience: integer("years_of_experience"),
  communicationMode: varchar("communication_mode", { enum: ["online", "offline", "both"] }),
  testimonials: text("testimonials"),
  
  // Optional fields
  specializations: text("specializations").array(),
  portfolio: varchar("portfolio"),
  linkedinProfile: varchar("linkedin_profile"),
  
  // Verification status and results
  verificationStatus: varchar("verification_status", { 
    enum: ["pending", "approved", "conditional", "rejected"] 
  }).default("pending"),
  validationReport: jsonb("validation_report"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coach profiles with professional information
export const coachProfiles = pgTable("coach_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  verificationId: integer("verification_id").references(() => coachVerifications.id),
  profileType: varchar("profile_type", { enum: ["individual", "organization"] }).notNull(),
  phoneNumber: varchar("phone_number"),
  yearsOfExperience: integer("years_of_experience"),
  specializations: text("specializations").array(), // ["weight_loss", "strength_training", "yoga", etc.]
  address: text("address"),
  profileBio: text("profile_bio"),
  certifications: text("certifications").array(), // File paths or certification details
  availability: jsonb("availability"), // Schedule/availability data
  languagesSpoken: text("languages_spoken").array(),
  trainingStyle: varchar("training_style", { 
    enum: ["one-on-one", "group", "online", "hybrid", "bootcamp", "personalized"] 
  }),
  hourlyRate: decimal("hourly_rate"), // Optional pricing
  servicesOffered: text("services_offered").array(),
  qualifications: text("qualifications").array(),
  businessLicense: varchar("business_license"), // For organizations
  organizationName: varchar("organization_name"), // For organizations
  teamSize: integer("team_size"), // For organizations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recipes table
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  cuisine: varchar("cuisine").notNull(),
  mealType: varchar("meal_type", { enum: ["breakfast", "lunch", "dinner", "snack"] }).notNull(),
  cookingTime: integer("cooking_time"), // in minutes
  servings: integer("servings").default(1),
  calories: integer("calories"),
  protein: decimal("protein"),
  carbs: decimal("carbs"),
  fats: decimal("fats"),
  ingredients: jsonb("ingredients").notNull(), // Array of {name, amount, unit}
  instructions: text("instructions").array().notNull(),
  imageUrl: varchar("image_url"),
  tags: text("tags").array(),
  difficulty: varchar("difficulty", { enum: ["easy", "medium", "hard"] }).default("medium"),
  rating: decimal("rating").default("0"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meal plans
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalCalories: integer("total_calories"),
  planData: jsonb("plan_data"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meal plan items (recipes assigned to specific days and meals)
export const mealPlanItems = pgTable("meal_plan_items", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id).notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  day: integer("day").notNull(), // 1-7 for days of the week
  mealType: varchar("meal_type", { enum: ["breakfast", "lunch", "dinner", "snack"] }).notNull(),
  servings: integer("servings").default(1),
});

// Meal logging (what users actually ate)
// Note: userId can be either users.id OR org_users.id (no foreign key constraint)
// Note: mealType can be either legacy format ("breakfast", "lunch", etc.) or composite ("Snack 1|Snack")
export const mealLogs = pgTable("meal_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id),
  mealType: varchar("meal_type").notNull(), // Removed enum to support composite identifiers
  servings: integer("servings").default(1),
  logDate: date("log_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Habits tracking
// Note: userId can be either users.id OR org_users.id (no foreign key constraint)
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  targetFrequency: integer("target_frequency").default(1), // per day
  points: integer("points").default(10),
  category: varchar("category", { enum: ["nutrition", "hydration", "exercise", "sleep", "custom"] }).default("custom"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Habit logs
// Note: userId can be either users.id OR org_users.id (no foreign key constraint)
export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").references(() => habits.id).notNull(),
  userId: varchar("user_id").notNull(),
  logDate: date("log_date").notNull(),
  completed: boolean("completed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Water intake logs
// Note: userId can be either users.id OR org_users.id (no foreign key constraint)
export const waterLogs = pgTable("water_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  logDate: date("log_date").notNull(),
  glassesCount: integer("glasses_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coach-client relationships
export const coachClients = pgTable("coach_clients", {
  id: serial("id").primaryKey(),
  coachId: varchar("coach_id").references(() => users.id).notNull(),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  status: varchar("status", { enum: ["active", "inactive", "pending"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages between coaches and clients
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  subject: varchar("subject"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community posts
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  tags: text("tags").array(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  archivedAt: timestamp("archived_at"),
});

// Community post likes
export const communityPostLikes = pgTable("community_post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => communityPosts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community post comments (tree structure with nested replies)
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => communityPosts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentCommentId: integer("parent_comment_id"),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comment likes
export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => postComments.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workout and Exercise Tables
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  primaryMuscles: text("primary_muscles").array(), // ["chest", "triceps"]
  secondaryMuscles: text("secondary_muscles").array(), // ["shoulders"]
  equipment: varchar("equipment"), // "barbell", "dumbbell", "bodyweight", etc.
  difficulty: varchar("difficulty", { enum: ["beginner", "intermediate", "advanced"] }).default("intermediate"),
  instructions: text("instructions").array(),
  tips: text("tips"),
  imageUrl: varchar("image_url"),
  videoUrl: varchar("video_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  goal: varchar("goal", { enum: ["hypertrophy", "strength", "fat_loss", "general_fitness"] }).notNull(),
  weeks: integer("weeks").default(8),
  daysPerWeek: integer("days_per_week").notNull(),
  sessionMinutes: integer("session_minutes"), // Made optional (nullable)
  split: varchar("split").notNull(), // "push/pull/legs", "upper/lower", etc.
  equipment: text("equipment").array(), // Made optional (nullable) - ["barbell", "dumbbell", "machine"]
  injuries: text("injuries"),
  progressionNotes: text("progression_notes"),
  warmupNotes: text("warmup_notes"),
  deloadNotes: text("deload_notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workoutItems = pgTable("workout_items", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").references(() => workouts.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  dayIndex: integer("day_index").notNull(), // 0-6 for days of the week
  orderIndex: integer("order_index").notNull(), // order within the day
  sets: integer("sets").notNull(),
  reps: varchar("reps"), // "8-12", "6-8", "failure", etc.
  rir: varchar("rir"), // Rate of Perceived Exertion: "1-2", "0-1", etc.
  restSec: integer("rest_sec"), // rest time in seconds
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ORGANIZATION SYSTEM TABLES

// Organizations table - stores organization/gym information
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  logoUrl: varchar("logo_url"),
  commonPassword: varchar("common_password"), // Shared password for all org members (nullable - must be set before adding members)
  hasCommonPassword: boolean("has_common_password").default(false), // Track if common password is set
  subscriptionPlan: varchar("subscription_plan", { 
    enum: ["free", "plus", "enterprise"] 
  }).default("free"),
  maxCoaches: integer("max_coaches").default(2),
  maxClients: integer("max_clients").default(40),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_organizations_owner").on(table.ownerId),
]);

// Organization billing periods - tracks one-time monthly purchases
export const organizationBillingPeriods = pgTable("organization_billing_periods", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  
  // Purchased tier and resources
  tier: varchar("tier", { enum: ["free", "basic", "pro"] }).notNull(),
  baseCoachAllowance: integer("base_coach_allowance").notNull(), // 0 for free, 2 for basic, 5 for pro
  baseClientAllowance: integer("base_client_allowance").notNull(), // 0 for free, 20 for basic, 50 for pro
  addonCoachQty: integer("addon_coach_qty").notNull().default(0),
  addonClientQty: integer("addon_client_qty").notNull().default(0),
  
  // Swap budget for anti-exploitation (tier-based limits)
  swapBudgetCoach: integer("swap_budget_coach").default(0), // BASIC: 2, PRO: 4, FREE: 0
  swapBudgetClient: integer("swap_budget_client").default(0), // BASIC: 2, PRO: 4, FREE: 0
  lastSwapTimestampCoach: timestamp("last_swap_timestamp_coach"), // Track last coach swap for 48hr cooldown
  lastSwapTimestampClient: timestamp("last_swap_timestamp_client"), // Track last client swap for 48hr cooldown
  
  // Payment details
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  amountPaid: integer("amount_paid"), // In cents
  currency: varchar("currency").default("usd"),
  
  // Period dates
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  currentPeriodStartsAt: timestamp("current_period_starts_at").notNull(),
  currentPeriodEndsAt: timestamp("current_period_ends_at").notNull(),
  
  // Status
  status: varchar("status", { 
    enum: ["active", "expired", "pending"] 
  }).notNull().default("pending"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_org_billing_org").on(table.organizationId),
  index("idx_org_billing_status").on(table.status),
  index("idx_org_billing_checkout").on(table.stripeCheckoutSessionId),
]);

// Organization member entitlements - tracks access status for coaches and clients
export const orgMemberEntitlements = pgTable("org_member_entitlements", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  memberId: varchar("member_id").notNull(), // references users.id or org_users.id
  memberType: varchar("member_type", { enum: ["user", "org_user"] }).notNull(),
  role: varchar("role", { enum: ["coach", "client"] }).notNull(),
  
  // Access status
  status: varchar("status", { 
    enum: ["active", "locked_expired", "locked_capacity", "locked_manual"] 
  }).notNull().default("active"),
  lockedReason: text("locked_reason"),
  lockedAt: timestamp("locked_at"),
  
  // Priority for capacity management
  priorityRank: integer("priority_rank"), // Lower number = higher priority when downgrading
  
  // Link to billing period (optional - for tracking)
  billingPeriodId: integer("billing_period_id").references(() => organizationBillingPeriods.id),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_entitlements_org").on(table.organizationId),
  index("idx_entitlements_member").on(table.memberId),
  index("idx_entitlements_status").on(table.status),
  uniqueIndex("idx_entitlements_org_member").on(table.organizationId, table.memberId),
]);

// Org users table - email-based organization members (coaches & clients)
export const orgUsers = pgTable("org_users", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  password: varchar("password"), // Personal password (optional - can use org common password)
  role: varchar("role", { enum: ["coach", "client"] }).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  isActive: boolean("is_active").default(true),
  isTest: boolean("is_test").default(false), // Mark test/demo profiles to exclude from analytics
  status: varchar("status", { enum: ["active", "locked_downgrade", "locked_manual"] }).default("active"),
  lastActivationChangeAt: timestamp("last_activation_change_at"),
  lastActivationChangePeriodId: integer("last_activation_change_period_id"),
  swappedInThisCycle: boolean("swapped_in_this_cycle").default(false), // Track if member has been swapped in during current billing cycle
  
  // Soft delete and reactivation tracking
  archivedAt: timestamp("archived_at"), // Null = active, set timestamp = soft deleted
  swapCount: integer("swap_count").default(0), // Track swaps in current billing period
  lastSwapPeriodId: integer("last_swap_period_id").references(() => organizationBillingPeriods.id), // Which billing period they were last swapped in
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_org_users_org").on(table.organizationId),
  index("idx_org_users_email_org").on(table.email, table.organizationId),
  index("idx_org_users_org_archived").on(table.organizationId, table.archivedAt),
]);

// Org coaches table - links coaches to organizations
export const orgCoaches = pgTable("org_coaches", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { enum: ["coach", "admin"] }).notNull(),
  invitedBy: varchar("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("idx_org_coaches_org").on(table.orgId),
  index("idx_org_coaches_user").on(table.userId),
]);

// Org clients table - links clients to organizations
export const orgClients = pgTable("org_clients", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  coachId: varchar("coach_id").references(() => users.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("idx_org_clients_org").on(table.orgId),
  index("idx_org_clients_user").on(table.userId),
  index("idx_org_clients_coach").on(table.coachId),
]);

// Org meal plans table - stores organization meal plans
export const orgMealPlans = pgTable("org_meal_plans", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  createdBy: varchar("created_by"),  // Nullable - can be users.id or org_users.id depending on creator type
  name: varchar("name").notNull(),
  weekNumber: integer("week_number"),
  planData: jsonb("plan_data").notNull(), // Full meal plan data
  isTemplate: boolean("is_template").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_org_meal_plans_org").on(table.orgId),
  index("idx_org_meal_plans_creator").on(table.createdBy),
]);

// Org workout plans table - stores organization workout plans
export const orgWorkoutPlans = pgTable("org_workout_plans", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  createdBy: varchar("created_by"),  // Nullable - can be users.id or org_users.id depending on creator type
  name: varchar("name").notNull(),
  description: text("description"),
  weekNumber: integer("week_number"),
  planData: jsonb("plan_data").notNull(), // Full workout plan data
  isTemplate: boolean("is_template").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_org_workout_plans_org").on(table.orgId),
  index("idx_org_workout_plans_creator").on(table.createdBy),
]);

// Plan assignments table - assigns plans to clients
export const planAssignments = pgTable("plan_assignments", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  planType: varchar("plan_type", { enum: ["meal", "workout"] }).notNull(),
  clientId: varchar("client_id").notNull(),  // Can be users.id or org_users.id - no FK constraint
  assignedBy: varchar("assigned_by").notNull(),  // Can be users.id or org_users.id - no FK constraint
  assignedAt: timestamp("assigned_at").defaultNow(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  isActive: boolean("is_active").default(true),
  dayMapping: jsonb("day_mapping"), // Maps plan days to calendar weekdays: { "0": "monday", "1": "tuesday", "2": "wednesday", "3": "rest", "4": "thursday", "5": "friday", "6": "rest" }
}, (table) => [
  index("idx_plan_assignments_client").on(table.clientId),
  index("idx_plan_assignments_plan").on(table.planId, table.planType),
  uniqueIndex("idx_unique_assignment").on(table.clientId, table.planId, table.planType),
]);

// Org messages table - handles organization messaging
export const orgMessages = pgTable("org_messages", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  senderId: varchar("sender_id").notNull(), // Can be users.id or org_members.id
  senderType: varchar("sender_type", { enum: ["user", "org_member"] }).notNull().default("user"),
  recipientId: varchar("recipient_id"), // Can be users.id or org_members.id, null for community messages
  recipientType: varchar("recipient_type", { enum: ["user", "org_member"] }),
  messageType: varchar("message_type", { enum: ["community", "dm"] }).notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments"), // JSON array of attachment URLs
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_org_messages_org").on(table.orgId),
  index("idx_org_messages_sender").on(table.senderId),
  index("idx_org_messages_recipient").on(table.recipientId),
]);

// Workout logs table - client workout tracking
// Note: clientId can be either users.id OR org_users.id (no foreign key constraint)
export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").notNull(),
  workoutId: integer("workout_id").notNull(),
  exerciseName: varchar("exercise_name").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  weight: decimal("weight"),
  notes: text("notes"),
  completedAt: timestamp("completed_at").defaultNow(),
}, (table) => [
  index("idx_workout_logs_client").on(table.clientId),
  index("idx_workout_logs_completed").on(table.completedAt),
]);

// Organization meal logs table - client meal tracking for org meal plans
export const orgMealLogs = pgTable("org_meal_logs", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  mealPlanId: integer("meal_plan_id").notNull(),
  mealName: varchar("meal_name").notNull(),
  eaten: boolean("eaten").default(false),
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow(),
}, (table) => [
  index("idx_org_meal_logs_client").on(table.clientId),
  index("idx_org_meal_logs_plan").on(table.mealPlanId),
]);

// Payments table - stores one-time payment records
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique().notNull(),
  planId: varchar("plan_id").notNull(), // 'ai-coach', 'personal-coach', 'coach-use'
  planName: varchar("plan_name").notNull(),
  amount: decimal("amount").notNull(), // payment amount in dollars
  currency: varchar("currency").default("usd"),
  status: varchar("status", { 
    enum: ["pending", "succeeded", "failed", "refunded"] 
  }).notNull(),
  
  // Billing information
  billingAddress: jsonb("billing_address").notNull(), // {line1, line2, city, state, postal_code, country}
  shippingAddress: jsonb("shipping_address"), // optional shipping address
  
  // Payment metadata
  metadata: jsonb("metadata"), // additional info about purchase
  invoiceUrl: varchar("invoice_url"), // Stripe invoice URL
  receiptUrl: varchar("receipt_url"), // Stripe receipt URL
  
  // Access period
  expiresAt: timestamp("expires_at").notNull(), // 2 days from purchase
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_payments_user").on(table.userId),
  index("idx_payments_expires").on(table.expiresAt),
]);

// User points - weekly points and tier for each user (resets every Monday)
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  weeklyPoints: integer("weekly_points").default(0).notNull(), // Current week points (resets Monday)
  totalPoints: integer("total_points").default(0).notNull(), // All-time points (never reset)
  tier: varchar("tier", { enum: ["bronze", "silver", "gold"] }).default("bronze").notNull(),
  currentWeekStart: timestamp("current_week_start").defaultNow(), // Track week start for reset logic
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_points_user").on(table.userId),
  index("idx_user_points_weekly").on(table.weeklyPoints),
  index("idx_user_points_total").on(table.totalPoints),
]);

// Weekly leaderboard archive - stores past week winners
export const weeklyLeaderboard = pgTable("weekly_leaderboard", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  weeklyPoints: integer("weekly_points").notNull(),
  rank: integer("rank").notNull(),
  tier: varchar("tier", { enum: ["bronze", "silver", "gold"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_weekly_leaderboard_week").on(table.weekStart),
  index("idx_weekly_leaderboard_rank").on(table.rank),
]);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  currentOrg: one(organizations, {
    fields: [users.currentOrgId],
    references: [organizations.id],
  }),
  ownedOrganizations: many(organizations),
  mealPlans: many(mealPlans),
  mealLogs: many(mealLogs),
  habits: many(habits),
  habitLogs: many(habitLogs),
  coachClients: many(coachClients, { relationName: "coach" }),
  clientCoaches: many(coachClients, { relationName: "client" }),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  communityPosts: many(communityPosts),
  communityPostLikes: many(communityPostLikes),
  workouts: many(workouts),
  orgCoaches: many(orgCoaches),
  orgClients: many(orgClients),
  sentOrgMessages: many(orgMessages, { relationName: "orgSender" }),
  receivedOrgMessages: many(orgMessages, { relationName: "orgRecipient" }),
  workoutLogs: many(workoutLogs),
  points: one(userPoints, {
    fields: [users.id],
    references: [userPoints.userId],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [recipes.createdBy],
    references: [users.id],
  }),
  mealPlanItems: many(mealPlanItems),
  mealLogs: many(mealLogs),
}));

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [mealPlans.createdBy],
    references: [users.id],
  }),
  items: many(mealPlanItems),
}));

export const mealPlanItemsRelations = relations(mealPlanItems, ({ one }) => ({
  mealPlan: one(mealPlans, {
    fields: [mealPlanItems.mealPlanId],
    references: [mealPlans.id],
  }),
  recipe: one(recipes, {
    fields: [mealPlanItems.recipeId],
    references: [recipes.id],
  }),
}));

export const mealLogsRelations = relations(mealLogs, ({ one }) => ({
  user: one(users, {
    fields: [mealLogs.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [mealLogs.recipeId],
    references: [recipes.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [habitLogs.userId],
    references: [users.id],
  }),
}));

export const coachClientsRelations = relations(coachClients, ({ one }) => ({
  coach: one(users, {
    fields: [coachClients.coachId],
    references: [users.id],
    relationName: "coach",
  }),
  client: one(users, {
    fields: [coachClients.clientId],
    references: [users.id],
    relationName: "client",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  likes: many(communityPostLikes),
}));

export const communityPostLikesRelations = relations(communityPostLikes, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityPostLikes.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communityPostLikes.userId],
    references: [users.id],
  }),
}));

export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
}));

// Workout relations
export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  owner: one(users, {
    fields: [workouts.ownerId],
    references: [users.id],
  }),
  items: many(workoutItems),
}));

export const workoutItemsRelations = relations(workoutItems, ({ one }) => ({
  workout: one(workouts, {
    fields: [workoutItems.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutItems.exerciseId],
    references: [exercises.id],
  }),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutItems: many(workoutItems),
}));

// Coach profile relations
export const coachProfilesRelations = relations(coachProfiles, ({ one }) => ({
  user: one(users, {
    fields: [coachProfiles.userId],
    references: [users.id],
  }),
}));

// Organization relations
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  coaches: many(orgCoaches),
  clients: many(orgClients),
  mealPlans: many(orgMealPlans),
  workoutPlans: many(orgWorkoutPlans),
  messages: many(orgMessages),
  users: many(users),
}));

export const orgCoachesRelations = relations(orgCoaches, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgCoaches.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [orgCoaches.userId],
    references: [users.id],
  }),
  invitedBy: one(users, {
    fields: [orgCoaches.invitedBy],
    references: [users.id],
  }),
}));

export const orgClientsRelations = relations(orgClients, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgClients.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [orgClients.userId],
    references: [users.id],
  }),
  coach: one(users, {
    fields: [orgClients.coachId],
    references: [users.id],
  }),
}));

export const orgMealPlansRelations = relations(orgMealPlans, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orgMealPlans.orgId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [orgMealPlans.createdBy],
    references: [users.id],
  }),
  assignments: many(planAssignments),
}));

export const orgWorkoutPlansRelations = relations(orgWorkoutPlans, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orgWorkoutPlans.orgId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [orgWorkoutPlans.createdBy],
    references: [users.id],
  }),
  assignments: many(planAssignments),
}));

export const planAssignmentsRelations = relations(planAssignments, ({ one }) => ({
  client: one(users, {
    fields: [planAssignments.clientId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [planAssignments.assignedBy],
    references: [users.id],
  }),
}));

export const orgMessagesRelations = relations(orgMessages, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgMessages.orgId],
    references: [organizations.id],
  }),
  sender: one(users, {
    fields: [orgMessages.senderId],
    references: [users.id],
    relationName: "orgSender",
  }),
  recipient: one(users, {
    fields: [orgMessages.recipientId],
    references: [users.id],
    relationName: "orgRecipient",
  }),
}));

export const workoutLogsRelations = relations(workoutLogs, ({ one }) => ({
  client: one(users, {
    fields: [workoutLogs.clientId],
    references: [users.id],
  }),
}));

export const orgMealLogsRelations = relations(orgMealLogs, ({ one }) => ({
  client: one(users, {
    fields: [orgMealLogs.clientId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  height: z.string().or(z.number()).optional(),
  weight: z.string().or(z.number()).optional(),
  targetWeight: z.string().or(z.number()).optional(),
  dailyCalorieGoal: z.string().or(z.number()).optional(),
  sleepDuration: z.string().or(z.number()).optional(),
  waterIntakeGoal: z.string().or(z.number()).optional(),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  rating: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
});

export const insertMealPlanItemSchema = createInsertSchema(mealPlanItems).omit({
  id: true,
});

export const insertMealLogSchema = createInsertSchema(mealLogs).omit({
  id: true,
  createdAt: true,
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
});

export const insertHabitLogSchema = createInsertSchema(habitLogs).omit({
  id: true,
  createdAt: true,
});

export const insertWaterLogSchema = createInsertSchema(waterLogs).omit({
  id: true,
  createdAt: true,
});

// Admin accounts table for super admin functionality
export const adminAccounts = pgTable("admin_accounts", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { enum: ["super_admin", "admin"] }).default("admin"),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin sessions table
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminAccounts.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// System reports table
export const systemReports = pgTable("system_reports", {
  id: serial("id").primaryKey(),
  reportType: varchar("report_type", { enum: ["user_stats", "subscription_stats", "revenue", "activity"] }).notNull(),
  data: jsonb("data").notNull(),
  generatedBy: integer("generated_by").references(() => adminAccounts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin types
// Coach verification schema
export const insertCoachVerificationSchema = createInsertSchema(coachVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewedAt: true,
  reviewNotes: true,
});

// Type exports
export type CoachVerification = typeof coachVerifications.$inferSelect;
export type InsertCoachVerification = typeof coachVerifications.$inferInsert;

export type AdminAccount = typeof adminAccounts.$inferSelect;
export type InsertAdminAccount = typeof adminAccounts.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;
export type SystemReport = typeof systemReports.$inferSelect;
export type InsertSystemReport = typeof systemReports.$inferInsert;

// Admin insert schemas
export const insertAdminAccountSchema = createInsertSchema(adminAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  createdAt: true,
});

export const insertCoachClientSchema = createInsertSchema(coachClients).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  likes: true,
  comments: true,
});

// Workout schemas
export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkoutItemSchema = createInsertSchema(workoutItems).omit({
  id: true,
  createdAt: true,
});

// Workout types
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = typeof workouts.$inferInsert;
export type WorkoutItem = typeof workoutItems.$inferSelect;
export type InsertWorkoutItem = typeof workoutItems.$inferInsert;

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Coach profile schema
export const insertCoachProfileSchema = createInsertSchema(coachProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Coach profile types
export type CoachProfile = typeof coachProfiles.$inferSelect;
export type InsertCoachProfile = typeof coachProfiles.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlanItem = typeof mealPlanItems.$inferSelect;
export type InsertMealPlanItem = z.infer<typeof insertMealPlanItemSchema>;
export type MealLog = typeof mealLogs.$inferSelect;
export type InsertMealLog = z.infer<typeof insertMealLogSchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;
export type WaterLog = typeof waterLogs.$inferSelect;
export type InsertWaterLog = z.infer<typeof insertWaterLogSchema>;
export type CoachClient = typeof coachClients.$inferSelect;
export type InsertCoachClient = z.infer<typeof insertCoachClientSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

// Organization system schemas and types
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationBillingPeriodSchema = createInsertSchema(organizationBillingPeriods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrgMemberEntitlementSchema = createInsertSchema(orgMemberEntitlements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrgCoachSchema = createInsertSchema(orgCoaches).omit({
  id: true,
  joinedAt: true,
});

export const insertOrgClientSchema = createInsertSchema(orgClients).omit({
  id: true,
  enrolledAt: true,
});

export const insertOrgUserSchema = createInsertSchema(orgUsers).omit({
  id: true,
  createdAt: true,
});

export const insertOrgMealPlanSchema = createInsertSchema(orgMealPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrgWorkoutPlanSchema = createInsertSchema(orgWorkoutPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanAssignmentSchema = createInsertSchema(planAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertOrgMessageSchema = createInsertSchema(orgMessages).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({
  id: true,
  completedAt: true,
});

export const insertOrgMealLogSchema = createInsertSchema(orgMealLogs).omit({
  id: true,
  loggedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// User points system schemas
export const insertUserPointsSchema = createInsertSchema(userPoints).omit({
  id: true,
  updatedAt: true,
});

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;

// Post comments schemas
export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
});

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;

// Weekly leaderboard schema
export const insertWeeklyLeaderboardSchema = createInsertSchema(weeklyLeaderboard).omit({
  id: true,
  createdAt: true,
});

export type WeeklyLeaderboard = typeof weeklyLeaderboard.$inferSelect;
export type InsertWeeklyLeaderboard = z.infer<typeof insertWeeklyLeaderboardSchema>;

// Organization system types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type OrganizationBillingPeriod = typeof organizationBillingPeriods.$inferSelect;
export type InsertOrganizationBillingPeriod = z.infer<typeof insertOrganizationBillingPeriodSchema>;
export type OrgMemberEntitlement = typeof orgMemberEntitlements.$inferSelect;
export type InsertOrgMemberEntitlement = z.infer<typeof insertOrgMemberEntitlementSchema>;
export type OrgCoach = typeof orgCoaches.$inferSelect;
export type InsertOrgCoach = z.infer<typeof insertOrgCoachSchema>;
export type OrgClient = typeof orgClients.$inferSelect;
export type InsertOrgClient = z.infer<typeof insertOrgClientSchema>;
export type OrgUser = typeof orgUsers.$inferSelect;
export type InsertOrgUser = z.infer<typeof insertOrgUserSchema>;
export type OrgMealPlan = typeof orgMealPlans.$inferSelect;
export type InsertOrgMealPlan = z.infer<typeof insertOrgMealPlanSchema>;
export type OrgWorkoutPlan = typeof orgWorkoutPlans.$inferSelect;
export type InsertOrgWorkoutPlan = z.infer<typeof insertOrgWorkoutPlanSchema>;
export type PlanAssignment = typeof planAssignments.$inferSelect;
export type InsertPlanAssignment = z.infer<typeof insertPlanAssignmentSchema>;
export type OrgMessage = typeof orgMessages.$inferSelect;
export type InsertOrgMessage = z.infer<typeof insertOrgMessageSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type OrgMealLog = typeof orgMealLogs.$inferSelect;
export type InsertOrgMealLog = z.infer<typeof insertOrgMealLogSchema>;

// Org member activation events - tracks when members are activated/deactivated for billing quota management
export const orgMemberActivationEvents = pgTable("org_member_activation_events", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  orgUserId: integer("org_user_id").references(() => orgUsers.id).notNull(),
  billingPeriodId: integer("billing_period_id").references(() => organizationBillingPeriods.id),
  oldStatus: varchar("old_status", { enum: ["active", "locked_downgrade", "locked_manual"] }),
  newStatus: varchar("new_status", { enum: ["active", "locked_downgrade", "locked_manual"] }).notNull(),
  reason: text("reason"), // e.g., "downgrade", "owner_lock", "owner_unlock", "swap"
  changedBy: varchar("changed_by"), // org owner user ID
  changedAt: timestamp("changed_at").defaultNow(),
}, (table) => [
  index("idx_activation_events_org").on(table.organizationId),
  index("idx_activation_events_period").on(table.billingPeriodId),
  index("idx_activation_events_user").on(table.orgUserId),
]);

// Password reset tokens table - for forgot password functionality
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token").notNull().unique(),
  userId: varchar("user_id"), // For individual users, org owners
  orgUserId: integer("org_user_id"), // For org coaches and clients
  userType: varchar("user_type", { 
    enum: ["individual", "org_owner", "coach", "org_client"] 
  }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_password_reset_token").on(table.token),
  index("idx_password_reset_user").on(table.userId),
  index("idx_password_reset_org_user").on(table.orgUserId),
]);

export const insertOrgMemberActivationEventSchema = createInsertSchema(orgMemberActivationEvents).omit({
  id: true,
  changedAt: true,
});

export type OrgMemberActivationEvent = typeof orgMemberActivationEvents.$inferSelect;
export type InsertOrgMemberActivationEvent = z.infer<typeof insertOrgMemberActivationEventSchema>;

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// User preferences schemas and types
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
