const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const where = { userId: req.user.id };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          damageReport: {
            select: {
              id: true,
              itemDamaged: true,
              property: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: req.user.id,
          isRead: false
        }
      })
    ]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({
      message: 'Notification marked as read',
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      message: 'All notifications marked as read',
      count: result.count
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// Get unread notification count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

module.exports = router;