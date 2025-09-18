/*
  Warnings:

  - You are about to drop the column `owner_id` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the `project_teams` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `team_id` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."project_teams" DROP CONSTRAINT "project_teams_project_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_teams" DROP CONSTRAINT "project_teams_team_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_owner_id_fkey";

-- AlterTable
ALTER TABLE "public"."projects" DROP COLUMN "owner_id",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "team_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."project_teams";

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
