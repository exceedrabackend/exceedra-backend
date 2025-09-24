const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    // Get all notifications created today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: startOfDay
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
            airbnbDeadline: true,
            proofDeadline: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${notifications.length} notifications created today:`);
    console.log('='.repeat(60));

    notifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.type}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   To: ${notification.user.name} (${notification.user.email}) - ${notification.user.role}`);
      console.log(`   Property: ${notification.damageReport?.propertyName || 'N/A'}`);
      console.log(`   Created: ${notification.createdAt.toLocaleString()}`);
      console.log(`   Read: ${notification.isRead ? 'Yes' : 'No'}`);
      console.log('-'.repeat(40));
    });

    if (notifications.length === 0) {
      console.log('No notifications found. This could mean:');
      console.log('1. No deadlines are approaching');
      console.log('2. Email configuration issues');
      console.log('3. Reminder logic not triggering');

      // Check if there are any damage reports with approaching deadlines
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const upcomingDeadlines = await prisma.damageReport.findMany({
        where: {
          OR: [
            {
              airbnbDeadline: {
                gte: today,
                lte: tomorrow
              },
              submittedToAirbnb: false
            }
          ]
        },
        select: {
          id: true,
          propertyName: true,
          airbnbDeadline: true,
          submittedToAirbnb: true,
          status: true
        }
      });

      console.log(`\nFound ${upcomingDeadlines.length} reports with deadlines today/tomorrow:`);
      upcomingDeadlines.forEach(report => {
        console.log(`- ${report.propertyName}: ${report.airbnbDeadline.toLocaleDateString()} (Status: ${report.status})`);
      });
    }

  } catch (error) {
    console.error('Error checking notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();