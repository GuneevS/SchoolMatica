import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

// Correct CAPS grading bands: Level 2 at 30%, Level 7 at 80%
const gradingBands = [
  { minPercent: 0, level: 1, descriptor: "Not Achieved" },
  { minPercent: 30, level: 2, descriptor: "Elementary Achievement" },
  { minPercent: 40, level: 3, descriptor: "Moderate Achievement" },
  { minPercent: 50, level: 4, descriptor: "Adequate Achievement" },
  { minPercent: 60, level: 5, descriptor: "Substantial Achievement" },
  { minPercent: 70, level: 6, descriptor: "Meritorious Achievement" },
  { minPercent: 80, level: 7, descriptor: "Outstanding Achievement" },
];

const permissionSeeds = [
  // Assessment Plans
  { key: "assessmentPlan:read", resource: "assessmentPlan", action: "read", description: "View assessment plans" },
  { key: "assessmentPlan:create", resource: "assessmentPlan", action: "create", description: "Create assessment plans" },
  { key: "assessmentPlan:update", resource: "assessmentPlan", action: "update", description: "Edit assessment plans" },
  { key: "assessmentPlan:delete", resource: "assessmentPlan", action: "delete", description: "Delete assessment plans" },
  { key: "assessmentPlan:advance", resource: "assessmentPlan", action: "advance", description: "Submit plans for approval" },
  { key: "assessmentPlan:approve", resource: "assessmentPlan", action: "approve", description: "Approve or lock assessment plans" },

  // Assessment Documents
  { key: "assessmentDocument:read", resource: "assessmentDocument", action: "read", description: "View assessment documents" },
  { key: "assessmentDocument:upload", resource: "assessmentDocument", action: "upload", description: "Upload assessment documents" },
  { key: "assessmentDocument:decide", resource: "assessmentDocument", action: "decide", description: "Approve or request changes on documents" },
  { key: "assessmentDocument:delete", resource: "assessmentDocument", action: "delete", description: "Delete assessment documents" },

  // Assessments
  { key: "assessment:read", resource: "assessment", action: "read", description: "View assessments" },
  { key: "assessment:create", resource: "assessment", action: "create", description: "Create assessments" },
  { key: "assessment:update", resource: "assessment", action: "update", description: "Edit assessments" },
  { key: "assessment:delete", resource: "assessment", action: "delete", description: "Delete assessments" },

  // Marks
  { key: "mark:read", resource: "mark", action: "read", description: "View marks" },
  { key: "mark:create", resource: "mark", action: "create", description: "Enter marks" },
  { key: "mark:update", resource: "mark", action: "update", description: "Update marks" },
  { key: "mark:delete", resource: "mark", action: "delete", description: "Delete marks" },

  // Classes
  { key: "class:read", resource: "class", action: "read", description: "View classes" },
  { key: "class:create", resource: "class", action: "create", description: "Create classes" },
  { key: "class:update", resource: "class", action: "update", description: "Update classes" },
  { key: "class:delete", resource: "class", action: "delete", description: "Delete classes" },
  { key: "class:manage", resource: "class", action: "manage", description: "Manage class assignments" },

  // Students
  { key: "student:read", resource: "student", action: "read", description: "View students" },
  { key: "student:create", resource: "student", action: "create", description: "Add students" },
  { key: "student:update", resource: "student", action: "update", description: "Update student info" },
  { key: "student:delete", resource: "student", action: "delete", description: "Remove students" },

  // Teachers
  { key: "teacher:read", resource: "teacher", action: "read", description: "View teachers" },
  { key: "teacher:create", resource: "teacher", action: "create", description: "Add teachers" },
  { key: "teacher:update", resource: "teacher", action: "update", description: "Update teacher info" },
  { key: "teacher:delete", resource: "teacher", action: "delete", description: "Remove teachers" },

  // Schools
  { key: "school:read", resource: "school", action: "read", description: "View schools" },
  { key: "school:create", resource: "school", action: "create", description: "Create schools" },
  { key: "school:update", resource: "school", action: "update", description: "Update schools" },
  { key: "school:delete", resource: "school", action: "delete", description: "Delete schools" },
  { key: "school:manage", resource: "school", action: "manage", description: "Manage school settings" },

  // Subjects
  { key: "subject:read", resource: "subject", action: "read", description: "View subjects" },
  { key: "subject:create", resource: "subject", action: "create", description: "Create subjects" },
  { key: "subject:update", resource: "subject", action: "update", description: "Update subjects" },
  { key: "subject:delete", resource: "subject", action: "delete", description: "Delete subjects" },

  // Reports
  { key: "report:read", resource: "report", action: "read", description: "View reports" },
  { key: "report:generate", resource: "report", action: "generate", description: "Generate reports" },
  { key: "report:publish", resource: "report", action: "publish", description: "Publish reports" },

  // Registrations
  { key: "registration:read", resource: "registration", action: "read", description: "View registrations" },
  { key: "registration:create", resource: "registration", action: "create", description: "Create registrations" },
  { key: "registration:update", resource: "registration", action: "update", description: "Update registrations" },
  { key: "registration:decide", resource: "registration", action: "decide", description: "Approve/reject registrations" },

  // Audit Logs
  { key: "audit:read", resource: "audit", action: "read", description: "View audit logs" },

  // Moderation
  { key: "moderation:read", resource: "moderation", action: "read", description: "View moderation threads" },
  { key: "moderation:create", resource: "moderation", action: "create", description: "Create moderation threads" },
  { key: "moderation:update", resource: "moderation", action: "update", description: "Update moderation threads" },
  { key: "moderation:resolve", resource: "moderation", action: "resolve", description: "Resolve moderation issues" },

  // Finance & Fees
  { key: "finance:read", resource: "finance", action: "read", description: "View invoices, payments, ledger, and reports" },
  { key: "finance:write", resource: "finance", action: "write", description: "Record payments, create invoices, adjustments" },
  { key: "finance:manage", resource: "finance", action: "manage", description: "Write-offs, credit notes, fee structures, bank details" },

  // Timetables
  { key: "timetable:read", resource: "timetable", action: "read", description: "View timetables" },
  { key: "timetable:create", resource: "timetable", action: "create", description: "Create timetables" },
  { key: "timetable:update", resource: "timetable", action: "update", description: "Update timetables" },
  { key: "timetable:delete", resource: "timetable", action: "delete", description: "Delete timetables" },

  // Templates
  { key: "template:read", resource: "template", action: "read", description: "View curriculum templates" },
  { key: "template:create", resource: "template", action: "create", description: "Create curriculum templates" },
  { key: "template:update", resource: "template", action: "update", description: "Update curriculum templates" },
  { key: "template:delete", resource: "template", action: "delete", description: "Delete curriculum templates" },

  // Grade Levels
  { key: "gradeLevel:read", resource: "gradeLevel", action: "read", description: "View grade levels" },
  { key: "gradeLevel:create", resource: "gradeLevel", action: "create", description: "Create grade levels" },
  { key: "gradeLevel:update", resource: "gradeLevel", action: "update", description: "Update grade levels" },
  { key: "gradeLevel:delete", resource: "gradeLevel", action: "delete", description: "Delete grade levels" },

  // User Management
  { key: "user:read", resource: "user", action: "read", description: "View users" },
  { key: "user:create", resource: "user", action: "create", description: "Create users" },
  { key: "user:update", resource: "user", action: "update", description: "Update users" },
  { key: "user:delete", resource: "user", action: "delete", description: "Delete users" },
  { key: "role:read", resource: "role", action: "read", description: "View roles" },
  { key: "role:assign", resource: "role", action: "assign", description: "Assign roles to users" },
  { key: "role:remove", resource: "role", action: "remove", description: "Remove roles from users" },

  // System Admin
  { key: "system:admin", resource: "system", action: "admin", description: "Full system access across all schools" },

  // Super Admin - Platform-level management
  { key: "superadmin:access", resource: "superadmin", action: "access", description: "Access super admin dashboard" },
  { key: "superadmin:schools", resource: "superadmin", action: "schools", description: "Create, configure, and manage all schools" },
  { key: "superadmin:users", resource: "superadmin", action: "users", description: "Manage all users across all schools" },
  { key: "superadmin:provision", resource: "superadmin", action: "provision", description: "Provision new schools with initial admin" },
  { key: "superadmin:impersonate", resource: "superadmin", action: "impersonate", description: "Impersonate any user (for debugging)" },
  { key: "superadmin:settings", resource: "superadmin", action: "settings", description: "Platform-wide settings" },
];

