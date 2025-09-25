/**
 * Migration script to move orphaned resources to projects
 * This script should be run BEFORE the schema migration that makes projectId required
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateOrphanedResources() {
  console.log('🔍 Checking for orphaned resources...');

  try {
    // Find all resources without a projectId
    const orphanedResources = await prisma.resource.findMany({
      where: {
        projectId: null,
      },
      include: {
        owner: {
          include: {
            ownedTeams: {
              include: {
                projects: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${orphanedResources.length} orphaned resources`);

    if (orphanedResources.length === 0) {
      console.log('✅ No orphaned resources found. Migration not needed.');
      return;
    }

    // Create a default project for each user who has orphaned resources
    const userResourceMap = new Map();

    for (const resource of orphanedResources) {
      if (!userResourceMap.has(resource.ownerId)) {
        userResourceMap.set(resource.ownerId, []);
      }
      userResourceMap.get(resource.ownerId).push(resource);
    }

    console.log(`👤 Processing orphaned resources for ${userResourceMap.size} users`);

    for (const [userId, resources] of userResourceMap.entries()) {
      const user = resources[0].owner;

      // Find user's personal team
      let personalTeam = user.ownedTeams.find(team => team.isPersonal);

      if (!personalTeam) {
        console.log(`⚠️  User ${user.email} has no personal team. Creating one...`);
        personalTeam = await prisma.team.create({
          data: {
            name: `${user.name || user.email}'s Team`,
            description: 'Personal team for individual resources',
            isPersonal: true,
            ownerId: userId,
            organisationId: null,
          },
        });
      }

      // Check if user has a "Legacy Resources" project in their personal team
      let legacyProject = personalTeam.projects.find(
        project => project.name === 'Legacy Resources'
      );

      if (!legacyProject) {
        console.log(`📦 Creating "Legacy Resources" project for ${user.email}...`);
        legacyProject = await prisma.project.create({
          data: {
            name: 'Legacy Resources',
            description: 'Resources migrated from the old system without project association',
            teamId: personalTeam.id,
            status: 'ACTIVE',
            priority: 'MEDIUM',
          },
        });
      }

      // Move all orphaned resources to the legacy project
      console.log(`🔄 Moving ${resources.length} resources to Legacy Resources project for ${user.email}...`);

      for (const resource of resources) {
        await prisma.resource.update({
          where: { id: resource.id },
          data: { projectId: legacyProject.id },
        });
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log(`📈 Summary:`);
    console.log(`   - ${orphanedResources.length} resources migrated`);
    console.log(`   - ${userResourceMap.size} users processed`);
    console.log(`   - Legacy projects created as needed`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateOrphanedResources()
  .then(() => {
    console.log('🎉 Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });