import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';

export async function createEmailTracking({
  emailType,
  sequenceId,
  stepNumber,
  leadId,
  recipientEmail,
}: {
  emailType: string;
  sequenceId?: string;
  stepNumber?: number;
  leadId: string;
  recipientEmail: string;
}): Promise<string> {
  const trackingId = randomUUID();

  await prisma.emailTracking.create({
    data: {
      trackingId,
      emailType,
      sequenceId,
      stepNumber,
      leadId,
      recipientEmail,
      sentAt: new Date(),
    },
  });

  console.log(`[TRACKING] Created: ${emailType} → ${recipientEmail} (${trackingId})`);
  return trackingId;
}

export function getTrackingPixelUrl(trackingId: string): string {
  const baseUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || '';
  return `${baseUrl}/api/track/open/${trackingId}`;
}

export function getTrackingPixelHtml(trackingId: string): string {
  const url = getTrackingPixelUrl(trackingId);
  return `<img src="${url}" width="1" height="1" style="display:none" alt="" />`;
}

export async function getOpenRate(sequenceId: string, stepNumber: number): Promise<number | null> {
  const sent = await prisma.emailTracking.count({
    where: { sequenceId, stepNumber },
  });

  if (sent === 0) return null;

  const opened = await prisma.emailTracking.count({
    where: { sequenceId, stepNumber, opened: true },
  });

  return Math.round((opened / sent) * 100);
}

export async function getAverageOpenRate(sequenceId: string): Promise<number | null> {
  const rates = await Promise.all([
    getOpenRate(sequenceId, 1),
    getOpenRate(sequenceId, 2),
    getOpenRate(sequenceId, 3),
  ]);

  const validRates = rates.filter((r): r is number => r !== null);
  if (validRates.length === 0) return null;

  return Math.round(validRates.reduce((sum, r) => sum + r, 0) / validRates.length);
}
