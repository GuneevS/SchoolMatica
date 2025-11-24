/**
 * Permission Migration Script
 * Run this to update the database with the new comprehensive permission system
 * 
 * Usage: npx tsx prisma/migrate-permissions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_PERMISSIONS = [
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
  
  // System Admin
  { key: "system:admin", resource: "system", action: "admin", description: "Full system access across all schools" },
];

async function migratePermissions() {
  console.log("🚀 Starting permission migration...\n");
  
  // Step 1: Create/Update permissions
  console.log("📝 Creating/updating permission definitions...");
  for (const perm of NEW_PERMISSIONS) {
    await prisma.permissionDefinition.upsert({
      where: { key: perm.key },
      create: perm,
      update: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
    });
  }
  console.log(`✅ Created/updated ${NEW_PERMISSIONS.length} permissions\n`);
  
  // Step 2: Create admin role if it doesn't exist
  console.log("👑 Setting up admin role...");
  const adminRole = await prisma.roleDefinition.upsert({
    where: { key: "admin" },
    create: {
      key: "admin",
      name: "System Administrator",
      priority: 100,
      description: "Full system access across all schools",
    },
    update: {
      name: "System Administrator",
      priority: 100,
      description: "Full system access across all schools",
    },
  });
  
  // Grant system:admin permission to admin role
  const systemAdminPerm = await prisma.permissionDefinition.findUnique({
    where: { key: "system:admin" },
  });
  
  if (systemAdminPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: systemAdminPerm.id,
        },
      },
      create: {
        roleId: adminRole.id,
        permissionId: systemAdminPerm.id,
      },
      update: {},
    });
    console.log("✅ Admin role configured with system:admin permission\n");
  }
  
  // Step 3: Display role summary
  console.log("📊 Current roles summary:");
  const roles = await prisma.roleDefinition.findMany({
    include: {
      permissions: {
        include: { permission: true },
      },
    },
    orderBy: { priority: "desc" },
  });
  
  for (const role of roles) {
    console.log(`\n  ${role.name} (${role.key}) - Priority: ${role.priority}`);
    console.log(`  Permissions: ${role.permissions.length}`);
  }
  
  console.log("\n\n✨ Migration completed successfully!");
  console.log("\n📌 Next steps:");
  console.log("  1. Restart your development server");
  console.log("  2. Set user email header: x-user-email: admin@schoolmatica.com");
  console.log("  3. Test admin access to all schools");
  console.log("  4. Verify role-based permissions in the UI\n");
}

migratePermissions()
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