const roleSeeds = [
  { key: "teacher", name: "Teacher", priority: 10, description: "Class educator" },
  { key: "hod", name: "Head of Department", priority: 20, description: "Department approver" },
  { key: "smt", name: "SMT", priority: 30, description: "School management team" },
  { key: "admin", name: "School Administrator", priority: 100, description: "Full access within a specific school" },
  { key: "super_admin", name: "Super Administrator", priority: 1000, description: "Platform-level access with full control across all schools" },
];

const rolePermissionMatrix: Record<string, string[]> = {
  teacher: [
    // Assessment Plans
    "assessmentPlan:read",
    "assessmentPlan:create",
    "assessmentPlan:update",
    "assessmentPlan:advance",
    // Assessments
    "assessment:read",
    "assessment:create",
    "assessment:update",
    // Documents
    "assessmentDocument:read",
    "assessmentDocument:upload",
    // Marks
    "mark:read",
    "mark:create",
    "mark:update",
    // Classes
    "class:read",
    // Students
    "student:read",
    // "student:create", // REMOVED: Teachers cannot create students
    "student:update",
    // Teachers
    "teacher:read",
    // Subjects
    "subject:read",
    // Reports
    "report:read",
    "report:generate",
    // Moderation
    "moderation:read",
    "moderation:create",
    // Timetables
    "timetable:read",
    // Templates
    "template:read",
    // Grade Levels
    "gradeLevel:read",
    // Finance (read-only for teachers)
    "finance:read",
  ],
  hod: [
    // Assessment Plans
    "assessmentPlan:read",
    "assessmentPlan:create",
    "assessmentPlan:update",
    "assessmentPlan:delete",
    "assessmentPlan:advance",
    "assessmentPlan:approve",
    // Assessments
    "assessment:read",
    "assessment:create",
    "assessment:update",
    "assessment:delete",
    // Documents
    "assessmentDocument:read",
    "assessmentDocument:upload",
    "assessmentDocument:decide",
    "assessmentDocument:delete",
    // Marks
    "mark:read",
    "mark:create",
    "mark:update",
    // Classes
    "class:read",
    "class:create",
    "class:update",
    "class:manage",
    // Students
    "student:read",
    "student:create",
    "student:update",
    // Teachers
    "teacher:read",
    "teacher:create",
    "teacher:update",
    // Subjects
    "subject:read",
    "subject:create",
    "subject:update",
    // Reports
    "report:read",
    "report:generate",
    "report:publish",
    // Registrations
    "registration:read",
    "registration:update",
    "registration:decide",
    // Audit
    "audit:read",
    // Moderation
    "moderation:read",
    "moderation:create",
    "moderation:update",
    "moderation:resolve",
    // Timetables
    "timetable:read",
    "timetable:create",
    "timetable:update",
    // Templates
    "template:read",
    "template:create",
    "template:update",
    // Grade Levels
    "gradeLevel:read",
    // Finance (read-only for HODs)
    "finance:read",
  ],
  smt: [
    // Assessment Plans
    "assessmentPlan:read",
    "assessmentPlan:create",
    "assessmentPlan:update",
    "assessmentPlan:delete",
    "assessmentPlan:advance",
    "assessmentPlan:approve",
    // Assessments
    "assessment:read",
    "assessment:create",
    "assessment:update",
    "assessment:delete",
    // Documents
    "assessmentDocument:read",
    "assessmentDocument:upload",
    "assessmentDocument:decide",
    "assessmentDocument:delete",
    // Marks
    "mark:read",
    "mark:create",
    "mark:update",
    "mark:delete",
    // Classes
    "class:read",
    "class:create",
    "class:update",
    "class:delete",
    "class:manage",
    // Students
    "student:read",
    "student:create",
    "student:update",
    "student:delete",
    // Teachers
    "teacher:read",
    "teacher:create",
    "teacher:update",
    "teacher:delete",
    // Subjects
    "subject:read",
    "subject:create",
    "subject:update",
    "subject:delete",
    // Reports
    "report:read",
    "report:generate",
    "report:publish",
    // Registrations
    "registration:read",
    "registration:create",
    "registration:update",
    "registration:decide",
    // Audit
    "audit:read",
    // Moderation
    "moderation:read",
    "moderation:create",
    "moderation:update",
    "moderation:resolve",
    // Timetables
    "timetable:read",
    "timetable:create",
    "timetable:update",
    "timetable:delete",
    // Templates
    "template:read",
    "template:create",
    "template:update",
    "template:delete",
    // Grade Levels
    "gradeLevel:read",
    "gradeLevel:create",
    "gradeLevel:update",
    "gradeLevel:delete",
    // School Management (within their school)
    "school:read",
    "school:update",
    "school:manage",
    // User Management (within their school)
    "user:read",
    "user:create",
    "user:update",
    "role:read",
    "role:assign",
    // Finance (read + write for SMT)
    "finance:read",
    "finance:write",
  ],
  admin: [
    "system:admin", // This grants everything within scope
    // Explicit user management for completeness
    "user:read",
    "user:create",
    "user:update",
    "user:delete",
    "role:read",
    "role:assign",
    "role:remove",
    // School management (within their assigned school)
    "school:read",
    "school:update",
    "school:manage",
    // Finance (full access for admin)
    "finance:read",
    "finance:write",
    "finance:manage",
  ],
  super_admin: [
    // ═══════════════════════════════════════════════════════════════════
    // SUPER ADMIN: Full platform-level access to ALL functionality
    // Super admins can access everything across all schools
    // ═══════════════════════════════════════════════════════════════════
    
    // System-wide access (grants cross-school capabilities)
    "system:admin",
    
    // Super admin specific permissions
    "superadmin:access",
    "superadmin:schools",
    "superadmin:users",
    "superadmin:provision",
    "superadmin:impersonate",
    "superadmin:settings",
    
    // Assessment Plans
    "assessmentPlan:read",
    "assessmentPlan:create",
    "assessmentPlan:update",
    "assessmentPlan:delete",
    "assessmentPlan:advance",
    "assessmentPlan:approve",
    
    // Assessment Documents
    "assessmentDocument:read",
    "assessmentDocument:upload",
    "assessmentDocument:decide",
    "assessmentDocument:delete",
    
    // Assessments
    "assessment:read",
    "assessment:create",
    "assessment:update",
    "assessment:delete",
    
    // Marks
    "mark:read",
    "mark:create",
    "mark:update",
    "mark:delete",
    
    // Classes
    "class:read",
    "class:create",
    "class:update",
    "class:delete",
    "class:manage",
    
    // Students
    "student:read",
    "student:create",
    "student:update",
    "student:delete",
    
    // Teachers
    "teacher:read",
    "teacher:create",
    "teacher:update",
    "teacher:delete",
    
    // Schools
    "school:read",
    "school:create",
    "school:update",
    "school:delete",
    "school:manage",
    
    // Subjects
    "subject:read",
    "subject:create",
    "subject:update",
    "subject:delete",
    
    // Grade Levels
    "gradeLevel:read",
    "gradeLevel:create",
    "gradeLevel:update",
    "gradeLevel:delete",
    
    // Grading Configuration
    "gradingConfig:read",
    "gradingConfig:update",
    
    // Timetables
    "timetable:read",
    "timetable:create",
    "timetable:update",
    "timetable:delete",
    
    // Curriculum Templates
    "template:read",
    "template:create",
    "template:update",
    "template:delete",
    
    // Reports
    "report:read",
    "report:generate",
    "report:publish",
    
    // Registrations
    "registration:read",
    "registration:create",
    "registration:update",
    "registration:decide",
    
    // Users
    "user:read",
    "user:create",
    "user:update",
    "user:delete",
    
    // Roles
    "role:read",
    "role:assign",
    "role:remove",
    
    // Moderation
    "moderation:read",
    "moderation:create",
    "moderation:update",
    "moderation:resolve",

    // Audit Logs
    "audit:read",

    // Finance (full access for super admin)
    "finance:read",
    "finance:write",
    "finance:manage",
  ],
};

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

