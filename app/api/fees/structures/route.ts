import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

// Schema for creating fee structures
const feeComponentSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
  optional: z.boolean().default(false),
  description: z.string().optional(),
});

const createFeeStructureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  grade: z.number().int().min(0).max(12).optional().nullable(),
  year: z.number().int().min(2020).max(2100),
  term: z.string().optional().nullable(),
  baseAmount: z.number().positive("Base amount must be positive"),
  components: z.array(feeComponentSchema).min(1, "At least one fee component is required"),
  isActive: z.boolean().default(true),
});

// GET - List fee structures for the school
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get("schoolId");
    const year = searchParams.get("year");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const schoolId = auth.isSuperAdmin
      ? (requestedSchoolId || auth.user.schoolId)
      : auth.user.schoolId;

    if (!schoolId && !auth.isSuperAdmin) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    const feeStructures = await prisma.feeStructure.findMany({
      where: {
        ...(schoolId && { schoolId }),
        ...(year && { year: parseInt(year) }),
        ...(activeOnly && { isActive: true }),
      },
      include: {
        discounts: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            value: true,
            currentUsage: true,
            maxUsage: true,
          },
        },
        invoices: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            balanceDue: true,
            status: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { grade: "asc" }],
    });

    // Add computed stats
    const result = feeStructures.map((fs) => {
      const totalInvoiced = fs.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalCollected = fs.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const totalOutstanding = fs.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
      const overdueCount = fs.invoices.filter((inv) => inv.status === "Overdue").length;

      return {
        id: fs.id,
        name: fs.name,
        description: fs.description,
        grade: fs.grade,
        year: fs.year,
        term: fs.term,
        baseAmount: fs.baseAmount,
        components: fs.components,
        isActive: fs.isActive,
        discounts: fs.discounts,
        stats: {
          invoiceCount: fs.invoices.length,
          totalInvoiced,
          totalCollected,
          totalOutstanding,
          collectionRate: totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0,
          overdueCount,
        },
        createdAt: fs.createdAt,
        updatedAt: fs.updatedAt,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return NextResponse.json({ error: "Failed to fetch fee structures" }, { status: 500 });
  }
}

// POST - Create a new fee structure
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const schoolId = auth.isSuperAdmin
      ? (body.schoolId || auth.user.schoolId)
      : auth.user.schoolId;

    if (!schoolId) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    const parsed = createFeeStructureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Calculate base amount from components if not explicitly set
    const componentsTotal = data.components.reduce((sum, c) => sum + (c.optional ? 0 : c.amount), 0);
    const baseAmount = data.baseAmount || componentsTotal;

    const feeStructure = await prisma.feeStructure.create({
      data: {
        schoolId,
        name: data.name,
        description: data.description,
        grade: data.grade,
        year: data.year,
        term: data.term,
        baseAmount,
        components: data.components as object[],
        isActive: data.isActive,
      },
    });

    return NextResponse.json(feeStructure, { status: 201 });
  } catch (error) {
    console.error("Error creating fee structure:", error);
    return NextResponse.json({ error: "Failed to create fee structure" }, { status: 500 });
  }
}
