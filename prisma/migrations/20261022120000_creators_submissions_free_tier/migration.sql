-- AlterTable
ALTER TABLE "Creator" ADD COLUMN "email" TEXT;
ALTER TABLE "Creator" ADD COLUMN "passwordHash" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "freeTier" BOOLEAN NOT NULL DEFAULT false,
    "exampleScenario" TEXT,
    "affiliateProgram" BOOLEAN NOT NULL DEFAULT false,
    "affiliateSignupUrl" TEXT,
    "affiliateLink" TEXT,
    "submitterEmail" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "Tool_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tool_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tool" ("body", "categoryId", "createdAt", "creatorId", "description", "featured", "id", "logoUrl", "name", "slug", "status", "tagline", "updatedAt", "websiteUrl") SELECT "body", "categoryId", "createdAt", "creatorId", "description", "featured", "id", "logoUrl", "name", "slug", "status", "tagline", "updatedAt", "websiteUrl" FROM "Tool";
DROP TABLE "Tool";
ALTER TABLE "new_Tool" RENAME TO "Tool";
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");
CREATE INDEX "Tool_status_featured_idx" ON "Tool"("status", "featured");
CREATE INDEX "Tool_freeTier_idx" ON "Tool"("freeTier");
CREATE INDEX "Tool_categoryId_idx" ON "Tool"("categoryId");
CREATE INDEX "Tool_creatorId_idx" ON "Tool"("creatorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Creator_email_key" ON "Creator"("email");

