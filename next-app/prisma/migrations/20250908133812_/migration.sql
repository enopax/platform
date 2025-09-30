-- CreateTable
CREATE TABLE "public"."user_storage_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "totalSize" BIGINT NOT NULL DEFAULT 0,
    "pinnedFiles" INTEGER NOT NULL DEFAULT 0,
    "pinnedSize" BIGINT NOT NULL DEFAULT 0,
    "uploadCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "deleteCount" INTEGER NOT NULL DEFAULT 0,
    "documentFiles" INTEGER NOT NULL DEFAULT 0,
    "imageFiles" INTEGER NOT NULL DEFAULT 0,
    "videoFiles" INTEGER NOT NULL DEFAULT 0,
    "archiveFiles" INTEGER NOT NULL DEFAULT 0,
    "otherFiles" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER NOT NULL DEFAULT 0,
    "availabilityRate" DOUBLE PRECISION NOT NULL DEFAULT 100.0,

    CONSTRAINT "user_storage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_storage_activity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "file_name" TEXT,
    "file_size" BIGINT,
    "ipfs_hash" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response_time" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,

    CONSTRAINT "user_storage_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_storage_metrics_user_id_date_key" ON "public"."user_storage_metrics"("user_id", "date");

-- CreateIndex
CREATE INDEX "user_storage_activity_user_id_timestamp_idx" ON "public"."user_storage_activity"("user_id", "timestamp");

-- AddForeignKey
ALTER TABLE "public"."user_storage_metrics" ADD CONSTRAINT "user_storage_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_storage_activity" ADD CONSTRAINT "user_storage_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
