/*
  Warnings:

  - You are about to drop the `organization_storage_resources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_storage_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."organization_storage_resources" DROP CONSTRAINT "organization_storage_resources_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."organization_storage_resources" DROP CONSTRAINT "organization_storage_resources_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_storage_assignments" DROP CONSTRAINT "team_storage_assignments_assigned_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_storage_assignments" DROP CONSTRAINT "team_storage_assignments_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_storage_assignments" DROP CONSTRAINT "team_storage_assignments_team_id_fkey";

-- DropTable
DROP TABLE "public"."organization_storage_resources";

-- DropTable
DROP TABLE "public"."team_storage_assignments";

-- CreateTable
CREATE TABLE "public"."team_storage_resources" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" "public"."StorageTier" NOT NULL DEFAULT 'FREE_500MB',
    "total_bytes" BIGINT NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "subscription_id" TEXT,
    "subscription_ends" TIMESTAMP(3),
    "purchased_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_storage_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_storage_resources_team_id_key" ON "public"."team_storage_resources"("team_id");

-- AddForeignKey
ALTER TABLE "public"."team_storage_resources" ADD CONSTRAINT "team_storage_resources_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_storage_resources" ADD CONSTRAINT "team_storage_resources_purchased_by_fkey" FOREIGN KEY ("purchased_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
