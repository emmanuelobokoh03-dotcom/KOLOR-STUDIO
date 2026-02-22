// Script to backfill "Lead created" activities for existing leads
// Run with: npx ts-node src/scripts/backfill-activities.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillActivities() {
  console.log('Starting activity backfill...\n');

  // Find all leads that don't have any activities
  const leads = await prisma.lead.findMany({
    include: {
      activities: true,
      assignedTo: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  console.log(`Found ${leads.length} total leads\n`);

  let backfilledCount = 0;

  for (const lead of leads) {
    // Check if lead has no activities
    if (lead.activities.length === 0) {
      console.log(`Backfilling: ${lead.clientName} - ${lead.projectTitle}`);
      
      // Create a "Lead created" activity
      await prisma.activity.create({
        data: {
          type: 'NOTE_ADDED',
          description: `Lead created for ${lead.clientName} (${lead.serviceType})`,
          leadId: lead.id,
          userId: lead.assignedToId,
          metadata: {
            source: 'backfill',
            originalCreatedAt: lead.createdAt.toISOString(),
            serviceType: lead.serviceType
          },
          createdAt: lead.createdAt, // Use the lead's original creation date
        }
      });

      backfilledCount++;
    }
  }

  console.log(`\nBackfill complete! Created ${backfilledCount} activities.`);
}

backfillActivities()
  .catch((error) => {
    console.error('Backfill error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
