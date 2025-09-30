/*
  Warnings:

  - Made the column `project_id` on table `resources` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."resources" ALTER COLUMN "project_id" SET NOT NULL;
