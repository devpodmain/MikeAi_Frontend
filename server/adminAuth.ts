import bcrypt from 'bcryptjs';
import { db } from './db';
import { adminAccounts, adminSessions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

export class AdminAuth {
  static async createAdminAccount(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: 'super_admin' | 'admin';
  }) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    const [admin] = await db.insert(adminAccounts).values({
      ...userData,
      passwordHash,
    }).returning();
    
    return admin;
  }

  static async validateAdmin(username: string, password: string) {
    try {
      // Trim whitespace from username
      const trimmedUsername = username.trim();
      
      const [admin] = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.username, trimmedUsername))
        .limit(1);

      if (!admin || !admin.isActive) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      
      if (!isValidPassword) {
        return null;
      }

      // Update last login
      await db
        .update(adminAccounts)
        .set({ lastLogin: new Date() })
        .where(eq(adminAccounts.id, admin.id));

      return admin;
    } catch (error) {
      return null;
    }
  }

  static async createSession(adminId: number) {
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(adminSessions).values({
      id: sessionId,
      adminId,
      expiresAt,
    });

    return sessionId;
  }

  static async getAdminBySession(sessionId: string) {
    try {
      const result = await db
        .select()
        .from(adminSessions)
        .innerJoin(adminAccounts, eq(adminSessions.adminId, adminAccounts.id))
        .where(eq(adminSessions.id, sessionId))
        .limit(1);

      if (!result[0]) {
        return null;
      }

      const session = result[0].admin_sessions;
      const admin = result[0].admin_accounts;

      if (new Date() > session.expiresAt) {
        await this.deleteSession(sessionId);
        return null;
      }

      return admin;
    } catch (error) {
      return null;
    }
  }

  static async deleteSession(sessionId: string) {
    await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
  }
}

// Middleware to check admin authentication
export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check both possible cookie names for compatibility
    const sessionId = req.cookies?.adminSession || req.cookies?.['admin-session'];

    if (!sessionId) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const admin = await AdminAuth.getAdminBySession(sessionId);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid or expired admin session' });
    }

    (req as any).admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to check super admin role
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const admin = (req as any).admin;
  
  if (!admin || admin.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  
  next();
};