-- CreateTable
CREATE TABLE "ToolReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "creatorId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ToolReview_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ToolReview_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlowReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "creatorId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FlowReview_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FlowReview_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ToolReview_toolId_createdAt_idx" ON "ToolReview"("toolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ToolReview_creatorId_toolId_key" ON "ToolReview"("creatorId", "toolId");

-- CreateIndex
CREATE INDEX "FlowReview_flowId_createdAt_idx" ON "FlowReview"("flowId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FlowReview_creatorId_flowId_key" ON "FlowReview"("creatorId", "flowId");

