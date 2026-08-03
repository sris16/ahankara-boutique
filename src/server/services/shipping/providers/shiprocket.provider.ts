import { ShippingProvider } from '@prisma/client';
import {
  ShippingProviderAdapter,
  CreateProviderShipmentRequest,
  CreateProviderShipmentResponse,
  NormalizedTrackingEvent,
} from './shipping-provider.interface';
import { env } from '@/utils/env';

export class ShiprocketShippingProvider implements ShippingProviderAdapter {
  private token: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private readonly baseUrl = 'https://apiv2.shiprocket.in/v1/external';

  get providerType(): ShippingProvider {
    return ShippingProvider.SHIPROCKET;
  }

  /**
   * Authenticates against Shiprocket API using environment credentials
   * and stores the resulting JWT token in memory.
   */
  public async authenticate(): Promise<string> {
    const email = env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_EMAIL;
    const password = env.SHIPROCKET_PASSWORD || process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new Error('Shiprocket credentials missing in environment (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD)');
    }

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shiprocket Authentication Failed (HTTP ${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.token) {
      throw new Error('Shiprocket Authentication Response did not contain a JWT token');
    }

    this.token = data.token;
    // Set token expiration to 9 days from now (Shiprocket tokens expire in 10 days)
    this.tokenExpiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

    return this.token as string;
  }

  /**
   * Retrieves a valid in-memory JWT token, re-authenticating if expired or missing.
   */
  public async getValidToken(): Promise<string> {
    if (!this.token || !this.tokenExpiresAt || this.tokenExpiresAt <= new Date()) {
      return await this.authenticate();
    }
    return this.token;
  }

  /**
   * Checks whether an in-memory token is currently stored.
   */
  public hasMemoryToken(): boolean {
    return !!this.token && !!this.tokenExpiresAt && this.tokenExpiresAt > new Date();
  }

  public async createShipment(
    request: CreateProviderShipmentRequest
  ): Promise<CreateProviderShipmentResponse> {
    const authToken = await this.getValidToken();

    const orderDate = new Date(request.order.createdAt)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    const payload = {
      order_id: request.order.orderNumber || request.order.id,
      order_date: orderDate,
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
      channel_id: '',
      comment: 'Ahankara Boutique Order',
      billing_customer_name: request.shippingAddress.name,
      billing_last_name: '',
      billing_address: request.shippingAddress.line1,
      billing_address_2: request.shippingAddress.line2 || '',
      billing_city: request.shippingAddress.city,
      billing_pincode: request.shippingAddress.postalCode,
      billing_state: request.shippingAddress.state,
      billing_country: request.shippingAddress.country || 'India',
      billing_email: 'srisakthi7890@gmail.com',
      billing_phone: request.shippingAddress.phone,
      shipping_is_billing: true,
      shipping_customer_name: request.shippingAddress.name,
      shipping_last_name: '',
      shipping_address: request.shippingAddress.line1,
      shipping_address_2: request.shippingAddress.line2 || '',
      shipping_city: request.shippingAddress.city,
      shipping_pincode: request.shippingAddress.postalCode,
      shipping_country: request.shippingAddress.country || 'India',
      shipping_state: request.shippingAddress.state,
      shipping_email: 'srisakthi7890@gmail.com',
      shipping_phone: request.shippingAddress.phone,
      order_items: request.items.map((item) => ({
        name: item.orderItem.productName,
        sku: item.orderItem.sku,
        units: item.quantity,
        selling_price: (item.orderItem.unitPrice / 100).toString(),
        discount: '0',
        tax: '0',
      })),
      payment_method: 'Prepaid',
      shipping_charges: request.order.shippingAmount / 100,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: request.order.discountAmount / 100,
      sub_total: request.order.subtotal / 100,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shiprocket Order Creation Failed (HTTP ${response.status}): ${errorText}`);
    }

    const data = await response.json();

    const providerShipmentId = String(data.shipment_id || data.order_id || '');
    if (!providerShipmentId) {
      throw new Error(`Shiprocket Order Creation returned invalid response: ${JSON.stringify(data)}`);
    }

    return {
      providerShipmentId,
      awb: data.awb_code || undefined,
      courierName: data.courier_name || undefined,
    };
  }

  public async cancelShipment(_providerShipmentId: string): Promise<void> {
    throw new Error('Shiprocket cancelShipment method not executed during shipment creation step');
  }

  public async getTracking(_providerShipmentId: string): Promise<NormalizedTrackingEvent[]> {
    throw new Error('Shiprocket getTracking method not executed during shipment creation step');
  }
}
