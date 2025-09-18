-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('COMPUTE', 'STORAGE', 'NETWORK', 'DATABASE', 'API', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ResourceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED');

-- CreateTable
CREATE TABLE "public"."resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ResourceType" NOT NULL DEFAULT 'OTHER',
    "status" "public"."ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "configuration" JSONB,
    "endpoint" TEXT,
    "credentials" JSONB,
    "quota_limit" BIGINT,
    "current_usage" BIGINT NOT NULL DEFAULT 0,
    "owner_id" TEXT NOT NULL,
    "team_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
