// lib/services/orders/events.ts
//
// One line on an order's timeline (ServiceOrderEvent). Accepts the normal
// prisma client or a transaction client.

import type { Prisma, ServiceEventKind, ApplyChannel } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Db = Prisma.TransactionClient | typeof prisma;

export async function logOrderEvent(
  db: Db,
  orderId: string,
  kind: ServiceEventKind,
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
  return db.serviceOrderEvent.create({
    data: {
      orderId,
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