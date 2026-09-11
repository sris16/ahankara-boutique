import { ShippingProvider, ShipmentStatus } from '@prisma/client';
import {
  ShippingProviderAdapter,
  CreateProviderShipmentRequest,
  CreateProviderShipmentResponse,
  NormalizedTrackingEvent,
  AssignAWBRequest,
  AssignAWBResponse,
} from './shipping-provider.interface';
import { env } from '@/utils/env';
import { ValidationError, AppError } from '@/utils/errors';
import * as crypto from 'crypto';

export class ShiprocketShippingProvider implements ShippingProviderAdapter {
  private token: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private readonly baseUrl = 'https://apiv2.shiprocket.in/v1/external';

  get providerType(): ShippingProvider {
    return ShippingProvider.SHIPROCKET;
  }

  public async authenticate(): Promise<string> {
    const email = env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_EMAIL;
    const password = env.SHIPROCKET_PASSWORD || process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new AppError('Shiprocket credentials missing in environment', 500, 'PROVIDER_CONFIG_ERROR');
    }

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new AppError(`Shiprocket Authentication Failed (HTTP ${response.status})`, 502, 'PROVIDER_AUTH_ERROR');
    }

    const data = await response.json();
    if (!data.token) {
      throw new AppError('Shiprocket Authentication Response did not contain a JWT token', 502, 'PROVIDER_AUTH_ERROR');
    }

    this.token = data.token;
    this.tokenExpiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    return this.token as string;
  }

  public async getValidToken(): Promise<string> {
    if (!this.token || !this.tokenExpiresAt || this.tokenExpiresAt <= new Date()) {
      return await this.authenticate();
    }
    return this.token;
  }

  public hasMemoryToken(): boolean {
    return !!this.token && !!this.tokenExpiresAt && this.tokenExpiresAt > new Date();
  }

  public async createShipment(
    request: CreateProviderShipmentRequest
  ): Promise<CreateProviderShipmentResponse> {
    const authToken = await this.getValidToken();

    if (!request.customerEmail) {
      throw new ValidationError('Customer email is required for Shiprocket shipment');
    }

    const pickupLocation = env.SHIPROCKET_PICKUP_LOCATION;
    if (!pickupLocation) {
      throw new AppError('SHIPROCKET_PICKUP_LOCATION is missing', 500, 'PROVIDER_CONFIG_ERROR');
    }

    let totalWeightInGrams = 0;
    let maxLength = 0;
    let maxBreadth = 0;
    let maxHeight = 0;

    for (const item of request.items) {
      const variant = item.orderItem.variant;
      if (!variant) {
        throw new ValidationError(`Variant missing for order item ${item.orderItemId}`);
      }
      if (!variant.weightInGrams || !variant.lengthCm || !variant.breadthCm || !variant.heightCm) {
        throw new ValidationError(`Product variant ${variant.sku} is missing physical dimensions or weight required for shipping`);
      }

      totalWeightInGrams += variant.weightInGrams * item.quantity;
      maxLength = Math.max(maxLength, variant.lengthCm);
      maxBreadth = Math.max(maxBreadth, variant.breadthCm);
      maxHeight = Math.max(maxHeight, variant.heightCm);
    }

    if (totalWeightInGrams <= 0 || maxLength <= 0 || maxBreadth <= 0 || maxHeight <= 0) {
      throw new ValidationError('Computed package dimensions and weight must be strictly positive');
    }

    const orderDate = new Date(request.order.createdAt)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    const billingAddress = request.billingAddress || request.shippingAddress;

    const payload = {
      order_id: request.order.orderNumber || request.order.id,
      order_date: orderDate,
      pickup_location: pickupLocation,
      channel_id: '',
      comment: 'Ahankara Studios Order',

      billing_customer_name: billingAddress.name,
      billing_last_name: '',
      billing_address: billingAddress.line1,
      billing_address_2: billingAddress.line2 || '',
      billing_city: billingAddress.city,
      billing_pincode: billingAddress.postalCode,
      billing_state: billingAddress.state,
      billing_country: billingAddress.country || 'India',
      billing_email: request.customerEmail,
      billing_phone: billingAddress.phone,

      shipping_is_billing: request.billingAddress === null,
      shipping_customer_name: request.shippingAddress.name,
      shipping_last_name: '',
      shipping_address: request.shippingAddress.line1,
      shipping_address_2: request.shippingAddress.line2 || '',
      shipping_city: request.shippingAddress.city,
      shipping_pincode: request.shippingAddress.postalCode,
      shipping_country: request.shippingAddress.country || 'India',
      shipping_state: request.shippingAddress.state,
      shipping_email: request.customerEmail,
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

      length: maxLength,
      breadth: maxBreadth,
      height: maxHeight,
      weight: totalWeightInGrams / 1000,
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
      throw new AppError(`Shiprocket Order Creation Failed (HTTP ${response.status})`, 502, 'PROVIDER_API_ERROR');
    }

    const data = await response.json();

    const providerOrderId = String(data.order_id || '');
    const providerShipmentId = String(data.shipment_id || '');
    if (!providerOrderId || !providerShipmentId) {
      throw new AppError(`Shiprocket Order Creation returned invalid response`, 502, 'PROVIDER_API_ERROR');
    }

    return {
      providerOrderId,
      providerShipmentId,
      awb: data.awb_code || undefined,
      courierName: data.courier_name || undefined,
    };
  }

  public async cancelShipment(providerShipmentId: string, providerOrderId?: string | null): Promise<void> {
    const authToken = await this.getValidToken();

    const cancelId = providerOrderId || providerShipmentId;

    const payload = {
      ids: [Number(cancelId)]
    };

    const response = await fetch(`${this.baseUrl}/orders/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        // Safe check for already cancelled or unrecognized - generally means it's cancelled
        const txt = await response.text();
        if (txt.includes('cancel') || txt.includes('already')) return;
      }
      throw new AppError(`Shiprocket Cancellation Failed (HTTP ${response.status})`, 502, 'PROVIDER_API_ERROR');
    }
  }

  public async assignAWB(providerShipmentId: string, options?: AssignAWBRequest): Promise<AssignAWBResponse> {
    const authToken = await this.getValidToken();

    const payload: Record<string, unknown> = {
      shipment_id: Number(providerShipmentId),
    };

    // If courierId is omitted, we request Shiprocket's automatic courier allocation behavior
    if (options?.courierId) {
      payload.courier_id = options.courierId;
    }

    const response = await fetch(`${this.baseUrl}/courier/assign/awb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 400 && data.message && data.message.toLowerCase().includes('awb already assigned')) {
        // Idempotency / Recovery path: If AWB was already assigned, we must fetch the order details to get the AWB.
        // Shiprocket does not return the AWB in the 400 response. But we only have providerShipmentId (shipment_id here).
        // A GET to /v1/external/orders/show/ doesn't accept shipment_id, it expects order_id.
        // Wait, there is /v1/external/courier/track/shipment/:shipment_id
        // Or we can just rely on the webhook. But for synchronous recovery, let's see if Shiprocket has another way.
        // Actually, we can fetch tracking data which contains the AWB, or throw a specific error and let webhook fix it.
        // To be safe and deterministic, let's just fetch shipment tracking by shipment_id.
        const trackRes = await fetch(`${this.baseUrl}/courier/track/shipment/${providerShipmentId}`, {
           method: 'GET',
           headers: { Authorization: `Bearer ${authToken}` }
        });
        if (trackRes.ok) {
           const trackData = await trackRes.json();
           const awb = trackData?.tracking_data?.track_url ? trackData.tracking_data.track_url.split('=').pop() || trackData.tracking_data.shipment_track?.[0]?.awb_code : null;

           if (awb) {
              return {
                 awb,
                 courierName: trackData?.tracking_data?.shipment_track?.[0]?.courier_name,
              };
           }
        }
      }
      throw new AppError(`Shiprocket AWB Assignment Failed (HTTP ${response.status})`, 502, 'PROVIDER_API_ERROR');
    }

    if (!data.response || !data.response.data || !data.response.data.awb_code) {
      if (data.awb_assign_status === 0) {
         throw new AppError(`Shiprocket AWB Assignment Failed: ${data.message || JSON.stringify(data)}`, 502, 'PROVIDER_API_ERROR');
      }
      throw new AppError(`Shiprocket AWB Assignment returned invalid format: ${JSON.stringify(data)}`, 502, 'PROVIDER_API_ERROR');
    }

    return {
      awb: data.response.data.awb_code,
      courierName: data.response.data.courier_name,
    };
  }

  public async getTracking(providerShipmentId: string, awb: string | null = null): Promise<NormalizedTrackingEvent[]> {
    if (!awb) {
      throw new ValidationError('AWB required for Shiprocket tracking');
    }

    const authToken = await this.getValidToken();

    const response = await fetch(`${this.baseUrl}/courier/track/awb/${awb}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      }
    });

    if (!response.ok) {
      throw new AppError(`Shiprocket Tracking Failed (HTTP ${response.status})`, 502, 'PROVIDER_API_ERROR');
    }

    const data = await response.json();

    const trackingData = data.tracking_data;
    if (!trackingData || trackingData.track_status !== 1 || !trackingData.shipment_track) {
      return [];
    }

    const events: NormalizedTrackingEvent[] = [];
    const activities = trackingData.shipment_track_activities || [];

    for (const activity of activities) {
      const hash = crypto.createHash('sha256')
        .update(`${awb}_${activity.sr_status_label}_${activity.date}`)
        .digest('hex');

      events.push({
        providerEventId: hash,
        status: this.mapShiprocketStatus(activity.activity, activity.sr_status_label),
        message: activity.activity,
        location: activity.location,
        eventTime: new Date(activity.date),
        rawPayload: activity
      });
    }

    return events;
  }

  public mapShiprocketStatus(activityText: string, statusLabel: string | undefined): ShipmentStatus {
    const text = (statusLabel || activityText || '').toUpperCase();
    if (text.includes('DELIVERED')) return ShipmentStatus.DELIVERED;
    if (text.includes('RTO DELIVERED')) return ShipmentStatus.RTO_DELIVERED;
    if (text.includes('RTO INIT')) return ShipmentStatus.RTO_INITIATED;
    if (text.includes('OUT FOR DELIVERY')) return ShipmentStatus.OUT_FOR_DELIVERY;
    if (text.includes('IN TRANSIT')) return ShipmentStatus.IN_TRANSIT;
    if (text.includes('PICKED UP')) return ShipmentStatus.PICKED_UP;
    if (text.includes('CANCELLED')) return ShipmentStatus.CANCELLED;
    return ShipmentStatus.PENDING;
  }
}
