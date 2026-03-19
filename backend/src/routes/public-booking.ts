import { Router, Response, Request } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendMeetingConfirmationEmail, sendMeetingNotificationToOwner } from '../services/email';

const router = Router();

// GET /api/book/:userId - Get public booking page data
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studioName: true,
        brandPrimaryColor: true,
        brandAccentColor: true,
        brandLogoUrl: true,
        timezone: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const meetingTypes = await prisma.meetingType.findMany({
      where: { userId, isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        color: true,
        location: true,
      },
    });

    res.json({ user, meetingTypes });
  } catch (error) {
    console.error('[PublicBooking] Get page data error:', error);
    res.status(500).json({ error: 'Failed to load booking page' });
  }
});

// GET /api/book/:userId/:meetingTypeId/slots?date=YYYY-MM-DD - Get available slots for a date
router.get('/:userId/:meetingTypeId/slots', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const meetingTypeId = String(req.params.meetingTypeId);
    const date = String(req.query.date || '');

    if (!date) {
      res.status(400).json({ error: 'date query parameter required (YYYY-MM-DD)' });
      return;
    }

    const meetingType = await prisma.meetingType.findFirst({
      where: { id: meetingTypeId, userId, isActive: true },
    });

    if (!meetingType) {
      res.status(404).json({ error: 'Meeting type not found' });
      return;
    }

    // Parse the requested date
    const requestedDate = new Date(date + 'T00:00:00Z');
    const dayOfWeek = requestedDate.getUTCDay(); // 0=Sunday

    // Get availability for this day of week
    const availability = await prisma.availabilitySchedule.findMany({
      where: { userId, dayOfWeek, isActive: true },
      orderBy: { startTime: 'asc' },
    });

    if (availability.length === 0) {
      res.json({ slots: [], message: 'No availability on this day' });
      return;
    }

    // Get existing bookings for this date (to exclude occupied slots)
    const dayStart = new Date(date + 'T00:00:00Z');
    const dayEnd = new Date(date + 'T23:59:59Z');

    const existingBookings = await prisma.meetingBooking.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
        startTime: { gte: dayStart, lte: dayEnd },
      },
      select: { startTime: true, endTime: true },
    });

    // Also check existing legacy bookings
    const existingLegacyBookings = await prisma.booking.findMany({
      where: {
        createdById: userId,
        status: 'CONFIRMED',
        startTime: { gte: dayStart, lte: dayEnd },
      },
      select: { startTime: true, endTime: true },
    });

    const allBookedSlots = [
      ...existingBookings.map(b => ({ start: b.startTime, end: b.endTime })),
      ...existingLegacyBookings.map(b => ({ start: b.startTime, end: b.endTime })),
    ];

    // Check maxPerDay limit
    if (meetingType.maxPerDay) {
      const todayBookingCount = await prisma.meetingBooking.count({
        where: {
          userId,
          meetingTypeId,
          status: 'CONFIRMED',
          startTime: { gte: dayStart, lte: dayEnd },
        },
      });
      if (todayBookingCount >= meetingType.maxPerDay) {
        res.json({ slots: [], message: 'No more slots available for this day' });
        return;
      }
    }

    // Generate available time slots
    const slots: string[] = [];
    const slotDuration = meetingType.duration;
    const bufferBefore = meetingType.bufferBefore;
    const bufferAfter = meetingType.bufferAfter;
    const now = new Date();

    for (const avail of availability) {
      const [startH, startM] = avail.startTime.split(':').map(Number);
      const [endH, endM] = avail.endTime.split(':').map(Number);

      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      while (currentMinutes + slotDuration <= endMinutes) {
        const slotStartH = Math.floor(currentMinutes / 60);
        const slotStartM = currentMinutes % 60;
        const slotStart = new Date(date + `T${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}:00Z`);
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

        // Skip past slots
        if (slotStart <= now) {
          currentMinutes += 30;
          continue;
        }

        // Check for conflicts with existing bookings (including buffer)
        const bufferedStart = new Date(slotStart.getTime() - bufferBefore * 60000);
        const bufferedEnd = new Date(slotEnd.getTime() + bufferAfter * 60000);

        const hasConflict = allBookedSlots.some(booked => {
          return bufferedStart < booked.end && bufferedEnd > booked.start;
        });

        if (!hasConflict) {
          slots.push(`${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`);
        }

        currentMinutes += 30; // 30-minute slot increments
      }
    }

    res.json({ slots, date, meetingType: { name: meetingType.name, duration: meetingType.duration } });
  } catch (error) {
    console.error('[PublicBooking] Get slots error:', error);
    res.status(500).json({ error: 'Failed to generate slots' });
  }
});

