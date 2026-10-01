import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | AHANKARA STUDIOS",
  description: "Learn how AHANKARA STUDIOS safeguards your personal data, payment information, and client privacy.",
  openGraph: {
    title: "Privacy Policy | AHANKARA STUDIOS",
    description: "Learn how AHANKARA STUDIOS safeguards your personal data, payment information, and client privacy.",
    type: "website",
    siteName: "AHANKARA STUDIOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | AHANKARA STUDIOS",
    description: "Learn how AHANKARA STUDIOS safeguards your personal data, payment information, and client privacy.",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 2026";

  const sections = [
    { id: "introduction", title: "1. Introduction & Scope" },
    { id: "collection", title: "2. Information We Collect" },
    { id: "payments", title: "3. Payment Security & Processing" },
    { id: "usage", title: "4. Utilization of Information" },
    { id: "sharing", title: "5. Logistics & Third-Party Partners" },
    { id: "cookies", title: "6. Cookies & Device Storage" },
    { id: "rights", title: "7. Your Rights & Data Portability" },
    { id: "contact", title: "8. Contact Our Privacy Concierge" },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen pb-24">
      {/* Header */}
      <section className="border-b border-border/40 py-16 md:py-20 bg-surface/30">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>Data Protection Standards</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Effective Date: {lastUpdated}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12 md:py-16 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Quick-jump Table of Contents */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 p-5 border border-border/60 bg-surface/50 rounded-sm space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Policy Sections
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

          {/* Policy Content */}
          <article className="lg:col-span-8 space-y-12 text-sm leading-relaxed text-muted-foreground font-light">
            <section id="introduction" className="space-y-3 pt-2">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">1. Introduction & Scope</h2>
              <p>
                At AHANKARA STUDIOS (&ldquo;AHANKARA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), we respect your privacy and are committed to safeguarding the personal information you share with us. This Privacy Policy outlines our procedures concerning the collection, storage, processing, and protection of personal data when you interact with our website, acquire garments from our collections, or correspond with our client concierge.
              </p>
            </section>

            <section id="collection" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">2. Information We Collect</h2>
              <p>
                We only collect data necessary to provide you with an exceptional atelier client experience. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="font-medium text-foreground">Account Identification:</strong> Full name, verified email address, encrypted authentication credentials, and customer reference IDs.</li>
                <li><strong className="font-medium text-foreground">Delivery & Consignment Details:</strong> Recipient name, physical delivery address, landmark, contact phone number, and postal code for courier dispatch.</li>
                <li><strong className="font-medium text-foreground">Order & Transaction History:</strong> Records of acquired garments, sizes, quantities, applied promotional codes, and billing summaries.</li>
                <li><strong className="font-medium text-foreground">Technical & Interaction Logs:</strong> IP address, device operating system, browser specifications, and browsing interactions within our digital storefront.</li>
              </ul>
            </section>

            <section id="payments" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">3. Payment Security & Processing</h2>
              <div className="flex items-start gap-3 p-4 border border-border/60 bg-surface/40 rounded-sm">
                <Lock className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-foreground">PCI-DSS Compliant Encryption</p>
                  <p>
                    All payment transactions on AHANKARA STUDIOS are processed via authoritative, encrypted payment gateways (including Razorpay).
                  </p>
                </div>
              </div>
              <p>
                We never store full debit or credit card numbers, CVVs, or Net Banking credentials on our application servers. Payment tokenization and signature verification are handled directly through authorized banking networks.
              </p>
            </section>

            <section id="usage" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">4. Utilization of Information</h2>
              <p>Personal data is utilized exclusively for genuine business purposes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To orchestrate, fulfill, and deliver your orders accurately.</li>
                <li>To transmit automated transactional notifications, dispatch notices, and tracking updates.</li>
                <li>To facilitate post-purchase requests including exchanges, returns, and authorized refunds.</li>
                <li>To prevent fraudulent transactions, inventory hoarding, and unauthorized system access.</li>
              </ul>
            </section>

            <section id="sharing" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">5. Logistics & Third-Party Partners</h2>
              <p>
                We never sell, rent, or monetize your personal data. We disclose information solely to vetted logistical and technological partners essential for service execution:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="font-medium text-foreground">Fulfillment & Courier Carriers:</strong> Trusted domestic logistics providers allocated for physical shipment conveyance and Airway Bill (AWB) generation.</li>
                <li><strong className="font-medium text-foreground">Communication Infrastructure:</strong> Secure transactional email dispatchers for order confirmations and password resets.</li>
                <li><strong className="font-medium text-foreground">Statutory Authorities:</strong> Disclosures strictly mandated under applicable Indian law, court order, or regulatory compliance.</li>
              </ul>
            </section>

            <section id="cookies" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">6. Cookies & Device Storage</h2>
              <p>
                We utilize essential HTTP cookies and browser local storage strictly to maintain session authentication, preserve cart item states, and remember customer preference settings. You can manage or block cookies through your browser configuration, though certain storefront capabilities (such as the persistent cart) may be restricted.
              </p>
            </section>

            <section id="rights" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">7. Your Rights & Data Portability</h2>
              <p>
                You retain complete control over your personal data. You may at any time:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access and update your profile details and saved delivery addresses through your <Link href="/account" className="underline underline-offset-4 text-foreground font-medium">Customer Account</Link>.</li>
                <li>Request a comprehensive export of your transactional history on file.</li>
                <li>Request account deactivation and personal data deletion, subject to statutory tax and invoice retention obligations.</li>
              </ul>
            </section>

            <section id="contact" className="space-y-3 pt-4 border-t border-border/40">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">8. Contact Our Privacy Concierge</h2>
              <p>
                For questions regarding this policy, data access requests, or privacy concerns, please contact our designated privacy officer:
              </p>
              <div className="p-4 border border-border/60 bg-surface/30 rounded-sm text-xs space-y-1">
                <p className="font-semibold text-foreground">AHANKARA STUDIOS — Privacy & Data Governance</p>
                <p>Email: <a href="mailto:ahankarastudios@gmail.com" className="font-medium text-foreground underline underline-offset-4">ahankarastudios@gmail.com</a></p>
                <p>Atelier Operations: Bangalore & Mumbai, India</p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
