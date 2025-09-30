-- CreateEnum
CREATE TYPE "public"."TeamVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "public"."MembershipEntity" AS ENUM ('ORGANISATION', 'TEAM');

-- CreateEnum
CREATE TYPE "public"."MembershipAction" AS ENUM ('ADDED', 'REMOVED', 'ROLE_CHANGED', 'PROMOTED', 'DEMOTED');

-- AlterTable
ALTER TABLE "public"."teams" ADD COLUMN     "allowJoinRequests" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxMembers" INTEGER,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "visibility" "public"."TeamVisibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable
CREATE TABLE "public"."team_join_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "status" "public"."JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "responded_by" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."membership_audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" "public"."MembershipEntity" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" "public"."MembershipAction" NOT NULL,
    "old_role" TEXT,
    "new_role" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_join_requests_user_id_team_id_key" ON "public"."team_join_requests"("user_id", "team_id");

-- AddForeignKey
ALTER TABLE "public"."team_join_requests" ADD CONSTRAINT "team_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_join_requests" ADD CONSTRAINT "team_join_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_audit_logs" ADD CONSTRAINT "membership_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_audit_logs" ADD CONSTRAINT "membership_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
