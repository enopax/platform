-- CreateEnum
CREATE TYPE "public"."StorageTier" AS ENUM ('FREE_500MB', 'BASIC_5GB', 'PRO_50GB', 'ENTERPRISE_500GB', 'UNLIMITED');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "storageTier" "public"."StorageTier" NOT NULL DEFAULT 'FREE_500MB';

-- CreateTable
CREATE TABLE "public"."user_files" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ipfs_hash" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_pinned" BOOLEAN NOT NULL DEFAULT true,
    "replication_count" INTEGER NOT NULL DEFAULT 0,
    "node_locations" TEXT[],
    "metadata" JSONB,
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_storage_quotas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" "public"."StorageTier" NOT NULL DEFAULT 'FREE_500MB',
    "allocated_bytes" BIGINT NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tier_updated_at" TIMESTAMP(3),
    "tier_updated_by" TEXT,
    "subscription_id" TEXT,
    "subscription_ends" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_storage_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_files_ipfs_hash_idx" ON "public"."user_files"("ipfs_hash");

-- CreateIndex
CREATE INDEX "user_files_user_id_uploaded_at_idx" ON "public"."user_files"("user_id", "uploaded_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_files_user_id_ipfs_hash_key" ON "public"."user_files"("user_id", "ipfs_hash");

-- CreateIndex
CREATE UNIQUE INDEX "user_storage_quotas_user_id_key" ON "public"."user_storage_quotas"("user_id");

-- AddForeignKey
ALTER TABLE "public"."user_files" ADD CONSTRAINT "user_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_storage_quotas" ADD CONSTRAINT "user_storage_quotas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
