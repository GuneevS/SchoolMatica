import { NextRequest, NextResponse } from "next/server";
import { getClassMarkbookPayload } from "@/lib/markbook";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ classId: string }>;
}

function escape(value: string | number) {
  const asString = String(value ?? "");
  if (asString.includes(",") || asString.includes("\"")) {
    return `"${asString.replace(/"/g, '""')}"`;
  }
  return asString;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { classId } = await params;

  const authResult = await authorizeWithSchool(request, "class:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classId },
    select: { schoolId: true },
  });
  if (!classGroup) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const payload = await getClassMarkbookPayload(classId);
  if (!payload) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const headers = [
    "Admission Number",
    "Learner",
    ...payload.assessments.map((assessment) => assessment.taskName),
    "SBA %",
    "Level",
    "Term1 %",
    "Term2 %",
    "Term3 %",
    "Term4 %",
  ];

  const rows = payload.rows.map((row) => {
    const assessmentMarks = payload.assessments.map((assessment) => {
      const mark = row.marks.find((item) => item.assessmentId === assessment.id);
      if (!mark) return "";
      if (mark.isAbsent) return "ABS";
      return mark.rawMark ?? "";
    });

    return [
      row.student.admissionNumber,
      `${row.student.lastName}, ${row.student.firstName}`,
      ...assessmentMarks,
      row.sbaPercent.toFixed(2),
      `${row.level}`,
      row.termPercents.T1.toFixed(2),
      row.termPercents.T2.toFixed(2),
      row.termPercents.T3.toFixed(2),
      row.termPercents.T4.toFixed(2),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escape(cell ?? "")).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=markbook-${payload.classGroup.name.replace(/\s+/g, "-")}.csv`,
    },
  });
}
