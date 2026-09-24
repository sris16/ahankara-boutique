import { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | AHANKARA STUDIOS",
  description: "Get in touch with AHANKARA STUDIOS for client services, orders, and inquiries.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl min-h-screen">
      <div className="text-center mb-16 md:mb-24">
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4 text-foreground">
          Contact Us
        </h1>
        <p className="text-muted-foreground font-light max-w-lg mx-auto">
          Our client services team is here to assist you with any inquiries regarding our collections, your orders, or styling advice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        {/* Contact Information */}
        <div className="flex flex-col gap-10">
          <div>
            <h2 className="font-serif text-2xl tracking-tight mb-6 text-foreground">Client Services</h2>

            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-sm tracking-wide uppercase mb-1">Email</h3>
                  <a href="mailto:ahankarastudios@gmail.com" className="text-muted-foreground font-light hover:text-foreground transition-colors">
                    ahankarastudios@gmail.com
                  </a>
                  <p className="text-xs text-muted-foreground/60 mt-1">We aim to reply within 24 business hours.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-sm tracking-wide uppercase mb-1">Studio / Returns</h3>
                  <p className="text-muted-foreground font-light leading-relaxed">
                    [Address Pending Business Confirmation]<br />
                    Ahankara Studios<br />
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-muted/10 border border-border rounded-sm">
            <h3 className="font-serif text-lg tracking-tight mb-2">Business Hours</h3>
            <ul className="text-sm text-muted-foreground font-light space-y-2">
              <li className="flex justify-between">
                <span>Monday - Friday</span>
                <span>10:00 AM - 6:00 PM IST</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday - Sunday</span>
                <span>Closed</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Form Placeholder */}
        <div>
          <h2 className="font-serif text-2xl tracking-tight mb-6 text-foreground">Send a Message</h2>
          <div className="p-8 bg-muted/5 border border-dashed rounded-sm h-[400px] flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground font-light mb-4">
              [Contact Form functionality is currently unavailable pending business email configuration integration.]
            </p>
            <p className="text-sm text-muted-foreground">
              Please email us directly at <a href="mailto:ahankarastudios@gmail.com" className="underline underline-offset-4 hover:text-foreground transition-colors">ahankarastudios@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
