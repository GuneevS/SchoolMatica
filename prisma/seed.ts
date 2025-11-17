import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demoStudents = [
  "Anele Ndlovu",
  "Bianca Mokoena",
  "Cameron Sithole",
  "Duaan Mthembu",
  "Emma Nkosi",
  "Felix Govender",
  "Gugu Khumalo",
  "Hannah van Wyk",
  "Isha Patel",
  "Jude Peterson",
];

const gradingBands = [
  { minPercent: 0, level: 1, descriptor: "Not Achieved" },
  { minPercent: 40, level: 2, descriptor: "Elementary" },
  { minPercent: 50, level: 3, descriptor: "Moderate" },
  { minPercent: 60, level: 4, descriptor: "Adequate" },
  { minPercent: 70, level: 5, descriptor: "Substantial" },
  { minPercent: 80, level: 6, descriptor: "Meritorious" },
  { minPercent: 90, level: 7, descriptor: "Outstanding" },
];

const assessmentSeed = [
  { taskName: "Listening & Speaking", term: "T1", totalMark: 10, rawWeight: 10, type: "Task", isPatComponent: false },
  { taskName: "Reading & Viewing", term: "T1", totalMark: 30, rawWeight: 15, type: "Assignment", isPatComponent: false },
  { taskName: "Writing", term: "T2", totalMark: 20, rawWeight: 25, type: "Task", isPatComponent: false },
  { taskName: "Mid-Year Exam", term: "T2", totalMark: 100, rawWeight: 25, type: "Exam", isPatComponent: false },
  { taskName: "Project", term: "T3", totalMark: 50, rawWeight: 15, type: "Project", isPatComponent: true },
  { taskName: "Final Exam", term: "T4", totalMark: 100, rawWeight: 10, type: "Exam", isPatComponent: false },
];

function normaliseWeights(seed = assessmentSeed) {
  const totalRaw = seed.reduce((sum, item) => sum + item.rawWeight, 0);
  return seed.map((assessment, index) => ({
    ...assessment,
    weightPercent: totalRaw === 0 ? 0 : (assessment.rawWeight / totalRaw) * 100,
    sequence: index + 1,
    status: "Active",
  }));
}

