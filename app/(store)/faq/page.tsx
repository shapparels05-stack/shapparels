import { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to commonly asked questions about SH Apparels orders, shipping, returns, and payment.",
};

const faqSections = [
  {
    title: "Ordering",
    items: [
      {
        question: "How do I place an order?",
        answer: "Simply browse our products, add items to your cart, and proceed to checkout. Fill in your shipping details and confirm your order. You can also order directly through WhatsApp.",
      },
      {
        question: "Do I need to create an account to order?",
        answer: "No, we offer guest checkout. You can place an order without creating an account.",
      },
      {
        question: "Can I modify my order after placing it?",
        answer: "Please contact us on WhatsApp as soon as possible if you need to modify your order. We will try our best to accommodate changes before the order is shipped.",
      },
    ],
  },
  {
    title: "Shipping",
    items: [
      {
        question: "Where do you deliver?",
        answer: "We deliver across Pakistan. Delivery is available to all major cities and towns.",
      },
      {
        question: "How long does delivery take?",
        answer: "Standard delivery takes 3-5 business days for major cities and 5-7 business days for other areas.",
      },
      {
        question: "Is shipping free?",
        answer: "We offer free shipping on orders above Rs. 5,000. For orders below this amount, a flat shipping fee of Rs. 200 applies.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    items: [
      {
        question: "What is your return policy?",
        answer: "We accept returns within 7 days of delivery for unused items in original packaging. Please contact us on WhatsApp to initiate a return.",
      },
      {
        question: "How do I exchange an item?",
        answer: "Contact us on WhatsApp with your order number and the item you wish to exchange. We will guide you through the process.",
      },
    ],
  },
  {
    title: "Payment",
    items: [
      {
        question: "What payment methods do you accept?",
        answer: "Currently, we accept Cash on Delivery (COD) only. Pay when your order arrives at your doorstep.",
      },
      {
        question: "Is Cash on Delivery available in my area?",
        answer: "COD is available across Pakistan for all deliverable areas.",
      },
    ],
  },
];

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqSections.flatMap((s) =>
      s.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      }))
    ),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Breadcrumbs items={[{ label: "FAQ" }]} />

      <div className="mt-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Help Center</p>
        <h1 className="mt-2 font-serif text-4xl font-bold">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-muted-foreground">
          Find answers to common questions about our products and services.
        </p>
      </div>

      <div className="mt-12 space-y-8">
        {faqSections.map((section) => (
          <div key={section.title}>
            <h2 className="font-serif text-xl font-semibold">{section.title}</h2>
            <Accordion type="single" collapsible className="mt-4">
              {section.items.map((item, index) => (
                <AccordionItem key={index} value={`${section.title}-${index}`}>
                  <AccordionTrigger className="text-left text-sm">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
}
