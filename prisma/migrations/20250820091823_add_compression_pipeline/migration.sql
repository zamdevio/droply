-- AlterTable
ALTER TABLE "File" ADD COLUMN     "compressionAlgo" TEXT,
ADD COLUMN     "compressionRatio" DOUBLE PRECISION,
ADD COLUMN     "isCompressed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalSize" BIGINT;

-- CreateIndex
CREATE INDEX "File_isCompressed_idx" ON "File"("isCompressed");

-- CreateIndex
CREATE INDEX "File_compressionAlgo_idx" ON "File"("compressionAlgo");
