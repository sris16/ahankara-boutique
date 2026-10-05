import { Metadata } from "next";
import { Mail, Clock, ShieldCheck, Sparkles, MapPin } from "lucide-react";
import { ContactFormClient } from "@/components/contact/ContactFormClient";

export const metadata: Metadata = {
  title: "Client Care & Contact | AHANKARA STUDIOS",
  description: "Connect with AHANKARA STUDIOS client care for order inquiries, bespoke consultations, and sizing guidance.",
  openGraph: {
    title: "Client Care & Contact | AHANKARA STUDIOS",
    description: "Connect with AHANKARA STUDIOS client care for order inquiries, bespoke consultations, and sizing guidance.",
    type: "website",
    siteName: "AHANKARA STUDIOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Client Care & Contact | AHANKARA STUDIOS",
    description: "Connect with AHANKARA STUDIOS client care for order inquiries, bespoke consultations, and sizing guidance.",
  },
  
};

export default function ContactPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="border-b border-border/40 py-16 md:py-20 bg-surface/30">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground mb-3 block">
            Atelier Concierge
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground mb-4">
            Connect With Us
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
            Our client services team is dedicated to assisting you with order tracking, styling consultations, garment specifications, and bespoke commissions.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-14 md:py-20 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Direct Client Services */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h2 className="font-serif text-2xl tracking-tight mb-2 text-foreground">
                Client Services
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct channels for prompt assistance from our styling and fulfillment specialists.
              </p>
            </div>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4 p-4 border border-border/50 rounded-sm bg-surface/40">
                <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border/70 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-xs tracking-wider uppercase mb-1">Direct Correspondence</h3>
                  <a
                    href="mailto:ahankarastudios@gmail.com"
                    className="text-sm font-medium text-foreground hover:underline underline-offset-4 transition-colors"
                  >
                    ahankarastudios@gmail.com
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Replies delivered within 24 business hours.
                  </p>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="flex items-start gap-4 p-4 border border-border/50 rounded-sm bg-surface/40">
                <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border/70 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-foreground" />
                </div>
                <div className="w-full">
                  <h3 className="font-medium text-xs tracking-wider uppercase mb-1">Concierge Hours</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Monday – Friday</span>
                      <span className="font-medium text-foreground">10:00 AM – 6:00 PM IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday & Sunday</span>
                      <span>Atelier Closed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Atelier Location */}
              <div className="flex items-start gap-4 p-4 border border-border/50 rounded-sm bg-surface/40">
                <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border/70 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-xs tracking-wider uppercase mb-1">Studio & Fulfillment</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AHANKARA STUDIOS Atelier<br />
                    Bangalore & Mumbai Operations<br />
                    Karnataka / Maharashtra, India
                  </p>
                </div>
              </div>
            </div>

            {/* Atelier Commitment */}
            <div className="p-5 border border-border/60 rounded-sm bg-surface/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Bespoke Assurance</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every piece leaving our atelier is handcrafted with meticulous quality control. If your order requires adjustments or styling support, our team is committed to your satisfaction.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl tracking-tight text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Transmit an Inquiry
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete the dossier below to dispatch a message directly to our atelier team.
                </p>
              </div>
            </div>

            <ContactFormClient />
          </div>
        </div>
      </div>
    </div>
  );
}
