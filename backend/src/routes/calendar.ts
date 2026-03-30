import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import * as gcal from '../services/googleCalendarService';

const router = Router();

/**
 * GET /api/calendar/events
 * Dynamically derive KOLOR events from Leads, Quotes, Contracts, Bookings
 * Query params: start (ISO), end (ISO)
 */
router.get('/events', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { start, end } = req.query;

    const startDate = start ? new Date(start as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = end ? new Date(end as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);

    // Get user industry for labels
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { industry: true } });

    const keyDateLabel = user?.industry === 'FINE_ART' ? 'Delivery date' : user?.industry === 'DESIGN' ? 'Deadline' : 'Shoot date';

    // Fetch all relevant data in parallel
    const [leads, quotes, contracts, bookings, manualEvents] = await Promise.all([
      // Leads with date fields
      prisma.lead.findMany({
        where: {
          assignedToId: userId,
          OR: [
            { keyDate: { gte: startDate, lte: endDate } },
            { eventDate: { gte: startDate, lte: endDate } },
            { shootingDate: { gte: startDate, lte: endDate } },
            { deliveryDate: { gte: startDate, lte: endDate } },
            { editingDeadline: { gte: startDate, lte: endDate } },
            { discoveryCallScheduled: true },
          ],
        },
        select: {
          id: true, projectTitle: true, clientName: true, status: true,
          serviceType: true, estimatedValue: true,
          keyDate: true, eventDate: true, shootingDate: true,
          deliveryDate: true, editingDeadline: true,
          discoveryCallScheduled: true, discoveryCallBookingId: true,
          bookings: {
            where: { startTime: { gte: startDate, lte: endDate } },
            select: { id: true, startTime: true, endTime: true, title: true, status: true },
          },
        },
      }),
      // Quotes with expiry dates
      prisma.quote.findMany({
        where: {
          createdById: userId,
          validUntil: { gte: startDate, lte: endDate },
          status: { in: ['SENT', 'VIEWED'] },
        },
        select: {
          id: true, quoteNumber: true, validUntil: true, total: true, status: true,
          lead: { select: { id: true, clientName: true, projectTitle: true } },
        },
      }),
      // Contracts needing action
      prisma.contract.findMany({
        where: {
          lead: { assignedToId: userId },
          sentAt: { gte: startDate, lte: endDate },
          status: { in: ['SENT', 'VIEWED'] },
        },
        select: {
          id: true, title: true, sentAt: true, status: true,
          lead: { select: { id: true, clientName: true, projectTitle: true } },
        },
      }),
      // Direct bookings in date range
      prisma.booking.findMany({
        where: {
          createdById: userId,
          startTime: { gte: startDate, lte: endDate },
        },
        select: {
          id: true, title: true, startTime: true, endTime: true, status: true, allDay: true,
          lead: { select: { id: true, clientName: true, projectTitle: true, serviceType: true } },
        },
      }),
      // Manual calendar events
      prisma.calendarEvent.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        select: {
          id: true, title: true, date: true, startTime: true, endTime: true,
          allDay: true, notes: true, eventType: true, leadId: true, googleEventId: true,
        },
      }),
    ]);

    const events: any[] = [];

    // Derive events from leads
    for (const lead of leads) {
      if (lead.keyDate && lead.keyDate >= startDate && lead.keyDate <= endDate) {
        events.push({
          id: `lead-keydate-${lead.id}`,
          title: `${keyDateLabel}: ${lead.projectTitle}`,
          date: lead.keyDate.toISOString(),
          allDay: true,
          type: 'key_date',
          color: '#8b5cf6',
          leadId: lead.id,
          clientName: lead.clientName,
          meta: { status: lead.status, value: lead.estimatedValue, serviceType: lead.serviceType },
        });
      }
      if (lead.eventDate && lead.eventDate >= startDate && lead.eventDate <= endDate) {
        events.push({
          id: `lead-event-${lead.id}`,
          title: `Event: ${lead.projectTitle}`,
          date: lead.eventDate.toISOString(),
          allDay: true,
          type: 'event_date',
          color: '#3b82f6',
          leadId: lead.id,
          clientName: lead.clientName,
          meta: { status: lead.status, value: lead.estimatedValue },
        });
      }
      if (lead.shootingDate && lead.shootingDate >= startDate && lead.shootingDate <= endDate) {
        events.push({
          id: `lead-shoot-${lead.id}`,
          title: `${keyDateLabel}: ${lead.clientName}`,
          date: lead.shootingDate.toISOString(),
          allDay: true,
          type: 'shooting',
          color: '#8b5cf6',
          leadId: lead.id,
          clientName: lead.clientName,
          meta: { status: lead.status, serviceType: lead.serviceType },
        });
      }
      if (lead.deliveryDate && lead.deliveryDate >= startDate && lead.deliveryDate <= endDate) {
        events.push({
          id: `lead-delivery-${lead.id}`,
          title: `Delivery: ${lead.clientName}`,
          date: lead.deliveryDate.toISOString(),
          allDay: true,
          type: 'delivery',
          color: '#22c55e',
          leadId: lead.id,
          clientName: lead.clientName,
          meta: { status: lead.status },
        });
      }
      if (lead.editingDeadline && lead.editingDeadline >= startDate && lead.editingDeadline <= endDate) {
        events.push({
          id: `lead-editing-${lead.id}`,
          title: `Editing deadline: ${lead.clientName}`,
          date: lead.editingDeadline.toISOString(),
          allDay: true,
          type: 'editing_deadline',
          color: '#f97316',
          leadId: lead.id,
          clientName: lead.clientName,
          meta: { status: lead.status },
        });
      }
      // Bookings from lead
      for (const booking of lead.bookings) {
        events.push({
          id: `booking-${booking.id}`,
          title: booking.title || `Booking: ${lead.clientName}`,
          date: booking.startTime.toISOString(),
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          allDay: false,
          type: 'booking',
          color: '#6C2EDB',
          leadId: lead.id,
          clientName: lead.clientName,
          meta: { bookingStatus: booking.status },
        });
      }
    }

    // Direct bookings (not nested under leads)
    for (const booking of bookings) {
      const existingId = `booking-${booking.id}`;
      if (!events.find(e => e.id === existingId)) {
        events.push({
          id: existingId,
          title: booking.title || `Booking: ${booking.lead.clientName}`,
          date: booking.startTime.toISOString(),
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          allDay: booking.allDay,
          type: 'booking',
          color: '#6C2EDB',
          leadId: booking.lead.id,
          clientName: booking.lead.clientName,
          meta: { bookingStatus: booking.status, serviceType: booking.lead.serviceType },
        });
      }
    }

    // Quote expiries
    for (const quote of quotes) {
      events.push({
        id: `quote-expiry-${quote.id}`,
        title: `Quote expires: ${quote.lead.clientName}`,
        date: quote.validUntil.toISOString(),
        allDay: true,
        type: 'quote_expiry',
        color: '#eab308',
        leadId: quote.lead.id,
        clientName: quote.lead.clientName,
        meta: { quoteNumber: quote.quoteNumber, total: quote.total, quoteStatus: quote.status },
      });
    }

    // Contract deadlines
    for (const contract of contracts) {
      events.push({
        id: `contract-${contract.id}`,
        title: `Contract pending: ${contract.lead.clientName}`,
        date: contract.sentAt!.toISOString(),
        allDay: true,
        type: 'contract',
        color: '#ef4444',
        leadId: contract.lead.id,
        clientName: contract.lead.clientName,
        meta: { contractTitle: contract.title, contractStatus: contract.status },
      });
    }

    // Manual events
    for (const evt of manualEvents) {
      events.push({
        id: `manual-${evt.id}`,
        title: evt.title,
        date: evt.date.toISOString(),
        startTime: evt.startTime?.toISOString() || null,
        endTime: evt.endTime?.toISOString() || null,
        allDay: evt.allDay,
        type: 'manual',
        color: '#6b7280',
        leadId: evt.leadId,
        notes: evt.notes,
        meta: { eventType: evt.eventType, googleEventId: evt.googleEventId },
      });
    }

    res.json({ events });
  } catch (error) {
    console.error('[Calendar] Events fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

/**
 * GET /api/calendar/google-events
 * Fetch personal Google Calendar events with graceful token refresh
 */
router.get('/google-events', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { start, end } = req.query;

    const connection = await gcal.getCalendarConnection(userId);
    if (!connection) {
      res.json({ connected: false, events: [] });
      return;
    }

    const startDate = start ? new Date(start as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = end ? new Date(end as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);

    // Use the google calendar service to get events (with auto-refresh)
    const { google } = await import('googleapis');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Refresh if expired
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      try {
        oauth2Client.setCredentials({ refresh_token: connection.refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        await prisma.calendarConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: credentials.access_token!,
            expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          },
        });
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error('[Calendar] Google token refresh failed:', refreshError);
        res.json({ connected: false, events: [], error: 'reconnect' });
        return;
      }
    } else {
      oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const googleEvents = (response.data.items || []).map(item => ({
      id: `google-${item.id}`,
      title: item.summary || '(No title)',
      date: item.start?.dateTime || item.start?.date || '',
      startTime: item.start?.dateTime || null,
      endTime: item.end?.dateTime || null,
      allDay: !item.start?.dateTime,
      type: 'google',
      color: '#4285f4',
      location: item.location || null,
      description: item.description || null,
      meta: { googleEventId: item.id, htmlLink: item.htmlLink },
    }));

    res.json({ connected: true, events: googleEvents });
  } catch (error: any) {
    console.error('[Calendar] Google events error:', error?.message || error);
    // If it's an auth error, suggest reconnecting
    if (error?.code === 401 || error?.code === 403 || error?.message?.includes('invalid_grant')) {
      res.json({ connected: false, events: [], error: 'reconnect' });
    } else {
      res.json({ connected: true, events: [], error: 'fetch_failed' });
    }
  }
});

