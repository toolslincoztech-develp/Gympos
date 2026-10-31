import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";
const MASTER_SUPER_ADMIN_EMAIL = "lincoztech@gmail.com";

async function handleExitImpersonation(req: NextRequest) {
  let superAdminUser = await prisma.user.findUnique({
    where: { email: MASTER_SUPER_ADMIN_EMAIL },
  });

  if (!superAdminUser) {
    superAdminUser = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });
  }

  const superToken = jwt.sign(
    {
      id: superAdminUser?.id || "super-admin-master-id",
      email: MASTER_SUPER_ADMIN_EMAIL,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  const response = req.method === "GET"
    ? NextResponse.redirect(new URL("/tenants", req.url))
    : NextResponse.json({ success: true, redirectUrl: "/tenants" });

  response.cookies.set("token", superToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}

export async function GET(req: NextRequest) {
  return handleExitImpersonation(req);
}

export async function POST(req: NextRequest) {
  return handleExitImpersonation(req);
}
