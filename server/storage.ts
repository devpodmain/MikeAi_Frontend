import {
  users,
  userProfiles,
  userPreferences,
  recipes,
  mealPlans,
  mealPlanItems,
  mealLogs,
  habits,
  habitLogs,
  waterLogs,
  workoutLogs,
  orgMealLogs,
  orgHabitLogs,
  coachClients,
  messages,
  communityPosts,
  communityPostLikes,
  postComments,
  commentLikes,
  exercises,
  workouts,
  workoutItems,
  organizations,
  organizationBillingPeriods,
  orgMemberEntitlements,
  orgUsers,
  orgCoaches,
  orgClients,
  orgMealPlans,
  orgWorkoutPlans,
  planAssignments,
  orgMessages,
  orgMemberActivationEvents,
  payments,
  userPoints,
  weeklyLeaderboard,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type UserPreferences,
  type InsertUserPreferences,
  type Recipe,
  type InsertRecipe,
  type MealPlan,
  type InsertMealPlan,
  type MealPlanItem,
  type InsertMealPlanItem,
  type MealLog,
  type InsertMealLog,
  type Habit,
  type InsertHabit,
  type HabitLog,
  type InsertHabitLog,
  type WaterLog,
  type InsertWaterLog,
  type CoachClient,
  type InsertCoachClient,
  type Message,
  type InsertMessage,
  type CommunityPost,
  type InsertCommunityPost,
  type PostComment,
  type InsertPostComment,
  type Exercise,
  type InsertExercise,
  type Workout,
  type InsertWorkout,
  type WorkoutItem,
  type InsertWorkoutItem,
  type Organization,
  type InsertOrganization,
  type OrganizationBillingPeriod,
  type InsertOrganizationBillingPeriod,
  type OrgMemberEntitlement,
  type InsertOrgMemberEntitlement,
  type OrgCoach,
  type InsertOrgCoach,
  type OrgClient,
  type InsertOrgClient,
  type OrgUser,
  type InsertOrgUser,
  type OrgMealPlan,
  type InsertOrgMealPlan,
  type OrgWorkoutPlan,
  type InsertOrgWorkoutPlan,
  type PlanAssignment,
  type InsertPlanAssignment,
  type OrgMessage,
  type InsertOrgMessage,
  type OrgMemberActivationEvent,
  type InsertOrgMemberActivationEvent,
  type Payment,
  type InsertPayment,
  type UserPoints,
  type InsertUserPoints,
  type WeeklyLeaderboard,
  type InsertWeeklyLeaderboard,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, sql, like, gte, lte, count, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { formatDistanceToNow } from 'date-fns';

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: "trial" | "active" | "canceled" | "past_due" | "unpaid" | "incomplete";
    subscriptionTier?: "free" | "plus" | "pro";
  }): Promise<User>;
  
  // User profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // User preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  
  // Recipe operations
  getRecipes(filters?: {
    cuisine?: string;
    mealType?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  
  // Meal plan operations
  getMealPlans(userId: string): Promise<MealPlan[]>;
  getMealPlan(id: number): Promise<MealPlan | undefined>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  getMealPlanItems(mealPlanId: number): Promise<(MealPlanItem & { recipe: Recipe })[]>;
  addMealPlanItem(item: InsertMealPlanItem): Promise<MealPlanItem>;
  deleteMealPlan(userId: string, mealPlanId: number): Promise<void>;
  deleteAllMealPlans(userId: string): Promise<void>;
  
  // Meal logging operations
  getMealLogs(userId: string, date?: string): Promise<(MealLog & { recipe?: Recipe })[]>;
  createMealLog(log: InsertMealLog): Promise<MealLog>;
  deleteMealLog(logId: number, userId: string): Promise<void>;
  deleteMealLogByTypeAndDate(userId: string, mealType: string, date: string): Promise<number>;
  
  // Habit operations
  getHabits(userId: string): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  deleteHabit(userId: string, habitId: number): Promise<void>;
  getHabitLogs(userId: string, date?: string): Promise<(HabitLog & { habit: Habit })[]>;
  createHabitLog(log: InsertHabitLog): Promise<HabitLog>;
  deleteHabitLog(userId: string, habitId: number, logDate: string): Promise<void>;
  getHabitStreak(userId: string, habitId: number): Promise<number>;
  
  // Water logging operations
  getTodayWaterIntake(userId: string, date: string): Promise<number>;
  logWaterIntake(log: InsertWaterLog): Promise<WaterLog>;
  resetTodayWaterIntake(userId: string, date: string): Promise<void>;
  
  // Coach-client operations
  getCoachClients(coachId: string): Promise<(CoachClient & { client: User & { profile?: UserProfile } })[]>;
  getClientCoaches(clientId: string): Promise<(CoachClient & { coach: User })[]>;
  createCoachClient(relation: InsertCoachClient): Promise<CoachClient>;
  updateCoachClientStatus(id: number, status: 'active' | 'inactive' | 'pending'): Promise<CoachClient>;
  
  // Message operations
  getMessages(userId: string): Promise<(Message & { sender: User; receiver: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
  
  // Community operations
  getCommunityPosts(limit?: number, offset?: number): Promise<(CommunityPost & { user: User })[]>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  togglePostLike(postId: number, userId: string): Promise<{ liked: boolean }>;
  
  // Comment operations
  createComment(comment: InsertPostComment): Promise<PostComment>;
  getPostComments(postId: number): Promise<(PostComment & { user: User; replies?: any[] })[]>;
  toggleCommentLike(commentId: number, userId: string): Promise<{ liked: boolean }>;

  // Workout operations
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout>;
  deleteWorkout(id: number): Promise<void>;
  
  // Exercise operations
  getExercises(): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  getExerciseByName(name: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Workout item operations
  getWorkoutItems(workoutId: number): Promise<WorkoutItem[]>;
  getWorkoutItemsWithExercises(workoutId: number): Promise<(WorkoutItem & { exerciseName: string; equipment?: string })[]>;
  createWorkoutItem(item: InsertWorkoutItem): Promise<WorkoutItem>;
  updateWorkoutItem(id: number, item: Partial<InsertWorkoutItem>): Promise<WorkoutItem>;
  deleteWorkoutItem(id: number): Promise<void>;

  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationWithCounts(id: number): Promise<(Organization & { coachCount: number; clientCount: number }) | undefined>;
  updateOrganization(id: number, org: Partial<InsertOrganization>): Promise<Organization>;
  softDeleteOrganization(id: number): Promise<Organization>;
  getUserOrganizations(userId: string): Promise<Organization[]>;
  
  // Organization subscription operations
  createOrganizationSubscription(subscription: InsertOrganizationSubscription): Promise<OrganizationSubscription>;
  getOrganizationSubscription(orgId: number): Promise<OrganizationSubscription | undefined>;
  updateOrganizationSubscription(orgId: number, updates: Partial<InsertOrganizationSubscription>): Promise<OrganizationSubscription>;
  
  // Organization billing period operations
  createBillingPeriod(period: InsertOrganizationBillingPeriod): Promise<OrganizationBillingPeriod>;
  getActiveBillingPeriod(orgId: number): Promise<OrganizationBillingPeriod | undefined>;
  getAllBillingPeriods(orgId: number): Promise<OrganizationBillingPeriod[]>;
  updateBillingPeriod(periodId: number, updates: Partial<InsertOrganizationBillingPeriod>): Promise<OrganizationBillingPeriod>;
  getBillingPeriodByCheckoutSession(sessionId: string): Promise<OrganizationBillingPeriod | undefined>;
  checkAndUpdateExpiredPeriods(orgId: number): Promise<void>;
  
  // Organization member entitlement operations
  createMemberEntitlement(entitlement: InsertOrgMemberEntitlement): Promise<OrgMemberEntitlement>;
  getMemberEntitlement(orgId: number, memberId: string): Promise<OrgMemberEntitlement | undefined>;
  getOrgEntitlements(orgId: number): Promise<OrgMemberEntitlement[]>;
  updateMemberEntitlement(entitlementId: number, updates: Partial<InsertOrgMemberEntitlement>): Promise<OrgMemberEntitlement>;
  lockMembersByCapacity(orgId: number, role: 'coach' | 'client', keepActiveCount: number): Promise<void>;
  getOrgsWhereUserIsCoach(userId: string): Promise<any[]>;
  getOrgsWhereUserIsClient(userId: string): Promise<any[]>;
  
  // Org coach operations
  addOrgCoach(coach: InsertOrgCoach): Promise<OrgCoach>;
  getOrgCoaches(orgId: number): Promise<(OrgCoach & { user: User })[]>;
  removeOrgCoach(orgId: number, userId: string): Promise<void>;
  getOrgCoachCount(orgId: number): Promise<number>;
  
  // Org client operations
  addOrgClient(client: InsertOrgClient): Promise<OrgClient>;
  getOrgClients(orgId: number): Promise<(OrgClient & { user: User; coach?: User })[]>;
  assignClientCoach(orgId: number, clientId: string, coachId: string | null): Promise<OrgClient>;
  removeOrgClient(orgId: number, clientId: string): Promise<void>;
  getOrgClientCount(orgId: number): Promise<number>;
  
  // Org user operations (email-based org members)
  createOrgUser(orgUser: InsertOrgUser): Promise<OrgUser>;
  getOrgUser(id: number): Promise<OrgUser | undefined>;
  getOrgUserByEmail(email: string, orgId?: number): Promise<OrgUser | undefined>;
  getOrgUsers(orgId: number, role?: 'coach' | 'client'): Promise<OrgUser[]>;
  getOrgUsersWithMetrics(orgId: number, role?: 'coach' | 'client'): Promise<any[]>;
  updateOrgUser(id: number, updates: Partial<InsertOrgUser>): Promise<OrgUser>;
  removeOrgUser(id: number): Promise<void>;
  ensureOrgUserActive(orgId: number, email: string, role: 'coach' | 'client', firstName?: string, lastName?: string): Promise<{ success: boolean; user?: OrgUser; error?: string; errorCode?: string }>;
  
  // Org member activation management operations
  swapMemberActivation(orgId: number, activateMemberId: number, deactivateMemberId: number, changedBy: string): Promise<{ success: boolean; message: string }>;
  canSwapInCurrentPeriod(orgId: number, role: 'coach' | 'client', billingPeriodId: number): Promise<{ canSwap: boolean; reason?: string }>;
  logActivationEvent(event: InsertOrgMemberActivationEvent): Promise<OrgMemberActivationEvent>;
  getActivationEvents(orgId: number, billingPeriodId?: number): Promise<OrgMemberActivationEvent[]>;
  
  // Org meal plan operations
  createOrgMealPlan(plan: InsertOrgMealPlan): Promise<OrgMealPlan>;
  getOrgMealPlans(orgId: number): Promise<OrgMealPlan[]>;
  getOrgMealPlansWithCounts(orgId: number): Promise<any[]>;
  deleteOrgMealPlan(planId: number): Promise<void>;
  
  // Org workout plan operations
  createOrgWorkoutPlan(plan: InsertOrgWorkoutPlan): Promise<OrgWorkoutPlan>;
  getOrgWorkoutPlans(orgId: number): Promise<OrgWorkoutPlan[]>;
  getOrgWorkoutPlansWithCounts(orgId: number): Promise<any[]>;
  deleteOrgWorkoutPlan(planId: number): Promise<void>;
  
  // Plan assignment operations
  assignPlanToClients(assignment: InsertPlanAssignment[]): Promise<PlanAssignment[]>;
  getClientPlanAssignments(clientId: string): Promise<PlanAssignment[]>;
  
  // Org message operations
  createOrgMessage(message: InsertOrgMessage): Promise<OrgMessage>;
  getOrgMessages(orgId: number, filters?: { messageType?: 'community' | 'dm'; limit?: number; offset?: number }): Promise<(OrgMessage & { sender: User; recipient?: User })[]>;
  getDirectMessageConversations(orgId: number, userId: string, userType: 'user' | 'org_member'): Promise<Array<{
    participantId: string;
    participantName: string;
    participantType: 'user' | 'org_member';
    lastMessage: string;
    lastMessageAt: Date;
    unreadCount: number;
  }>>;
  getDirectMessageThread(orgId: number, userId: string, participantId: string, userType: 'user' | 'org_member'): Promise<(OrgMessage & { sender: User; recipient?: User })[]>;
  markMessagesAsRead(messageIds: number[]): Promise<void>;
  getOrganizationMembers(orgId: number): Promise<Array<{ id: string; name: string; email: string; role: string; type: 'user' | 'org_member' }>>;
  
  // User organization operations
  updateUserOrgSettings(userId: string, updates: { userType?: string; currentOrgId?: number | null }): Promise<User>;
  
  // Organization analytics operations
  getMostActiveClients(orgId: number, limit?: number): Promise<Array<{
    clientId: string;
    name: string;
    email: string;
    activityScore: number;
    activityPercentage: number;
  }>>;
  getCoachPerformance(orgId: number): Promise<Array<{
    coachId: string;
    name: string;
    email: string;
    clientCount: number;
    plansCreated: number;
    successRate: number;
  }>>;
  getClientProgressMetrics(orgId: number): Promise<{
    completionRate: number;
    excellent: number;
    good: number;
    needsHelp: number;
  }>;
  getPlanCompletionRates(orgId: number): Promise<{
    mealAdherence: number;
    workoutCompletion: number;
  }>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(paymentIntentId: string): Promise<Payment | undefined>;
  getUserPayments(userId: string): Promise<Payment[]>;
  getUserActivePayment(userId: string): Promise<Payment | undefined>;
  
  // User points operations
  getUserPoints(userId: string): Promise<UserPoints | undefined>;
  awardPoints(userId: string, points: number): Promise<UserPoints>;
  getLeaderboard(limit?: number): Promise<(UserPoints & { user: User })[]>;
  getUserRank(userId: string): Promise<number>;
  resetWeeklyPoints(): Promise<void>;
  getWeeklyLeaderboardHistory(limit?: number): Promise<(WeeklyLeaderboard & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Set trial end date for new users (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        trialEndsAt,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: "trial" | "active" | "canceled" | "past_due" | "unpaid" | "incomplete";
    subscriptionTier?: "free" | "plus" | "pro";
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    // Convert numeric string values to numbers for database storage
    const profileData = {
      ...profile,
      height: profile.height ? parseFloat(profile.height.toString()) : null,
      weight: profile.weight ? parseFloat(profile.weight.toString()) : null,
      targetWeight: profile.targetWeight ? parseFloat(profile.targetWeight.toString()) : null,
      dailyCalorieGoal: profile.dailyCalorieGoal ? parseFloat(profile.dailyCalorieGoal.toString()) : null,
      sleepDuration: profile.sleepDuration ? parseFloat(profile.sleepDuration.toString()) : null,
      waterIntakeGoal: profile.waterIntakeGoal ? parseFloat(profile.waterIntakeGoal.toString()) : null,
    };
    const [newProfile] = await db.insert(userProfiles).values(profileData).returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    // Convert numeric string values to numbers for database storage
    const profileData = {
      ...profile,
      height: profile.height ? parseFloat(profile.height.toString()) : undefined,
      weight: profile.weight ? parseFloat(profile.weight.toString()) : undefined,
      targetWeight: profile.targetWeight ? parseFloat(profile.targetWeight.toString()) : undefined,
      dailyCalorieGoal: profile.dailyCalorieGoal ? parseFloat(profile.dailyCalorieGoal.toString()) : undefined,
      sleepDuration: profile.sleepDuration ? parseFloat(profile.sleepDuration.toString()) : undefined,
      waterIntakeGoal: profile.waterIntakeGoal ? parseFloat(profile.waterIntakeGoal.toString()) : undefined,
      updatedAt: new Date(),
    };
    const [updatedProfile] = await db
      .update(userProfiles)
      .set(profileData)
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(prefs.userId);
    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(userPreferences.userId, prefs.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userPreferences).values(prefs).returning();
      return created;
    }
  }

  // Recipe operations
  async getRecipes(filters?: {
    cuisine?: string;
    mealType?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Recipe[]> {
    let query = db.select().from(recipes);

    if (filters?.cuisine && filters.cuisine !== "all") {
      query = query.where(eq(recipes.cuisine, filters.cuisine));
    }

    if (filters?.mealType && filters.mealType !== "all") {
      query = query.where(eq(recipes.mealType, filters.mealType));
    }

    if (filters?.search) {
      query = query.where(
        or(
          like(recipes.name, `%${filters.search}%`),
          like(recipes.description, `%${filters.search}%`)
        )
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      // Use PostgreSQL array overlap operator with proper syntax  
      // Create conditions for each tag using ANY operator
      for (const tag of filters.tags) {
        query = query.where(sql`${tag} = ANY(${recipes.tags})`);
      }
    }

    query = query.orderBy(desc(recipes.rating));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db.insert(recipes).values(recipe).returning();
    return newRecipe;
  }

  // Meal plan operations
  async getMealPlans(userId: string): Promise<MealPlan[]> {
    return await db.select().from(mealPlans).where(and(eq(mealPlans.userId, userId), eq(mealPlans.isActive, true))).orderBy(desc(mealPlans.createdAt));
  }

  async getMealPlan(id: number): Promise<MealPlan | undefined> {
    const [mealPlan] = await db.select().from(mealPlans).where(eq(mealPlans.id, id));
    return mealPlan;
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const [newMealPlan] = await db.insert(mealPlans).values(mealPlan).returning();
    return newMealPlan;
  }

  async getMealPlanItems(mealPlanId: number): Promise<(MealPlanItem & { recipe: Recipe })[]> {
    return await db
      .select()
      .from(mealPlanItems)
      .innerJoin(recipes, eq(mealPlanItems.recipeId, recipes.id))
      .where(eq(mealPlanItems.mealPlanId, mealPlanId));
  }

  async addMealPlanItem(item: InsertMealPlanItem): Promise<MealPlanItem> {
    const [newItem] = await db.insert(mealPlanItems).values(item).returning();
    return newItem;
  }

  async deleteMealPlan(userId: string, mealPlanId: number): Promise<void> {
    await db
      .update(mealPlans)
      .set({ isActive: false })
      .where(and(eq(mealPlans.id, mealPlanId), eq(mealPlans.userId, userId)));
  }

  async deleteAllMealPlans(userId: string): Promise<void> {
    console.log('Deleting all meal plans for user:', userId);
    const result = await db
      .delete(mealPlans)
      .where(eq(mealPlans.userId, userId));
    console.log('Delete result:', result);
  }

  // Meal logging operations
  async getMealLogs(userId: string, date?: string): Promise<(MealLog & { recipe?: Recipe })[]> {
    let query = db
      .select()
      .from(mealLogs)
      .leftJoin(recipes, eq(mealLogs.recipeId, recipes.id))
      .where(eq(mealLogs.userId, userId));

    if (date) {
      query = query.where(eq(mealLogs.logDate, date));
    }

    return await query.orderBy(desc(mealLogs.createdAt));
  }

  async createMealLog(log: InsertMealLog): Promise<MealLog> {
    const [newLog] = await db.insert(mealLogs).values(log).returning();
    return newLog;
  }

  async deleteMealLog(logId: number, userId: string): Promise<void> {
    await db
      .delete(mealLogs)
      .where(and(eq(mealLogs.id, logId), eq(mealLogs.userId, userId)));
  }

  async deleteMealLogByTypeAndDate(userId: string, mealType: string, date: string): Promise<number> {
    const result = await db
      .delete(mealLogs)
      .where(and(
        eq(mealLogs.userId, userId),
        eq(mealLogs.mealType, mealType),
        eq(mealLogs.logDate, date)
      ))
      .returning();
    
    return result.length; // Return number of deleted rows
  }

  // Habit operations
  async getHabits(userId: string): Promise<Habit[]> {
    return await db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.isActive, true)));
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db.insert(habits).values(habit).returning();
    return newHabit;
  }

  async deleteHabit(userId: string, habitId: number): Promise<void> {
    await db
      .update(habits)
      .set({ isActive: false })
      .where(
        and(
          eq(habits.id, habitId),
          eq(habits.userId, userId)
        )
      );
  }

  async getHabitLogs(userId: string, date?: string): Promise<(HabitLog & { habit: Habit })[]> {
    const conditions = [eq(habitLogs.userId, userId)];
    if (date) {
      conditions.push(eq(habitLogs.logDate, date));
    }

    const results = await db
      .select()
      .from(habitLogs)
      .innerJoin(habits, eq(habitLogs.habitId, habits.id))
      .where(and(...conditions))
      .orderBy(desc(habitLogs.createdAt));

    // Flatten the nested join structure to match expected return type
    return results.map(row => ({
      ...row.habit_logs,
      habit: row.habits
    }));
  }

  async createHabitLog(log: InsertHabitLog): Promise<HabitLog> {
    const [newLog] = await db.insert(habitLogs).values(log).returning();
    return newLog;
  }

  async deleteHabitLog(userId: string, habitId: number, logDate: string): Promise<void> {
    await db
      .delete(habitLogs)
      .where(
        and(
          eq(habitLogs.userId, userId),
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.logDate, logDate)
        )
      );
  }

  async getHabitStreak(userId: string, habitId: number): Promise<number> {
    const logs = await db
      .select({ logDate: habitLogs.logDate, completed: habitLogs.completed })
      .from(habitLogs)
      .where(and(eq(habitLogs.userId, userId), eq(habitLogs.habitId, habitId)))
      .orderBy(desc(habitLogs.logDate))
      .limit(30);

    let streak = 0;
    for (const log of logs) {
      if (log.completed) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Water logging operations
  async getTodayWaterIntake(userId: string, date: string): Promise<number> {
    const logs = await db
      .select({ glassesCount: waterLogs.glassesCount })
      .from(waterLogs)
      .where(and(eq(waterLogs.userId, userId), eq(waterLogs.logDate, date)));

    return logs.reduce((total, log) => total + (log.glassesCount || 0), 0);
  }

  async logWaterIntake(log: InsertWaterLog): Promise<WaterLog> {
    const [newLog] = await db.insert(waterLogs).values(log).returning();
    return newLog;
  }

  async resetTodayWaterIntake(userId: string, date: string): Promise<void> {
    await db
      .delete(waterLogs)
      .where(and(eq(waterLogs.userId, userId), eq(waterLogs.logDate, date)));
  }

  // Coach-client operations
  async getCoachClients(coachId: string): Promise<(CoachClient & { client: User & { profile?: UserProfile } })[]> {
    return await db
      .select()
      .from(coachClients)
      .innerJoin(users, eq(coachClients.clientId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(coachClients.coachId, coachId));
  }

  async getClientCoaches(clientId: string): Promise<(CoachClient & { coach: User })[]> {
    return await db
      .select()
      .from(coachClients)
      .innerJoin(users, eq(coachClients.coachId, users.id))
      .where(eq(coachClients.clientId, clientId));
  }

  async createCoachClient(relation: InsertCoachClient): Promise<CoachClient> {
    const [newRelation] = await db.insert(coachClients).values(relation).returning();
    return newRelation;
  }

  async updateCoachClientStatus(id: number, status: 'active' | 'inactive' | 'pending'): Promise<CoachClient> {
    const [updated] = await db
      .update(coachClients)
      .set({ status })
      .where(eq(coachClients.id, id))
      .returning();
    return updated;
  }

  // Message operations
  async getMessages(userId: string): Promise<(Message & { sender: User; receiver: User })[]> {
    // Get messages sent by the user
    const sentMessages = await db
      .select({
        message: messages,
        sender: users,
        receiver: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.senderId, userId))
      .orderBy(desc(messages.createdAt));

    // Get messages received by the user  
    const receivedMessages = await db
      .select({
        message: messages,
        sender: users,
        receiver: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.receiverId, users.id))
      .where(eq(messages.receiverId, userId))
      .orderBy(desc(messages.createdAt));

    // For now, return just the messages table data
    // TODO: Properly implement sender/receiver data
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const [updated] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  // Community operations
  async getCommunityPosts(limit = 20, offset = 0): Promise<(CommunityPost & { user: User })[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const result = await db
      .select({
        community_posts: communityPosts,
        users: users
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.userId, users.id))
      .where(
        and(
          sql`${communityPosts.archivedAt} IS NULL`, // Not manually archived
          gte(communityPosts.createdAt, sevenDaysAgo) // Within last 7 days
        )
      )
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Transform the result to match the expected format
    return result.map(row => ({
      ...row.community_posts,
      user: row.users
    }));
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [newPost] = await db.insert(communityPosts).values(post).returning();
    return newPost;
  }

  async togglePostLike(postId: number, userId: string): Promise<{ liked: boolean }> {
    const [existingLike] = await db
      .select()
      .from(communityPostLikes)
      .where(and(eq(communityPostLikes.postId, postId), eq(communityPostLikes.userId, userId)));

    if (existingLike) {
      await db
        .delete(communityPostLikes)
        .where(and(eq(communityPostLikes.postId, postId), eq(communityPostLikes.userId, userId)));
      
      await db
        .update(communityPosts)
        .set({ likes: sql`${communityPosts.likes} - 1` })
        .where(eq(communityPosts.id, postId));
      
      return { liked: false };
    } else {
      await db.insert(communityPostLikes).values({ postId, userId });
      
      await db
        .update(communityPosts)
        .set({ likes: sql`${communityPosts.likes} + 1` })
        .where(eq(communityPosts.id, postId));
      
      return { liked: true };
    }
  }

  // Comment operations
  async createComment(comment: InsertPostComment): Promise<PostComment> {
    const [newComment] = await db.insert(postComments).values(comment).returning();
    
    // Increment comment count on the post
    await db
      .update(communityPosts)
      .set({ comments: sql`${communityPosts.comments} + 1` })
      .where(eq(communityPosts.id, comment.postId));
    
    return newComment;
  }

  async getPostComments(postId: number): Promise<(PostComment & { user: User; replies?: any[] })[]> {
    const result = await db
      .select({
        comment: postComments,
        user: users
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(postComments.createdAt);
    
    const comments = result.map(row => ({
      ...row.comment,
      user: row.user,
      replies: []
    }));
    
    // Build tree structure: organize comments with parentCommentId into nested replies
    const commentMap = new Map<number, any>();
    const topLevelComments: any[] = [];
    
    comments.forEach(comment => {
      commentMap.set(comment.id, comment);
    });
    
    comments.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        topLevelComments.push(comment);
      }
    });
    
    return topLevelComments;
  }

  async toggleCommentLike(commentId: number, userId: string): Promise<{ liked: boolean }> {
    const [existingLike] = await db
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));

    if (existingLike) {
      await db
        .delete(commentLikes)
        .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));
      
      await db
        .update(postComments)
        .set({ likes: sql`${postComments.likes} - 1` })
        .where(eq(postComments.id, commentId));
      
      return { liked: false };
    } else {
      await db.insert(commentLikes).values({ commentId, userId });
      
      await db
        .update(postComments)
        .set({ likes: sql`${postComments.likes} + 1` })
        .where(eq(postComments.id, commentId));
      
      return { liked: true };
    }
  }

  // Workout operations
  async getWorkouts(userId: string): Promise<Workout[]> {
    return await db.select().from(workouts).where(eq(workouts.ownerId, userId)).orderBy(desc(workouts.createdAt));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout> {
    const [updatedWorkout] = await db
      .update(workouts)
      .set({ ...workout, updatedAt: new Date() })
      .where(eq(workouts.id, id))
      .returning();
    return updatedWorkout;
  }

  async deleteWorkout(id: number): Promise<void> {
    await db.delete(workouts).where(eq(workouts.id, id));
  }

  // Exercise operations
  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises).orderBy(exercises.name);
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async getExerciseByName(name: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.name, name));
    return exercise;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  // Workout item operations
  async getWorkoutItems(workoutId: number): Promise<WorkoutItem[]> {
    return await db.select().from(workoutItems).where(eq(workoutItems.workoutId, workoutId)).orderBy(workoutItems.dayIndex, workoutItems.orderIndex);
  }

  async getWorkoutItemsWithExercises(workoutId: number): Promise<(WorkoutItem & { exerciseName: string; equipment?: string })[]> {
    return await db
      .select({
        id: workoutItems.id,
        workoutId: workoutItems.workoutId,
        exerciseId: workoutItems.exerciseId,
        dayIndex: workoutItems.dayIndex,
        orderIndex: workoutItems.orderIndex,
        sets: workoutItems.sets,
        reps: workoutItems.reps,
        rir: workoutItems.rir,
        restSec: workoutItems.restSec,
        notes: workoutItems.notes,
        createdAt: workoutItems.createdAt,
        exerciseName: exercises.name,
        equipment: exercises.equipment,
      })
      .from(workoutItems)
      .innerJoin(exercises, eq(workoutItems.exerciseId, exercises.id))
      .where(eq(workoutItems.workoutId, workoutId))
      .orderBy(workoutItems.dayIndex, workoutItems.orderIndex);
  }

  async createWorkoutItem(item: InsertWorkoutItem): Promise<WorkoutItem> {
    const [newItem] = await db.insert(workoutItems).values(item).returning();
    return newItem;
  }

  async updateWorkoutItem(id: number, item: Partial<InsertWorkoutItem>): Promise<WorkoutItem> {
    const [updatedItem] = await db
      .update(workoutItems)
      .set(item)
      .where(eq(workoutItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteWorkoutItem(id: number): Promise<void> {
    await db.delete(workoutItems).where(eq(workoutItems.id, id));
  }

  // Organization operations
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [newOrg] = await db.insert(organizations).values(org).returning();
    return newOrg;
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationWithCounts(id: number): Promise<(Organization & { coachCount: number; clientCount: number }) | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    if (!org) return undefined;

    // Count from old orgCoaches table
    const [oldCoachCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orgCoaches)
      .where(and(eq(orgCoaches.orgId, id), eq(orgCoaches.isActive, true)));

    // Count from old orgClients table
    const [oldClientCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orgClients)
      .where(and(eq(orgClients.orgId, id), eq(orgClients.isActive, true)));

    // Count from new org_users table (coaches)
    const [newCoachCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orgUsers)
      .where(and(
        eq(orgUsers.organizationId, id), 
        eq(orgUsers.role, 'coach'),
        eq(orgUsers.isActive, true),
        sql`${orgUsers.archivedAt} IS NULL`
      ));

    // Count from new org_users table (clients)
    const [newClientCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orgUsers)
      .where(and(
        eq(orgUsers.organizationId, id), 
        eq(orgUsers.role, 'client'),
        eq(orgUsers.isActive, true),
        sql`${orgUsers.archivedAt} IS NULL`
      ));

    // Sum counts from both old and new systems
    const totalCoachCount = Number(oldCoachCountResult?.count || 0) + Number(newCoachCountResult?.count || 0);
    const totalClientCount = Number(oldClientCountResult?.count || 0) + Number(newClientCountResult?.count || 0);

    return {
      ...org,
      coachCount: totalCoachCount,
      clientCount: totalClientCount,
    };
  }

  async updateOrganization(id: number, org: Partial<InsertOrganization>): Promise<Organization> {
    const [updated] = await db
      .update(organizations)
      .set({ ...org, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async softDeleteOrganization(id: number): Promise<Organization> {
    // First, get all org meal plan IDs and workout plan IDs for this organization
    const orgMealPlanIds = await db
      .select({ id: orgMealPlans.id })
      .from(orgMealPlans)
      .where(eq(orgMealPlans.orgId, id));
    
    const orgWorkoutPlanIds = await db
      .select({ id: orgWorkoutPlans.id })
      .from(orgWorkoutPlans)
      .where(eq(orgWorkoutPlans.orgId, id));
    
    const mealPlanIds = orgMealPlanIds.map(p => p.id);
    const workoutPlanIds = orgWorkoutPlanIds.map(p => p.id);
    
    // Delete plan assignments for org meal plans
    if (mealPlanIds.length > 0) {
      await db
        .delete(planAssignments)
        .where(
          and(
            eq(planAssignments.planType, 'meal'),
            sql`${planAssignments.planId} IN ${mealPlanIds}`
          )
        );
    }
    
    // Delete plan assignments for org workout plans
    if (workoutPlanIds.length > 0) {
      await db
        .delete(planAssignments)
        .where(
          and(
            eq(planAssignments.planType, 'workout'),
            sql`${planAssignments.planId} IN ${workoutPlanIds}`
          )
        );
    }
    
    // Delete all organization-related data in cascade order
    await db.delete(orgMessages).where(eq(orgMessages.orgId, id));
    await db.delete(orgMealPlans).where(eq(orgMealPlans.orgId, id));
    await db.delete(orgWorkoutPlans).where(eq(orgWorkoutPlans.orgId, id));
    await db.delete(orgCoaches).where(eq(orgCoaches.orgId, id));
    await db.delete(orgClients).where(eq(orgClients.orgId, id));
    await db.delete(orgUsers).where(eq(orgUsers.organizationId, id));
    await db.delete(orgMemberEntitlements).where(eq(orgMemberEntitlements.organizationId, id));
    await db.delete(organizationBillingPeriods).where(eq(organizationBillingPeriods.organizationId, id));
    
    // Finally, soft delete the organization itself
    const [deleted] = await db
      .update(organizations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    
    return deleted;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return await db.select().from(organizations).where(eq(organizations.ownerId, userId));
  }

  // Organization billing period operations
  async createBillingPeriod(period: InsertOrganizationBillingPeriod): Promise<OrganizationBillingPeriod> {
    const [newPeriod] = await db.insert(organizationBillingPeriods).values(period).returning();
    return newPeriod;
  }

  async getActiveBillingPeriod(orgId: number): Promise<OrganizationBillingPeriod | undefined> {
    const [period] = await db
      .select()
      .from(organizationBillingPeriods)
      .where(
        and(
          eq(organizationBillingPeriods.organizationId, orgId),
          eq(organizationBillingPeriods.status, 'active')
        )
      )
      .orderBy(sql`${organizationBillingPeriods.currentPeriodEndsAt} DESC`)
      .limit(1);
    return period;
  }

  async getAllBillingPeriods(orgId: number): Promise<OrganizationBillingPeriod[]> {
    return await db
      .select()
      .from(organizationBillingPeriods)
      .where(eq(organizationBillingPeriods.organizationId, orgId))
      .orderBy(sql`${organizationBillingPeriods.currentPeriodEndsAt} DESC`);
  }

  async getAllActiveBillingPeriods(): Promise<OrganizationBillingPeriod[]> {
    return await db
      .select()
      .from(organizationBillingPeriods)
      .where(eq(organizationBillingPeriods.status, 'active'))
      .orderBy(sql`${organizationBillingPeriods.organizationId} ASC`);
  }

  async getBillingPeriodByCheckoutSession(checkoutSessionId: string): Promise<OrganizationBillingPeriod | undefined> {
    const [period] = await db
      .select()
      .from(organizationBillingPeriods)
      .where(eq(organizationBillingPeriods.stripeCheckoutSessionId, checkoutSessionId))
      .limit(1);
    return period;
  }

  async runActivationMaintenanceForAllOrgs(): Promise<{ totalOrgsProcessed: number; totalCoachesLocked: number; totalClientsLocked: number }> {
    const activeBillingPeriods = await this.getAllActiveBillingPeriods();
    let totalOrgsProcessed = 0;
    let totalCoachesLocked = 0;
    let totalClientsLocked = 0;

    console.log(`[Activation Maintenance] Found ${activeBillingPeriods.length} active billing periods to process`);

    for (const period of activeBillingPeriods) {
      try {
        const coachQuota = period.baseCoachAllowance + period.addonCoachQty;
        const clientQuota = period.baseClientAllowance + period.addonClientQty;

        const result = await this.autoLockExcessMembers(
          period.organizationId,
          coachQuota,
          clientQuota,
          period.id
        );

        totalOrgsProcessed++;
        totalCoachesLocked += result.coachesLocked;
        totalClientsLocked += result.clientsLocked;

        if (result.coachesLocked > 0 || result.clientsLocked > 0) {
          console.log(
            `[Activation Maintenance] Org ${period.organizationId}: Locked ${result.coachesLocked} coaches, ${result.clientsLocked} clients`
          );
        }
      } catch (error) {
        console.error(`[Activation Maintenance] Failed for org ${period.organizationId}:`, error);
      }
    }

    console.log(
      `[Activation Maintenance] Complete: ${totalOrgsProcessed} orgs processed, ${totalCoachesLocked} coaches locked, ${totalClientsLocked} clients locked`
    );

    return { totalOrgsProcessed, totalCoachesLocked, totalClientsLocked };
  }

  async updateBillingPeriod(periodId: number, updates: Partial<InsertOrganizationBillingPeriod>): Promise<OrganizationBillingPeriod> {
    const [updated] = await db
      .update(organizationBillingPeriods)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizationBillingPeriods.id, periodId))
      .returning();
    return updated;
  }

  async getBillingPeriodByCheckoutSession(sessionId: string): Promise<OrganizationBillingPeriod | undefined> {
    const [period] = await db
      .select()
      .from(organizationBillingPeriods)
      .where(eq(organizationBillingPeriods.stripeCheckoutSessionId, sessionId));
    return period;
  }

  async checkAndUpdateExpiredPeriods(orgId: number): Promise<void> {
    const activePeriod = await this.getActiveBillingPeriod(orgId);
    if (!activePeriod) return;
    
    // Enforce capacity limits before checking expiration (catches manual DB changes)
    await this.enforceCapacityLimits(orgId);
    
    const now = new Date();
    if (now > activePeriod.currentPeriodEndsAt) {
      console.log(`[Subscription Expiry] Organization ${orgId} billing period has expired. Locking all members.`);
      
      await this.updateBillingPeriod(activePeriod.id, { status: 'expired' });
      
      // Update entitlements table
      await db.update(orgMemberEntitlements)
        .set({
          status: 'locked_expired',
          lockedReason: 'Billing period expired. Organization owner must renew access.',
          lockedAt: now,
          updatedAt: now
        })
        .where(and(
          eq(orgMemberEntitlements.organizationId, orgId),
          eq(orgMemberEntitlements.status, 'active')
        ));
      
      // CRITICAL: Lock ALL members in orgUsers table when subscription expires
      // After expiry, org reverts to FREE tier with 0 capacity, so ALL members must be locked
      const lockResult = await this.autoLockExcessMembers(orgId, 0, 0, activePeriod.id);
      console.log(`[Subscription Expiry] Locked ${lockResult.coachesLocked} coaches and ${lockResult.clientsLocked} clients for org ${orgId}`);
    }
  }

  // Organization member entitlement operations
  async createMemberEntitlement(entitlement: InsertOrgMemberEntitlement): Promise<OrgMemberEntitlement> {
    const [newEntitlement] = await db.insert(orgMemberEntitlements).values(entitlement).returning();
    return newEntitlement;
  }

  async getMemberEntitlement(orgId: number, memberId: string): Promise<OrgMemberEntitlement | undefined> {
    const [entitlement] = await db
      .select()
      .from(orgMemberEntitlements)
      .where(
        and(
          eq(orgMemberEntitlements.organizationId, orgId),
          eq(orgMemberEntitlements.memberId, memberId)
        )
      );
    return entitlement;
  }

  async getOrgEntitlements(orgId: number): Promise<OrgMemberEntitlement[]> {
    return await db
      .select()
      .from(orgMemberEntitlements)
      .where(eq(orgMemberEntitlements.organizationId, orgId));
  }

  async updateMemberEntitlement(entitlementId: number, updates: Partial<InsertOrgMemberEntitlement>): Promise<OrgMemberEntitlement> {
    const [updated] = await db
      .update(orgMemberEntitlements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orgMemberEntitlements.id, entitlementId))
      .returning();
    return updated;
  }

  async lockMembersByCapacity(orgId: number, role: 'coach' | 'client', keepActiveCount: number): Promise<void> {
    // Get all members of this role sorted by priority (lower rank = higher priority)
    const members = await db
      .select()
      .from(orgMemberEntitlements)
      .where(
        and(
          eq(orgMemberEntitlements.organizationId, orgId),
          eq(orgMemberEntitlements.role, role)
        )
      )
      .orderBy(orgMemberEntitlements.priorityRank);

    // Lock members beyond the keepActiveCount
    for (let i = keepActiveCount; i < members.length; i++) {
      await db
        .update(orgMemberEntitlements)
        .set({
          status: 'locked_capacity',
          lockedReason: `Exceeds ${role} capacity for current billing period`,
          lockedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orgMemberEntitlements.id, members[i].id));
    }
  }

  async getOrgsWhereUserIsCoach(userId: string): Promise<any[]> {
    const result = await db
      .select({
        organization: organizations
      })
      .from(orgCoaches)
      .innerJoin(organizations, eq(orgCoaches.orgId, organizations.id))
      .where(and(eq(orgCoaches.userId, userId), eq(orgCoaches.isActive, true)));
    
    return result;
  }

  async getOrgsWhereUserIsClient(userId: string): Promise<any[]> {
    const result = await db
      .select({
        organization: organizations
      })
      .from(orgClients)
      .innerJoin(organizations, eq(orgClients.orgId, organizations.id))
      .where(and(eq(orgClients.userId, userId), eq(orgClients.isActive, true)));
    
    return result;
  }

  // Org coach operations
  async addOrgCoach(coach: InsertOrgCoach): Promise<OrgCoach> {
    const [newCoach] = await db.insert(orgCoaches).values(coach).returning();
    return newCoach;
  }

  async getOrgCoaches(orgId: number): Promise<(OrgCoach & { user: User })[]> {
    const results = await db
      .select({
        orgCoach: orgCoaches,
        user: users,
      })
      .from(orgCoaches)
      .innerJoin(users, eq(orgCoaches.userId, users.id))
      .where(and(eq(orgCoaches.orgId, orgId), eq(orgCoaches.isActive, true)));

    return results.map(row => ({
      ...row.orgCoach,
      user: row.user,
    }));
  }

  async removeOrgCoach(orgId: number, userId: string): Promise<void> {
    // Handle old table (orgCoaches)
    await db
      .update(orgCoaches)
      .set({ isActive: false })
      .where(and(eq(orgCoaches.orgId, orgId), eq(orgCoaches.userId, userId)));
    
    // Handle new table (org_users) - could be ID or email-based
    // Try as numeric ID first
    const numericId = parseInt(userId);
    if (!isNaN(numericId)) {
      await db
        .update(orgUsers)
        .set({ isActive: false })
        .where(and(
          eq(orgUsers.organizationId, orgId), 
          eq(orgUsers.id, numericId),
          eq(orgUsers.role, 'coach')
        ));
    } else {
      // Try as email for legacy users table reference
      await db
        .update(orgUsers)
        .set({ isActive: false })
        .where(and(
          eq(orgUsers.organizationId, orgId), 
          eq(orgUsers.email, userId),
          eq(orgUsers.role, 'coach')
        ));
    }
  }

  async getOrgCoachCount(orgId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orgCoaches)
      .where(and(eq(orgCoaches.orgId, orgId), eq(orgCoaches.isActive, true)));
    return Number(result?.count || 0);
  }

  // Org client operations
  async addOrgClient(client: InsertOrgClient): Promise<OrgClient> {
    const [newClient] = await db.insert(orgClients).values(client).returning();
    return newClient;
  }

  async getOrgClients(orgId: number): Promise<(OrgClient & { user: User; coach?: User })[]> {
    const results = await db
      .select()
      .from(orgClients)
      .innerJoin(users, eq(orgClients.userId, users.id))
      .where(and(eq(orgClients.orgId, orgId), eq(orgClients.isActive, true)));

    // Map results to include user and coach info  
    const clientsWithDetails = [];
    for (const row of results) {
      const client = row.org_clients;
      const user = row.users;
      
      let coach = undefined;
      if (client.coachId) {
        const [coachData] = await db.select().from(users).where(eq(users.id, client.coachId));
        coach = coachData;
      }
      
      clientsWithDetails.push({
        ...client,
        user,
        coach,
      });
    }
    
    return clientsWithDetails;
  }

  async assignClientCoach(orgId: number, clientId: string, coachId: string | null): Promise<OrgClient> {
    const [updated] = await db
      .update(orgClients)
      .set({ coachId })
      .where(and(eq(orgClients.orgId, orgId), eq(orgClients.userId, clientId)))
      .returning();
    return updated;
  }

  async removeOrgClient(orgId: number, clientId: string): Promise<void> {
    // Handle old table (orgClients)
    await db
      .update(orgClients)
      .set({ isActive: false })
      .where(and(eq(orgClients.orgId, orgId), eq(orgClients.userId, clientId)));
    
    // Handle new table (org_users) - could be ID or email-based
    // Try as numeric ID first
    const numericId = parseInt(clientId);
    if (!isNaN(numericId)) {
      await db
        .update(orgUsers)
        .set({ isActive: false })
        .where(and(
          eq(orgUsers.organizationId, orgId), 
          eq(orgUsers.id, numericId),
          eq(orgUsers.role, 'client')
        ));
    } else {
      // Try as email for legacy users table reference
      await db
        .update(orgUsers)
        .set({ isActive: false })
        .where(and(
          eq(orgUsers.organizationId, orgId), 
          eq(orgUsers.email, clientId),
          eq(orgUsers.role, 'client')
        ));
    }
  }

  async getOrgClientCount(orgId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orgClients)
      .where(and(eq(orgClients.orgId, orgId), eq(orgClients.isActive, true)));
    return Number(result?.count || 0);
  }

  // Org user operations (email-based org members)
  async createOrgUser(orgUser: InsertOrgUser): Promise<OrgUser> {
    const [newOrgUser] = await db.insert(orgUsers).values(orgUser).returning();
    return newOrgUser;
  }

  async getOrgUser(id: number): Promise<OrgUser | undefined> {
    const [orgUser] = await db.select().from(orgUsers).where(eq(orgUsers.id, id));
    return orgUser;
  }

  async getOrgUserByEmail(email: string, orgId?: number): Promise<OrgUser | undefined> {
    if (orgId) {
      const [orgUser] = await db
        .select()
        .from(orgUsers)
        .where(and(
          eq(orgUsers.email, email), 
          eq(orgUsers.organizationId, orgId),
          eq(orgUsers.isActive, true)
        ));
      return orgUser;
    } else {
      // Find by email alone for login purposes (only active users)
      const [orgUser] = await db
        .select()
        .from(orgUsers)
        .where(and(
          eq(orgUsers.email, email),
          eq(orgUsers.isActive, true)
        ));
      return orgUser;
    }
  }

  async getOrgUsers(orgId: number, role?: 'coach' | 'client'): Promise<OrgUser[]> {
    if (role) {
      return await db
        .select()
        .from(orgUsers)
        .where(and(
          eq(orgUsers.organizationId, orgId), 
          eq(orgUsers.role, role), 
          eq(orgUsers.isActive, true),
          isNull(orgUsers.archivedAt)
        ))
        .orderBy(desc(orgUsers.createdAt));
    }
    return await db
      .select()
      .from(orgUsers)
      .where(and(
        eq(orgUsers.organizationId, orgId), 
        eq(orgUsers.isActive, true),
        isNull(orgUsers.archivedAt)
      ))
      .orderBy(desc(orgUsers.createdAt));
  }

  async getOrgUsersWithMetrics(orgId: number, role?: 'coach' | 'client'): Promise<any[]> {
    const orgUsersList = await this.getOrgUsers(orgId, role);
    
    const usersWithMetrics = await Promise.all(
      orgUsersList.map(async (orgUser) => {
        const assignments = await db
          .select()
          .from(planAssignments)
          .where(
            and(
              eq(planAssignments.clientId, orgUser.id.toString()),
              eq(planAssignments.isActive, true)
            )
          );
        
        const activePlans = assignments.length;
        const lastActivity = assignments.length > 0 
          ? assignments.reduce((latest, a) => {
              const assignedAt = new Date(a.assignedAt!);
              return assignedAt > latest ? assignedAt : latest;
            }, new Date(0))
          : null;
        
        // Calculate progress based on ACTUAL activity (last 7 days)
        // Activity weights: workouts=4pts, meals=2pts, habits=1pt, water=0.5pts
        let progress = 0;
        if (activePlans > 0) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const [workoutCount, mealCount, habitCount, waterCount] = await Promise.all([
            db.select({ count: sql<number>`count(*)::int` })
              .from(workoutLogs)
              .where(and(
                eq(workoutLogs.clientId, orgUser.id.toString()),
                gte(workoutLogs.completedAt, sevenDaysAgo)
              ))
              .then(r => r[0]?.count || 0),
            
            db.select({ count: sql<number>`count(*)::int` })
              .from(mealLogs)
              .where(and(
                eq(mealLogs.userId, orgUser.id.toString()),
                gte(mealLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])
              ))
              .then(r => r[0]?.count || 0),
            
            db.select({ count: sql<number>`count(*)::int` })
              .from(habitLogs)
              .where(and(
                eq(habitLogs.userId, orgUser.id.toString()),
                eq(habitLogs.completed, true),
                gte(habitLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])
              ))
              .then(r => r[0]?.count || 0),
            
            db.select({ count: sql<number>`count(*)::int` })
              .from(waterLogs)
              .where(and(
                eq(waterLogs.userId, orgUser.id.toString()),
                gte(waterLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])
              ))
              .then(r => r[0]?.count || 0),
          ]);
          
          // Calculate weighted activity score
          const activityScore = (workoutCount * 4) + (mealCount * 2) + (habitCount * 1) + (waterCount * 0.5);
          
          // Expected activity over 7 days: 3 workouts, 21 meals, 7 habits, 7 water logs
          // (3*4) + (21*2) + (7*1) + (7*0.5) = 12 + 42 + 7 + 3.5 = 64.5
          const expectedScore = 64.5;
          
          // Convert to percentage (cap at 100%)
          progress = Math.min(100, Math.round((activityScore / expectedScore) * 100));
        }
        
        // Get active meal plan and workout plan names
        const mealPlanAssignment = assignments.find(a => a.planType === 'meal');
        const workoutPlanAssignment = assignments.find(a => a.planType === 'workout');
        
        let mealPlanName = null;
        let workoutPlanName = null;
        
        if (mealPlanAssignment) {
          const [mealPlan] = mealPlanAssignment.planId 
            ? await db.select().from(orgMealPlans).where(eq(orgMealPlans.id, parseInt(mealPlanAssignment.planId)))
            : [];
          mealPlanName = mealPlan?.name || null;
        }
        
        if (workoutPlanAssignment) {
          const [workoutPlan] = workoutPlanAssignment.planId
            ? await db.select().from(orgWorkoutPlans).where(eq(orgWorkoutPlans.id, parseInt(workoutPlanAssignment.planId)))
            : [];
          workoutPlanName = workoutPlan?.name || null;
        }
        
        return {
          ...orgUser,
          activePlans,
          lastActivity: lastActivity ? formatDistanceToNow(lastActivity, { addSuffix: true }) : 'No activity',
          progress,
          mealPlan: mealPlanName,
          workoutPlan: workoutPlanName,
        };
      })
    );
    
    return usersWithMetrics;
  }

  async updateOrgUser(id: number, updates: Partial<InsertOrgUser>): Promise<OrgUser> {
    const [updated] = await db
      .update(orgUsers)
      .set(updates)
      .where(eq(orgUsers.id, id))
      .returning();
    return updated;
  }

  async removeOrgUser(id: number): Promise<void> {
    // Get the org user to emit deactivation event
    const orgUser = await this.getOrgUser(id);
    if (!orgUser) {
      throw new Error('Org user not found');
    }

    const now = new Date();
    
    // Soft delete: set archived_at only, keep status unchanged to preserve historical state
    await db
      .update(orgUsers)
      .set({ 
        archivedAt: now,
        isActive: false 
      })
      .where(eq(orgUsers.id, id));

    // Get current billing period for logging
    const activePeriod = await this.getActiveBillingPeriod(orgUser.organizationId);
    
    // Emit deactivation event
    if (activePeriod) {
      await this.logActivationEvent({
        organizationId: orgUser.organizationId,
        orgUserId: id,
        billingPeriodId: activePeriod.id,
        oldStatus: orgUser.status || 'active',
        newStatus: 'inactive',
        reason: 'member_removed',
        changedBy: 'system',
      });
    }
  }

  async ensureOrgUserActive(
    orgId: number,
    email: string,
    role: 'coach' | 'client',
    firstName?: string,
    lastName?: string
  ): Promise<{ success: boolean; user?: OrgUser; error?: string; errorCode?: string }> {
    // Look up archived member
    const [archivedMember] = await db
      .select()
      .from(orgUsers)
      .where(
        and(
          eq(orgUsers.organizationId, orgId),
          eq(orgUsers.email, email),
          eq(orgUsers.role, role),
          sql`${orgUsers.archivedAt} IS NOT NULL`
        )
      );

    // If no archived member, create new one
    if (!archivedMember) {
      const newUser = await this.createOrgUser({
        email,
        role,
        organizationId: orgId,
        firstName: firstName || null,
        lastName: lastName || null,
      });
      return { success: true, user: newUser };
    }

    // Archived member found - check if they can be reactivated
    
    // Check for manual lock (only block if manually locked)
    if (archivedMember.status === 'locked_manual') {
      return {
        success: false,
        errorCode: 'LOCKED_MANUAL',
        error: 'Member access was manually locked by an admin'
      };
    }

    // Note: We don't block on locked_downgrade status for archived members
    // because they were locked due to capacity in a previous period.
    // We'll recalculate their status based on current capacity below.

    // Get current billing period
    const currentPeriod = await this.getActiveBillingPeriod(orgId);
    if (!currentPeriod) {
      return {
        success: false,
        errorCode: 'NO_BILLING_PERIOD',
        error: 'No active billing period found'
      };
    }

    // Check swap rules
    let swapCount = archivedMember.swapCount || 0;
    const lastSwapPeriodId = archivedMember.lastSwapPeriodId;

    // Reset swap count if this is a new billing period
    if (lastSwapPeriodId !== currentPeriod.id) {
      swapCount = 0;
    }

    // Check if already swapped once in current period
    if (lastSwapPeriodId === currentPeriod.id && swapCount >= 1) {
      return {
        success: false,
        errorCode: 'SWAP_LIMIT',
        error: 'Member already swapped once this billing period'
      };
    }

    // Check capacity
    const [activeCountResult] = await db
      .select({ count: count() })
      .from(orgUsers)
      .where(
        and(
          eq(orgUsers.organizationId, orgId),
          eq(orgUsers.role, role),
          sql`${orgUsers.archivedAt} IS NULL`,
          eq(orgUsers.status, 'active')
        )
      );

    const activeCount = Number(activeCountResult?.count || 0);

    // Get tier limits from billing period
    const baseAllowance = role === 'coach' 
      ? currentPeriod.baseCoachAllowance 
      : currentPeriod.baseClientAllowance;
    const addonQty = role === 'coach'
      ? currentPeriod.addonCoachQty
      : currentPeriod.addonClientQty;
    const capacity = baseAllowance + addonQty;

    // Determine new status based on capacity
    let newStatus: 'active' | 'locked_downgrade';
    if (activeCount >= capacity) {
      newStatus = 'locked_downgrade';
    } else {
      newStatus = 'active';
    }

    // Update the archived member
    const now = new Date();
    const [updatedMember] = await db
      .update(orgUsers)
      .set({
        archivedAt: null, // Clear archived timestamp
        status: newStatus,
        isActive: newStatus === 'active',
        firstName: firstName || archivedMember.firstName,
        lastName: lastName || archivedMember.lastName,
        swapCount: swapCount + 1,
        lastSwapPeriodId: currentPeriod.id,
      })
      .where(eq(orgUsers.id, archivedMember.id))
      .returning();

    // Emit activation event
    await this.logActivationEvent({
      organizationId: orgId,
      orgUserId: archivedMember.id,
      billingPeriodId: currentPeriod.id,
      oldStatus: archivedMember.status || 'locked_manual',
      newStatus: newStatus,
      reason: newStatus === 'active' ? 'member_reactivated' : 'member_reactivated_locked',
      changedBy: 'system',
    });

    return { success: true, user: updatedMember };
  }

  // Org member activation management operations
  async swapMemberActivation(
    orgId: number, 
    activateMemberId: number, 
    deactivateMemberId: number, 
    changedBy: string
  ): Promise<{ success: boolean; message: string }> {
    // Prevent self-swap
    if (activateMemberId === deactivateMemberId) {
      return { success: false, message: 'Cannot swap a member with themselves' };
    }

    // Get current active billing period
    const activePeriod = await this.getActiveBillingPeriod(orgId);
    if (!activePeriod) {
      return { success: false, message: 'No active billing period found' };
    }

    // Get both members
    const [memberToActivate, memberToDeactivate] = await Promise.all([
      this.getOrgUser(activateMemberId),
      this.getOrgUser(deactivateMemberId),
    ]);

    if (!memberToActivate || !memberToDeactivate) {
      return { success: false, message: 'One or both members not found' };
    }

    // Validate same organization
    if (memberToActivate.organizationId !== orgId || memberToDeactivate.organizationId !== orgId) {
      return { success: false, message: 'Members must belong to the organization' };
    }

    // Validate same role
    if (memberToActivate.role !== memberToDeactivate.role) {
      return { success: false, message: 'Can only swap members with the same role' };
    }

    // Validate status transitions
    if (memberToActivate.status === 'active') {
      return { success: false, message: 'Member is already active' };
    }
    
    if (memberToDeactivate.status !== 'active') {
      return { success: false, message: 'Can only deactivate currently active members' };
    }

    // Check for valid statuses (must be active or locked, not invited/pending)
    const validStatuses = ['active', 'locked_downgrade', 'locked_manual'];
    if (!validStatuses.includes(memberToActivate.status || '')) {
      return { success: false, message: 'Cannot activate members with pending or invalid status' };
    }

    // Use database transaction to ensure atomicity and prevent race conditions
    try {
      await db.transaction(async (tx) => {
        const now = new Date();
        
        // Use PostgreSQL advisory lock to serialize swaps for this org/role/billing period
        // Lock key is hash of (orgId, role, billingPeriodId) to ensure uniqueness
        const lockId = (orgId * 1000000) + (memberToActivate.role === 'coach' ? 1 : 2) * 1000 + (activePeriod.id % 1000);
        const lockResult = await tx.execute(sql`SELECT pg_try_advisory_xact_lock(${lockId})`);
        
        // @ts-ignore - pg_try_advisory_xact_lock returns a boolean
        if (!lockResult.rows[0]?.pg_try_advisory_xact_lock) {
          throw new Error('Another swap operation is in progress. Please try again.');
        }

        // Re-read members and billing period with FOR UPDATE to ensure consistency
        const [freshMemberToActivate] = await tx
          .select()
          .from(orgUsers)
          .where(eq(orgUsers.id, activateMemberId))
          .for('update');
        
        const [freshMemberToDeactivate] = await tx
          .select()
          .from(orgUsers)
          .where(eq(orgUsers.id, deactivateMemberId))
          .for('update');
        
        const [freshBillingPeriod] = await tx
          .select()
          .from(organizationBillingPeriods)
          .where(eq(organizationBillingPeriods.id, activePeriod.id))
          .for('update');

        if (!freshMemberToActivate || !freshMemberToDeactivate || !freshBillingPeriod) {
          throw new Error('Failed to acquire lock on required records');
        }

        const role = memberToActivate.role;

        // ANTI-EXPLOITATION CHECK 1: Member can only be swapped in once per billing cycle
        if (freshMemberToActivate.swappedInThisCycle) {
          // Log rejection for audit trail
          await tx.insert(orgMemberActivationEvents).values({
            organizationId: orgId,
            orgUserId: activateMemberId,
            billingPeriodId: activePeriod.id,
            oldStatus: freshMemberToActivate.status || 'locked_downgrade',
            newStatus: freshMemberToActivate.status || 'locked_downgrade',
            reason: 'swap_rejected_already_swapped',
            changedBy,
          });
          throw new Error(`This ${role} has already been swapped in during this billing cycle. Each member can only be activated once per period.`);
        }

        // ANTI-EXPLOITATION CHECK 2: Verify swap budget remaining for this role
        const swapBudget = role === 'coach' ? freshBillingPeriod.swapBudgetCoach : freshBillingPeriod.swapBudgetClient;
        
        if (swapBudget <= 0) {
          // Log rejection for audit trail
          await tx.insert(orgMemberActivationEvents).values({
            organizationId: orgId,
            orgUserId: activateMemberId,
            billingPeriodId: activePeriod.id,
            oldStatus: freshMemberToActivate.status || 'locked_downgrade',
            newStatus: freshMemberToActivate.status || 'locked_downgrade',
            reason: 'swap_rejected_budget_exhausted',
            changedBy,
          });
          throw new Error(`${role === 'coach' ? 'Coach' : 'Client'} swap budget exhausted for this billing period. You've used all available swaps.`);
        }

        // ANTI-EXPLOITATION CHECK 3: Enforce 48-hour cooldown between swaps for this role
        const lastSwapTimestamp = role === 'coach' ? freshBillingPeriod.lastSwapTimestampCoach : freshBillingPeriod.lastSwapTimestampClient;
        if (lastSwapTimestamp) {
          const hoursSinceLastSwap = (now.getTime() - lastSwapTimestamp.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastSwap < 48) {
            const hoursRemaining = Math.ceil(48 - hoursSinceLastSwap);
            // Log rejection for audit trail
            await tx.insert(orgMemberActivationEvents).values({
              organizationId: orgId,
              orgUserId: activateMemberId,
              billingPeriodId: activePeriod.id,
              oldStatus: freshMemberToActivate.status || 'locked_downgrade',
              newStatus: freshMemberToActivate.status || 'locked_downgrade',
              reason: 'swap_rejected_cooldown',
              changedBy,
            });
            throw new Error(`${role === 'coach' ? 'Coach' : 'Client'} swap cooldown active. Please wait ${hoursRemaining} more hours before swapping again.`);
          }
        }
        
        // Activate the locked member and mark as swapped in
        await tx.update(orgUsers)
          .set({ 
            status: 'active',
            swappedInThisCycle: true, // Anti-exploitation: prevent re-swapping this member
            lastActivationChangeAt: now,
            lastActivationChangePeriodId: activePeriod.id,
          })
          .where(eq(orgUsers.id, activateMemberId));
        
        // Deactivate the active member (keep swappedInThisCycle unchanged for tracking)
        await tx.update(orgUsers)
          .set({ 
            status: 'locked_manual',
            lastActivationChangeAt: now,
            lastActivationChangePeriodId: activePeriod.id,
          })
          .where(eq(orgUsers.id, deactivateMemberId));

        // Decrement swap budget and update cooldown timestamp for this role
        if (role === 'coach') {
          await tx.update(organizationBillingPeriods)
            .set({
              swapBudgetCoach: freshBillingPeriod.swapBudgetCoach - 1,
              lastSwapTimestampCoach: now,
            })
            .where(eq(organizationBillingPeriods.id, activePeriod.id));
        } else {
          await tx.update(organizationBillingPeriods)
            .set({
              swapBudgetClient: freshBillingPeriod.swapBudgetClient - 1,
              lastSwapTimestampClient: now,
            })
            .where(eq(organizationBillingPeriods.id, activePeriod.id));
        }

        // Log both events
        await tx.insert(orgMemberActivationEvents).values([
          {
            organizationId: orgId,
            orgUserId: activateMemberId,
            billingPeriodId: activePeriod.id,
            oldStatus: memberToActivate.status,
            newStatus: 'active',
            reason: 'swap',
            changedBy,
          },
          {
            organizationId: orgId,
            orgUserId: deactivateMemberId,
            billingPeriodId: activePeriod.id,
            oldStatus: memberToDeactivate.status || 'active',
            newStatus: 'locked_manual',
            reason: 'swap',
            changedBy,
          },
        ]);
      });

      return { success: true, message: 'Members swapped successfully' };
    } catch (error: any) {
      console.error('Swap transaction failed:', error);
      // Return the specific error message if it's our validation error
      if (error.message && error.message.includes('swap has already been performed')) {
        return { success: false, message: error.message };
      }
      return { success: false, message: 'Swap operation failed. Please try again.' };
    }
  }

  async canSwapInCurrentPeriod(orgId: number, role: 'coach' | 'client', billingPeriodId: number): Promise<{ canSwap: boolean; reason?: string }> {
    // Get all swap events for this org/period
    const swapEvents = await db
      .select()
      .from(orgMemberActivationEvents)
      .where(
        and(
          eq(orgMemberActivationEvents.organizationId, orgId),
          eq(orgMemberActivationEvents.billingPeriodId, billingPeriodId),
          eq(orgMemberActivationEvents.reason, 'swap')
        )
      );

    if (swapEvents.length === 0) {
      return { canSwap: true }; // No swaps yet
    }

    // Check if any of these swap events involve a member with the specified role
    for (const event of swapEvents) {
      const member = await db
        .select()
        .from(orgUsers)
        .where(eq(orgUsers.id, event.orgUserId))
        .limit(1);
      
      if (member.length > 0 && member[0].role === role) {
        return { 
          canSwap: false, 
          reason: `A ${role} swap has already been performed this billing cycle. You can only swap once per role per billing period.` 
        };
      }
    }

    return { canSwap: true };
  }

  async logActivationEvent(event: InsertOrgMemberActivationEvent): Promise<OrgMemberActivationEvent> {
    const [newEvent] = await db
      .insert(orgMemberActivationEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async getActivationEvents(orgId: number, billingPeriodId?: number): Promise<OrgMemberActivationEvent[]> {
    if (billingPeriodId) {
      return await db
        .select()
        .from(orgMemberActivationEvents)
        .where(
          and(
            eq(orgMemberActivationEvents.organizationId, orgId),
            eq(orgMemberActivationEvents.billingPeriodId, billingPeriodId)
          )
        )
        .orderBy(desc(orgMemberActivationEvents.changedAt));
    }

    return await db
      .select()
      .from(orgMemberActivationEvents)
      .where(eq(orgMemberActivationEvents.organizationId, orgId))
      .orderBy(desc(orgMemberActivationEvents.changedAt));
  }

  async getActivationEventsWithMemberInfo(orgId: number, billingPeriodId?: number): Promise<any[]> {
    const query = db
      .select({
        id: orgMemberActivationEvents.id,
        organizationId: orgMemberActivationEvents.organizationId,
        orgUserId: orgMemberActivationEvents.orgUserId,
        billingPeriodId: orgMemberActivationEvents.billingPeriodId,
        oldStatus: orgMemberActivationEvents.oldStatus,
        newStatus: orgMemberActivationEvents.newStatus,
        reason: orgMemberActivationEvents.reason,
        changedBy: orgMemberActivationEvents.changedBy,
        changedAt: orgMemberActivationEvents.changedAt,
        memberEmail: orgUsers.email,
        memberFirstName: orgUsers.firstName,
        memberLastName: orgUsers.lastName,
        memberRole: orgUsers.role,
      })
      .from(orgMemberActivationEvents)
      .leftJoin(orgUsers, eq(orgMemberActivationEvents.orgUserId, orgUsers.id))
      .where(
        billingPeriodId
          ? and(
              eq(orgMemberActivationEvents.organizationId, orgId),
              eq(orgMemberActivationEvents.billingPeriodId, billingPeriodId)
            )
          : eq(orgMemberActivationEvents.organizationId, orgId)
      )
      .orderBy(desc(orgMemberActivationEvents.changedAt));

    return await query;
  }

  async resetSwapTrackingForNewPeriod(orgId: number): Promise<void> {
    // Reset swappedInThisCycle for all members when a NEW billing period is created
    // This gives fresh swap budget for the new cycle
    await db.update(orgUsers)
      .set({ swappedInThisCycle: false })
      .where(eq(orgUsers.organizationId, orgId));
  }

  async autoLockExcessMembers(orgId: number, coachQuota: number, clientQuota: number, billingPeriodId: number): Promise<{ coachesLocked: number, clientsLocked: number }> {
    let coachesLocked = 0;
    let clientsLocked = 0;

    await db.transaction(async (tx) => {
      const now = new Date();

      // Get active coaches ordered by createdAt (oldest first) - NULL status is treated as active
      const activeCoaches = await tx
        .select()
        .from(orgUsers)
        .where(
          and(
            eq(orgUsers.organizationId, orgId),
            eq(orgUsers.role, 'coach'),
            eq(orgUsers.isActive, true),
            or(
              eq(orgUsers.status, 'active'),
              isNull(orgUsers.status)
            )
          )
        )
        .orderBy(asc(orgUsers.createdAt));

      // Get active clients ordered by createdAt (oldest first) - NULL status is treated as active
      const activeClients = await tx
        .select()
        .from(orgUsers)
        .where(
          and(
            eq(orgUsers.organizationId, orgId),
            eq(orgUsers.role, 'client'),
            eq(orgUsers.isActive, true),
            or(
              eq(orgUsers.status, 'active'),
              isNull(orgUsers.status)
            )
          )
        )
        .orderBy(asc(orgUsers.createdAt));

      // Lock excess coaches if active > quota
      if (activeCoaches.length > coachQuota) {
        const excessCoaches = activeCoaches.slice(coachQuota); // Get oldest coaches beyond quota
        coachesLocked = excessCoaches.length;

        for (const coach of excessCoaches) {
          // Update status to locked_downgrade
          await tx.update(orgUsers)
            .set({
              status: 'locked_downgrade',
              lastActivationChangeAt: now,
              lastActivationChangePeriodId: billingPeriodId,
            })
            .where(eq(orgUsers.id, coach.id));

          // Log activation event
          await tx.insert(orgMemberActivationEvents).values({
            organizationId: orgId,
            orgUserId: coach.id,
            billingPeriodId,
            oldStatus: 'active',
            newStatus: 'locked_downgrade',
            reason: 'downgrade',
            changedBy: 'system', // System-initiated
          });
        }
      }

      // Lock excess clients if active > quota
      if (activeClients.length > clientQuota) {
        const excessClients = activeClients.slice(clientQuota); // Get oldest clients beyond quota
        clientsLocked = excessClients.length;

        for (const client of excessClients) {
          // Update status to locked_downgrade
          await tx.update(orgUsers)
            .set({
              status: 'locked_downgrade',
              lastActivationChangeAt: now,
              lastActivationChangePeriodId: billingPeriodId,
            })
            .where(eq(orgUsers.id, client.id));

          // Log activation event
          await tx.insert(orgMemberActivationEvents).values({
            organizationId: orgId,
            orgUserId: client.id,
            billingPeriodId,
            oldStatus: 'active',
            newStatus: 'locked_downgrade',
            reason: 'downgrade',
            changedBy: 'system', // System-initiated
          });
        }
      }
    });

    return { coachesLocked, clientsLocked };
  }

  // Auto-unlock locked_downgrade members when capacity becomes available
  async autoUnlockWhenCapacityAvailable(orgId: number, coachQuota: number, clientQuota: number, billingPeriodId: number): Promise<{ coachesUnlocked: number, clientsUnlocked: number }> {
    let coachesUnlocked = 0;
    let clientsUnlocked = 0;

    await db.transaction(async (tx) => {
      const now = new Date();

      // Count current active members (NULL status is treated as active)
      const activeCoachCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(orgUsers)
        .where(
          and(
            eq(orgUsers.organizationId, orgId),
            eq(orgUsers.role, 'coach'),
            eq(orgUsers.isActive, true),
            or(
              eq(orgUsers.status, 'active'),
              isNull(orgUsers.status)
            )
          )
        )
        .then(result => Number(result[0]?.count || 0));

      const activeClientCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(orgUsers)
        .where(
          and(
            eq(orgUsers.organizationId, orgId),
            eq(orgUsers.role, 'client'),
            eq(orgUsers.isActive, true),
            or(
              eq(orgUsers.status, 'active'),
              isNull(orgUsers.status)
            )
          )
        )
        .then(result => Number(result[0]?.count || 0));

      // Unlock coaches if there's available capacity
      if (activeCoachCount < coachQuota) {
        const availableSlots = coachQuota - activeCoachCount;
        
        // Get locked_downgrade coaches ordered by when they were locked (earliest first)
        const lockedCoaches = await tx
          .select()
          .from(orgUsers)
          .where(
            and(
              eq(orgUsers.organizationId, orgId),
              eq(orgUsers.role, 'coach'),
              eq(orgUsers.isActive, true),
              eq(orgUsers.status, 'locked_downgrade')
            )
          )
          .orderBy(asc(orgUsers.lastActivationChangeAt))
          .limit(availableSlots);

        coachesUnlocked = lockedCoaches.length;

        for (const coach of lockedCoaches) {
          // Update status to active
          await tx.update(orgUsers)
            .set({
              status: 'active',
              lastActivationChangeAt: now,
              lastActivationChangePeriodId: billingPeriodId,
            })
            .where(eq(orgUsers.id, coach.id));

          // Log activation event
          await tx.insert(orgMemberActivationEvents).values({
            organizationId: orgId,
            orgUserId: coach.id,
            billingPeriodId,
            oldStatus: 'locked_downgrade',
            newStatus: 'active',
            reason: 'auto_unlock',
            changedBy: 'system',
          });
        }
      }

      // Unlock clients if there's available capacity
      if (activeClientCount < clientQuota) {
        const availableSlots = clientQuota - activeClientCount;
        
        // Get locked_downgrade clients ordered by when they were locked (earliest first)
        const lockedClients = await tx
          .select()
          .from(orgUsers)
          .where(
            and(
              eq(orgUsers.organizationId, orgId),
              eq(orgUsers.role, 'client'),
              eq(orgUsers.isActive, true),
              eq(orgUsers.status, 'locked_downgrade')
            )
          )
          .orderBy(asc(orgUsers.lastActivationChangeAt))
          .limit(availableSlots);

        clientsUnlocked = lockedClients.length;

        for (const client of lockedClients) {
          // Update status to active
          await tx.update(orgUsers)
            .set({
              status: 'active',
              lastActivationChangeAt: now,
              lastActivationChangePeriodId: billingPeriodId,
            })
            .where(eq(orgUsers.id, client.id));

          // Log activation event
          await tx.insert(orgMemberActivationEvents).values({
            organizationId: orgId,
            orgUserId: client.id,
            billingPeriodId,
            oldStatus: 'locked_downgrade',
            newStatus: 'active',
            reason: 'auto_unlock',
            changedBy: 'system',
          });
        }
      }
    });

    return { coachesUnlocked, clientsUnlocked };
  }

  // Enforce capacity limits - automatically locks excess members if active count exceeds quota
  // This is called at key access points to catch manual DB changes or other edge cases
  async enforceCapacityLimits(orgId: number): Promise<{ enforced: boolean, coachesLocked: number, clientsLocked: number }> {
    const billingPeriod = await this.getActiveBillingPeriod(orgId);
    
    if (!billingPeriod) {
      return { enforced: false, coachesLocked: 0, clientsLocked: 0 };
    }

    // Calculate total quotas (defensive parseInt to handle any data issues)
    const coachQuota = parseInt(String(billingPeriod.baseCoachAllowance)) + parseInt(String(billingPeriod.addonCoachQty));
    const clientQuota = parseInt(String(billingPeriod.baseClientAllowance)) + parseInt(String(billingPeriod.addonClientQty));

    // Count active members (NULL status is treated as active)
    const activeCoachCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(orgUsers)
      .where(
        and(
          eq(orgUsers.organizationId, orgId),
          eq(orgUsers.role, 'coach'),
          eq(orgUsers.isActive, true),
          or(
            eq(orgUsers.status, 'active'),
            isNull(orgUsers.status)
          )
        )
      )
      .then(result => Number(result[0]?.count || 0));

    const activeClientCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(orgUsers)
      .where(
        and(
          eq(orgUsers.organizationId, orgId),
          eq(orgUsers.role, 'client'),
          eq(orgUsers.isActive, true),
          or(
            eq(orgUsers.status, 'active'),
            isNull(orgUsers.status)
          )
        )
      )
      .then(result => Number(result[0]?.count || 0));

    // Check if locking is needed (over capacity)
    const needsLocking = activeCoachCount > coachQuota || activeClientCount > clientQuota;
    let coachesLocked = 0;
    let clientsLocked = 0;

    if (needsLocking) {
      console.log(`[CAPACITY ENFORCEMENT] Org ${orgId}: Active coaches ${activeCoachCount} > quota ${coachQuota} or active clients ${activeClientCount} > quota ${clientQuota}`);
      
      const lockResult = await this.autoLockExcessMembers(orgId, coachQuota, clientQuota, billingPeriod.id);
      coachesLocked = lockResult.coachesLocked;
      clientsLocked = lockResult.clientsLocked;
      
      console.log(`[CAPACITY ENFORCEMENT] Locked ${coachesLocked} coaches and ${clientsLocked} clients`);
    }

    // Check if unlocking is possible (under capacity with locked_downgrade members)
    // This runs even if no locking occurred, to handle member deletions
    const unlockResult = await this.autoUnlockWhenCapacityAvailable(orgId, coachQuota, clientQuota, billingPeriod.id);
    
    if (unlockResult.coachesUnlocked > 0 || unlockResult.clientsUnlocked > 0) {
      console.log(`[CAPACITY ENFORCEMENT] Auto-unlocked ${unlockResult.coachesUnlocked} coaches and ${unlockResult.clientsUnlocked} clients`);
    }

    return { 
      enforced: needsLocking || unlockResult.coachesUnlocked > 0 || unlockResult.clientsUnlocked > 0, 
      coachesLocked, 
      clientsLocked 
    };
  }

  // Org meal plan operations
  async createOrgMealPlan(plan: InsertOrgMealPlan): Promise<OrgMealPlan> {
    const [newPlan] = await db.insert(orgMealPlans).values(plan).returning();
    return newPlan;
  }

  async getOrgMealPlans(orgId: number): Promise<OrgMealPlan[]> {
    return await db
      .select()
      .from(orgMealPlans)
      .where(eq(orgMealPlans.orgId, orgId))
      .orderBy(desc(orgMealPlans.createdAt));
  }

  // Org workout plan operations
  async createOrgWorkoutPlan(plan: InsertOrgWorkoutPlan): Promise<OrgWorkoutPlan> {
    const [newPlan] = await db.insert(orgWorkoutPlans).values(plan).returning();
    return newPlan;
  }

  async getOrgWorkoutPlans(orgId: number): Promise<OrgWorkoutPlan[]> {
    return await db
      .select()
      .from(orgWorkoutPlans)
      .where(eq(orgWorkoutPlans.orgId, orgId))
      .orderBy(desc(orgWorkoutPlans.createdAt));
  }

  async getOrgMealPlansWithCounts(orgId: number): Promise<any[]> {
    const plans = await this.getOrgMealPlans(orgId);
    
    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(DISTINCT ${planAssignments.clientId})::int` })
          .from(planAssignments)
          .where(
            and(
              eq(planAssignments.planId, plan.id),
              eq(planAssignments.planType, 'meal'),
              eq(planAssignments.isActive, true)
            )
          );
        
        return {
          ...plan,
          assignedCount: count || 0
        };
      })
    );
    
    return plansWithCounts;
  }

  async getOrgWorkoutPlansWithCounts(orgId: number): Promise<any[]> {
    const plans = await this.getOrgWorkoutPlans(orgId);
    
    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(DISTINCT ${planAssignments.clientId})::int` })
          .from(planAssignments)
          .where(
            and(
              eq(planAssignments.planId, plan.id),
              eq(planAssignments.planType, 'workout'),
              eq(planAssignments.isActive, true)
            )
          );
        
        return {
          ...plan,
          assignedCount: count || 0
        };
      })
    );
    
    return plansWithCounts;
  }

  async deleteOrgMealPlan(planId: number): Promise<void> {
    // First delete all plan assignments for this meal plan
    await db.delete(planAssignments).where(
      and(
        eq(planAssignments.planId, planId),
        eq(planAssignments.planType, 'meal')
      )
    );
    // Then delete the meal plan itself
    await db.delete(orgMealPlans).where(eq(orgMealPlans.id, planId));
  }

  async deleteOrgWorkoutPlan(planId: number): Promise<void> {
    // First delete all plan assignments for this workout plan
    await db.delete(planAssignments).where(
      and(
        eq(planAssignments.planId, planId),
        eq(planAssignments.planType, 'workout')
      )
    );
    // Then delete the workout plan itself
    await db.delete(orgWorkoutPlans).where(eq(orgWorkoutPlans.id, planId));
  }

  // Plan assignment operations
  async assignPlanToClients(assignments: InsertPlanAssignment[]): Promise<PlanAssignment[]> {
    const newAssignments = await db.insert(planAssignments).values(assignments).returning();
    return newAssignments;
  }

  async getClientPlanAssignments(clientId: string): Promise<PlanAssignment[]> {
    return await db
      .select()
      .from(planAssignments)
      .where(and(eq(planAssignments.clientId, clientId), eq(planAssignments.isActive, true)))
      .orderBy(desc(planAssignments.assignedAt));
  }

  // Org message operations
  async createOrgMessage(message: InsertOrgMessage): Promise<OrgMessage> {
    const [newMessage] = await db.insert(orgMessages).values(message).returning();
    return newMessage;
  }

  async getOrgMessages(
    orgId: number,
    filters?: { messageType?: 'community' | 'dm'; limit?: number; offset?: number }
  ): Promise<(OrgMessage & { sender: User; recipient?: User })[]> {
    // Build predicates array
    const predicates = [eq(orgMessages.orgId, orgId)];
    
    if (filters?.messageType) {
      predicates.push(eq(orgMessages.messageType, filters.messageType));
    }

    // Get all messages first
    let query = db
      .select()
      .from(orgMessages)
      .where(and(...predicates))
      .orderBy(desc(orgMessages.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const messages = await query;

    // For each message, fetch sender info based on senderType
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        let sender: User | undefined;
        
        if (message.senderType === 'org_member') {
          // Fetch from organization_members
          const [member] = await db
            .select()
            .from(orgUsers)
            .where(eq(orgUsers.id, parseInt(message.senderId)))
            .limit(1);
          
          if (member) {
            // Convert org member to User shape for compatibility
            sender = {
              id: member.id.toString(),
              email: member.email,
              firstName: member.firstName,
              lastName: member.lastName,
              profileImageUrl: null,
              userType: member.role,
              currentOrgId: member.organizationId,
              password: null,
              authProvider: 'email',
              googleId: null,
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              subscriptionStatus: 'trial',
              subscriptionTier: 'free',
              trialEndsAt: null,
              createdAt: member.createdAt,
              updatedAt: member.updatedAt || member.createdAt,
            } as User;
          }
        } else {
          // Fetch from users table
          [sender] = await db
            .select()
            .from(users)
            .where(eq(users.id, message.senderId))
            .limit(1);
        }

        return {
          ...message,
          sender: sender!,
          recipient: undefined,
        };
      })
    );

    return messagesWithSenders;
  }

  async getDirectMessageConversations(
    orgId: number,
    userId: string,
    userType: 'user' | 'org_member'
  ): Promise<Array<{
    participantId: string;
    participantName: string;
    participantType: 'user' | 'org_member';
    lastMessage: string;
    lastMessageAt: Date;
    unreadCount: number;
  }>> {
    // Get all DMs where user is sender or recipient
    const dms = await db
      .select()
      .from(orgMessages)
      .where(
        and(
          eq(orgMessages.orgId, orgId),
          eq(orgMessages.messageType, 'dm'),
          or(
            and(
              eq(orgMessages.senderId, userId),
              eq(orgMessages.senderType, userType)
            ),
            and(
              eq(orgMessages.recipientId, userId),
              eq(orgMessages.recipientType, userType)
            )
          )
        )
      )
      .orderBy(desc(orgMessages.createdAt));

    // Group by conversation partner
    const conversationMap = new Map<string, {
      participantId: string;
      participantType: 'user' | 'org_member';
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
    }>();

    for (const dm of dms) {
      const isReceiver = dm.recipientId === userId && dm.recipientType === userType;
      const partnerId = isReceiver ? dm.senderId : dm.recipientId!;
      const partnerType = isReceiver ? dm.senderType : dm.recipientType!;
      
      if (!conversationMap.has(partnerId)) {
        const unreadCount = dms.filter(
          msg => msg.recipientId === userId && 
                 msg.senderId === partnerId && 
                 !msg.isRead
        ).length;

        conversationMap.set(partnerId, {
          participantId: partnerId,
          participantType: partnerType as 'user' | 'org_member',
          lastMessage: dm.content,
          lastMessageAt: dm.createdAt!,
          unreadCount,
        });
      }
    }

    // Fetch names for all participants
    const conversations = await Promise.all(
      Array.from(conversationMap.values()).map(async (conv) => {
        let participantName = 'Unknown';
        
        try {
          if (conv.participantType === 'org_member') {
            const participantIdNum = parseInt(conv.participantId);
            if (isNaN(participantIdNum)) {
              console.error(`[DM] Invalid org_member participantId: ${conv.participantId}`);
            } else {
              const [member] = await db
                .select()
                .from(orgUsers)
                .where(eq(orgUsers.id, participantIdNum))
                .limit(1);
              if (member) {
                participantName = `${member.firstName} ${member.lastName}`;
              } else {
                console.error(`[DM] Org member not found: ${participantIdNum}`);
              }
            }
          } else {
            const [user] = await db
              .select()
              .from(users)
              .where(eq(users.id, conv.participantId))
              .limit(1);
            if (user) {
              participantName = `${user.firstName} ${user.lastName}`;
            } else {
              console.error(`[DM] User not found: ${conv.participantId}`);
            }
          }
        } catch (error) {
          console.error(`[DM] Error fetching participant name:`, error);
        }

        return {
          ...conv,
          participantName,
        };
      })
    );

    return conversations;
  }

  async getDirectMessageThread(
    orgId: number,
    userId: string,
    participantId: string,
    userType: 'user' | 'org_member'
  ): Promise<(OrgMessage & { sender: User; recipient?: User })[]> {
    // Get all messages between the two users
    const messages = await db
      .select()
      .from(orgMessages)
      .where(
        and(
          eq(orgMessages.orgId, orgId),
          eq(orgMessages.messageType, 'dm'),
          or(
            and(
              eq(orgMessages.senderId, userId),
              eq(orgMessages.recipientId, participantId)
            ),
            and(
              eq(orgMessages.senderId, participantId),
              eq(orgMessages.recipientId, userId)
            )
          )
        )
      )
      .orderBy(orgMessages.createdAt);

    // Populate sender info for each message (similar to getOrgMessages)
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        let sender: User | undefined;
        
        if (message.senderType === 'org_member') {
          const [member] = await db
            .select()
            .from(orgUsers)
            .where(eq(orgUsers.id, parseInt(message.senderId)))
            .limit(1);
          
          if (member) {
            sender = {
              id: member.id.toString(),
              email: member.email,
              firstName: member.firstName,
              lastName: member.lastName,
              profileImageUrl: null,
              userType: member.role,
              currentOrgId: member.organizationId,
              password: null,
              authProvider: 'email',
              googleId: null,
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              subscriptionStatus: 'trial',
              subscriptionTier: 'free',
              trialEndsAt: null,
              createdAt: member.createdAt,
              updatedAt: member.updatedAt || member.createdAt,
            } as User;
          }
        } else {
          [sender] = await db
            .select()
            .from(users)
            .where(eq(users.id, message.senderId))
            .limit(1);
        }

        return {
          ...message,
          sender: sender!,
          recipient: undefined,
        };
      })
    );

    return messagesWithSenders;
  }

  async markMessagesAsRead(messageIds: number[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    await db
      .update(orgMessages)
      .set({ isRead: true })
      .where(sql`${orgMessages.id} IN (${sql.join(messageIds.map(id => sql`${id}`), sql`, `)})`);
  }

  async getOrganizationMembers(
    orgId: number
  ): Promise<Array<{ id: string; name: string; email: string; role: string; type: 'user' | 'org_member' }>> {
    // Get the organization owner
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const members: Array<{ id: string; name: string; email: string; role: string; type: 'user' | 'org_member' }> = [];

    if (org) {
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, org.ownerId))
        .limit(1);
      
      if (owner) {
        members.push({
          id: owner.id,
          name: `${owner.firstName} ${owner.lastName}`,
          email: owner.email,
          role: 'owner',
          type: 'user',
        });
      }
    }

    // Get all organization members (coaches and clients)
    const orgMembers = await db
      .select()
      .from(orgUsers)
      .where(eq(orgUsers.organizationId, orgId));

    for (const member of orgMembers) {
      members.push({
        id: member.id.toString(),
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        role: member.role,
        type: 'org_member',
      });
    }

    return members;
  }

  // User organization operations
  async updateUserOrgSettings(userId: string, updates: { userType?: string; currentOrgId?: number | null }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPayment(paymentIntentId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntentId));
    return payment;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getUserActivePayment(userId: string): Promise<Payment | undefined> {
    const now = new Date();
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(payments.status, 'succeeded'),
          gte(payments.expiresAt, now)
        )
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);
    return payment;
  }

  // User points operations
  async getUserPoints(userId: string): Promise<UserPoints | undefined> {
    const [points] = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId));
    return points;
  }

  async awardPoints(userId: string, points: number): Promise<UserPoints> {
    // Get current points or create new record
    const currentPoints = await this.getUserPoints(userId);
    const now = new Date();

    if (currentPoints) {
      // Update existing points (both weekly and total)
      const newWeekly = currentPoints.weeklyPoints + points;
      const newTotal = currentPoints.totalPoints + points;
      let newTier: 'bronze' | 'silver' | 'gold' = 'bronze';
      if (newWeekly >= 100) newTier = 'gold';
      else if (newWeekly >= 50) newTier = 'silver';

      const [updated] = await db
        .update(userPoints)
        .set({
          weeklyPoints: newWeekly,
          totalPoints: newTotal,
          tier: newTier,
          updatedAt: now,
        })
        .where(eq(userPoints.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new points record
      let tier: 'bronze' | 'silver' | 'gold' = 'bronze';
      if (points >= 100) tier = 'gold';
      else if (points >= 50) tier = 'silver';

      const [created] = await db
        .insert(userPoints)
        .values({
          userId,
          weeklyPoints: points,
          totalPoints: points,
          tier,
          currentWeekStart: now,
        })
        .returning();
      return created;
    }
  }

  async getLeaderboard(limit: number = 10): Promise<(UserPoints & { user: User })[]> {
    const results = await db
      .select({
        points: userPoints,
        user: users,
      })
      .from(userPoints)
      .innerJoin(users, eq(userPoints.userId, users.id))
      .orderBy(desc(userPoints.weeklyPoints)) // Sort by weekly points instead
      .limit(limit);

    return results.map(row => ({
      ...row.points,
      user: row.user,
    }));
  }

  async getUserRank(userId: string): Promise<number> {
    const userPointsRecord = await this.getUserPoints(userId);
    if (!userPointsRecord) return 0;

    const result = await db
      .select({ count: count() })
      .from(userPoints)
      .where(sql`${userPoints.weeklyPoints} > ${userPointsRecord.weeklyPoints}`); // Compare weekly points

    return (result[0]?.count || 0) + 1;
  }

  async resetWeeklyPoints(): Promise<void> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get top 10 from current week to archive
    const topUsers = await this.getLeaderboard(10);
    
    // Archive the weekly winners
    const archiveEntries: InsertWeeklyLeaderboard[] = topUsers.map((entry, index) => ({
      userId: entry.userId,
      weekStart: weekStart,
      weekEnd: now,
      weeklyPoints: entry.weeklyPoints,
      rank: index + 1,
      tier: entry.tier,
    }));

    if (archiveEntries.length > 0) {
      await db.insert(weeklyLeaderboard).values(archiveEntries);
    }

    // Reset all weekly points to 0
    await db.update(userPoints).set({
      weeklyPoints: 0,
      tier: 'bronze',
      currentWeekStart: now,
      updatedAt: now,
    });

    console.log(`Weekly points reset completed. Archived ${archiveEntries.length} winners.`);
  }

  async getWeeklyLeaderboardHistory(limit: number = 10): Promise<(WeeklyLeaderboard & { user: User })[]> {
    const results = await db
      .select({
        leaderboard: weeklyLeaderboard,
        user: users,
      })
      .from(weeklyLeaderboard)
      .innerJoin(users, eq(weeklyLeaderboard.userId, users.id))
      .orderBy(desc(weeklyLeaderboard.weekEnd), weeklyLeaderboard.rank)
      .limit(limit);

    return results.map(row => ({
      ...row.leaderboard,
      user: row.user,
    }));
  }

  // Organization analytics operations
  async getMostActiveClients(orgId: number, limit: number = 10): Promise<Array<{
    clientId: string;
    name: string;
    email: string;
    activityScore: number;
    activityPercentage: number;
  }>> {
    // 30-day rolling window
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all active clients for this org using raw SQL
    const orgClientsResult = await db.execute<{
      id: number;
      email: string;
      first_name: string | null;
      last_name: string | null;
    }>(
      sql`SELECT id, email, first_name, last_name 
          FROM org_users 
          WHERE organization_id = ${orgId}
            AND role = 'client'
            AND is_active = true
            AND (status = 'active' OR status IS NULL)`
    );
    const orgClients = orgClientsResult.rows.map(r => ({
      id: r.id,
      userId: r.id.toString(), // For org members, id IS their userId
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
    }));

    if (orgClients.length === 0) {
      return [];
    }

    const clientIds = orgClients.map(c => c.userId);

    // Get activity counts for each client (last 30 days)
    // Activity weights: workouts=4pts, meals=2pts, habits=1pt, water=0.5pts
    const activityData = await Promise.all(clientIds.map(async (clientId) => {
      const [workoutCount, mealCount, habitCount, waterCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` })
          .from(workoutLogs)
          .where(and(
            eq(workoutLogs.clientId, clientId),
            gte(workoutLogs.completedAt, thirtyDaysAgo)
          ))
          .then(r => r[0]?.count || 0),
        
        db.select({ count: sql<number>`count(*)::int` })
          .from(mealLogs)
          .where(and(
            eq(mealLogs.userId, clientId),
            gte(mealLogs.logDate, thirtyDaysAgo.toISOString().split('T')[0])
          ))
          .then(r => r[0]?.count || 0),
        
        db.select({ count: sql<number>`count(*)::int` })
          .from(habitLogs)
          .where(and(
            eq(habitLogs.userId, clientId),
            eq(habitLogs.completed, true),
            gte(habitLogs.logDate, thirtyDaysAgo.toISOString().split('T')[0])
          ))
          .then(r => r[0]?.count || 0),
        
        db.select({ count: sql<number>`count(*)::int` })
          .from(waterLogs)
          .where(and(
            eq(waterLogs.userId, clientId),
            gte(waterLogs.logDate, thirtyDaysAgo.toISOString().split('T')[0])
          ))
          .then(r => r[0]?.count || 0),
      ]);

      // Weighted score: workouts=4, meals=2, habits=1, water=0.5
      const activityScore = (workoutCount * 4) + (mealCount * 2) + (habitCount * 1) + (waterCount * 0.5);

      return {
        clientId,
        activityScore,
        workoutCount,
        mealCount,
        habitCount,
        waterCount
      };
    }));

    // Find max score for percentage calculation
    const maxScore = Math.max(...activityData.map(d => d.activityScore), 1);

    // Combine client info with activity data
    const clientsWithActivity = orgClients.map(client => {
      const activity = activityData.find(a => a.clientId === client.userId);
      return {
        clientId: client.userId,
        name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email,
        email: client.email,
        activityScore: activity?.activityScore || 0,
        activityPercentage: maxScore > 0 ? Math.round((activity?.activityScore || 0) / maxScore * 100) : 0,
      };
    });

    // Sort by activity score and return top N
    return clientsWithActivity
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, limit);
  }

  async getCoachPerformance(orgId: number): Promise<Array<{
    coachId: string;
    name: string;
    email: string;
    clientCount: number;
    plansCreated: number;
    successRate: number;
  }>> {
    // Get all active coaches for this org using raw SQL
    const orgCoachesResult = await db.execute<{
      id: number;
      email: string;
      first_name: string | null;
      last_name: string | null;
    }>(
      sql`SELECT id, email, first_name, last_name 
          FROM org_users 
          WHERE organization_id = ${orgId}
            AND role = 'coach'
            AND is_active = true
            AND (status = 'active' OR status IS NULL)`
    );
    const orgCoaches = orgCoachesResult.rows.map(r => ({
      id: r.id,
      userId: r.id.toString(), // For org members, id IS their userId
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
    }));

    if (orgCoaches.length === 0) {
      return [];
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const coachPerformance = await Promise.all(orgCoaches.map(async (coach) => {
      // Count clients assigned to this coach (via plan assignments)
      const clientsAssigned = await db
        .select({ clientId: planAssignments.clientId })
        .from(planAssignments)
        .where(and(
          eq(planAssignments.assignedBy, coach.userId),
          eq(planAssignments.isActive, true)
        ))
        .then(results => {
          const uniqueClients = new Set(results.map(r => r.clientId));
          return uniqueClients.size;
        });

      // Count plans created by this coach
      const [mealPlansCount, workoutPlansCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` })
          .from(orgMealPlans)
          .where(and(
            eq(orgMealPlans.orgId, orgId),
            eq(orgMealPlans.createdBy, coach.userId)
          ))
          .then(r => r[0]?.count || 0),
        
        db.select({ count: sql<number>`count(*)::int` })
          .from(orgWorkoutPlans)
          .where(and(
            eq(orgWorkoutPlans.orgId, orgId),
            eq(orgWorkoutPlans.createdBy, coach.userId)
          ))
          .then(r => r[0]?.count || 0),
      ]);

      // Calculate success rate: % of coach's clients who logged activity in last 7 days
      let successRate = 0;
      if (clientsAssigned > 0) {
        const activeClientIds = await db
          .select({ clientId: planAssignments.clientId })
          .from(planAssignments)
          .where(and(
            eq(planAssignments.assignedBy, coach.userId),
            eq(planAssignments.isActive, true)
          ))
          .then(results => Array.from(new Set(results.map(r => r.clientId))));

        // Check which clients have logged activity in last 7 days
        const activeClientsCount = await Promise.all(activeClientIds.map(async (clientId) => {
          const hasActivity = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(workoutLogs)
            .where(and(
              eq(workoutLogs.clientId, clientId),
              gte(workoutLogs.completedAt, sevenDaysAgo)
            ))
            .then(r => r[0]?.count || 0);
          
          return hasActivity > 0 ? 1 : 0;
        }));

        const activeCount = activeClientsCount.reduce((sum, val) => sum + val, 0);
        successRate = Math.round((activeCount / clientsAssigned) * 100);
      }

      return {
        coachId: coach.userId,
        name: `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || coach.email,
        email: coach.email,
        clientCount: clientsAssigned,
        plansCreated: mealPlansCount + workoutPlansCount,
        successRate,
      };
    }));

    return coachPerformance.sort((a, b) => b.clientCount - a.clientCount);
  }

  async getClientProgressMetrics(orgId: number): Promise<{
    completionRate: number;
    excellent: number;
    good: number;
    needsHelp: number;
  }> {
    // Get all active clients using raw SQL
    const orgClientsResult = await db.execute<{ id: number }>(
      sql`SELECT id 
          FROM org_users 
          WHERE organization_id = ${orgId}
            AND role = 'client'
            AND is_active = true
            AND (status = 'active' OR status IS NULL)`
    );
    const orgClients = orgClientsResult.rows.map(r => ({ userId: r.id.toString() }));

    if (orgClients.length === 0) {
      return { completionRate: 0, excellent: 0, good: 0, needsHelp: 100 };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Calculate activity for each client
    const clientActivities = await Promise.all(orgClients.map(async (client) => {
      const totalLogs = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(workoutLogs)
        .where(and(
          eq(workoutLogs.clientId, client.userId),
          gte(workoutLogs.completedAt, thirtyDaysAgo)
        ))
        .then(r => r[0]?.count || 0);
      
      return totalLogs;
    }));

    // Categorize clients based on activity (logs in last 30 days)
    // Excellent: ≥20 logs (66%+ days active), Good: 10-19 logs (33-66%), Needs Help: <10 logs
    let excellentCount = 0;
    let goodCount = 0;
    let needsHelpCount = 0;

    clientActivities.forEach(logCount => {
      if (logCount >= 20) {
        excellentCount++;
      } else if (logCount >= 10) {
        goodCount++;
      } else {
        needsHelpCount++;
      }
    });

    const totalClients = orgClients.length;
    const completionRate = Math.round(((excellentCount + goodCount) / totalClients) * 100);

    return {
      completionRate,
      excellent: Math.round((excellentCount / totalClients) * 100),
      good: Math.round((goodCount / totalClients) * 100),
      needsHelp: Math.round((needsHelpCount / totalClients) * 100),
    };
  }

  async getPlanCompletionRates(orgId: number): Promise<{
    mealAdherence: number;
    workoutCompletion: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get clients with active meal plan assignments using raw query
    const mealPlanClientsResult = await db.execute<{ client_id: string }>(
      sql`SELECT DISTINCT pa.client_id 
          FROM plan_assignments pa
          INNER JOIN org_meal_plans omp ON pa.plan_id = omp.id
          WHERE omp.org_id = ${orgId}
            AND pa.plan_type = 'meal'
            AND pa.is_active = true`
    );
    const mealPlanClients = mealPlanClientsResult.rows.map(r => r.client_id);

    // Get clients with active workout plan assignments using raw query
    const workoutPlanClientsResult = await db.execute<{ client_id: string }>(
      sql`SELECT DISTINCT pa.client_id 
          FROM plan_assignments pa
          INNER JOIN org_workout_plans owp ON pa.plan_id = owp.id
          WHERE owp.org_id = ${orgId}
            AND pa.plan_type = 'workout'
            AND pa.is_active = true`
    );
    const workoutPlanClients = workoutPlanClientsResult.rows.map(r => r.client_id);

    // Calculate meal adherence
    let mealAdherence = 0;
    if (mealPlanClients.length > 0) {
      const mealLogsCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(mealLogs)
        .where(and(
          sql`${mealLogs.userId} IN (${sql.join(mealPlanClients.map(id => sql`${id}`), sql`, `)})`,
          gte(mealLogs.logDate, thirtyDaysAgo.toISOString().split('T')[0])
        ))
        .then(r => r[0]?.count || 0);

      // Expected: 3 meals/day * 30 days * number of clients with meal plans
      const expectedMeals = mealPlanClients.length * 30 * 3;
      mealAdherence = Math.min(100, Math.round((mealLogsCount / expectedMeals) * 100));
    }

    // Calculate workout completion
    let workoutCompletion = 0;
    if (workoutPlanClients.length > 0) {
      const workoutDaysCount = await db
        .select({ 
          clientId: workoutLogs.clientId,
          logDate: sql<string>`DATE(${workoutLogs.completedAt})`,
        })
        .from(workoutLogs)
        .where(and(
          sql`${workoutLogs.clientId} IN (${sql.join(workoutPlanClients.map(id => sql`${id}`), sql`, `)})`,
          gte(workoutLogs.completedAt, thirtyDaysAgo)
        ))
        .then(results => {
          // Count unique days per client
          const uniqueDays = new Set(results.map(r => `${r.clientId}-${r.logDate}`));
          return uniqueDays.size;
        });

      // Expected: 4 workouts/week * 4 weeks * number of clients = 16 workout days per client
      const expectedWorkoutDays = workoutPlanClients.length * 16;
      workoutCompletion = Math.min(100, Math.round((workoutDaysCount / expectedWorkoutDays) * 100));
    }

    return {
      mealAdherence,
      workoutCompletion,
    };
  }

  // Get 30-day activity trend for org owner dashboard
  async getActivityTrend(orgId: number): Promise<Array<{
    date: string;
    workouts: number;
    meals: number;
    habits: number;
    water: number;
  }>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all active clients for this org
    const orgClientsResult = await db.execute<{ id: number }>(
      sql`SELECT id FROM org_users 
          WHERE organization_id = ${orgId}
            AND role = 'client'
            AND is_active = true
            AND (status = 'active' OR status IS NULL)`
    );
    const clientIds = orgClientsResult.rows.map(r => r.id.toString());
    
    if (clientIds.length === 0) {
      return [];
    }
    
    // Generate array of last 30 days
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Get daily activity counts
    const trend = await Promise.all(dates.map(async (date) => {
      const [workouts, meals, habits, water] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` })
          .from(workoutLogs)
          .where(and(
            sql`${workoutLogs.clientId} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`,
            sql`DATE(${workoutLogs.completedAt}) = ${date}`
          ))
          .then(r => r[0]?.count || 0),
        
        db.select({ count: sql<number>`count(*)::int` })
          .from(mealLogs)
          .where(and(
            sql`${mealLogs.userId} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`,
            eq(mealLogs.logDate, date)
          ))
          .then(r => r[0]?.count || 0),
        
        db.select({ count: sql<number>`count(*)::int` })
          .from(habitLogs)
          .where(and(
            sql`${habitLogs.userId} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`,
            eq(habitLogs.completed, true),
            eq(habitLogs.logDate, date)
          ))
          .then(r => r[0]?.count || 0),
        
        db.select({ count: sql<number>`count(*)::int` })
          .from(waterLogs)
          .where(and(
            sql`${waterLogs.userId} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`,
            eq(waterLogs.logDate, date)
          ))
          .then(r => r[0]?.count || 0),
      ]);
      
      return { date, workouts, meals, habits, water };
    }));
    
    return trend;
  }

  // Get team capacity info for org owner dashboard
  async getTeamCapacity(orgId: number): Promise<{
    coachesUsed: number;
    coachesAllowed: number;
    clientsUsed: number;
    clientsAllowed: number;
  }> {
    // Get active billing period
    const billingPeriod = await this.getActiveBillingPeriod(orgId);
    
    // Count active members
    const coachesUsed = await db.execute<{ count: number }>(
      sql`SELECT COUNT(*)::int as count FROM org_users 
          WHERE organization_id = ${orgId}
            AND role = 'coach'
            AND is_active = true
            AND (status = 'active' OR status IS NULL)`
    ).then(r => r.rows[0]?.count || 0);
    
    const clientsUsed = await db.execute<{ count: number }>(
      sql`SELECT COUNT(*)::int as count FROM org_users 
          WHERE organization_id = ${orgId}
            AND role = 'client'
            AND is_active = true
            AND (status = 'active' OR status IS NULL)`
    ).then(r => r.rows[0]?.count || 0);
    
    const coachesAllowed = billingPeriod 
      ? billingPeriod.baseCoachAllowance + billingPeriod.addonCoachQty 
      : 0;
    const clientsAllowed = billingPeriod 
      ? billingPeriod.baseClientAllowance + billingPeriod.addonClientQty 
      : 0;
    
    return {
      coachesUsed,
      coachesAllowed,
      clientsUsed,
      clientsAllowed,
    };
  }

  // Get clients needing attention for coach dashboard
  async getLowActivityClients(orgId: number, coachId?: string): Promise<Array<{
    clientId: string;
    name: string;
    email: string;
    progress: number;
    lastActivityDays: number;
    reason: string;
  }>> {
    // Get all active clients (optionally filtered by coach)
    let clientsResult;
    if (coachId) {
      clientsResult = await db.execute<{
        id: number;
        email: string;
        first_name: string | null;
        last_name: string | null;
      }>(
        sql`SELECT id, email, first_name, last_name 
            FROM org_users 
            WHERE organization_id = ${orgId}
              AND role = 'client'
              AND is_active = true
              AND (status = 'active' OR status IS NULL)
              AND coach_id = ${coachId}`
      );
    } else {
      clientsResult = await db.execute<{
        id: number;
        email: string;
        first_name: string | null;
        last_name: string | null;
      }>(
        sql`SELECT id, email, first_name, last_name 
            FROM org_users 
            WHERE organization_id = ${orgId}
              AND role = 'client'
              AND is_active = true
              AND (status = 'active' OR status IS NULL)`
      );
    }
    
    const clients = clientsResult.rows.map(r => ({
      id: r.id,
      userId: r.id.toString(),
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
    }));
    
    if (clients.length === 0) {
      return [];
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Calculate progress and activity for each client
    const lowActivityClients = await Promise.all(
      clients.map(async (client) => {
        const [workoutCount, mealCount, habitCount, waterCount, lastWorkout, lastMeal] = await Promise.all([
          db.select({ count: sql<number>`count(*)::int` })
            .from(workoutLogs)
            .where(and(
              eq(workoutLogs.clientId, client.userId),
              gte(workoutLogs.completedAt, sevenDaysAgo)
            ))
            .then(r => r[0]?.count || 0),
          
          db.select({ count: sql<number>`count(*)::int` })
            .from(mealLogs)
            .where(and(
              eq(mealLogs.userId, client.userId),
              gte(mealLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])
            ))
            .then(r => r[0]?.count || 0),
          
          db.select({ count: sql<number>`count(*)::int` })
            .from(habitLogs)
            .where(and(
              eq(habitLogs.userId, client.userId),
              eq(habitLogs.completed, true),
              gte(habitLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])
            ))
            .then(r => r[0]?.count || 0),
          
          db.select({ count: sql<number>`count(*)::int` })
            .from(waterLogs)
            .where(and(
              eq(waterLogs.userId, client.userId),
              gte(waterLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])
            ))
            .then(r => r[0]?.count || 0),
          
          db.select({ completedAt: workoutLogs.completedAt })
            .from(workoutLogs)
            .where(eq(workoutLogs.clientId, client.userId))
            .orderBy(desc(workoutLogs.completedAt))
            .limit(1)
            .then(r => r[0]?.completedAt || null),
          
          db.select({ logDate: mealLogs.logDate })
            .from(mealLogs)
            .where(eq(mealLogs.userId, client.userId))
            .orderBy(desc(mealLogs.logDate))
            .limit(1)
            .then(r => r[0]?.logDate || null),
        ]);
        
        // Calculate progress
        const activityScore = (workoutCount * 4) + (mealCount * 2) + (habitCount * 1) + (waterCount * 0.5);
        const expectedScore = 64.5;
        const progress = Math.min(100, Math.round((activityScore / expectedScore) * 100));
        
        // Calculate days since last activity
        const lastActivity = lastWorkout || lastMeal;
        const lastActivityDays = lastActivity 
          ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        // Determine reason for low activity
        let reason = '';
        if (progress < 30) {
          reason = 'Very low activity';
        } else if (lastActivityDays >= 3) {
          reason = `No activity for ${lastActivityDays} days`;
        }
        
        return {
          clientId: client.userId,
          name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email,
          email: client.email,
          progress,
          lastActivityDays,
          reason,
        };
      })
    );
    
    // Filter clients with progress < 30% OR 3+ days inactive
    return lowActivityClients
      .filter(c => c.progress < 30 || c.lastActivityDays >= 3)
      .sort((a, b) => a.progress - b.progress);
  }

  // Get habit and water compliance for coach dashboard
  async getHabitWaterCompliance(orgId: number, coachId?: string): Promise<Array<{
    clientId: string;
    name: string;
    habitCompliance: number;
    waterCompliance: number;
  }>> {
    // Get all active clients (optionally filtered by coach)
    let clientsResult;
    if (coachId) {
      clientsResult = await db.execute<{
        id: number;
        email: string;
        first_name: string | null;
        last_name: string | null;
      }>(
        sql`SELECT id, email, first_name, last_name 
            FROM org_users 
            WHERE organization_id = ${orgId}
              AND role = 'client'
              AND is_active = true
              AND (status = 'active' OR status IS NULL)
              AND coach_id = ${coachId}`
      );
    } else {
      clientsResult = await db.execute<{
        id: number;
        email: string;
        first_name: string | null;
        last_name: string | null;
      }>(
        sql`SELECT id, email, first_name, last_name 
            FROM org_users 
            WHERE organization_id = ${orgId}
              AND role = 'client'
              AND is_active = true
              AND (status = 'active' OR status IS NULL)`
      );
    }
    
    const clients = clientsResult.rows.map(r => ({
      id: r.id,
      userId: r.id.toString(),
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
    }));
    
    if (clients.length === 0) {
      return [];
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Calculate compliance for each client
    const compliance = await Promise.all(
      clients.map(async (client) => {
        const [habitCount, waterCount] = await Promise.all([
          db.select({ count: sql<number>`count(*)::int` })
            .from(habitLogs)
            .where(and(
              eq(habitLogs.userId, client.userId),
              eq(habitLogs.completed, true),
              gte(habitLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])
            ))
            .then(r => r[0]?.count || 0),
          
          db.select({ count: sql<number>`count(*)::int` })
            .from(waterLogs)
            .where(and(
              eq(waterLogs.userId, client.userId),
              gte(waterLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])
            ))
            .then(r => r[0]?.count || 0),
        ]);
        
        // Expected: 7 days of tracking
        const habitCompliance = Math.min(100, Math.round((habitCount / 7) * 100));
        const waterCompliance = Math.min(100, Math.round((waterCount / 7) * 100));
        
        return {
          clientId: client.userId,
          name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email,
          habitCompliance,
          waterCompliance,
        };
      })
    );
    
    return compliance;
  }
}

export const storage = new DatabaseStorage();
