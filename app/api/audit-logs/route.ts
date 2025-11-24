import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, getUserSchoolIds, isSystemAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const result = await authorizeWithSchool(request, "audit:read");
  if ("error" in result) {
    return result.error;
  }
  
  const { auth } = result;
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");
  const entityType = searchParams.get("entityType") ?? undefined;
  const entityId = searchParams.get("entityId") ?? undefined;
  
  // Build where clause based on user permissions
  let whereClause: any = {
    entityType,
    entityId,
  };
  
  if (schoolId) {
    // Validate school access
    if (!hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }
    whereClause.schoolId = schoolId;
  } else if (!isSystemAdmin(auth)) {
    // Non-admins can only see logs from their schools
    const userSchoolIds = getUserSchoolIds(auth);
    whereClause.schoolId = { in: userSchoolIds };
  }
  
  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(logs);
}

