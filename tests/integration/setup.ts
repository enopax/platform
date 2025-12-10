import { PrismaClient } from '@prisma/client';
import { userService } from '@/lib/services/user';
import { organisationService } from '@/lib/services/organisation';
import { teamService } from '@/lib/services/team';
import { projectService } from '@/lib/services/project';
import { resourceService } from '@/lib/services/resource';

let prisma: PrismaClient;

export async function setupIntegrationTests() {
  prisma = new PrismaClient();
  await prisma.$connect();
  console.log('✅ Integration test database connected');
}

export async function teardownIntegrationTests() {
  if (prisma) {
    await prisma.$disconnect();
    console.log('✅ Integration test database disconnected');
  }
}

export function getPrismaClient() {
  return prisma;
}

export function getServices() {
  return {
    userService,
    organisationService,
    teamService,
    projectService,
    resourceService,
  };
}

export async function cleanupTestData() {
  if (!prisma) {
    return;
  }

  try {
    await prisma.$transaction([
      prisma.projectResource.deleteMany(),
      prisma.projectTeam.deleteMany(),
      prisma.resource.deleteMany(),
      prisma.project.deleteMany(),
      prisma.teamMember.deleteMany(),
      prisma.team.deleteMany(),
      prisma.organisationMember.deleteMany(),
      prisma.organisation.deleteMany(),
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
    throw error;
  }
}
