import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | AHANKARA STUDIOS",
  description: "Terms of Service and usage conditions for AHANKARA STUDIOS.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl min-h-screen">
      <div className="mb-12 md:mb-16">
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4 text-foreground">
          Terms of Service
        </h1>
        <p className="text-muted-foreground uppercase tracking-widest text-xs md:text-sm">
          Last Updated: [Pending Business Confirmation]
        </p>
      </div>

      <div className="prose prose-sm md:prose-base prose-neutral dark:prose-invert max-w-none">
        <div className="p-6 bg-muted/20 border border-dashed rounded-sm mb-8 text-sm">
          <p className="font-medium text-foreground mb-2">Notice</p>
          <p className="text-muted-foreground m-0">
            The full legal text of the Terms of Service is pending final legal review and business confirmation. The sections below outline our structural approach to service terms.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">1. Agreement to Terms</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Statement that by accessing the website and placing an order, you agree to be bound by these terms.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">2. Intellectual Property</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Details regarding the ownership of designs, imagery, brand marks, and website content.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">3. Orders and Pricing</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Information on order acceptance, pricing errors, currency, and the right to refuse service.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">4. Shipping and Delivery</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: General conditions regarding delivery timelines, risk of loss, and shipping provider obligations.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">5. Returns and Exchanges</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Reference to the Returns Policy, detailing eligible items and processing timelines.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">6. Limitation of Liability</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Standard legal protections limiting the company&apos;s liability.]
          </p>
        </section>
      </div>
    </div>
  );
}