/**
 * SEED SAFETY MODE
 * 
 * Set FORCE_SEED=true to delete all existing data before seeding.
 * By default, this script will only seed if the database is empty.
 * This prevents accidental data loss in production environments.
 * 
 * Examples:
 *   - First-time setup: npx prisma db seed
 *   - Force re-seed: FORCE_SEED=true npx prisma db seed
 */
const FORCE_SEED = process.env.FORCE_SEED === "true";
const SEED_DEMO_ACCOUNTS = process.env.SEED_DEMO_ACCOUNTS === "true";

const QUICK_LOGIN_PASSWORD = "Password123!";
const QUICK_LOGIN_SCHOOL = {
  name: "Nimbus Academy",
  shortCode: "NIM",
  branding: {
    logoUrl: null,
    primary: "#1b4f72",
    secondary: "#f0b429",
    accent: "#f06b5b",
  },
};
const QUICK_LOGIN_EMAILS = {
  platform: "platform@schoolmatica.dev",
  admin: "admin@nimbus.edu",
  hod: "hod@nimbus.edu",
  smt: "smt@nimbus.edu",
  teacher: "teacher@nimbus.edu",
  parent: "parent@nimbus.edu",
  student: "student@nimbus.edu",
};

async function clearAllData() {
  console.log("⚠️  FORCE_SEED is enabled - clearing all existing data...");
  
  // Behavior-related tables (must be deleted before AppUser due to FK constraints)
  await prisma.behaviorThresholdTrigger.deleteMany();
  await prisma.behaviorIncident.deleteMany();
  await prisma.behaviorBalance.deleteMany();
  await prisma.behaviorPolicy.deleteMany();
  
  // Fee-related tables
  await prisma.accountLedger.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.feeStructure.deleteMany();
  
  // Notification and messaging
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.schoolEvent.deleteMany();
  
  // Homework (delete submissions first)
  await prisma.homeworkSubmission.deleteMany();
  await prisma.homework.deleteMany();
  
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
  await prisma.userRoleAssignment.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permissionDefinition.deleteMany();
  await prisma.roleDefinition.deleteMany();
  await prisma.appUser.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.parentContact.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.timetablePeriod.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.classTeacherAssignment.deleteMany();
  await prisma.teacherSubjectAssignment.deleteMany();
  await prisma.teacherInvitation.deleteMany();
  await prisma.reportCard.deleteMany();
  await prisma.learnerComment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classGroup.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.gradeLevel.deleteMany();
  await prisma.school.deleteMany();
  await prisma.gradingConfig.deleteMany();
  
  console.log("✅ All data cleared");
}

