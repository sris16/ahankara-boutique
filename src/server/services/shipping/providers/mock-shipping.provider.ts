import { ShippingProvider, ShipmentStatus } from '@prisma/client';
import { CreateProviderShipmentRequest, CreateProviderShipmentResponse, NormalizedTrackingEvent, ShippingProviderAdapter } from './shipping-provider.interface';

export class MockShippingProvider implements ShippingProviderAdapter {
  get providerType(): ShippingProvider {
    return ShippingProvider.MOCK;
  }

  async createShipment(request: CreateProviderShipmentRequest): Promise<CreateProviderShipmentResponse> {
    const timestamp = Date.now();
    return {
      providerShipmentId: `mock_ship_${request.shipmentId}_${timestamp}`,
      awb: `AWB${timestamp}`,
      trackingNumber: `TRK${timestamp}`,
      courierName: 'Mock Courier',
      trackingUrl: `https://mock.example.com/track/TRK${timestamp}`,
      estimatedDeliveryAt: new Date(timestamp + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    };
  }

  async cancelShipment(providerShipmentId: string): Promise<void> {
    console.log(`[MockProvider] Cancelling shipment ${providerShipmentId}`);
    return Promise.resolve();
  }

  async getTracking(providerShipmentId: string): Promise<NormalizedTrackingEvent[]> {
    // In a real provider, we would fetch from the provider API.
    // For MOCK, we just return a simulated history based on time.
    const now = new Date();
    return [
      {
        providerEventId: `evt_${providerShipmentId}_1`,
        status: ShipmentStatus.SHIPMENT_CREATED,
        message: 'Shipment created successfully',
        eventTime: new Date(now.getTime() - 100000),
      },
      {
        providerEventId: `evt_${providerShipmentId}_2`,
        status: ShipmentStatus.PICKUP_SCHEDULED,
        message: 'Pickup scheduled',
        eventTime: new Date(now.getTime() - 50000),
      }
    ];
  }
}
