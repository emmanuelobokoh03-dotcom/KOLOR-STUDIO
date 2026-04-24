import prisma from '../lib/prisma';
import { sendMeetingReminderEmail } from './email';

/**
 * Process meeting reminders: sends email 24 hours before meeting
 */
let meetingReminderProcessorRunning = false;

export async function processMeetingReminders(): Promise<void> {
  if (meetingReminderProcessorRunning) {
    console.warn('[MeetingReminders] Previous run still active — skipping this invocation');
    return;
  }
  meetingReminderProcessorRunning = true;
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Find confirmed bookings happening in ~24 hours that haven't had reminders sent
    const upcomingBookings = await prisma.meetingBooking.findMany({
      where: {
        status: 'CONFIRMED',
        reminderSentAt: null,
        startTime: {
          gte: in23h,
          lte: in24h,
        },
      },
      include: {
        meetingType: true,
        user: {
          select: { firstName: true, lastName: true, studioName: true },
        },
      },
    });

    if (upcomingBookings.length === 0) return;

    console.log(`[MeetingReminders] Processing ${upcomingBookings.length} reminders`);

    for (const booking of upcomingBookings) {
      const studioName = booking.user.studioName || `${booking.user.firstName} ${booking.user.lastName}`;

      const sent = await sendMeetingReminderEmail({
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        meetingTypeName: booking.meetingType.name,
        startTime: booking.startTime,
        duration: booking.meetingType.duration,
        location: booking.meetingType.location,
        studioName,
      });

      if (sent) {
        await prisma.meetingBooking.update({
          where: { id: booking.id },
          data: { reminderSentAt: new Date() },
        });
        console.log(`[MeetingReminders] Sent reminder for booking ${booking.id}`);
      }
    }
  } catch (error) {
    console.error('[MeetingReminders] Error:', error);
  } finally {
    meetingReminderProcessorRunning = false;
  }
}
