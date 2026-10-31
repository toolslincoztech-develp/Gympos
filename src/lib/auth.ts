import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

export function getAuthUser(req: NextRequest): any | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export function requireSuperAdmin(req: NextRequest): any | null {
  const user = getAuthUser(req);
  if (!user || user.role !== "SUPER_ADMIN") return null;
  return user;
}

export function requireTenantUser(req: NextRequest): any | null {
  const user = getAuthUser(req);
  if (!user || !user.tenantId) return null;
  return user;
}
