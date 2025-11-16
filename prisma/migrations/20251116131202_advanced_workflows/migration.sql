-- AlterTable
ALTER TABLE "ModerationComment" ADD COLUMN "attachmentUrl" TEXT;

-- AlterTable
ALTER TABLE "ModerationThread" ADD COLUMN "kind" TEXT;
ALTER TABLE "ModerationThread" ADD COLUMN "title" TEXT;

-- CreateTable
CREATE TABLE "CurriculumTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "defaultTermCount" INTEGER NOT NULL,
    "schoolId" TEXT,
    "createdByRole" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CurriculumTemplate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssessmentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "curriculumTemplateId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "totalMark" INTEGER NOT NULL,
    "rawWeight" REAL NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" TEXT,
    "isPatComponent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssessmentTemplate_curriculumTemplateId_fkey" FOREIGN KEY ("curriculumTemplateId") REFERENCES "CurriculumTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssessmentDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT,
    "assessmentPlanId" TEXT,
    "threadId" TEXT,
    "label" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "uploadedByRole" TEXT NOT NULL,
    "uploadedByName" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentDocument_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AssessmentDocument_assessmentPlanId_fkey" FOREIGN KEY ("assessmentPlanId") REFERENCES "AssessmentPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AssessmentDocument_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ModerationThread" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "reviewerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentApproval_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AssessmentDocument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorName" TEXT,
    "metadata" JSONB,
    "diff" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearnerRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "classGroupId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "learnerData" JSONB NOT NULL,
    "guardianData" JSONB NOT NULL,
    "supportingDocs" JSONB,
    "studentId" TEXT,
    "submittedAt" DATETIME,
    "decidedAt" DATETIME,
    "decisionNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearnerRegistration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LearnerRegistration_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LearnerRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarkSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentPlanId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "sbaPercent" REAL NOT NULL,
    "termPercent" REAL NOT NULL,
    "level" INTEGER NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarkSnapshot_assessmentPlanId_fkey" FOREIGN KEY ("assessmentPlanId") REFERENCES "AssessmentPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MarkSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentPlanId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "totalMark" INTEGER NOT NULL,
    "rawWeight" REAL NOT NULL,
    "weightPercent" REAL NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" TEXT,
    "status" TEXT NOT NULL,
    "dueDate" DATETIME,
    "isPatComponent" BOOLEAN NOT NULL DEFAULT false,
    "termWeightOverride" REAL,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assessment_assessmentPlanId_fkey" FOREIGN KEY ("assessmentPlanId") REFERENCES "AssessmentPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assessment" ("assessmentPlanId", "createdAt", "id", "rawWeight", "sequence", "status", "taskName", "term", "totalMark", "type", "updatedAt", "weightPercent") SELECT "assessmentPlanId", "createdAt", "id", "rawWeight", "sequence", "status", "taskName", "term", "totalMark", "type", "updatedAt", "weightPercent" FROM "Assessment";
DROP TABLE "Assessment";
ALTER TABLE "new_Assessment" RENAME TO "Assessment";
CREATE TABLE "new_AssessmentPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "termCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "lockedAt" DATETIME,
    "submittedByRole" TEXT,
    "approvedByRole" TEXT,
    "termWeights" JSONB,
    "templateId" TEXT,
    "classGroupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssessmentPlan_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CurriculumTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AssessmentPlan_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AssessmentPlan" ("classGroupId", "createdAt", "id", "name", "status", "termCount", "updatedAt", "year") SELECT "classGroupId", "createdAt", "id", "name", "status", "termCount", "updatedAt", "year" FROM "AssessmentPlan";
DROP TABLE "AssessmentPlan";
ALTER TABLE "new_AssessmentPlan" RENAME TO "AssessmentPlan";
CREATE TABLE "new_ClassGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "curriculumTemplateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClassGroup_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClassGroup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClassGroup_curriculumTemplateId_fkey" FOREIGN KEY ("curriculumTemplateId") REFERENCES "CurriculumTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ClassGroup" ("createdAt", "grade", "id", "name", "schoolId", "subjectId", "updatedAt", "year") SELECT "createdAt", "grade", "id", "name", "schoolId", "subjectId", "updatedAt", "year" FROM "ClassGroup";
DROP TABLE "ClassGroup";
ALTER TABLE "new_ClassGroup" RENAME TO "ClassGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_createdAt_idx" ON "AuditLog"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerRegistration_studentId_key" ON "LearnerRegistration"("studentId");

-- CreateIndex
CREATE INDEX "MarkSnapshot_assessmentPlanId_term_idx" ON "MarkSnapshot"("assessmentPlanId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "MarkSnapshot_assessmentPlanId_studentId_term_key" ON "MarkSnapshot"("assessmentPlanId", "studentId", "term");
