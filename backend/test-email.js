const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testEmail() {
  console.log('🔧 Testing email configuration...');
  console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
  console.log('📧 EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('📧 EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    // Test the connection
    console.log('\n🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    console.log('\n📤 Sending test email...');
    const testEmailHtml = `
      <h2 style="color: #e74c3c;">🚨 TEST EMAIL - Damage Claim Reminder System</h2>
      <p><strong>This is a test email</strong> to verify the damage claim notification system is working.</p>
      <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
      <p><strong>To:</strong> mshoaibkhansumbal@gmail.com</p>
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      <hr>
      <p>If you receive this email, the notification system is working correctly!</p>
      <p><em>This was sent from the Damage Claim Automation System</em></p>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'mshoaibkhansumbal@gmail.com',
      subject: '🚨 TEST: Damage Claim System - Email Working!',
      html: testEmailHtml
    });

    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Check email at: mshoaibkhansumbal@gmail.com');
    console.log('📁 Also check spam/junk folder if not in inbox');

  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error details:', error.message);

    if (error.code === 'EAUTH') {
      console.log('\n🔑 Authentication failed. Check:');
      console.log('1. EMAIL_USER is correct Gmail address');
      console.log('2. EMAIL_PASS is the correct app password (not regular password)');
      console.log('3. App password is enabled in Google Account settings');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection failed. Check:');
      console.log('1. Internet connection');
      console.log('2. EMAIL_HOST and EMAIL_PORT settings');
      console.log('3. Firewall/antivirus blocking SMTP');
    }
  }
}

testEmail();