async function seed() {
  await prisma.documentApproval.deleteMany();
  await prisma.assessmentDocument.deleteMany();
  await prisma.moderationComment.deleteMany();
  await prisma.moderationThread.deleteMany();
  await prisma.markSnapshot.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.assessmentPlan.deleteMany();
  await prisma.assessmentTemplate.deleteMany();
  await prisma.curriculumTemplate.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.learnerRegistration.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classGroup.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.school.deleteMany();
  await prisma.gradingConfig.deleteMany();

  const gradingConfig = await prisma.gradingConfig.create({
    data: {
      name: "FET Default",
      phasesJson: {
        FET: gradingBands,
      },
    },
  });

  const school = await prisma.school.create({
    data: {
      name: "SchoolMatica High",
      shortCode: "SMH",
      gradingConfig: {
        connect: { id: gradingConfig.id },
      },
    },
  });

  const gradeLevel = await prisma.gradeLevel.create({
    data: {
      name: "Grade 10",
      order: 10,
      schoolId: school.id,
    },
  });

  const leadTeacher = await prisma.teacher.create({
    data: {
      firstName: "Naledi",
      lastName: "Dlamini",
      email: "naledi.dlamini@schoolmatica.com",
      phone: "+27 82 456 7890",
      role: "Teacher",
      schoolId: school.id,
      bio: "Grade 10 English HL lead teacher",
    },
  });

  const subject = await prisma.subject.create({
    data: {
      name: "English HL",
      code: "ENGHL",
      phase: "FET",
      schoolId: school.id,
    },
  });

  const curriculumTemplate = await prisma.curriculumTemplate.create({
    data: {
      name: "Grade 10 English HL Template",
      subjectName: subject.name,
      subjectCode: subject.code,
      phase: subject.phase,
      grade: 10,
      defaultTermCount: 4,
      schoolId: school.id,
      createdByRole: "HOD",
      assessmentTemplates: {
        create: normaliseWeights().map((item) => ({
          taskName: item.taskName,
          term: item.term,
          totalMark: item.totalMark,
          rawWeight: item.rawWeight,
          sequence: item.sequence,
          type: item.type,
          isPatComponent: item.isPatComponent,
        })),
      },
    },
    include: { assessmentTemplates: true },
  });

  const currentYear = new Date().getFullYear();
  const classGroup = await prisma.classGroup.create({
    data: {
      name: "Grade 10A English HL",
      grade: 10,
      year: currentYear,
      subjectId: subject.id,
      schoolId: school.id,
      curriculumTemplateId: curriculumTemplate.id,
      gradeLevelId: gradeLevel.id,
      primaryTeacherId: leadTeacher.id,
      teacherAssignments: {
        create: [
          {
            teacherId: leadTeacher.id,
            role: "Lead",
            subjectId: subject.id,
          },
        ],
      },
    },
  });

  const students = await Promise.all(
    demoStudents.map((fullName, index) => {
      const [firstName, lastName] = fullName.split(" ");
      const admissionNumber = `G10-${String(index + 1).padStart(2, "0")}`;
      return prisma.student.create({
        data: {
          admissionNumber,
          firstName,
          lastName: lastName ?? "Learner",
          gender: index % 2 === 0 ? "F" : "M",
          classGroupId: classGroup.id,
          advisorTeacherId: leadTeacher.id,
          parents: {
            create: [
              {
                fullName: `${lastName ?? "Guardian"} ${index % 2 === 0 ? "Mkhize" : "Ngcobo"}`,
                relationship: "Guardian",
                phone: `+27 82 000 0${index}${index}`,
                email: `guardian${index}@example.com`,
                primary: true,
              },
            ],
          },
        },
      });
    }),
  );

  const plan = await prisma.assessmentPlan.create({
    data: {
      name: `${currentYear} Annual Plan`,
      year: currentYear,
      termCount: 4,
      status: "Draft",
      termWeights: {
        T1: 25,
        T2: 25,
        T3: 25,
        T4: 25,
      },
      templateId: curriculumTemplate.id,
      classGroupId: classGroup.id,
      assessments: {
        create: normaliseWeights(),
      },
    },
    include: { assessments: true },
  });

  const performance = [0.85, 0.72, 0.65, 0.58, 0.45];
  for (let i = 0; i < performance.length; i += 1) {
    const student = students[i];
    for (const assessment of plan.assessments) {
      const ratio = performance[i] + (Math.random() - 0.5) * 0.1;
      const rawMark = Math.max(0, Math.min(assessment.totalMark, Math.round(assessment.totalMark * ratio)));
      await prisma.mark.create({
        data: {
          assessmentId: assessment.id,
          studentId: student.id,
          rawMark,
          status: "Draft",
        },
      });
    }
  }

  await prisma.markSnapshot.create({
    data: {
      assessmentPlanId: plan.id,
      studentId: students[0].id,
      term: "T2",
      sbaPercent: 68.4,
      termPercent: 71.2,
      level: 4,
    },
  });

  await prisma.moderationThread.create({
    data: {
      assessmentPlanId: plan.id,
      status: "Open",
      createdByRole: "HOD",
      comments: {
        create: [
          {
            authorRole: "HOD",
            message: "Please review weighting of the mid-year exam.",
          },
        ],
      },
    },
  });

  await prisma.assessmentDocument.create({
    data: {
      assessmentPlanId: plan.id,
      label: "Moderation Checklist",
      fileName: "moderation-checklist.pdf",
      mimeType: "application/pdf",
      fileUrl: "https://example.com/moderation-checklist.pdf",
      storageKey: "demo/moderation-checklist.pdf",
      version: 1,
      status: "Pending",
      uploadedByRole: "Teacher",
      uploadedByName: "Ms Mokoena",
      approvals: {
        create: {
          reviewerRole: "HOD",
          reviewerName: "Mr Sithole",
          status: "Pending",
        },
      },
    },
  });

  await prisma.assessmentDocument.create({
    data: {
      assessmentId: plan.assessments[3].id,
      label: "Mid-year exam paper",
      fileName: "midyear-exam.pdf",
      mimeType: "application/pdf",
      fileUrl: "https://example.com/midyear-exam.pdf",
      storageKey: "demo/midyear-exam.pdf",
      version: 2,
      status: "Approved",
      uploadedByRole: "Teacher",
      uploadedByName: "Mr Dlamini",
      approvals: {
        create: {
          reviewerRole: "SMT",
          reviewerName: "Deputy Head",
          status: "Approved",
          decidedAt: new Date(),
          notes: "Paper moderated and signed off.",
        },
      },
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        schoolId: school.id,
        entityType: "AssessmentPlan",
        entityId: plan.id,
        action: "PLAN_CREATED",
        actorRole: "Teacher",
        actorName: "Ms Mokoena",
        metadata: { name: plan.name },
      },
      {
        schoolId: school.id,
        entityType: "Assessment",
        entityId: plan.assessments[0].id,
        action: "ASSESSMENT_WEIGHT_UPDATED",
        actorRole: "HOD",
        actorName: "Mr Sithole",
        metadata: { taskName: plan.assessments[0].taskName, weightPercent: plan.assessments[0].weightPercent },
      },
    ],
  });

  await prisma.learnerRegistration.create({
    data: {
      schoolId: school.id,
      classGroupId: classGroup.id,
      status: "Approved",
      learnerData: {
        firstName: "Kamohelo",
        lastName: "Molefe",
        birthDate: "2011-02-04",
        gender: "F",
      },
      guardianData: {
        guardianName: "Thandi Molefe",
        contactNumber: "+27 82 123 0000",
        email: "thandi@example.com",
      },
      supportingDocs: {
        birthCertificate: "https://example.com/docs/bc.pdf",
      },
      submittedAt: new Date(),
      decidedAt: new Date(),
      decisionNote: "Placed in Grade 10A English HL.",
    },
  });
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
