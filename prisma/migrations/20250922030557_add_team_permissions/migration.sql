-- AlterTable
ALTER TABLE "public"."team_members" ADD COLUMN     "can_execute" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_lead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_read" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "can_write" BOOLEAN NOT NULL DEFAULT false;
