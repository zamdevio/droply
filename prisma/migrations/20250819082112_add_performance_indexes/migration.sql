-- CreateIndex
CREATE INDEX "File_passwordHash_idx" ON "File"("passwordHash");

-- CreateIndex
CREATE INDEX "File_status_expiresAt_idx" ON "File"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "File_status_passwordHash_idx" ON "File"("status", "passwordHash");
