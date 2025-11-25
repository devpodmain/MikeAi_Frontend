import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { users, organizations, orgCoaches, orgClients } from "@shared/schema";

// Helper function to get user ID from Passport authentication
export function getUserId(req: any): string | null {
  // Check for authenticated user from Passport
  if (req.user?.id) {
    return req.user.id;
  }
  
  return null;
}

// Middleware to verify user is member of the specified organization
export async function requireOrgMembership(req: any, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const orgId = parseInt(req.params.orgId || req.params.id);
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    // Check if user is owner
    const org = await storage.getOrganization(orgId);
    if (org?.ownerId === userId) {
      req.userOrgRole = 'owner';
      req.organizationId = orgId;
      return next();
    }

    // Check if user is in org_users table (new system)
    // org_users.id is integer, session stores it as string "1", "2", etc
    const orgUsers = await storage.getOrgUsers(orgId);
    const userIdAsInt = parseInt(userId);
    if (!isNaN(userIdAsInt)) {
      const orgUser = orgUsers.find(u => u.id === userIdAsInt);
      if (orgUser) {
        // Check activation status - block locked members
        const status = orgUser.status || 'active';
        if (status === 'locked_downgrade' || status === 'locked_manual') {
          return res.status(403).json({ 
            message: "Your access has been paused by your organization. Please contact your organization owner.",
            locked: true,
            reason: status === 'locked_downgrade' ? 'subscription_downgrade' : 'manual_lock'
          });
        }
        
        req.userOrgRole = orgUser.role; // 'coach' or 'client'
        req.organizationId = orgId;
        return next();
      }
    }

    // Check if user is coach (old system)
    const coaches = await storage.getOrgCoaches(orgId);
    const isCoach = coaches.some(coach => coach.userId === userId);
    if (isCoach) {
      req.userOrgRole = 'coach';
      req.organizationId = orgId;
      return next();
    }

    // Check if user is client (old system)
    const clients = await storage.getOrgClients(orgId);
    const client = clients.find(client => client.userId === userId);
    if (client) {
      req.userOrgRole = 'client';
      req.organizationId = orgId;
      req.assignedCoachId = client.coachId;
      return next();
    }

    return res.status(403).json({ message: "Access denied: Not a member of this organization" });
  } catch (error) {
    console.error('Error in requireOrgMembership:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to verify user is the owner of the organization
export async function requireOrgOwner(req: any, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const orgId = parseInt(req.params.orgId || req.params.id);
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    const org = await storage.getOrganization(orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    if (org.ownerId !== userId) {
      return res.status(403).json({ message: "Access denied: Only organization owners can perform this action" });
    }

    req.userOrgRole = 'owner';
    req.organizationId = orgId;
    req.organization = org;
    next();
  } catch (error) {
    console.error('Error in requireOrgOwner:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to verify user is a coach in the organization
export async function requireCoach(req: any, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const orgId = parseInt(req.params.orgId || req.params.id);
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    // Check org_users table first (new system)
    const orgUsers = await storage.getOrgUsers(orgId);
    const userIdAsInt = parseInt(userId);
    if (!isNaN(userIdAsInt)) {
      const orgUser = orgUsers.find(u => u.id === userIdAsInt && u.role === 'coach');
      if (orgUser) {
        // Check activation status - block locked coaches
        const status = orgUser.status || 'active';
        if (status === 'locked_downgrade' || status === 'locked_manual') {
          return res.status(403).json({ 
            message: "Your access has been paused by your organization. Please contact your organization owner.",
            locked: true,
            reason: status === 'locked_downgrade' ? 'subscription_downgrade' : 'manual_lock'
          });
        }
        
        req.userOrgRole = 'coach';
        req.organizationId = orgId;
        return next();
      }
    }

    // Check old org_coaches table for backwards compatibility
    const coaches = await storage.getOrgCoaches(orgId);
    const isCoach = coaches.some(coach => coach.userId === userId);
    
    if (!isCoach) {
      return res.status(403).json({ message: "Access denied: Only coaches can perform this action" });
    }

    req.userOrgRole = 'coach';
    req.organizationId = orgId;
    next();
  } catch (error) {
    console.error('Error in requireCoach:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to verify user is a client in the organization
export async function requireOrgClient(req: any, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const orgId = parseInt(req.params.orgId || req.params.id);
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    // Check org_users table first (new system)
    const orgUsers = await storage.getOrgUsers(orgId);
    const userIdAsInt = parseInt(userId);
    if (!isNaN(userIdAsInt)) {
      const orgUser = orgUsers.find(u => u.id === userIdAsInt && u.role === 'client');
      if (orgUser) {
        // Check activation status - block locked clients
        const status = orgUser.status || 'active';
        if (status === 'locked_downgrade' || status === 'locked_manual') {
          return res.status(403).json({ 
            message: "Your access has been paused by your organization. Please contact your organization owner.",
            locked: true,
            reason: status === 'locked_downgrade' ? 'subscription_downgrade' : 'manual_lock'
          });
        }
        
        req.userOrgRole = 'client';
        req.organizationId = orgId;
        return next();
      }
    }

    // Check old org_clients table for backwards compatibility
    const clients = await storage.getOrgClients(orgId);
    const client = clients.find(c => c.userId === userId);
    
    if (!client) {
      return res.status(403).json({ message: "Access denied: Only clients can perform this action" });
    }

    req.userOrgRole = 'client';
    req.organizationId = orgId;
    req.assignedCoachId = client.coachId;
    next();
  } catch (error) {
    console.error('Error in requireOrgClient:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to check organization has active billing (soft-lock enforcement)
// Note: Org owners can bypass the lock to access their org and upgrade
export async function requireOrgActiveSubscription(req: any, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.orgId || req.params.id || req.organizationId);
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    const billingStatus = await getOrgBillingStatus(orgId);
    
    // Check if user is the organization owner - owners can bypass soft-lock
    const userId = getUserId(req);
    if (userId) {
      const org = await storage.getOrganization(orgId);
      if (org?.ownerId === userId) {
        // Owner bypass: allow access but attach billing status for UI
        req.billingStatus = billingStatus;
        return next();
      }
    }
    
    // For non-owners (coaches, clients), enforce the soft-lock
    if (billingStatus.locked) {
      return res.status(402).json({ 
        message: "Access locked: Organization billing has expired or is inactive",
        locked: true,
        tier: billingStatus.tier,
        requiresUpgrade: true
      });
    }

    req.billingStatus = billingStatus;
    next();
  } catch (error) {
    console.error('Error in requireOrgActiveSubscription:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to block plan creation for FREE tier and expired orgs (NO owner bypass)
// This ensures org owners cannot create plans unless they have an active paid subscription
export async function requireOrgPaidSubscription(req: any, res: Response, next: NextFunction) {
  try {
    const orgId = parseInt(req.params.orgId || req.params.id || req.organizationId);
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    const billingStatus = await getOrgBillingStatus(orgId);
    
    // Block if on FREE tier or billing is locked/expired - NO owner bypass for plan creation
    if (billingStatus.locked || billingStatus.tier === 'free') {
      return res.status(402).json({ 
        message: "Subscription required: Please upgrade to create plans",
        locked: true,
        tier: billingStatus.tier,
        requiresUpgrade: true
      });
    }

    req.billingStatus = billingStatus;
    next();
  } catch (error) {
    console.error('Error in requireOrgPaidSubscription:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to allow both coaches and owners
export async function requireCoachOrOwner(req: any, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const orgId = parseInt(req.params.orgId || req.params.id);
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    // Check if user is owner
    const org = await storage.getOrganization(orgId);
    if (org?.ownerId === userId) {
      req.userOrgRole = 'owner';
      req.organizationId = orgId;
      return next();
    }

    // Check if user is coach in org_users table (new system)
    const orgUsers = await storage.getOrgUsers(orgId);
    const userIdAsInt = parseInt(userId);
    if (!isNaN(userIdAsInt)) {
      const orgUser = orgUsers.find(u => u.id === userIdAsInt);
      if (orgUser && orgUser.role === 'coach') {
        // Check activation status - block locked coaches
        const status = orgUser.status || 'active';
        if (status === 'locked_downgrade' || status === 'locked_manual') {
          return res.status(403).json({ 
            message: "Your access has been paused by your organization. Please contact your organization owner.",
            locked: true,
            reason: status === 'locked_downgrade' ? 'subscription_downgrade' : 'manual_lock'
          });
        }
        
        req.userOrgRole = 'coach';
        req.organizationId = orgId;
        return next();
      }
    }

    // Also check old org_coaches table for backwards compatibility
    const coaches = await storage.getOrgCoaches(orgId);
    const isCoach = coaches.some(coach => coach.userId === userId);
    if (isCoach) {
      req.userOrgRole = 'coach';
      req.organizationId = orgId;
      return next();
    }

    return res.status(403).json({ message: "Access denied: Only coaches and owners can perform this action" });
  } catch (error) {
    console.error('Error in requireCoachOrOwner:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to verify coach has access to specific client
export async function checkClientAccess(req: any, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const orgId = parseInt(req.params.orgId || req.params.id);
    const clientId = req.params.clientId || req.body.clientId;
    
    if (isNaN(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }
    if (!clientId) {
      return res.status(400).json({ message: "Client ID required" });
    }

    // Owners have access to all clients
    const org = await storage.getOrganization(orgId);
    if (org?.ownerId === userId) {
      req.hasClientAccess = true;
      return next();
    }

    // Check if user is coach and client is assigned to them
    const clients = await storage.getOrgClients(orgId);
    const client = clients.find(c => c.userId === clientId);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found in organization" });
    }

    // For coaches, check if client is assigned to them
    const coaches = await storage.getOrgCoaches(orgId);
    const isCoach = coaches.some(coach => coach.userId === userId);
    
    if (isCoach && client.coachId === userId) {
      req.hasClientAccess = true;
      return next();
    }

    return res.status(403).json({ message: "Access denied: You don't have access to this client" });
  } catch (error) {
    console.error('Error in checkClientAccess:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to add security headers
export function securityHeaders(req: any, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Restrict features available to the page
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
}

// Middleware to log security violations
export function logSecurityViolation(action: string) {
  return (req: any, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    const orgId = req.params.orgId || req.params.id;
    const clientId = req.params.clientId;
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.warn(`SECURITY VIOLATION: ${action}`, {
      userId,
      orgId,
      clientId,
      method,
      path,
      ip,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
    });
    
    // In production, this could send alerts or log to a security monitoring service
    next();
  };
}

// Helper to validate and sanitize input
export function validateOrgId(paramName: string = 'orgId') {
  return (req: any, res: Response, next: NextFunction) => {
    const orgId = req.params[paramName] || req.params.id;
    const parsed = parseInt(orgId);
    
    if (isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }
    
    req.validatedOrgId = parsed;
    next();
  };
}

// Helper to check if organization has active billing
export async function getOrgBillingStatus(orgId: number) {
  try {
    const billing = await storage.getActiveBillingPeriod(orgId);
    
    if (!billing) {
      return { isActive: false, tier: 'free', locked: true };
    }

    const now = new Date();
    const periodEnd = billing.currentPeriodEndsAt ? new Date(billing.currentPeriodEndsAt) : null;
    
    // Check if billing period has expired
    const hasExpired = periodEnd && now >= periodEnd;
    
    // FREE tier with 0/0 capacity is locked (can't access features)
    const isFreeLocked = billing.tier === 'free' && 
                         billing.baseCoachAllowance === 0 && 
                         billing.baseClientAllowance === 0;
    
    const isLocked = hasExpired || isFreeLocked;
    
    return {
      isActive: !isLocked,
      tier: billing.tier,
      locked: isLocked,
      daysRemaining: periodEnd ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
    };
  } catch (error) {
    console.error('Error checking org billing status:', error);
    return { isActive: false, tier: 'free', locked: true };
  }
}

// Helper to validate user permissions for data filtering
export async function getUserOrgPermissions(userId: string, orgId: number) {
  const permissions = {
    isOwner: false,
    isCoach: false,
    isClient: false,
    assignedCoachId: null as string | null,
    canViewAllClients: false,
    canManageCoaches: false,
    canAssignPlans: false,
    canSendMessages: false,
    locked: false,
  };

  // Check billing status first
  const billingStatus = await getOrgBillingStatus(orgId);
  permissions.locked = billingStatus.locked;

  // Check owner status
  const org = await storage.getOrganization(orgId);
  if (org?.ownerId === userId) {
    permissions.isOwner = true;
    permissions.canViewAllClients = true;
    permissions.canManageCoaches = true;
    permissions.canAssignPlans = true;
    permissions.canSendMessages = true;
    return permissions;
  }

  // Check coach status
  const coaches = await storage.getOrgCoaches(orgId);
  const isCoach = coaches.some(coach => coach.userId === userId);
  if (isCoach) {
    permissions.isCoach = true;
    permissions.canAssignPlans = true;
    permissions.canSendMessages = true;
    return permissions;
  }

  // Check client status
  const clients = await storage.getOrgClients(orgId);
  const client = clients.find(c => c.userId === userId);
  if (client) {
    permissions.isClient = true;
    permissions.assignedCoachId = client.coachId;
    permissions.canSendMessages = true;
    return permissions;
  }

  return permissions;
}