async function checkDatabaseHasData(): Promise<boolean> {
  const [schoolCount, userCount, roleCount] = await Promise.all([
    prisma.school.count(),
    prisma.appUser.count(),
    prisma.roleDefinition.count(),
  ]);
  
  return schoolCount > 0 || userCount > 0 || roleCount > 0;
}

async function ensureBaseRolesAndPermissions() {
  await prisma.permissionDefinition.createMany({
    data: permissionSeeds,
    skipDuplicates: true,
  });
  await prisma.roleDefinition.createMany({
    data: roleSeeds,
    skipDuplicates: true,
  });

  const permissions = await prisma.permissionDefinition.findMany();
  const roles = await prisma.roleDefinition.findMany();

  const permissionByKey = new Map<string, (typeof permissions)[number]>(
    permissions.map((permission) => [permission.key, permission]),
  );
  const roleByKey = new Map<string, (typeof roles)[number]>(
    roles.map((role) => [role.key, role]),
  );

  for (const [roleKey, permissionKeys] of Object.entries(rolePermissionMatrix)) {
    const role = roleByKey.get(roleKey);
    if (!role) continue;
    const rolePermissionData: { roleId: string; permissionId: string }[] = [];
    for (const permissionKey of permissionKeys) {
      const permission = permissionByKey.get(permissionKey);
      if (!permission) continue;
      rolePermissionData.push({ roleId: role.id, permissionId: permission.id });
    }
    if (rolePermissionData.length) {
      await prisma.rolePermission.createMany({
        data: rolePermissionData,
        skipDuplicates: true,
      });
    }
  }

  return { roleByKey };
}

async function ensureRoleAssignment(args: {
  userId: string;
  roleId: string;
  scopeSchoolId: string | null;
}) {
  const existing = await prisma.userRoleAssignment.findFirst({
    where: { userId: args.userId, roleId: args.roleId },
  });

  if (!existing) {
    await prisma.userRoleAssignment.create({
      data: args,
    });
  }
}

