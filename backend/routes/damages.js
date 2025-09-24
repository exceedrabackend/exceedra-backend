const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { addDays, format } = require('date-fns');
const upload = require('../middleware/upload');
const supabaseService = require('../services/supabaseService');
const notificationService = require('../services/notificationService');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

// Get all damage reports with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      propertyName,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {};

    // If user is a cleaner, only show their reports
    if (req.user.role === 'CLEANER') {
      where.reportedById = req.user.id;
    }

    if (propertyName) {
      where.propertyName = {
        contains: propertyName,
        mode: 'insensitive'
      };
    }
    if (status) where.status = status;

    if (fromDate || toDate) {
      where.damageDate = {};
      if (fromDate) where.damageDate.gte = new Date(fromDate);
      if (toDate) where.damageDate.lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [damageReports, total] = await Promise.all([
      prisma.damageReport.findMany({
        where,
        include: {
          reportedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              images: {
                select: {
                  id: true,
                  imageUrl: true,
                  description: true
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit)
      }),
      prisma.damageReport.count({ where })
    ]);

    res.json({
      damageReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get damage reports error:', error);
    res.status(500).json({ message: 'Error fetching damage reports' });
  }
});

// Get damage report by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const where = { id };

    // If user is a cleaner, only allow access to their reports
    if (req.user.role === 'CLEANER') {
      where.reportedById = req.user.id;
    }

    const damageReport = await prisma.damageReport.findFirst({
      where,
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            images: {
              select: {
                id: true,
                imageUrl: true,
                publicId: true,
                description: true,
                createdAt: true
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!damageReport) {
      return res.status(404).json({ message: 'Damage report not found' });
    }

    res.json(damageReport);
  } catch (error) {
    console.error('Get damage report error:', error);
    res.status(500).json({ message: 'Error fetching damage report' });
  }
});

// Create new damage report with multiple items
router.post('/', authMiddleware, upload.array('images', 50), async (req, res) => {
  try {
    const {
      propertyName,
      propertyAddress,
      damageDate,
      items // JSON string of items array
    } = req.body;

    if (!propertyName || !damageDate || !items) {
      return res.status(400).json({
        message: 'Property name, damage date, and items are required'
      });
    }

    let parsedItems;
    try {
      parsedItems = JSON.parse(items);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid items format' });
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ message: 'At least one damaged item is required' });
    }

    const damageDateTime = new Date(damageDate);

    // Calculate deadlines based on damage date
    const airbnbDeadline = addDays(damageDateTime, 14);
    const proofDeadline = addDays(damageDateTime, 30);

    // Create damage report
    const damageReport = await prisma.damageReport.create({
      data: {
        reportedById: req.user.id,
        propertyName,
        propertyAddress: propertyAddress || '',
        damageDate: damageDateTime,
        checkoutDate: damageDateTime, // Use damage date as checkout date
        airbnbDeadline,
        proofDeadline
      }
    });

    // Process items and images
    const files = req.files || [];
    let fileIndex = 0;

    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];

      if (!item.itemName || !item.damageType) {
        continue; // Skip invalid items
      }

      // Create damage item
      const damageItem = await prisma.damageItem.create({
        data: {
          damageReportId: damageReport.id,
          itemName: item.itemName,
          damageType: item.damageType,
          description: item.description || '',
          repairCost: item.repairCost || null,
          repairTime: item.repairTime || null,
          replacementCost: item.replacementCost || null,
          replacementLink: item.replacementLink || null
        }
      });

      // Upload images for this item
      const itemImageCount = parseInt(item.imageCount) || 0;
      const itemFiles = files.slice(fileIndex, fileIndex + itemImageCount);
      fileIndex += itemImageCount;

      if (itemFiles.length > 0) {
        const imagePromises = itemFiles.map(async (file) => {
          const result = await supabaseService.uploadImage(file.buffer, file.originalname);

          return prisma.damageImage.create({
            data: {
              damageItemId: damageItem.id,
              imageUrl: result.secure_url,
              publicId: result.public_id,
              description: file.originalname
            }
          });
        });

        await Promise.all(imagePromises);
      }
    }

    // Send notifications to claim team
    await notificationService.notifyNewDamageReport(damageReport.id);

    // Get complete damage report with relations
    const completeDamageReport = await prisma.damageReport.findUnique({
      where: { id: damageReport.id },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            images: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Damage report created successfully',
      damageReport: completeDamageReport
    });
  } catch (error) {
    console.error('Create damage report error:', error);
    res.status(500).json({ message: 'Error creating damage report' });
  }
});

