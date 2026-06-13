import { Metadata } from "next";
import { Phone, Mail, MessageCircle, Clock } from "lucide-react";
import { SocialLinks } from "@/components/shared/social-links";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { ContactForm } from "@/components/shared/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with SH Apparels. We are here to help with your queries about our products and orders.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Contact Us" }]} />

      <div className="mt-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Get in Touch</p>
        <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">Contact Us</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Have a question about our products or your order? We&apos;d love to hear from you.
        </p>
        <SocialLinks className="mt-6 justify-center" />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {/* Contact Form */}
        <Card>
          <CardContent className="pt-6">
            <ContactForm />
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="space-y-6">
          {[
            {
              icon: Phone,
              title: "Phone",
              content: WHATSAPP_NUMBER ? `+${WHATSAPP_NUMBER}` : "Contact us",
              href: WHATSAPP_NUMBER ? `tel:+${WHATSAPP_NUMBER}` : undefined,
            },
            {
              icon: MessageCircle,
              title: "WhatsApp",
              content: "Message us on WhatsApp",
              href: WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : undefined,
            },
            {
              icon: Mail,
              title: "Email",
              content: "sh.apparels05@gmail.com",
              href: "mailto:sh.apparels05@gmail.com",
            },
            {
              icon: Clock,
              title: "Business Hours",
              content: "Mon - Sat: 10:00 AM - 8:00 PM",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.content}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
