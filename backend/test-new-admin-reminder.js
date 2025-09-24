const { PrismaClient } = require('@prisma/client');
const { addDays, subDays } = require('date-fns');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createTestForNewAdmin() {
  try {
    // Find the new admin user
    const newAdmin = await prisma.user.findFirst({
      where: {
        email: 'mshoaibkhansumbal@gmail.com',
        role: 'ADMIN'
      }
    });

    if (!newAdmin) {
      console.log('New admin user not found. Please run seed first.');
      return;
    }

    console.log('Found new admin:', newAdmin.email);

    const today = new Date();

    // Create a damage report with Airbnb deadline today (urgent reminder)
    const urgentReport = await prisma.damageReport.create({
      data: {
        reportedById: newAdmin.id,
        propertyName: 'New Admin Test Property - URGENT',
        propertyAddress: '999 Urgent Street',
        damageDate: subDays(today, 14), // 14 days ago, so deadline is today
        checkoutDate: subDays(today, 14),
        airbnbDeadline: today, // Today - URGENT!
        proofDeadline: addDays(today, 16),
        status: 'PENDING'
      }
    });

    // Create test item
    await prisma.damageItem.create({
      data: {
        damageReportId: urgentReport.id,
        itemName: 'Urgent Broken Window',
        damageType: 'REPLACE',
        description: 'Window completely shattered',
        replacementCost: 500.00,
        replacementLink: 'https://amazon.com/replacement-window'
      }
    });

    console.log('✅ Created urgent test report for new admin');
    console.log('📧 Admin email:', newAdmin.email);
    console.log('⚠️ Deadline: TODAY (', today.toLocaleDateString(), ')');
    console.log('🆔 Report ID:', urgentReport.id);

    // Now trigger the reminder system
    console.log('\n🔄 Triggering reminder system...');

    const notificationService = require('./services/notificationService');
    await notificationService.checkAndSendReminders();

    console.log('✅ Reminder check completed!');
    console.log('📬 Check email at: mshoaibkhansumbal@gmail.com');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestForNewAdmin();