/*
  Warnings:

  - You are about to drop the column `message` on the `organisation_join_requests` table. All the data in the column will be lost.
  - You are about to drop the column `responseMessage` on the `organisation_join_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."organisation_join_requests" DROP COLUMN "message",
DROP COLUMN "responseMessage";