async function ensureQuickLoginSchool() {
  const quickPasswordHash = await bcrypt.hash(QUICK_LOGIN_PASSWORD, 10);

  const existingSchool = await prisma.school.findUnique({
    where: { shortCode: QUICK_LOGIN_SCHOOL.shortCode },
  });

  let school = existingSchool;
  let gradingConfigId = school?.gradingConfigId ?? null;

  if (!school) {
    const gradingConfig = await prisma.gradingConfig.create({
      data: {
        name: "Nimbus Default",
        phasesJson: {
          FET: gradingBands,
        },
      },
    });

    gradingConfigId = gradingConfig.id;

    school = await prisma.school.create({
      data: {
        name: QUICK_LOGIN_SCHOOL.name,
        shortCode: QUICK_LOGIN_SCHOOL.shortCode,
        branding: QUICK_LOGIN_SCHOOL.branding,
        gradingConfig: {
          connect: { id: gradingConfig.id },
        },
      },
    });
  } else if (!gradingConfigId) {
    const gradingConfig = await prisma.gradingConfig.create({
      data: {
        name: "Nimbus Default",
        phasesJson: {
          FET: gradingBands,
        },
      },
    });
    gradingConfigId = gradingConfig.id;
    await prisma.school.update({
      where: { id: school.id },
      data: {
        gradingConfig: {
          connect: { id: gradingConfig.id },
        },
      },
    });
  }

  if (!school) {
    throw new Error("Failed to create or fetch Nimbus Academy");
  }

  const gradeLevel =
    (await prisma.gradeLevel.findFirst({
      where: { schoolId: school.id, name: "Grade 10" },
    })) ??
    (await prisma.gradeLevel.create({
      data: {
        name: "Grade 10",
        order: 10,
        schoolId: school.id,
      },
    }));

  const subject =
    (await prisma.subject.findFirst({
      where: { schoolId: school.id, code: "MTH" },
    })) ??
    (await prisma.subject.create({
      data: {
        name: "Mathematics",
        code: "MTH",
        phase: "FET",
        schoolId: school.id,
      },
    }));

  const teacher = await prisma.teacher.upsert({
    where: { email: QUICK_LOGIN_EMAILS.teacher },
    update: {
      firstName: "Aisha",
      lastName: "Patel",
      phone: "+27 82 555 0101",
      role: "Teacher",
      schoolId: school.id,
      bio: "Grade 10 Mathematics educator",
    },
    create: {
      firstName: "Aisha",
      lastName: "Patel",
      email: QUICK_LOGIN_EMAILS.teacher,
      phone: "+27 82 555 0101",
      role: "Teacher",
      schoolId: school.id,
      bio: "Grade 10 Mathematics educator",
    },
  });

  const hodTeacher = await prisma.teacher.upsert({
    where: { email: QUICK_LOGIN_EMAILS.hod },
    update: {
      firstName: "Sipho",
      lastName: "Maseko",
      phone: "+27 82 555 0202",
      role: "HOD",
      schoolId: school.id,
      bio: "Mathematics department head",
    },
    create: {
      firstName: "Sipho",
      lastName: "Maseko",
      email: QUICK_LOGIN_EMAILS.hod,
      phone: "+27 82 555 0202",
      role: "HOD",
      schoolId: school.id,
      bio: "Mathematics department head",
    },
  });

  const smtTeacher = await prisma.teacher.upsert({
    where: { email: QUICK_LOGIN_EMAILS.smt },
    update: {
      firstName: "Lerato",
      lastName: "Botha",
      phone: "+27 82 555 0303",
      role: "SMT",
      schoolId: school.id,
      bio: "Deputy Principal",
    },
    create: {
      firstName: "Lerato",
      lastName: "Botha",
      email: QUICK_LOGIN_EMAILS.smt,
      phone: "+27 82 555 0303",
      role: "SMT",
      schoolId: school.id,
      bio: "Deputy Principal",
    },
  });

  const currentYear = new Date().getFullYear();
  const classGroup =
    (await prisma.classGroup.findFirst({
      where: { schoolId: school.id, name: "Grade 10A Mathematics" },
    })) ??
    (await prisma.classGroup.create({
      data: {
        name: "Grade 10A Mathematics",
        grade: 10,
        year: currentYear,
        classType: "Subject",
        subjectId: subject.id,
        schoolId: school.id,
        gradeLevelId: gradeLevel.id,
        primaryTeacherId: teacher.id,
        teacherAssignments: {
          create: [
            {
              teacherId: teacher.id,
              role: "Lead",
              subjectId: subject.id,
            },
            {
              teacherId: hodTeacher.id,
              role: "HOD",
              subjectId: subject.id,
            },
          ],
        },
      },
    }));

  const student =
    (await prisma.student.findFirst({
      where: {
        admissionNumber: "NIM-10-001",
        classGroup: { schoolId: school.id },
      },
    })) ??
    (await prisma.student.create({
      data: {
        admissionNumber: "NIM-10-001",
        firstName: "Maya",
        lastName: "Naidoo",
        gender: "F",
        classGroupId: classGroup.id,
        advisorTeacherId: teacher.id,
      },
    }));

  const parentContact =
    (await prisma.parentContact.findFirst({
      where: {
        email: QUICK_LOGIN_EMAILS.parent,
        studentId: student.id,
      },
    })) ??
    (await prisma.parentContact.create({
      data: {
        studentId: student.id,
        fullName: "Raj Naidoo",
        relationship: "Guardian",
        email: QUICK_LOGIN_EMAILS.parent,
        phone: "+27 82 555 0404",
        primary: true,
      },
    }));

  const adminUser = await prisma.appUser.upsert({
    where: { email: QUICK_LOGIN_EMAILS.admin },
    update: {
      displayName: "Nimbus Admin",
      schoolId: school.id,
      passwordHash: quickPasswordHash,
    },
    create: {
      email: QUICK_LOGIN_EMAILS.admin,
      displayName: "Nimbus Admin",
      schoolId: school.id,
      passwordHash: quickPasswordHash,
    },
  });

  const teacherUser = await prisma.appUser.upsert({
    where: { email: QUICK_LOGIN_EMAILS.teacher },
    update: {
      displayName: `${teacher.firstName} ${teacher.lastName}`,
      schoolId: school.id,
      teacherId: teacher.id,
      passwordHash: quickPasswordHash,
    },
    create: {
      email: QUICK_LOGIN_EMAILS.teacher,
      displayName: `${teacher.firstName} ${teacher.lastName}`,
      schoolId: school.id,
      teacherId: teacher.id,
      passwordHash: quickPasswordHash,
    },
  });

  const hodUser = await prisma.appUser.upsert({
    where: { email: QUICK_LOGIN_EMAILS.hod },
    update: {
      displayName: `${hodTeacher.firstName} ${hodTeacher.lastName}`,
      schoolId: school.id,
      teacherId: hodTeacher.id,
      passwordHash: quickPasswordHash,
    },
    create: {
      email: QUICK_LOGIN_EMAILS.hod,
      displayName: `${hodTeacher.firstName} ${hodTeacher.lastName}`,
      schoolId: school.id,
      teacherId: hodTeacher.id,
      passwordHash: quickPasswordHash,
    },
  });

  const smtUser = await prisma.appUser.upsert({
    where: { email: QUICK_LOGIN_EMAILS.smt },
    update: {
      displayName: `${smtTeacher.firstName} ${smtTeacher.lastName}`,
      schoolId: school.id,
      teacherId: smtTeacher.id,
      passwordHash: quickPasswordHash,
    },
    create: {
      email: QUICK_LOGIN_EMAILS.smt,
      displayName: `${smtTeacher.firstName} ${smtTeacher.lastName}`,
      schoolId: school.id,
      teacherId: smtTeacher.id,
      passwordHash: quickPasswordHash,
    },
  });

  const parentUser = await prisma.appUser.upsert({
    where: { email: QUICK_LOGIN_EMAILS.parent },
    update: {
      displayName: "Raj Naidoo",
      schoolId: school.id,
      passwordHash: quickPasswordHash,
    },
    create: {
      email: QUICK_LOGIN_EMAILS.parent,
      displayName: "Raj Naidoo",
      schoolId: school.id,
      passwordHash: quickPasswordHash,
    },
  });

  const studentUser = await prisma.appUser.upsert({
    where: { email: QUICK_LOGIN_EMAILS.student },
    update: {
      displayName: "Maya Naidoo",
      schoolId: school.id,
      passwordHash: quickPasswordHash,
    },
    create: {
      email: QUICK_LOGIN_EMAILS.student,
      displayName: "Maya Naidoo",
      schoolId: school.id,
      passwordHash: quickPasswordHash,
    },
  });

  const platformUser = await prisma.appUser.upsert({
    where: { email: QUICK_LOGIN_EMAILS.platform },
    update: {
      displayName: "Platform Admin",
      schoolId: null,
      passwordHash: quickPasswordHash,
    },
    create: {
      email: QUICK_LOGIN_EMAILS.platform,
      displayName: "Platform Admin",
      schoolId: null,
      passwordHash: quickPasswordHash,
    },
  });

  const parentUserLink =
    (await prisma.parentUser.findUnique({ where: { userId: parentUser.id } })) ??
    (await prisma.parentUser.create({
      data: {
        userId: parentUser.id,
      },
    }));

  if (!parentContact.parentUserId) {
    await prisma.parentContact.update({
      where: { id: parentContact.id },
      data: { parentUserId: parentUserLink.id },
    });
  }

  const existingStudentUser = await prisma.studentUser.findUnique({
    where: { userId: studentUser.id },
  });
  if (!existingStudentUser) {
    await prisma.studentUser.create({
      data: {
        userId: studentUser.id,
        studentId: student.id,
      },
    });
  }

  const { roleByKey } = await ensureBaseRolesAndPermissions();
  const teacherRole = roleByKey.get("teacher");
  const hodRole = roleByKey.get("hod");
  const smtRole = roleByKey.get("smt");
  const adminRole = roleByKey.get("admin");
  const superAdminRole = roleByKey.get("super_admin");

  if (teacherRole) {
    await ensureRoleAssignment({
      userId: teacherUser.id,
      roleId: teacherRole.id,
      scopeSchoolId: school.id,
    });
  }
  if (hodRole) {
    await ensureRoleAssignment({
      userId: hodUser.id,
      roleId: hodRole.id,
      scopeSchoolId: school.id,
    });
  }
  if (smtRole) {
    await ensureRoleAssignment({
      userId: smtUser.id,
      roleId: smtRole.id,
      scopeSchoolId: school.id,
    });
  }
  if (adminRole) {
    await ensureRoleAssignment({
      userId: adminUser.id,
      roleId: adminRole.id,
      scopeSchoolId: school.id,
    });
  }
  if (superAdminRole) {
    await ensureRoleAssignment({
      userId: platformUser.id,
      roleId: superAdminRole.id,
      scopeSchoolId: null,
    });
  }

  const now = new Date();
  const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  let demoPlan = await prisma.assessmentPlan.findFirst({
    where: { classGroupId: classGroup.id, name: "Nimbus Term Plan" },
    include: { assessments: true },
  });

  if (!demoPlan) {
    demoPlan = await prisma.assessmentPlan.create({
      data: {
        name: "Nimbus Term Plan",
        year: currentYear,
        termCount: 4,
        status: "Active",
        termWeights: { T1: 25, T2: 25, T3: 25, T4: 25 },
        classGroupId: classGroup.id,
        assessments: {
          create: [
            {
              taskName: "Algebra Quiz",
              term: "T1",
              totalMark: 20,
              rawWeight: 10,
              weightPercent: 50,
              sequence: 1,
              type: "Quiz",
              status: "Active",
            },
            {
              taskName: "Geometry Assignment",
              term: "T1",
              totalMark: 30,
              rawWeight: 10,
              weightPercent: 50,
              sequence: 2,
              type: "Assignment",
              status: "Active",
            },
          ],
        },
      },
      include: { assessments: true },
    });
  }

  if (demoPlan.assessments.length === 0) {
    await prisma.assessment.createMany({
      data: [
        {
          assessmentPlanId: demoPlan.id,
          taskName: "Algebra Quiz",
          term: "T1",
          totalMark: 20,
          rawWeight: 10,
          weightPercent: 50,
          sequence: 1,
          type: "Quiz",
          status: "Active",
        },
        {
          assessmentPlanId: demoPlan.id,
          taskName: "Geometry Assignment",
          term: "T1",
          totalMark: 30,
          rawWeight: 10,
          weightPercent: 50,
          sequence: 2,
          type: "Assignment",
          status: "Active",
        },
      ],
    });
    demoPlan = await prisma.assessmentPlan.findUnique({
      where: { id: demoPlan.id },
      include: { assessments: true },
    });
  }

  if (demoPlan) {
    for (const assessment of demoPlan.assessments) {
      const rawMark = assessment.taskName.includes("Algebra") ? 17 : 24;
      await prisma.mark.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId: assessment.id,
            studentId: student.id,
          },
        },
        update: {
          rawMark,
          status: "Draft",
        },
        create: {
          assessmentId: assessment.id,
          studentId: student.id,
          rawMark,
          status: "Draft",
        },
      });
    }
  }

  const existingReport = await prisma.reportCard.findFirst({
    where: { studentId: student.id, term: "T1", year: currentYear },
  });
  if (!existingReport) {
    await prisma.reportCard.create({
      data: {
        studentId: student.id,
        classGroupId: classGroup.id,
        term: "T1",
        year: currentYear,
        status: "Published",
        overallGrade: "B+",
        overallPercentage: 78,
        achievementLevel: 5,
        teacherComment: "Strong effort and consistent participation.",
        hodComment: "Keep pushing for distinction.",
        publishedAt: now,
      },
    });
  }

  await prisma.behaviorBalance.upsert({
    where: { studentId: student.id },
    update: {
      meritTotal: 15,
      demeritTotal: 4,
      netBalance: 11,
      lastResetAt: null,
    },
    create: {
      studentId: student.id,
      meritTotal: 15,
      demeritTotal: 4,
      netBalance: 11,
    },
  });

  const incidentSeeds = [
    {
      type: "Merit",
      points: 5,
      category: "Leadership",
      description: "Peer tutoring session",
      issuedById: teacherUser.id,
    },
    {
      type: "Demerit",
      points: 2,
      category: "Conduct",
      description: "Late to class",
      issuedById: teacherUser.id,
    },
    {
      type: "Merit",
      points: 4,
      category: "Academic",
      description: "Top score in algebra quiz",
      issuedById: hodUser.id,
    },
  ];

  for (const incident of incidentSeeds) {
    const existingIncident = await prisma.behaviorIncident.findFirst({
      where: {
        studentId: student.id,
        description: incident.description,
      },
    });
    if (!existingIncident) {
      await prisma.behaviorIncident.create({
        data: {
          studentId: student.id,
          schoolId: school.id,
          type: incident.type,
          points: incident.points,
          category: incident.category,
          description: incident.description,
          issuedById: incident.issuedById,
          term: "T1",
          year: currentYear,
          status: "Active",
        },
      });
    }
  }

  const feeStructure =
    (await prisma.feeStructure.findFirst({
      where: { schoolId: school.id, name: `Grade 10 Annual Fees ${currentYear}` },
    })) ??
    (await prisma.feeStructure.create({
      data: {
        schoolId: school.id,
        name: `Grade 10 Annual Fees ${currentYear}`,
        description: "Nimbus Academy annual tuition",
        grade: 10,
        year: currentYear,
        term: "Annual",
        baseAmount: 18500,
        components: [
          { name: "Tuition", amount: 16000, optional: false },
          { name: "Activities", amount: 2500, optional: false },
        ],
      },
    }));

  const invoiceNumber = `NIM-${currentYear}-001`;
  const existingInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber },
  });
  if (!existingInvoice) {
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        schoolId: school.id,
        studentId: student.id,
        feeStructureId: feeStructure.id,
        parentContactId: parentContact.id,
        term: "T1",
        year: currentYear,
        subtotal: 18500,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 18500,
        paidAmount: 5000,
        balanceDue: 13500,
        status: "Partially Paid",
        dueDate: addDays(20),
        lineItems: [
          { name: "Annual Fees", amount: 18500 },
        ],
      },
    });
  }

  const existingEvent = await prisma.schoolEvent.findFirst({
    where: { schoolId: school.id, title: "Maths Olympiad Qualifier" },
  });
  if (!existingEvent) {
    await prisma.schoolEvent.create({
      data: {
        schoolId: school.id,
        title: "Maths Olympiad Qualifier",
        description: "Round one of the annual mathematics competition.",
        eventType: "Academic",
        startDate: addDays(5),
        endDate: addDays(5),
        startTime: "14:00",
        endTime: "16:00",
        location: "Hall A",
        isAllDay: false,
        audience: ["all"],
        createdBy: adminUser.id,
        status: "Active",
      },
    });
  }

  const homeworkSeeds = [
    {
      title: "Algebra practice set",
      description: "Complete the worksheet and submit your answers.",
      dueOffset: 3,
      points: 20,
      submissionStatus: "Submitted" as const,
    },
    {
      title: "Geometry worksheet",
      description: "Focus on triangles and angle proofs.",
      dueOffset: -2,
      points: 15,
      submissionStatus: null,
    },
    {
      title: "Trigonometry challenge",
      description: "Solve the applied trig problems in the pack.",
      dueOffset: 9,
      points: 25,
      submissionStatus: null,
    },
  ];

  for (const seed of homeworkSeeds) {
    const existingHomework = await prisma.homework.findFirst({
      where: { classGroupId: classGroup.id, title: seed.title },
    });
    const homeworkRecord =
      existingHomework ??
      (await prisma.homework.create({
        data: {
          schoolId: school.id,
          classGroupId: classGroup.id,
          teacherId: teacher.id,
          title: seed.title,
          description: seed.description,
          subject: subject.name,
          dueDate: addDays(seed.dueOffset),
          assignedDate: now,
          points: seed.points,
          status: "Active",
        },
      }));

    if (seed.submissionStatus) {
      await prisma.homeworkSubmission.upsert({
        where: {
          homeworkId_studentId: {
            homeworkId: homeworkRecord.id,
            studentId: student.id,
          },
        },
        update: {
          status: seed.submissionStatus,
          submittedAt: addDays(seed.dueOffset - 1),
        },
        create: {
          homeworkId: homeworkRecord.id,
          studentId: student.id,
          status: seed.submissionStatus,
          submittedAt: addDays(seed.dueOffset - 1),
        },
      });
    }
  }

  const existingThread = await prisma.messageThread.findFirst({
    where: { schoolId: school.id, subject: "Welcome to Nimbus" },
  });
  if (!existingThread) {
    await prisma.messageThread.create({
      data: {
        schoolId: school.id,
        type: "Direct",
        subject: "Welcome to Nimbus",
        participants: [
          { id: studentUser.id, type: "student", name: "Maya Naidoo", role: "Student" },
          { id: teacherUser.id, type: "teacher", name: `${teacher.firstName} ${teacher.lastName}`, role: "Teacher" },
        ],
        lastMessageAt: now,
        createdBy: teacherUser.id,
        messages: {
          create: {
            senderId: teacherUser.id,
            content: "Welcome to Grade 10 Mathematics! Let me know if you need help.",
            readBy: [teacherUser.id],
          },
        },
      },
    });
  }
}

