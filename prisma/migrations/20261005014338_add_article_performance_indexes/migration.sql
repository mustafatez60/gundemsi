-- CreateIndex
CREATE INDEX "Article_status_createdAt_idx" ON "Article"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Article_status_isFeatured_createdAt_idx" ON "Article"("status", "isFeatured", "createdAt");

-- CreateIndex
CREATE INDEX "Article_status_isBreaking_updatedAt_idx" ON "Article"("status", "isBreaking", "updatedAt");

-- CreateIndex
CREATE INDEX "Article_status_viewCount_createdAt_idx" ON "Article"("status", "viewCount", "createdAt");

-- CreateIndex
CREATE INDEX "Article_categoryId_status_createdAt_idx" ON "Article"("categoryId", "status", "createdAt");
