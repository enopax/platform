/*
  Warnings:

  - You are about to drop the column `organisation_id` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `team_id` on the `resources` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,team_id]` on the table `projects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,owner_id]` on the table `teams` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."resources" DROP CONSTRAINT "resources_team_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."teams" DROP CONSTRAINT "teams_organisation_id_fkey";

-- DropIndex
DROP INDEX "public"."projects_name_organisation_id_key";

-- DropIndex
DROP INDEX "public"."teams_name_organisation_id_key";

-- AlterTable
ALTER TABLE "public"."projects" DROP COLUMN "organisation_id",
ADD COLUMN     "development" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."resources" DROP COLUMN "team_id",
ADD COLUMN     "project_id" TEXT;

-- AlterTable
ALTER TABLE "public"."teams" ADD COLUMN     "is_deletable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_personal" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "organisation_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_team_id_key" ON "public"."projects"("name", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_owner_id_key" ON "public"."teams"("name", "owner_id");

-- AddForeignKey
ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
