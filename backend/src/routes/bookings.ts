import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logActivity } from './activities';
import { sendBookingConfirmationEmail } from '../services/email';

const router = Router();
import prisma from '../lib/prisma';

// GET /api/bookings - Get all bookings for authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { start, end, status, leadId } = req.query;

    const where: any = {
      lead: {
        assignedToId: userId
      }
    };

    // Filter by date range
    if (start && end) {
      where.startTime = {
        gte: new Date(start as string),
        lte: new Date(end as string),
      };
    }

    // Filter by status
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Filter by lead
    if (leadId) {
      where.leadId = leadId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            clientEmail: true,
            clientPhone: true,
            projectTitle: true,
            serviceType: true,
            status: true,
            estimatedValue: true,
            actualValue: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({ bookings, count: bookings.length });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/calendar - Get bookings formatted for calendar
router.get('/calendar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { start, end } = req.query;

    const startDate = start ? new Date(start as string) : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const endDate = end ? new Date(end as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);

    const bookings = await prisma.booking.findMany({
      where: {
        lead: {
          assignedToId: userId
        },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED']
        }
      },
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            clientEmail: true,
            projectTitle: true,
            serviceType: true,
            status: true,
            estimatedValue: true,
            actualValue: true,
          }
        }
      },
      orderBy: { startTime: 'asc' },
    });

    // Format for react-big-calendar
    const events = bookings.map(booking => ({
      id: booking.id,
      title: booking.title,
      start: booking.startTime,
      end: booking.endTime,
      allDay: booking.allDay,
      resource: {
        bookingId: booking.id,
        leadId: booking.leadId,
        clientName: booking.lead.clientName,
        serviceType: booking.lead.serviceType,
        location: booking.location,
        notes: booking.notes,
        status: booking.status,
        value: booking.lead.actualValue || booking.lead.estimatedValue,
        color: booking.color,
      }
    }));

    res.json({ events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch calendar events' });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            clientEmail: true,
            clientPhone: true,
            projectTitle: true,
            serviceType: true,
            status: true,
            estimatedValue: true,
            actualValue: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
      return;
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch booking' });
  }
});

// POST /api/bookings - Create new booking
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { leadId, startTime, endTime, duration, allDay, title, location, notes, color } = req.body;

    // Validate required fields
    if (!leadId || !startTime || !endTime) {
      res.status(400).json({ error: 'Bad Request', message: 'leadId, startTime, and endTime are required' });
      return;
    }

    // Verify lead exists and belongs to user
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        assignedToId: userId
      }
    });

    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    // Calculate duration if not provided
    const start = new Date(startTime);
    const end = new Date(endTime);
    const calculatedDuration = duration || Math.round((end.getTime() - start.getTime()) / (1000 * 60));

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        leadId,
        createdById: userId,
        startTime: start,
        endTime: end,
        duration: calculatedDuration,
        allDay: allDay || false,
        title: title || lead.projectTitle || `Booking - ${lead.clientName}`,
        location,
        notes,
        color,
        status: 'CONFIRMED',
      },
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            clientEmail: true,
            projectTitle: true,
            serviceType: true,
            status: true,
          }
        }
      }
    });

    // Update lead eventDate if not set
    if (!lead.eventDate) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { eventDate: start }
      });
    }

    // Log activity
    await logActivity(
      leadId,
      userId,
      'BOOKING_CREATED',
      `Booking created: ${booking.title} on ${start.toLocaleDateString()}`,
      { bookingId: booking.id, startTime: start, location }
    );

    // Send booking confirmation email to client
    try {
      await sendBookingConfirmationEmail({
        clientName: booking.lead.clientName,
        clientEmail: booking.lead.clientEmail,
        projectTitle: booking.lead.projectTitle,
        bookingDate: start,
        duration: calculatedDuration,
        location: location || undefined,
        notes: notes || undefined,
      });
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the booking creation if email fails
    }

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create booking' });
  }
});

// PATCH /api/bookings/:id - Update booking
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const { startTime, endTime, duration, allDay, title, location, notes, color, status } = req.body;

    // Get existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!existingBooking) {
      res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
      return;
    }

    // Build update data
    const updateData: any = {};
    
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (duration !== undefined) updateData.duration = duration;
    if (allDay !== undefined) updateData.allDay = allDay;
    if (title) updateData.title = title;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;
    if (color !== undefined) updateData.color = color;
    
    // Handle status changes
    if (status && status !== existingBooking.status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
      }
    }

    // Recalculate duration if times changed
    if (startTime && endTime && !duration) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      updateData.duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            clientEmail: true,
            projectTitle: true,
            serviceType: true,
            status: true,
          }
        }
      }
    });

    // Log activity based on what changed
    let activityType: 'BOOKING_UPDATED' | 'BOOKING_CANCELLED' | 'BOOKING_COMPLETED' = 'BOOKING_UPDATED';
    let description = `Booking updated: ${booking.title}`;

    if (status === 'CANCELLED') {
      activityType = 'BOOKING_CANCELLED';
      description = `Booking cancelled: ${booking.title}`;
    } else if (status === 'COMPLETED') {
      activityType = 'BOOKING_COMPLETED';
      description = `Booking completed: ${booking.title}`;
    } else if (startTime && startTime !== existingBooking.startTime.toISOString()) {
      description = `Booking rescheduled: ${booking.title} to ${new Date(startTime).toLocaleDateString()}`;
    }

    await logActivity(
      existingBooking.leadId,
      userId,
      activityType,
      description,
      { bookingId: booking.id, changes: updateData }
    );

    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update booking' });
  }
});

// DELETE /api/bookings/:id - Delete booking
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
      return;
    }

    await prisma.booking.delete({
      where: { id }
    });

    // Log activity
    await logActivity(
      booking.leadId,
      userId,
      'BOOKING_CANCELLED',
      `Booking deleted: ${booking.title}`,
      { bookingId: id }
    );

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete booking' });
  }
});

// POST /api/bookings/:id/complete - Mark booking as completed
router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            projectTitle: true,
            serviceType: true,
          }
        }
      }
    });

    await logActivity(
      booking.leadId,
      userId,
      'BOOKING_COMPLETED',
      `Booking completed: ${booking.title}`,
      { bookingId: booking.id }
    );

    res.json({ message: 'Booking marked as completed', booking });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to complete booking' });
  }
});

// POST /api/bookings/:id/cancel - Cancel booking
router.post('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const { reason } = req.body;

    // First get the existing booking to access its notes
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      select: { notes: true }
    });

    if (!existingBooking) {
      res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
      return;
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        notes: reason ? `${existingBooking.notes || ''}\n\nCancellation reason: ${reason}`.trim() : undefined,
      },
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            projectTitle: true,
            serviceType: true,
          }
        }
      }
    });

    await logActivity(
      booking.leadId,
      userId,
      'BOOKING_CANCELLED',
      `Booking cancelled: ${booking.title}${reason ? ` - Reason: ${reason}` : ''}`,
      { bookingId: booking.id, reason }
    );

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to cancel booking' });
  }
});

export default router;
