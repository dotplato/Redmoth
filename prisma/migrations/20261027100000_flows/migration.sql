-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "logoUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Flow_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Flow_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlowTool" (
    "flowId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    PRIMARY KEY ("flowId", "toolId"),
    CONSTRAINT "FlowTool_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FlowTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlowStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "FlowStep_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FlowStep_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedFlow" (
    "creatorId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("creatorId", "flowId"),
    CONSTRAINT "SavedFlow_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedFlow_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Flow_slug_key" ON "Flow"("slug");

-- CreateIndex
CREATE INDEX "Flow_featured_idx" ON "Flow"("featured");

-- CreateIndex
CREATE INDEX "Flow_categoryId_idx" ON "Flow"("categoryId");

-- CreateIndex
CREATE INDEX "Flow_authorId_idx" ON "Flow"("authorId");

-- CreateIndex
CREATE INDEX "FlowTool_toolId_idx" ON "FlowTool"("toolId");

-- CreateIndex
CREATE INDEX "FlowStep_flowId_position_idx" ON "FlowStep"("flowId", "position");

-- CreateIndex
CREATE INDEX "FlowStep_toolId_idx" ON "FlowStep"("toolId");

-- CreateIndex
CREATE INDEX "SavedFlow_creatorId_createdAt_idx" ON "SavedFlow"("creatorId", "createdAt");

