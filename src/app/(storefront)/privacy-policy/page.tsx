import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AHANKARA STUDIOS",
  description: "Privacy Policy and data protection guidelines for AHANKARA STUDIOS.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl min-h-screen">
      <div className="mb-12 md:mb-16">
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4 text-foreground">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground uppercase tracking-widest text-xs md:text-sm">
          Last Updated: [Pending Business Confirmation]
        </p>
      </div>

      <div className="prose prose-sm md:prose-base prose-neutral dark:prose-invert max-w-none">
        <div className="p-6 bg-muted/20 border border-dashed rounded-sm mb-8 text-sm">
          <p className="font-medium text-foreground mb-2">Notice</p>
          <p className="text-muted-foreground m-0">
            The full legal text of the Privacy Policy is pending final legal review and business confirmation. The sections below outline our structural approach to data privacy.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">1. Introduction</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Statement detailing how Ahankara Studios collects, uses, and protects your personal information when you use our services.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">2. Data Collection</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Details on the exact personal data collected, including account information, payment details, and browsing data.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">3. Data Usage</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Explanation of how collected data is utilized for order processing, customer service, and personalization.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">4. Third-Party Services</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Information regarding data shared with payment processors (e.g., Razorpay) and logistics partners.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">5. Your Rights</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Instructions on how customers can request access to, modification of, or deletion of their personal data.]
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-serif text-2xl tracking-tight mb-4">6. Contact Information</h2>
          <p className="font-light text-muted-foreground leading-relaxed">
            [Content pending legal review: Official contact details for privacy-related inquiries.]
          </p>
        </section>
      </div>
    </div>
  );
}
