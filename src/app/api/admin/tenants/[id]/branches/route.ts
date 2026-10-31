import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

function getAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  context: any
) {
  const decoded = getAuth(req);
  if (!decoded || decoded.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Await params for Next.js 15+ compatibility
  const params = await context.params;

  try {
    const branches = await prisma.branch.findMany({
      where: { tenantId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(branches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: any
) {
  const decoded = getAuth(req);
  if (!decoded || decoded.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Await params for Next.js 15+ compatibility
  const params = await context.params;

  try {
    const { name, location, phone } = await req.json();

    const branch = await prisma.branch.create({
      data: {
        name,
        location,
        phone,
        tenantId: params.id,
      },
    });

    return NextResponse.json(branch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
