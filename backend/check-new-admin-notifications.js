const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function checkNewAdminNotifications() {
  try {
    // Get all notifications for the new admin
    const newAdminNotifications = await prisma.notification.findMany({
      where: {
        user: {
          email: 'mshoaibkhansumbal@gmail.com'
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        },
        damageReport: {
          select: {
            propertyName: true,
            airbnbDeadline: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`🔍 Notifications for NEW ADMIN (mshoaibkhansumbal@gmail.com):`);
    console.log('='.repeat(70));

    if (newAdminNotifications.length === 0) {
      console.log('❌ No notifications found for new admin');
      console.log('This might be because:');
      console.log('1. The reminder system hasn\'t run yet');
      console.log('2. No deadlines are approaching for this admin\'s reports');
      console.log('3. The admin user wasn\'t properly created');
    } else {
      newAdminNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. 📧 ${notif.type}`);
        console.log(`   ✉️  ${notif.title}`);
        console.log(`   📝 ${notif.message}`);
        console.log(`   📅 Created: ${notif.createdAt.toLocaleString()}`);
        console.log(`   🏠 Property: ${notif.damageReport?.propertyName || 'N/A'}`);
        console.log(`   📖 Read: ${notif.isRead ? 'Yes' : 'No'}`);
        console.log('-'.repeat(50));
      });
    }

    // Also check all ADMIN users to see total coverage
    console.log('\n🔍 ALL ADMIN USERS in system:');
    const allAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true
      },
      select: {
        email: true,
        name: true,
        createdAt: true
      }
    });

    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email} (${admin.name}) - Created: ${admin.createdAt.toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewAdminNotifications();