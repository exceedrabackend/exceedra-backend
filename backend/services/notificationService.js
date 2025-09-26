const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { subDays, isAfter, isBefore, addDays } = require('date-fns');

const prisma = new PrismaClient();

// Email transporter with better configuration and fallback
const createEmailTransporter = () => {
  // If no email config, return null
  if (!process.env.EMAIL_USER) {
    return null;
  }

  // Gmail SMTP configuration (most reliable)
  if (process.env.EMAIL_USER.includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      timeout: 10000 // 10 second timeout
    });
  }

  // Generic SMTP configuration
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    timeout: 10000, // 10 second timeout
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
};

const emailTransporter = createEmailTransporter();

// Twilio client (optional - only initialize if proper credentials are provided)
const twilioClient = process.env.TWILIO_ACCOUNT_SID &&
                     process.env.TWILIO_AUTH_TOKEN &&
                     process.env.TWILIO_ACCOUNT_SID.startsWith('AC')
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Send email notification with timeout and async processing
const sendEmail = async (to, subject, html) => {
  // Return immediately if email not configured - don't block API responses
  if (!emailTransporter || !process.env.EMAIL_USER) {
    console.log('Email not configured, skipping email notification');
    return Promise.resolve();
  }

  // Process email asynchronously without blocking
  setImmediate(async () => {
    try {
      // Add 10 second timeout to prevent hanging
      const emailPromise = emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
      });

      await Promise.race([
        emailPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email timeout after 10 seconds')), 10000)
        )
      ]);

      console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw error - just log it to prevent API blocking
    }
  });

  // Return immediately so API responses aren't delayed
  return Promise.resolve();
};

// Send SMS notification with async processing
const sendSMS = async (to, message) => {
  // Return immediately if SMS not configured
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('SMS not configured, skipping SMS notification');
    return Promise.resolve();
  }

  // Process SMS asynchronously without blocking
  setImmediate(async () => {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });

      console.log(`SMS sent to ${to}: ${message}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
      // Don't throw error - just log it
    }
  });

  // Return immediately so API responses aren't delayed
  return Promise.resolve();
};

// Create notification in database
const createNotification = async (userId, damageReportId, type, title, message, scheduledFor = null) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        damageReportId,
        type,
        title,
        message,
        scheduledFor
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Notify claim team about new damage report
const notifyNewDamageReport = async (damageReportId) => {
  try {
    const damageReport = await prisma.damageReport.findUnique({
      where: { id: damageReportId },
      include: {
        reportedBy: true,
        items: true
      }
    });

    if (!damageReport) return;

    // Get claim team members
    const claimTeamMembers = await prisma.user.findMany({
      where: {
        role: { in: ['CLAIM_TEAM', 'ADMIN'] },
        isActive: true
      }
    });

    const title = 'New Damage Report';
    const message = `New damage reported at ${damageReport.propertyName} (${(damageReport.items?.[0]?.itemName || 'Multiple items')}) by ${damageReport.reportedBy.name}. Deadline: ${damageReport.airbnbDeadline.toLocaleDateString()}`;

    const emailHtml = `
      <h2>New Damage Report</h2>
      <p><strong>Property:</strong> ${damageReport.propertyName}</p>
      <p><strong>Address:</strong> ${damageReport.propertyAddress || 'N/A'}</p>
      <p><strong>Item Damaged:</strong> ${(damageReport.items?.[0]?.itemName || 'Multiple items')}</p>
      <p><strong>Damage Type:</strong> ${damageReport.damageType}</p>
      <p><strong>Reported By:</strong> ${damageReport.reportedBy.name}</p>
      <p><strong>Damage Date:</strong> ${damageReport.damageDate.toLocaleDateString()}</p>
      <p><strong>Airbnb Deadline:</strong> ${damageReport.airbnbDeadline.toLocaleDateString()}</p>
      ${damageReport.description ? `<p><strong>Description:</strong> ${damageReport.description}</p>` : ''}
      <p><a href="${process.env.FRONTEND_URL}/damages/${damageReportId}">View Damage Report</a></p>
    `;

    // Send notifications to all claim team members
    for (const member of claimTeamMembers) {
      // Create database notification
      await createNotification(member.id, damageReportId, 'NEW_DAMAGE_REPORT', title, message);

      // Send email
      await sendEmail(member.email, title, emailHtml);

      // Send SMS if phone number is available
      if (member.phone) {
        await sendSMS(member.phone, message);
      }
    }
  } catch (error) {
    console.error('Error notifying new damage report:', error);
  }
};

// Notify status update
const notifyStatusUpdate = async (damageReportId, newStatus) => {
  try {
    const damageReport = await prisma.damageReport.findUnique({
      where: { id: damageReportId },
      include: {
        reportedBy: true,
        items: true
      }
    });

    if (!damageReport) return;

    const title = 'Damage Report Status Update';
    const message = `Status updated for damage at ${damageReport.propertyName} (${(damageReport.items?.[0]?.itemName || 'Multiple items')}): ${newStatus}`;

    const emailHtml = `
      <h2>Damage Report Status Update</h2>
      <p><strong>Property:</strong> ${damageReport.propertyName}</p>
      <p><strong>Item Damaged:</strong> ${(damageReport.items?.[0]?.itemName || 'Multiple items')}</p>
      <p><strong>New Status:</strong> ${newStatus}</p>
      <p><a href="${process.env.FRONTEND_URL}/damages/${damageReportId}">View Damage Report</a></p>
    `;

    // Notify the person who reported the damage
    await createNotification(
      damageReport.reportedBy.id,
      damageReportId,
      'STATUS_UPDATE',
      title,
      message
    );

    await sendEmail(damageReport.reportedBy.email, title, emailHtml);

    if (damageReport.reportedBy.phone) {
      await sendSMS(damageReport.reportedBy.phone, message);
    }
  } catch (error) {
    console.error('Error notifying status update:', error);
  }
};

// Check for upcoming deadlines and send reminders
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = addDays(now, 1);

    // Find damage reports with deadlines approaching
    const upcomingDeadlines = await prisma.damageReport.findMany({
      where: {
        OR: [
          // Airbnb deadline reminders (1 day before and on the day)
          {
            airbnbDeadline: {
              gte: now,
              lt: tomorrow
            },
            submittedToAirbnb: false
          },
          {
            airbnbDeadline: {
              gte: tomorrow,
              lt: addDays(tomorrow, 1)
            },
            submittedToAirbnb: false
          },
          // Proof deadline reminders (1 day before and on the day)
          {
            proofDeadline: {
              gte: now,
              lt: tomorrow
            },
            status: 'PROOF_REQUIRED'
          },
          {
            proofDeadline: {
              gte: tomorrow,
              lt: addDays(tomorrow, 1)
            },
            status: 'PROOF_REQUIRED'
          }
        ]
      },
      include: {
        reportedBy: true,
        items: true
      }
    });

    // Get claim team members
    const claimTeamMembers = await prisma.user.findMany({
      where: {
        role: { in: ['CLAIM_TEAM', 'ADMIN'] },
        isActive: true
      }
    });

    for (const damageReport of upcomingDeadlines) {
      const isAirbnbDeadline = !damageReport.submittedToAirbnb;
      const deadline = isAirbnbDeadline ? damageReport.airbnbDeadline : damageReport.proofDeadline;
      const isToday = deadline.toDateString() === now.toDateString();
      const isTomorrow = deadline.toDateString() === tomorrow.toDateString();

      let title, message, type;

      if (isAirbnbDeadline) {
        title = isToday ? 'Airbnb Deadline Today!' : 'Airbnb Deadline Tomorrow';
        message = `${isToday ? 'TODAY' : 'TOMORROW'} is the deadline to submit damage claim for ${damageReport.propertyName} (${(damageReport.items?.[0]?.itemName || 'Multiple items')}) to Airbnb`;
        type = 'DEADLINE_REMINDER';
      } else {
        title = isToday ? 'Proof Deadline Today!' : 'Proof Deadline Tomorrow';
        message = `${isToday ? 'TODAY' : 'TOMORROW'} is the deadline to submit additional proof for ${damageReport.propertyName} (${(damageReport.items?.[0]?.itemName || 'Multiple items')}) to Airbnb`;
        type = 'PROOF_DEADLINE_REMINDER';
      }

      const emailHtml = `
        <h2 style="color: ${isToday ? 'red' : 'orange'};">${title}</h2>
        <p><strong>Property:</strong> ${damageReport.propertyName}</p>
        <p><strong>Item Damaged:</strong> ${(damageReport.items?.[0]?.itemName || 'Multiple items')}</p>
        <p><strong>Deadline:</strong> ${deadline.toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${damageReport.status}</p>
        <p><a href="${process.env.FRONTEND_URL}/damages/${damageReport.id}">View Damage Report</a></p>
      `;

      // Check if reminder was already sent today
      const existingReminder = await prisma.notification.findFirst({
        where: {
          damageReportId: damageReport.id,
          type,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        }
      });

      if (existingReminder) continue; // Skip if already sent today

      // Send reminders to claim team
      for (const member of claimTeamMembers) {
        await createNotification(member.id, damageReport.id, type, title, message);
        await sendEmail(member.email, title, emailHtml);

        if (member.phone) {
          await sendSMS(member.phone, message);
        }
      }
    }

    console.log(`Checked ${upcomingDeadlines.length} damage reports for reminders`);
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

module.exports = {
  notifyNewDamageReport,
  notifyStatusUpdate,
  checkAndSendReminders,
  createNotification,
  sendEmail,
  sendSMS
};