/**
 * POST /api/calendar/events
 * Create a manual calendar event
 */
router.post('/events', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const { title, date, startTime, endTime, allDay, notes, eventType, leadId } = req.body;

    if (!title || !date) {
      res.status(400).json({ error: 'Title and date are required' });
      return;
    }

    const eventData: any = {
      userId,
      title,
      date: new Date(date),
      allDay: allDay ?? true,
      notes: notes || null,
      eventType: eventType || 'MANUAL',
      leadId: leadId || null,
    };

    if (startTime) eventData.startTime = new Date(startTime);
    if (endTime) eventData.endTime = new Date(endTime);

    // Try to sync to Google Calendar if connected
    let googleEventId: string | null = null;
    try {
      const connection = await gcal.getCalendarConnection(userId);
      if (connection) {
        const { google } = await import('googleapis');
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        if (connection.expiresAt && connection.expiresAt < new Date()) {
          oauth2Client.setCredentials({ refresh_token: connection.refreshToken });
          const { credentials } = await oauth2Client.refreshAccessToken();
          await prisma.calendarConnection.update({
            where: { id: connection.id },
            data: {
              accessToken: credentials.access_token!,
              expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
            },
          });
          oauth2Client.setCredentials(credentials);
        } else {
          oauth2Client.setCredentials({
            access_token: connection.accessToken,
            refresh_token: connection.refreshToken,
          });
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const gcalEvent = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: title,
            description: notes || undefined,
            start: allDay
              ? { date: new Date(date).toISOString().split('T')[0] }
              : { dateTime: new Date(startTime).toISOString() },
            end: allDay
              ? { date: new Date(date).toISOString().split('T')[0] }
              : { dateTime: new Date(endTime || startTime).toISOString() },
          },
        });
        googleEventId = gcalEvent.data.id || null;
      }
    } catch (syncErr) {
      console.warn('[Calendar] Google sync failed (non-blocking):', syncErr);
    }

    eventData.googleEventId = googleEventId;

    const calendarEvent = await prisma.calendarEvent.create({ data: eventData });

    res.status(201).json({
      event: {
        id: `manual-${calendarEvent.id}`,
        title: calendarEvent.title,
        date: calendarEvent.date.toISOString(),
        startTime: calendarEvent.startTime?.toISOString() || null,
        endTime: calendarEvent.endTime?.toISOString() || null,
        allDay: calendarEvent.allDay,
        type: 'manual',
        color: '#6b7280',
        leadId: calendarEvent.leadId,
        notes: calendarEvent.notes,
        meta: { eventType: calendarEvent.eventType, googleEventId: calendarEvent.googleEventId },
      },
      googleSynced: !!googleEventId,
    });
  } catch (error) {
    console.error('[Calendar] Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * DELETE /api/calendar/events/:id
 * Delete a manual calendar event
 */
router.delete('/events/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const event = await prisma.calendarEvent.findFirst({ where: { id, userId } });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Try to delete from Google Calendar too
    if (event.googleEventId) {
      try {
        await gcal.deleteEvent(userId, event.googleEventId);
      } catch (err) {
        console.warn('[Calendar] Google event delete failed:', err);
      }
    }

    await prisma.calendarEvent.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('[Calendar] Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
