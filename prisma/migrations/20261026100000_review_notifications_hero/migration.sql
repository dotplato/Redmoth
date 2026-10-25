-- AlterTable
ALTER TABLE "Tool" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "Tool" ADD COLUMN "reviewedAt" DATETIME;

-- CreateTable
CREATE TABLE "HeroSlot" (
    "position" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "toolId" TEXT NOT NULL,
    CONSTRAINT "HeroSlot_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "toolId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminNotification_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "toolId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "HeroSlot_toolId_key" ON "HeroSlot"("toolId");

-- CreateIndex
CREATE INDEX "AdminNotification_read_createdAt_idx" ON "AdminNotification"("read", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

