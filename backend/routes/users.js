const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const validator = require('validator');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { role, active, search, page = 1, limit = 20 } = req.query;

    const where = {};

    if (role) where.role = role;
    if (active !== undefined) where.isActive = active === 'true';

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          country: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user by ID (Admin only)
router.get('/:id', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            damageReports: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Create new user (Admin only)
router.post('/', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { email, name, phone, country, role, password } = req.body;

    // Validation
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'Email, name, and password are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (role && !['CLEANER', 'CLAIM_TEAM', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        phone,
        country,
        role: role || 'CLEANER',
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Update user (Admin only)
router.put('/:id', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, country, role, isActive } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate role if provided
    if (role && !['CLEANER', 'CLAIM_TEAM', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Reset user password (Admin only)
router.put('/:id/reset-password', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authMiddleware, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { damageReports: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting user with damage reports
    if (user._count.damageReports > 0) {
      return res.status(400).json({
        message: 'Cannot delete user with existing damage reports. Deactivate the user instead.'
      });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get cleaners list (for dropdowns, etc.)
router.get('/role/cleaners', authMiddleware, requireRole(['CLAIM_TEAM', 'ADMIN']), async (req, res) => {
  try {
    const cleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(cleaners);
  } catch (error) {
    console.error('Get cleaners error:', error);
    res.status(500).json({ message: 'Error fetching cleaners' });
  }
});

module.exports = router;