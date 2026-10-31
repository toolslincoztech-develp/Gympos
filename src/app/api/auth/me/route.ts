import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { getCached, setCached } from "@/lib/cache";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const cacheKey = `user:${decoded.id}`;
    const cachedUser = getCached<any>(cacheKey);

    if (cachedUser) {
      return NextResponse.json({
        ...cachedUser,
        isImpersonated: Boolean(decoded.isImpersonated),
        impersonatorEmail: decoded.impersonatorEmail || null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        tenant: {
          include: {
            modules: {
              include: {
                module: true,
              },
            },
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant: user.tenant,
    };

    setCached(cacheKey, userPayload, 60000);

    return NextResponse.json({
      ...userPayload,
      isImpersonated: Boolean(decoded.isImpersonated),
      impersonatorEmail: decoded.impersonatorEmail || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
