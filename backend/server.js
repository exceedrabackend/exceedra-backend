const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const damageRoutes = require('./routes/damages');
const notificationRoutes = require('./routes/notifications');

// Import services
const notificationService = require('./services/notificationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/damages', damageRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint to manually trigger reminder check
app.post('/api/test/reminders', async (req, res) => {
  try {
    console.log('Manual reminder check triggered...');
    await notificationService.checkAndSendReminders();
    res.json({
      message: 'Reminder check completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in manual reminder check:', error);
    res.status(500).json({
      message: 'Error checking reminders',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Schedule notification checks every hour
cron.schedule('0 * * * *', () => {
  console.log('Running scheduled notification check...');
  notificationService.checkAndSendReminders();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});