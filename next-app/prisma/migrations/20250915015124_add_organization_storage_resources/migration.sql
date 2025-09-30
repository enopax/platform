-- AlterTable
ALTER TABLE "public"."user_files" ADD COLUMN     "project_id" TEXT,
ADD COLUMN     "team_id" TEXT;

-- CreateTable
CREATE TABLE "public"."organization_storage_resources" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" "public"."StorageTier" NOT NULL DEFAULT 'FREE_500MB',
    "total_bytes" BIGINT NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "subscription_id" TEXT,
    "subscription_ends" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_storage_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_storage_assignments" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "allocated_bytes" BIGINT NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_storage_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_storage_assignments_resource_id_team_id_key" ON "public"."team_storage_assignments"("resource_id", "team_id");

-- CreateIndex
CREATE INDEX "user_files_team_id_uploaded_at_idx" ON "public"."user_files"("team_id", "uploaded_at");

-- CreateIndex
CREATE INDEX "user_files_project_id_uploaded_at_idx" ON "public"."user_files"("project_id", "uploaded_at");

-- AddForeignKey
ALTER TABLE "public"."user_files" ADD CONSTRAINT "user_files_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_files" ADD CONSTRAINT "user_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_storage_resources" ADD CONSTRAINT "organization_storage_resources_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_storage_resources" ADD CONSTRAINT "organization_storage_resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_storage_assignments" ADD CONSTRAINT "team_storage_assignments_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."organization_storage_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_storage_assignments" ADD CONSTRAINT "team_storage_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_storage_assignments" ADD CONSTRAINT "team_storage_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