async function seed() {
  // Check if we should run the seed
  const hasData = await checkDatabaseHasData();
  
  if (hasData && !FORCE_SEED) {
    if (SEED_DEMO_ACCOUNTS) {
      console.log("✨ Database already contains data. Seeding demo login accounts only.");
      await ensureQuickLoginSchool();
      console.log("✅ Demo login accounts ready.");
      return;
    }
    console.log("📦 Database already contains data. Skipping seed to preserve existing data.");
    console.log("   To seed demo accounts only, run with SEED_DEMO_ACCOUNTS=true");
    console.log("   To force re-seed (WILL DELETE ALL DATA), run with FORCE_SEED=true");
    console.log("   Example: SEED_DEMO_ACCOUNTS=true npx prisma db seed");
    return;
  }
  
  if (FORCE_SEED && hasData) {
    await clearAllData();
  }
  
  console.log("🌱 Starting database seed...");

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
      branding: {
        logoUrl: null,
        primary: "#1f8679",
        secondary: "#f28c28",
        accent: "#ff6b5b",
      },
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

  const hodTeacher = await prisma.teacher.create({
    data: {
      firstName: "Bongani",
      lastName: "Khuzwayo",
      email: "bongani.khuzwayo@schoolmatica.com",
      phone: "+27 82 555 1111",
      role: "HOD",
      schoolId: school.id,
      bio: "English department head",
    },
  });

  const smtTeacher = await prisma.teacher.create({
    data: {
      firstName: "Thuli",
      lastName: "Nkadimeng",
      email: "thuli.nkadimeng@schoolmatica.com",
      phone: "+27 82 999 2222",
      role: "SMT",
      schoolId: school.id,
      bio: "Deputy Principal",
    },
  });

  await prisma.permissionDefinition.createMany({ data: permissionSeeds });
  const permissions = await prisma.permissionDefinition.findMany();
  const permissionByKey = new Map<string, (typeof permissions)[number]>(
    permissions.map((permission: (typeof permissions)[number]) => [permission.key, permission]),
  );

  const roles = await Promise.all(
    roleSeeds.map((roleSeed) =>
      prisma.roleDefinition.create({
        data: roleSeed,
      }),
    ),
  );
  const roleByKey = new Map<string, (typeof roles)[number]>(
    roles.map((role: (typeof roles)[number]) => [role.key, role]),
  );

  for (const [roleKey, permissionKeys] of Object.entries(rolePermissionMatrix)) {
    const role = roleByKey.get(roleKey);
    if (!role) continue;
    const rolePermissionData: { roleId: string; permissionId: string }[] = [];
    for (const permissionKey of permissionKeys) {
      const permission = permissionByKey.get(permissionKey);
      if (!permission) continue;
      rolePermissionData.push({ roleId: role.id, permissionId: permission.id });
    }
    if (rolePermissionData.length) {
      await prisma.rolePermission.createMany({ data: rolePermissionData });
    }
  }

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

  const passwordHash = await bcrypt.hash("password123", 10);

  const nalediUser = await prisma.appUser.create({
    data: {
      email: leadTeacher.email,
      displayName: `${leadTeacher.firstName} ${leadTeacher.lastName}`,
      schoolId: school.id,
      teacherId: leadTeacher.id,
      passwordHash,
    },
  });

  const hodUser = await prisma.appUser.create({
    data: {
      email: hodTeacher.email,
      displayName: `${hodTeacher.firstName} ${hodTeacher.lastName}`,
      schoolId: school.id,
      teacherId: hodTeacher.id,
      passwordHash,
    },
  });

  const smtUser = await prisma.appUser.create({
    data: {
      email: smtTeacher.email,
      displayName: `${smtTeacher.firstName} ${smtTeacher.lastName}`,
      schoolId: school.id,
      teacherId: smtTeacher.id,
      passwordHash,
    },
  });

  // Create school administrator (for specific school)
  const adminUser = await prisma.appUser.create({
    data: {
      email: "admin@schoolmatica.com",
      displayName: "School Administrator",
      schoolId: school.id,
      passwordHash,
    },
  });

  // Create super administrator (platform-level, no specific school)
  // IMPORTANT: Use a separate password hash for super admin with custom credentials
  const superAdminPasswordHash = await bcrypt.hash("Admin@2025", 10);
  const superAdminUser = await prisma.appUser.create({
    data: {
      email: "guneev66@gmail.com",
      displayName: "Guneev Singh (Super Administrator)",
      schoolId: null, // No specific school - platform-level
      passwordHash: superAdminPasswordHash,
    },
  });

  await prisma.userRoleAssignment.createMany({
    data: [
      {
        userId: nalediUser.id,
        roleId: roleByKey.get("teacher")!.id,
        scopeSchoolId: school.id,
      },
      {
        userId: hodUser.id,
        roleId: roleByKey.get("hod")!.id,
        scopeSchoolId: school.id,
      },
      {
        userId: smtUser.id,
        roleId: roleByKey.get("smt")!.id,
        scopeSchoolId: school.id,
      },
      {
        userId: adminUser.id,
        roleId: roleByKey.get("admin")!.id,
        scopeSchoolId: school.id, // Admin is scoped to their school
      },
      {
        userId: superAdminUser.id,
        roleId: roleByKey.get("super_admin")!.id,
        scopeSchoolId: null, // Super admin has platform-level access
      },
    ],
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

  console.log("✅ Database seed completed successfully!");
  console.log("   - Created demo school: SchoolMatica High");
  console.log("   - Created super admin: guneev66@gmail.com (password: Admin@2025)");
  console.log("   - Created school admin: admin@schoolmatica.com (password: password123)");
  console.log("   - Created sample teachers, students, and assessments");

  await ensureQuickLoginSchool();
  console.log("✅ Quick login school and demo accounts created (Nimbus Academy)");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