// POST /api/book/:userId/:meetingTypeId - Create a booking
router.post('/:userId/:meetingTypeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const meetingTypeId = String(req.params.meetingTypeId);
    const { clientName, clientEmail, clientPhone, clientNotes, startTime } = req.body;

    if (!clientName || !clientEmail || !startTime) {
      res.status(400).json({ error: 'clientName, clientEmail, and startTime are required' });
      return;
    }

    const meetingType = await prisma.meetingType.findFirst({
      where: { id: meetingTypeId, userId, isActive: true },
    });

    if (!meetingType) {
      res.status(404).json({ error: 'Meeting type not found' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, studioName: true, email: true, timezone: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + meetingType.duration * 60000);

    // Double-check for conflicts
    const conflict = await prisma.meetingBooking.findFirst({
      where: {
        userId,
        status: 'CONFIRMED',
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflict) {
      res.status(409).json({ error: 'This time slot is no longer available' });
      return;
    }

    const booking = await prisma.meetingBooking.create({
      data: {
        meetingTypeId,
        userId,
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        clientNotes: clientNotes || null,
        startTime: start,
        endTime: end,
        status: 'CONFIRMED',
      },
    });

    // Send confirmation email to client
    const studioName = user.studioName || `${user.firstName} ${user.lastName}`;
    try {
      await sendMeetingConfirmationEmail({
        clientName,
        clientEmail,
        meetingTypeName: meetingType.name,
        startTime: start,
        endTime: end,
        duration: meetingType.duration,
        location: meetingType.location,
        studioName,
        bookingId: booking.id,
      });
      await prisma.meetingBooking.update({
        where: { id: booking.id },
        data: { confirmationSentAt: new Date() },
      });
    } catch (emailError) {
      console.error('[PublicBooking] Confirmation email error:', emailError);
    }

    // Notify owner
    try {
      await sendMeetingNotificationToOwner({
        ownerEmail: user.email,
        clientName,
        clientEmail,
        meetingTypeName: meetingType.name,
        startTime: start,
        duration: meetingType.duration,
        location: meetingType.location,
        clientNotes: clientNotes || undefined,
        studioName,
      });
    } catch (emailError) {
      console.error('[PublicBooking] Owner notification email error:', emailError);
    }

    res.status(201).json({
      message: 'Meeting booked successfully',
      booking: {
        id: booking.id,
        meetingType: meetingType.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('[PublicBooking] Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ========================
// Authenticated meeting bookings router (mounted separately in server.ts)
// ========================
export const meetingBookingsRouter = Router();

// GET /api/meeting-bookings - Get all meeting bookings for authenticated user
meetingBookingsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const status = req.query.status ? String(req.query.status) : undefined;
    const upcoming = req.query.upcoming ? String(req.query.upcoming) : undefined;

    const where: any = { userId };
    if (status) where.status = status;
    if (upcoming === 'true') {
      where.startTime = { gte: new Date() };
    }

    const bookings = await prisma.meetingBooking.findMany({
      where,
      include: {
        meetingType: { select: { name: true, duration: true, color: true, location: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({ bookings });
  } catch (error) {
    console.error('[MeetingBookings] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PATCH /api/meeting-bookings/:id/cancel - Cancel a meeting booking
meetingBookingsRouter.patch('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const id = String(req.params.id);
    const { reason } = req.body;

    const booking = await prisma.meetingBooking.findFirst({ where: { id, userId } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const updated = await prisma.meetingBooking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || null,
      },
    });

    res.json({ message: 'Booking cancelled', booking: updated });
  } catch (error) {
    console.error('[MeetingBookings] Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;
