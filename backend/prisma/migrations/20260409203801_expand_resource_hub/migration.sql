/*
  Warnings:

  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Professional` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN "sentimentScore" DECIMAL;
ALTER TABLE "JournalEntry" ADD COLUMN "sleepHours" DECIMAL;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Appointment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Professional";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Profile" (
    "profileId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstPregnancy" BOOLEAN NOT NULL,
    "historyOfBipolar" BOOLEAN NOT NULL,
    "babyBirthDate" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostAttachment" (
    "attachmentId" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost" ("postId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostSupport" (
    "supportId" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostSupport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost" ("postId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostSupport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expert" (
    "expertId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "specialization" TEXT,
    "licenseNo" TEXT,
    "bio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "availability" TEXT,
    CONSTRAINT "Expert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Consultation" (
    "meetingId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "dateTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "clinicalNotes" TEXT,
    CONSTRAINT "Consultation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Consultation_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert" ("expertId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartnerBridge" (
    "bridgeId" TEXT NOT NULL PRIMARY KEY,
    "motherUserId" TEXT NOT NULL,
    "partnerUserId" TEXT,
    "partnerEmail" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "alertNotification" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PartnerBridge_motherUserId_fkey" FOREIGN KEY ("motherUserId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PartnerBridge_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RedFlagLog" (
    "alertId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "triggerSource" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RedFlagLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskTracker" (
    "taskId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResourceHub" (
    "resourceId" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "thumbnail" TEXT,
    "url" TEXT,
    "authorName" TEXT,
    "authorRole" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ModAudit" (
    "auditId" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "reason" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModAudit_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost" ("postId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModAudit_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CommunityPost" (
    "postId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT,
    "body" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "pseudonym" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CommunityPost" ("content", "createdAt", "postId", "pseudonym", "userId") SELECT "content", "createdAt", "postId", "pseudonym", "userId" FROM "CommunityPost";
DROP TABLE "CommunityPost";
ALTER TABLE "new_CommunityPost" RENAME TO "CommunityPost";
CREATE TABLE "new_User" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "faceVerifyStatus" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "mustResetPassword" BOOLEAN NOT NULL DEFAULT false,
    "currentMoodScore" DECIMAL,
    "communityPseudonym" TEXT,
    "communityBio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "fullName", "passwordHash", "phoneNumber", "role", "userId") SELECT "createdAt", "email", "fullName", "passwordHash", "phoneNumber", "role", "userId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostSupport_postId_userId_key" ON "PostSupport"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Expert_userId_key" ON "Expert"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Expert_licenseNo_key" ON "Expert"("licenseNo");