// Update damage report status (Claim Team/Admin only)
router.put('/:id/status', authMiddleware, requireRole(['CLAIM_TEAM', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, submittedToAirbnb, claimAmount, guestName, confirmationCode, receivedAmount } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updateData = { status };

    if (submittedToAirbnb !== undefined) {
      updateData.submittedToAirbnb = submittedToAirbnb;
      if (submittedToAirbnb) {
        updateData.submittedAt = new Date();
      }
    }

    // Handle approval with all required fields
    if (status === 'APPROVED') {
      if (!claimAmount || parseFloat(claimAmount) <= 0) {
        return res.status(400).json({ message: 'Claim amount is required for approval' });
      }
      if (!guestName || guestName.trim() === '') {
        return res.status(400).json({ message: 'Guest name is required for approval' });
      }
      if (!confirmationCode || confirmationCode.trim() === '') {
        return res.status(400).json({ message: 'Confirmation code is required for approval' });
      }
      if (!receivedAmount || parseFloat(receivedAmount) < 0) {
        return res.status(400).json({ message: 'Received amount is required for approval' });
      }

      updateData.claimAmount = parseFloat(claimAmount);
      updateData.guestName = guestName.trim();
      updateData.confirmationCode = confirmationCode.trim();
      updateData.receivedAmount = parseFloat(receivedAmount);
      updateData.approvedAt = new Date();
    }

    const updatedDamageReport = await prisma.damageReport.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send status update notification
    await notificationService.notifyStatusUpdate(id, status);

    res.json({
      message: 'Damage report status updated successfully',
      damageReport: updatedDamageReport
    });
  } catch (error) {
    console.error('Update damage report status error:', error);
    res.status(500).json({ message: 'Error updating damage report status' });
  }
});

