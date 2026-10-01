"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, Send, Mail } from "lucide-react";

export function ContactFormClient() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "Order Inquiry",
    orderNumber: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate client concierge dispatch
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: "Inquiry Received",
      description: "Our client services team will review your message and reply within 24 business hours.",
      variant: "default",
    });
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      subject: "Order Inquiry",
      orderNumber: "",
      message: "",
    });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="bg-surface border border-border/70 p-8 rounded-sm text-center space-y-4 shadow-subtle">
        <div className="w-12 h-12 rounded-full bg-foreground/10 text-foreground flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 stroke-[1.75]" />
        </div>
        <h3 className="font-serif text-2xl tracking-tight text-foreground">
          Thank you for reaching out
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Your inquiry has been logged with AHANKARA STUDIOS Client Care. A concierge specialist will respond to <span className="font-medium text-foreground">{formData.email}</span> within 24 business hours.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs uppercase tracking-widest"
          >
            Send Another Message
          </Button>
          <Button
            asChild
            size="sm"
            className="text-xs uppercase tracking-widest"
          >
            <a
              href={`mailto:ahankarastudios@gmail.com?subject=${encodeURIComponent(
                `[AHANKARA] ${formData.subject}${formData.orderNumber ? ` - ${formData.orderNumber}` : ""}`
              )}&body=${encodeURIComponent(formData.message)}`}
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Open in Mail App
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-surface border border-border/70 p-6 md:p-8 rounded-sm shadow-subtle">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-name"
            name="name"
            type="text"
            required
            placeholder="e.g. Rohini Sen"
            value={formData.name}
            onChange={handleChange}
            className="h-10 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-email" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            className="h-10 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="contact-subject" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Inquiry Topic <span className="text-destructive">*</span>
          </Label>
          <Select
            id="contact-subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="text-sm"
          >
            <option value="Order Inquiry">Order Inquiry & Tracking</option>
            <option value="Bespoke Consultation">Bespoke & Styling Consultation</option>
            <option value="Sizing & Fit Advice">Sizing & Garment Fit Advice</option>
            <option value="Returns & Exchanges">Returns, Repairs & Exchanges</option>
            <option value="Press & Collaborations">Press & Atelier Partnerships</option>
            <option value="Other">General Inquiries</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-order" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Order Reference <span className="text-muted-foreground/60">(Optional)</span>
          </Label>
          <Input
            id="contact-order"
            name="orderNumber"
            type="text"
            placeholder="e.g. AHK-20261001-XXXX"
            value={formData.orderNumber}
            onChange={handleChange}
            className="h-10 text-sm font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder="Please share details about your piece, inquiry, or consultation request..."
          value={formData.message}
          onChange={handleChange}
          className="text-sm resize-y"
        />
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40">
        <p className="text-[11px] text-muted-foreground">
          Average response time: 24 business hours (Mon–Fri).
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto uppercase tracking-widest text-xs px-8 h-10 gap-2 font-medium"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" />
              Transmitting...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Submit Inquiry
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
