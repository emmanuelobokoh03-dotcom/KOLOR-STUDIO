import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../lib/prisma';

function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/** Generate OAuth consent screen URL */
export function getAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
    state: userId,
    prompt: 'consent',
  });
}

/** Exchange authorization code for tokens */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/** Store or update calendar connection */
export async function storeCalendarConnection(userId: string, tokens: any) {
  return prisma.calendarConnection.upsert({
    where: { userId_provider: { userId, provider: 'GOOGLE' } },
    update: {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope ?? null,
    },
    create: {
      userId,
      provider: 'GOOGLE',
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope ?? null,
    },
  });
}

/** Get calendar connection for a user */
export async function getCalendarConnection(userId: string) {
  return prisma.calendarConnection.findFirst({ where: { userId } });
}

/** Get an authenticated Google Calendar client, auto-refreshing tokens */
async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
  const connection = await getCalendarConnection(userId);
  if (!connection) throw new Error('No calendar connection found');

  const oauth2Client = getOAuth2Client();

  // Refresh if expired
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

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/** Check if a time range is free in Google Calendar */
export async function checkAvailability(
  userId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const calendar = await getCalendarClient(userId);
    const resp = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: 'primary' }],
      },
    });
    const busy = resp.data.calendars?.primary?.busy || [];
    return busy.length === 0;
  } catch (error) {
    console.error('[GCAL] Availability check failed:', error);
    return true; // Don't block booking if check fails
  }
}

/** Get busy time ranges from Google Calendar for a given day */
export async function getBusySlots(
  userId: string,
  dayStart: Date,
  dayEnd: Date
): Promise<Array<{ start: Date; end: Date }>> {
  try {
    const calendar = await getCalendarClient(userId);
    const resp = await calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        items: [{ id: 'primary' }],
      },
    });
    const busy = resp.data.calendars?.primary?.busy || [];
    return busy.map(b => ({
      start: new Date(b.start as string),
      end: new Date(b.end as string),
    }));
  } catch (error) {
    console.error('[GCAL] getBusySlots failed:', error);
    return [];
  }
}

/** Create a Google Calendar event for a booking */
export async function createEvent(
  userId: string,
  booking: {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string | null;
    clientNotes?: string | null;
    startTime: Date;
    endTime: Date;
    meetingType: { name: string; duration: number; location?: string | null };
  }
): Promise<string | null> {
  try {
    const calendar = await getCalendarClient(userId);
    const resp = await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all',
      requestBody: {
        summary: `${booking.meetingType.name} — ${booking.clientName}`,
        description: [
          `Client: ${booking.clientName}`,
          `Email: ${booking.clientEmail}`,
          booking.clientPhone ? `Phone: ${booking.clientPhone}` : null,
          booking.clientNotes ? `\nNotes: ${booking.clientNotes}` : null,
          `\nBooking ID: ${booking.id}`,
        ].filter(Boolean).join('\n'),
        location: booking.meetingType.location || undefined,
        start: { dateTime: booking.startTime.toISOString() },
        end: { dateTime: booking.endTime.toISOString() },
        attendees: [{ email: booking.clientEmail }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 },
            { method: 'popup', minutes: 30 },
          ],
        },
      },
    });

    const eventId = resp.data.id || null;

    // Store event ID on booking
    if (eventId) {
      await prisma.meetingBooking.update({
        where: { id: booking.id },
        data: { calendarEventId: eventId },
      });
    }

    console.log(`[GCAL] Event created: ${eventId}`);
    return eventId;
  } catch (error) {
    console.error('[GCAL] Event creation failed:', error);
    return null;
  }
}

/** Delete a Google Calendar event */
export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  try {
    const calendar = await getCalendarClient(userId);
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });
    console.log(`[GCAL] Event deleted: ${eventId}`);
  } catch (error) {
    console.error('[GCAL] Event deletion failed:', error);
  }
}

/** Disconnect calendar */
export async function disconnect(userId: string): Promise<void> {
  await prisma.calendarConnection.deleteMany({ where: { userId } });
}
