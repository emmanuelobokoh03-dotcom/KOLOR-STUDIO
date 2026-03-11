import prisma from '../lib/prisma';

export const AUDIT_ACTIONS = {
  DELETE_LEAD: 'DELETE_LEAD',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  REFUND_ISSUED: 'REFUND_ISSUED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  QUOTE_DELETED: 'QUOTE_DELETED',
  FILE_DELETED: 'FILE_DELETED',
} as const;

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  metadata,
  req,
}: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> };
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        ipAddress: req?.ip || null,
        userAgent: (req?.headers?.['user-agent'] as string) || null,
      },
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log:', error);
  }
}