// Add images to existing damage item
router.post('/:reportId/items/:itemId/images', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const { reportId, itemId } = req.params;

    // Check if damage report exists and user has permission
    const where = { id: reportId };
    if (req.user.role === 'CLEANER') {
      where.reportedById = req.user.id;
    }

    const damageReport = await prisma.damageReport.findFirst({
      where,
      include: {
        items: {
          where: { id: itemId }
        }
      }
    });

    if (!damageReport || damageReport.items.length === 0) {
      return res.status(404).json({ message: 'Damage report or item not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    // Upload images
    const imagePromises = req.files.map(async (file) => {
      const result = await supabaseService.uploadImage(file.buffer, file.originalname);

      return prisma.damageImage.create({
        data: {
          damageItemId: itemId,
          imageUrl: result.secure_url,
          publicId: result.public_id,
          description: file.originalname
        }
      });
    });

    const newImages = await Promise.all(imagePromises);

    res.status(201).json({
      message: 'Images uploaded successfully',
      images: newImages
    });
  } catch (error) {
    console.error('Add images error:', error);
    res.status(500).json({ message: 'Error uploading images' });
  }
});

// Delete image
router.delete('/images/:imageId', authMiddleware, async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await prisma.damageImage.findUnique({
      where: { id: imageId },
      include: {
        damageItem: {
          include: {
            damageReport: {
              select: {
                id: true,
                reportedById: true
              }
            }
          }
        }
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check permissions
    if (req.user.role === 'CLEANER' && image.damageItem.damageReport.reportedById !== req.user.id) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Delete from supabase
    await supabaseService.deleteImage(image.publicId);

    // Delete from database
    await prisma.damageImage.delete({
      where: { id: imageId }
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

// Get damage reports dashboard stats (Claim Team/Admin only)
router.get('/dashboard/stats', authMiddleware, requireRole(['CLAIM_TEAM', 'ADMIN']), async (req, res) => {
  try {
    const [
      totalReports,
      pendingReports,
      overdueReports,
      resolvedReports,
      upcomingDeadlines
    ] = await Promise.all([
      // Total reports
      prisma.damageReport.count(),

      // Pending reports
      prisma.damageReport.count({
        where: { status: 'PENDING' }
      }),

      // Overdue reports (past Airbnb deadline and not submitted)
      prisma.damageReport.count({
        where: {
          airbnbDeadline: { lt: new Date() },
          submittedToAirbnb: false
        }
      }),

      // Resolved reports
      prisma.damageReport.count({
        where: { status: 'RESOLVED' }
      }),

      // Upcoming deadlines (next 7 days)
      prisma.damageReport.count({
        where: {
          airbnbDeadline: {
            gte: new Date(),
            lte: addDays(new Date(), 7)
          },
          submittedToAirbnb: false
        }
      })
    ]);

    res.json({
      totalReports,
      pendingReports,
      overdueReports,
      resolvedReports,
      upcomingDeadlines
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Export damage reports to Excel (Claim Team/Admin only)
router.get('/export/excel', authMiddleware, requireRole(['CLAIM_TEAM', 'ADMIN']), async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.damageDate = {};
      if (fromDate) where.damageDate.gte = new Date(fromDate);
      if (toDate) where.damageDate.lte = new Date(toDate);
    }

    const damageReports = await prisma.damageReport.findMany({
      where,
      include: {
        reportedBy: {
          select: {
            name: true,
            country: true
          }
        },
        items: {
          include: {
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Damage Reports');

    // Define column headers and widths
    worksheet.columns = [
      { header: 'Account', key: 'account', width: 12 },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'Date checkout', key: 'dateCheckout', width: 15 },
      { header: 'Last date to submit claim', key: 'lastDateSubmit', width: 20 },
      { header: 'Name', key: 'name', width: 18 },
      { header: 'Confirmation code', key: 'confirmationCode', width: 18 },
      { header: 'Damages', key: 'damages', width: 25 },
      { header: 'Requested Amount', key: 'requestedAmount', width: 18 },
      { header: 'Received Amount', key: 'receivedAmount', width: 18 },
      { header: 'Documents/Invoices', key: 'documents', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    // Style the header row with grey background
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF000000' } }; // Black text
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' } // Grey background
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add border to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data rows with alternating colors
    damageReports.forEach((report, index) => {
      const totalRequestedAmount = report.items.reduce((sum, item) => {
        const cost = item.damageType === 'REPAIR' ? item.repairCost : item.replacementCost;
        return sum + (cost ? parseFloat(cost) : 0);
      }, 0);

      const rowData = {
        account: report.reportedBy.country || 'N/A',
        unit: report.propertyName,
        dateCheckout: format(new Date(report.checkoutDate), 'dd-MMM'),
        lastDateSubmit: format(new Date(report.airbnbDeadline), 'dd-MMM'),
        name: report.guestName || 'N/A',
        confirmationCode: report.confirmationCode || 'N/A',
        damages: report.items.map(item => item.itemName).join(', '),
        requestedAmount: totalRequestedAmount,
        receivedAmount: report.receivedAmount ? parseFloat(report.receivedAmount) : '',
        documents: report.items.length > 0 ? `${report.items.length} item(s) with ${report.items.reduce((sum, item) => sum + item.images.length, 0)} images` : 'No documents',
        status: report.status === 'APPROVED' ? 'Approved' :
               report.status === 'CANCELLED' ? 'Cancelled' :
               report.status === 'RESOLVED' ? 'Completed' :
               report.status
      };

      const row = worksheet.addRow(rowData);
      const rowNumber = index + 2; // +2 because index starts at 0 and header is row 1

      // Color rows based on status
      let fillColor;
      if (report.status === 'APPROVED' || report.status === 'RESOLVED') {
        fillColor = 'FFD5E8D4'; // Light green for approved/completed
      } else if (report.status === 'PENDING') {
        fillColor = 'FFD4E4F7'; // Light blue for pending
      } else {
        // Default color for other statuses (IN_REVIEW, CANCELLED, etc.)
        fillColor = 'FFF2F2F2'; // Light grey
      }

      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColor }
      };

      // Style the row
      row.alignment = { vertical: 'middle', wrapText: true };
      row.height = 25;

      // Add borders to all cells
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Format amount columns as currency
      const requestedAmountCell = row.getCell('requestedAmount');
      const receivedAmountCell = row.getCell('receivedAmount');

      if (requestedAmountCell.value) {
        requestedAmountCell.numFmt = '$#,##0.00';
        requestedAmountCell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      if (receivedAmountCell.value) {
        receivedAmountCell.numFmt = '$#,##0.00';
        receivedAmountCell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      // Center align certain columns
      row.getCell('account').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('dateCheckout').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('lastDateSubmit').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('confirmationCode').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('status').alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Generate filename with current date
    const filename = `damage-reports-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ message: 'Error exporting data to Excel' });
  }
});

module.exports = router;