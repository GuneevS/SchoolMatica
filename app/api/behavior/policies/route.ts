import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

// Schema for notification thresholds
const thresholdSchema = z.object({
  id: z.string(),
  points: z.number().int().min(1).max(100),
  name: z.string().min(1),
  description: z.string().optional(),
  notifyParent: z.boolean(),
  notifyHOD: z.boolean(),
  notifyPrincipal: z.boolean(),
  sendEmail: z.boolean(),
  action: z.string(),
  color: z.string(),
});

const policySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["Merit", "Demerit"]),
  category: z.string().min(1),
  description: z.string().optional(),
  defaultPoints: z.number().int().min(1),
  thresholds: z.array(thresholdSchema),
  rewards: z.any().optional(),
  consequences: z.any().optional(),
  isActive: z.boolean().default(true),
});

// GET - List behavior policies for the school
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    
    // Super admins can specify schoolId via query param, others use their assigned school
    const requestedSchoolId = searchParams.get("schoolId");
    const schoolId = auth.isSuperAdmin 
      ? (requestedSchoolId || auth.user.schoolId)
      : auth.user.schoolId;
    
    if (!schoolId && !auth.isSuperAdmin) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    const policies = await prisma.behaviorPolicy.findMany({
      where: {
        ...(schoolId && { schoolId }),
        ...(type && { type }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
  }
}

// POST - Create new behavior policy
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Super admins can specify schoolId in body, others use their assigned school
    const schoolId = auth.isSuperAdmin 
      ? (body.schoolId || auth.user.schoolId)
      : auth.user.schoolId;
      
    if (!schoolId) {
      return NextResponse.json({ error: "No school context. Super admins must specify schoolId." }, { status: 400 });
    }

    const parsed = policySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const policy = await prisma.behaviorPolicy.create({
      data: {
        schoolId,
        name: data.name,
        type: data.type,
        category: data.category,
        description: data.description,
        defaultPoints: data.defaultPoints,
        thresholds: data.thresholds,
        rewards: data.rewards,
        consequences: data.consequences,
        isActive: data.isActive,
        createdBy: auth.user.id,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
  }
}

// PUT - Update behavior policy (mainly for updating thresholds)
export async function PUT(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, schoolId: requestedSchoolId, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Policy ID required" }, { status: 400 });
    }

    // Super admins can update policies in any school
    const schoolId = auth.isSuperAdmin 
      ? (requestedSchoolId || auth.user.schoolId)
      : auth.user.schoolId;

    if (!schoolId && !auth.isSuperAdmin) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    // Verify policy exists (super admins can access any, others only their school)
    const existing = await prisma.behaviorPolicy.findFirst({
      where: auth.isSuperAdmin 
        ? { id }
        : { id, schoolId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const parsed = policySchema.partial().safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const policy = await prisma.behaviorPolicy.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}
