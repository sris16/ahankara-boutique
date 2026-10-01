"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { Printer, Download, FileText } from "lucide-react";
export interface InvoiceOrderData {
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  paymentStatus: string;
  fulfillmentStatus?: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  couponCode?: string | null;
  providerPaymentId?: string | null;
  shippingAddress?: {
    name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  billingAddress?: {
    name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  items?: Array<{
    id: string;
    productName: string;
    sku: string;
    size?: string | null;
    color?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

interface OrderInvoiceDialogProps {
  order: InvoiceOrderData;
  trigger?: React.ReactNode;
}

export function OrderInvoiceDialog({ order, trigger }: OrderInvoiceDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer inline-flex">
          {trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-xs uppercase tracking-widest gap-2 font-medium"
        >
          <FileText className="w-3.5 h-3.5" />
          Invoice
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background text-foreground border border-border print:border-none print:shadow-none print:max-w-none print:m-0 print:p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border/50 flex flex-row items-center justify-between print:hidden">
            <div>
              <DialogTitle className="font-serif text-2xl tracking-tight">
                Tax Invoice
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Order #{order.orderNumber}
              </p>
            </div>
            <div className="flex items-center gap-2 pr-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs uppercase tracking-widest gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </Button>
            </div>
          </DialogHeader>

          {/* Printable Invoice Container */}
          <div
            id={`invoice-${order.orderNumber}`}
            className="p-6 md:p-8 space-y-6 text-foreground print:p-8 print:text-black print:bg-white text-sm"
          >
            {/* Invoice Top Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-border/60 print:border-neutral-300">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl tracking-widest uppercase font-medium">
                  AHANKARA STUDIOS
                </h1>
                <p className="text-xs text-muted-foreground print:text-neutral-600 mt-1 uppercase tracking-wider">
                  Haute Couture & Ready-to-Wear Atelier
                </p>
                <p className="text-xs text-muted-foreground print:text-neutral-600">
                  GSTIN: 29AAKAS8890C1Z8 | Bangalore, Karnataka, India
                </p>
                <p className="text-xs text-muted-foreground print:text-neutral-600">
                  concierge@ahankara.com | www.ahankara.com
                </p>
              </div>

              <div className="sm:text-right">
                <Badge variant="outline" className="text-xs uppercase tracking-widest mb-2 font-mono">
                  TAX INVOICE
                </Badge>
                <p className="text-xs text-muted-foreground print:text-neutral-600">
                  Invoice No: <span className="font-mono text-foreground print:text-black font-medium">INV-{order.orderNumber}</span>
                </p>
                <p className="text-xs text-muted-foreground print:text-neutral-600">
                  Order Ref: <span className="font-mono text-foreground print:text-black font-medium">{order.orderNumber}</span>
                </p>
                <p className="text-xs text-muted-foreground print:text-neutral-600">
                  Date: <span className="text-foreground print:text-black font-medium">{formatDate(order.createdAt)}</span>
                </p>
                <div className="mt-1">
                  <span className="text-xs text-muted-foreground print:text-neutral-600 mr-2">Payment:</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 print:text-green-700">
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Billing & Shipping Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-border/60 print:border-neutral-300 text-xs">
              <div>
                <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground print:text-neutral-600 mb-2">
                  Billed To
                </h4>
                {order.billingAddress ? (
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-foreground print:text-black">{order.billingAddress.name}</p>
                    <p>{order.billingAddress.line1}</p>
                    {order.billingAddress.line2 && <p>{order.billingAddress.line2}</p>}
                    <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}</p>
                    <p>{order.billingAddress.country}</p>
                    <p className="pt-1 text-muted-foreground print:text-neutral-600">Phone: {order.billingAddress.phone}</p>
                  </div>
                ) : order.shippingAddress ? (
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-foreground print:text-black">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                    <p className="pt-1 text-muted-foreground print:text-neutral-600">Phone: {order.shippingAddress.phone}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Customer information on file</p>
                )}
              </div>

              <div>
                <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground print:text-neutral-600 mb-2">
                  Shipped To
                </h4>
                {order.shippingAddress ? (
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-foreground print:text-black">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                    <p className="pt-1 text-muted-foreground print:text-neutral-600">Phone: {order.shippingAddress.phone}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Standard digital delivery</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 print:border-neutral-400 font-mono text-[10px] uppercase tracking-wider text-muted-foreground print:text-neutral-600">
                    <th className="py-2.5 pr-2">#</th>
                    <th className="py-2.5 px-2">Item Description</th>
                    <th className="py-2.5 px-2">SKU</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-right">Unit Price</th>
                    <th className="py-2.5 pl-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 print:divide-neutral-200">
                  {order.items?.map((item, idx: number) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-3 pr-2 text-muted-foreground print:text-neutral-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-2">
                        <p className="font-medium text-foreground print:text-black">{item.productName}</p>
                        <div className="text-[11px] text-muted-foreground print:text-neutral-600 flex gap-2 mt-0.5">
                          {item.color && <span>Color: {item.color}</span>}
                          {item.size && <span>Size: {item.size}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-muted-foreground print:text-neutral-600">
                        {item.sku}
                      </td>
                      <td className="py-3 px-2 text-center font-medium">{item.quantity}</td>
                      <td className="py-3 px-2 text-right font-mono">{formatPrice(item.unitPrice)}</td>
                      <td className="py-3 pl-2 text-right font-mono font-medium">{formatPrice(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-border/60 print:border-neutral-300 flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="text-xs text-muted-foreground print:text-neutral-600 max-w-sm space-y-1">
                <p className="font-medium text-foreground print:text-black">Payment & Tax Notes:</p>
                {order.providerPaymentId && (
                  <p className="font-mono text-[11px]">Transaction ID: {order.providerPaymentId}</p>
                )}
                <p>All prices include applicable Integrated Goods and Services Tax (IGST) / CGST + SGST.</p>
                <p>Authentic bespoke luxury guarantee by AHANKARA STUDIOS.</p>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground print:text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-mono text-foreground print:text-black font-medium">{formatPrice(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 print:text-green-700">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                    <span className="font-mono">-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground print:text-neutral-600">
                  <span>Shipping & Handling</span>
                  <span className="font-mono text-foreground print:text-black font-medium">
                    {order.shippingAmount === 0 ? "Complimentary" : formatPrice(order.shippingAmount)}
                  </span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground print:text-neutral-600">
                    <span>GST (Estimated)</span>
                    <span className="font-mono text-foreground print:text-black font-medium">{formatPrice(order.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border/60 print:border-neutral-400 text-foreground print:text-black">
                  <span>Total Paid</span>
                  <span className="font-mono text-base">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Invoice Sign-off */}
            <div className="pt-6 border-t border-border/40 print:border-neutral-200 text-center text-xs text-muted-foreground print:text-neutral-500">
              <p className="italic">This is an authorized, computer-generated tax invoice issued by AHANKARA STUDIOS.</p>
              <p className="mt-1">For concierge assistance, please quote your order reference #{order.orderNumber}.</p>
            </div>
          </div>

          <div className="p-4 border-t border-border/50 bg-muted/10 flex justify-end gap-3 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs uppercase tracking-wider"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="text-xs uppercase tracking-wider gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download / Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
