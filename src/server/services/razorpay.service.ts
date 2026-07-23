import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '@/utils/env';

export class RazorpayService {
  private static instance: Razorpay;

  public static get client(): Razorpay {
    if (!this.instance) {
      this.instance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
    return this.instance;
  }

  /**
   * Creates a Razorpay Order
   * @param amount Amount in paise
   * @param receipt Our internal Order number
   */
  public static async createOrder(amount: number, receipt: string) {
    return this.client.orders.create({
      amount,
      currency: 'INR',
      receipt,
      // Optional notes can go here
    });
  }

  /**
   * Validates the checkout signature received from the frontend
   */
  public static verifyCheckoutSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    return generatedSignature === razorpaySignature;
  }

  /**
   * Validates a webhook signature from Razorpay.
   * NOTE: payload must be the exact raw string body of the request.
   */
  public static verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  public static async fetchPayment(paymentId: string) {
    return this.client.payments.fetch(paymentId);
  }

  public static async fetchOrder(orderId: string) {
    return this.client.orders.fetch(orderId);
  }
}
