import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/server/services/payment.service';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const rawBody = await req.text();
    
    await PaymentService.processWebhook(rawBody, signature);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to Razorpay so it doesn't keep retrying if it's a validation error
    // If it's a genuine processing error, we could return 500 so they retry.
    if (error instanceof Error && error.message === 'Invalid webhook signature') {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
