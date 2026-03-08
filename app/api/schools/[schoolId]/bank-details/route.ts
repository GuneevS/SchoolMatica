import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

interface Params {
  params: Promise<{ schoolId: string }>;
}

const bankDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  branchCode: z.string().min(1, "Branch code is required"),
  accountHolder: z.string().min(1, "Account holder name is required"),
  accountType: z.enum(["Cheque", "Savings", "Transmission"]).optional(),
  reference: z.string().optional(),
});

// GET - Get school bank details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;

    // Verify access
    if (!auth.isSuperAdmin && auth.user.schoolId !== schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, bankDetails: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({
      schoolId: school.id,
      schoolName: school.name,
      bankDetails: school.bankDetails || null,
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return NextResponse.json({ error: "Failed to fetch bank details" }, { status: 500 });
  }
}

// PUT - Update school bank details
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;

    // Only admins and super admins can update bank details
    if (!auth.isSuperAdmin && auth.user.schoolId !== schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bankDetailsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        bankDetails: parsed.data as object,
      },
      select: { id: true, name: true, bankDetails: true },
    });

    return NextResponse.json({
      schoolId: school.id,
      schoolName: school.name,
      bankDetails: school.bankDetails,
    });
  } catch (error) {
    console.error("Error updating bank details:", error);
    return NextResponse.json({ error: "Failed to update bank details" }, { status: 500 });
  }
}
