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
    "pricing" TEXT NOT NULL DEFAULT 'PAID',
    "exampleScenario" TEXT,
    "scenarioUser" TEXT,
    "scenarioProblem" TEXT,
    "scenarioHow" TEXT,
    "scenarioResult" TEXT,
    "releaseDate" DATETIME,
    "affiliateProgram" BOOLEAN NOT NULL DEFAULT false,
    "affiliateSignupUrl" TEXT,
    "affiliateLink" TEXT,
    "submitterEmail" TEXT,
    "submittedById" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "Tool_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Creator" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tool_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tool_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Old "free tier" yes/no maps to Freemium/Paid.
INSERT INTO "new_Tool" ("affiliateLink", "affiliateProgram", "affiliateSignupUrl", "body", "categoryId", "createdAt", "creatorId", "description", "exampleScenario", "featured", "id", "logoUrl", "name", "releaseDate", "scenarioHow", "scenarioProblem", "scenarioResult", "scenarioUser", "slug", "status", "submittedAt", "submitterEmail", "tagline", "updatedAt", "websiteUrl", "pricing") SELECT "affiliateLink", "affiliateProgram", "affiliateSignupUrl", "body", "categoryId", "createdAt", "creatorId", "description", "exampleScenario", "featured", "id", "logoUrl", "name", "releaseDate", "scenarioHow", "scenarioProblem", "scenarioResult", "scenarioUser", "slug", "status", "submittedAt", "submitterEmail", "tagline", "updatedAt", "websiteUrl", CASE WHEN "freeTier" THEN 'FREEMIUM' ELSE 'PAID' END FROM "Tool";
DROP TABLE "Tool";
ALTER TABLE "new_Tool" RENAME TO "Tool";
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");
CREATE INDEX "Tool_status_featured_idx" ON "Tool"("status", "featured");
CREATE INDEX "Tool_pricing_idx" ON "Tool"("pricing");
CREATE INDEX "Tool_categoryId_idx" ON "Tool"("categoryId");
CREATE INDEX "Tool_creatorId_idx" ON "Tool"("creatorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

