import { Metadata } from "next";
import Link from "next/link";
import { Scale, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | AHANKARA STUDIOS",
  description: "Review the terms and conditions governing purchases, orders, and service usage at AHANKARA STUDIOS.",
  openGraph: {
    title: "Terms of Service | AHANKARA STUDIOS",
    description: "Review the terms and conditions governing purchases, orders, and service usage at AHANKARA STUDIOS.",
    type: "website",
    siteName: "AHANKARA STUDIOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | AHANKARA STUDIOS",
    description: "Review the terms and conditions governing purchases, orders, and service usage at AHANKARA STUDIOS.",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "October 2026";

  const sections = [
    { id: "agreement", title: "1. Agreement & Acceptance" },
    { id: "intellectual-property", title: "2. Intellectual Property & Designs" },
    { id: "pricing", title: "3. Pricing, Taxes & Availability" },
    { id: "orders", title: "4. Order Creation & Cancellations" },
    { id: "shipping", title: "5. Shipping, Transit & Delivery" },
    { id: "returns", title: "6. Returns, Exchanges & Refunds" },
    { id: "care", title: "7. Garment Care & Craft Integrity" },
    { id: "governing-law", title: "8. Liability & Governing Law" },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen pb-24">
      {/* Header */}
      <section className="border-b border-border/40 py-16 md:py-20 bg-surface/30">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            <Scale className="w-4 h-4 text-foreground" />
            <span>Storefront Conditions</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Last Revised: {lastUpdated}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12 md:py-16 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Quick-jump Table of Contents */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 p-5 border border-border/60 bg-surface/50 rounded-sm space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Terms Overview
            </h3>
            <nav className="space-y-1.5 text-xs">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block text-muted-foreground hover:text-foreground hover:underline transition-colors py-1"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Terms Content */}
          <article className="lg:col-span-8 space-y-12 text-sm leading-relaxed text-muted-foreground font-light">
            <section id="agreement" className="space-y-3 pt-2">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">1. Agreement & Acceptance</h2>
              <p>
                By navigating this website, registering a customer account, or acquiring garments produced by AHANKARA STUDIOS (&ldquo;AHANKARA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you acknowledge and agree to comply with these Terms of Service. If you disagree with any portion of these conditions, your sole remedy is to discontinue utilizing our services.
              </p>
            </section>

            <section id="intellectual-property" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">2. Intellectual Property & Designs</h2>
              <p>
                All brand identifiers, trademarks, garment patterns, photography, typography, layouts, and digital assets published on this platform are the exclusive intellectual property of AHANKARA STUDIOS. Any unauthorized reproduction, imitation, reverse-engineering of silhouettes, or commercial exploitation is strictly prohibited without explicit written consent.
              </p>
            </section>

            <section id="pricing" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">3. Pricing, Taxes & Availability</h2>
              <p>
                All prices presented on the storefront are denominated in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST).
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="font-medium text-foreground">Authoritative Valuation:</strong> Final payable amounts are calculated authoritatively by our backend server engine upon checkout initiation.</li>
                <li><strong className="font-medium text-foreground">Inventory Allocation:</strong> Adding garments to your cart does not constitute a reservation. Inventory is reserved only upon proceeding to payment within a designated reservation window.</li>
                <li><strong className="font-medium text-foreground">Pricing Corrections:</strong> In the rare event of an inadvertent technical pricing discrepancy, we reserve the right to cancel affected orders and issue a complete refund.</li>
              </ul>
            </section>

            <section id="orders" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">4. Order Creation & Cancellations</h2>
              <p>
                Receipt of an order confirmation email signifies acknowledgment of your request, not definitive contract acceptance. We reserve the right to refuse or cancel orders due to suspected fraudulent activity or inventory shortages.
              </p>
              <p>
                <strong className="font-medium text-foreground">Customer Cancellation:</strong> You may cancel an order directly from your <Link href="/account/orders" className="underline underline-offset-4 text-foreground font-medium">Order History</Link> prior to shipment fulfillment. Once an Airway Bill (AWB) is generated and the parcel is collected by our courier partner, the order cannot be canceled and must be processed under our standard Returns policy.
              </p>
            </section>

            <section id="shipping" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">5. Shipping, Transit & Delivery</h2>
              <p>
                Consignments are fulfilled via authorized premium domestic courier partners. Estimated delivery timelines provided during checkout are indicative guidelines and may vary based on geographic destination, weather events, or carrier operational conditions.
              </p>
              <p>
                Risk of loss and title for all pieces pass to the customer upon verified delivery handoff at the recipient address recorded on the order dossier.
              </p>
            </section>

            <section id="returns" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">6. Returns, Exchanges & Refunds</h2>
              <p>
                We stand behind the craftsmanship of every piece. If a garment does not meet your expectations:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="font-medium text-foreground">Eligibility Window:</strong> Return or exchange requests must be registered within 7 calendar days following confirmed delivery.</li>
                <li><strong className="font-medium text-foreground">Pristine Condition:</strong> Returned items must be unworn, unwashed, unaltered, and accompanied by all original atelier tags and packaging.</li>
                <li><strong className="font-medium text-foreground">Inspection & Refund:</strong> Upon physical receipt at our atelier, pieces undergo quality inspection. Approved refunds are credited to the original payment instrument within 5–7 banking days.</li>
              </ul>
            </section>

            <section id="care" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">7. Garment Care & Craft Integrity</h2>
              <p>
                Due to the artisanal qualities of our heavyweight textiles, natural dyes, and structural construction, garments must be cared for strictly according to the sewn-in care label specifications (e.g., dry-clean only or cold hand-wash). We are not liable for damage resulting from improper laundering, excessive tumble drying, or chemical treatments.
              </p>
            </section>

            <section id="governing-law" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">8. Liability & Governing Law</h2>
              <p>
                These Terms of Service and any transactional contracts between customer and atelier shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of these terms shall be subject to the exclusive jurisdiction of the competent courts in Bangalore or Mumbai, India.
              </p>
              <div className="p-4 border border-border/60 bg-surface/30 rounded-sm text-xs mt-4">
                <p className="font-semibold text-foreground">Concierge Legal Inquiries:</p>
                <p className="mt-1">For questions concerning these terms, email <a href="mailto:ahankarastudios@gmail.com" className="font-medium text-foreground underline underline-offset-4">ahankarastudios@gmail.com</a>.</p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
