// lib/applyAssistance/events.ts
//
// Writes one line to a request's timeline (ApplyAssistanceEvent). Accepts
// either the normal prisma client or a transaction client, so events can be
// written inside the same transaction as the change they describe.

import type { Prisma, ApplyEventKind, ApplyChannel } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Db = Prisma.TransactionClient | typeof prisma;

export async function logEvent(
  db: Db,
  requestId: string,
  kind: ApplyEventKind,
  summary: string,
  extra: {
    actor?: 'system' | 'admin' | 'customer';
    channel?: ApplyChannel;
    template?: string;
    providerMessageId?: string;
    deliveryStatus?: string;
    metadata?: Prisma.InputJsonValue;
  } = {},
) {
  return db.applyAssistanceEvent.create({
    data: {
      requestId,
      kind,
      summary,
      actor: extra.actor ?? 'system',
      channel: extra.channel,
      template: extra.template,
      providerMessageId: extra.providerMessageId,
      deliveryStatus: extra.deliveryStatus,
      metadata: extra.metadata,
    },
  });
}