import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/utils/env';
import { prisma } from '@/lib/prisma';
import { ShippingService } from '@/server/services/shipping.service';
import { ShiprocketShippingProvider } from '@/server/services/shipping/providers/shiprocket.provider';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    if (!env.SHIPROCKET_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook not securely configured' }, { status: 500 });
    }

    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== env.SHIPROCKET_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    const awb = payload.awb ? String(payload.awb) : undefined;
    const statusText = payload.current_status || payload.shipment_status;
    const scannedDate = payload.scanned_datetime || payload.current_timestamp;

    if (!awb || !statusText || !scannedDate) {
      return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
    }

    // Find our internal shipment by AWB
    const shipment = await prisma.shipment.findFirst({
      where: { awb }
    });

    if (!shipment) {
      // Shiprocket sends a test webhook with a dummy AWB when setting up the webhook.
      // We must return 200 OK so Shiprocket accepts the webhook URL.
      console.log(`[Shiprocket Webhook] Ignored tracking event for unknown AWB: ${awb}`);
      return NextResponse.json({ status: 'ignored', reason: 'unknown_awb' });
    }

    const provider = new ShiprocketShippingProvider();
    const internalStatus = provider.mapShiprocketStatus(statusText, undefined);

    // Generate canonical hash for idempotency
    const hash = crypto.createHash('sha256')
      .update(`${awb}_${statusText}_${scannedDate}`)
      .digest('hex');

    const event = {
      providerEventId: hash,
      status: internalStatus,
      message: statusText,
      location: payload.scanned_location || 'Unknown',
      eventTime: new Date(scannedDate),
      rawPayload: payload
    };

    await ShippingService.processTrackingEvent(shipment.id, event);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Shiprocket webhook error:', error);
    // Return 200 on conflict to prevent Shiprocket from retrying the identical valid event forever
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'CONFLICT') {
      return NextResponse.json({ status: 'ok', note: 'duplicate' });
    }
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ status: 'ok', note: 'duplicate' });
    }
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
