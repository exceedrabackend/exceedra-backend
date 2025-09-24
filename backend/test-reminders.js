const { PrismaClient } = require('@prisma/client');
const { addDays, subDays } = require('date-fns');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createTestDataForReminders() {
  try {
    // Find the admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('No admin user found. Please run seed first.');
      return;
    }

    const today = new Date();

    // Create a damage report with Airbnb deadline tomorrow (should trigger reminder)
    const damageReportTomorrow = await prisma.damageReport.create({
      data: {
        reportedById: admin.id,
        propertyName: 'Test Property - Deadline Tomorrow',
        propertyAddress: '123 Test Street',
        damageDate: subDays(today, 13), // 13 days ago, so deadline is tomorrow
        checkoutDate: subDays(today, 13),
        airbnbDeadline: addDays(today, 1), // Tomorrow
        proofDeadline: addDays(today, 17), // 17 days from now
        status: 'PENDING'
      }
    });

    // Create a damage report with Airbnb deadline today (should trigger urgent reminder)
    const damageReportToday = await prisma.damageReport.create({
      data: {
        reportedById: admin.id,
        propertyName: 'Test Property - Deadline Today',
        propertyAddress: '456 Test Avenue',
        damageDate: subDays(today, 14), // 14 days ago, so deadline is today
        checkoutDate: subDays(today, 14),
        airbnbDeadline: today, // Today
        proofDeadline: addDays(today, 16), // 16 days from now
        status: 'PENDING'
      }
    });

    // Create test items for both reports
    await prisma.damageItem.createMany({
      data: [
        {
          damageReportId: damageReportTomorrow.id,
          itemName: 'Test Coffee Table',
          damageType: 'REPAIR',
          description: 'Scratched surface',
          repairCost: 150.00,
          repairTime: '2 hours'
        },
        {
          damageReportId: damageReportToday.id,
          itemName: 'Test TV',
          damageType: 'REPLACE',
          description: 'Screen cracked',
          replacementCost: 800.00,
          replacementLink: 'https://amazon.com/test-tv'
        }
      ]
    });

    console.log('Test data created successfully!');
    console.log('- Report with deadline tomorrow:', damageReportTomorrow.id);
    console.log('- Report with deadline today:', damageReportToday.id);
    console.log('- Airbnb deadline tomorrow:', addDays(today, 1).toLocaleDateString());
    console.log('- Airbnb deadline today:', today.toLocaleDateString());

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDataForReminders();