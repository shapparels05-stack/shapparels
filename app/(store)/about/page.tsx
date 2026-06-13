import { Metadata } from "next";
import Link from "next/link";
import { SocialLinks } from "@/components/shared/social-links";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gem, Heart, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about SH Apparels - your destination for premium ladies beauty products in Pakistan.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "About Us" }]} />

      {/* Hero Section */}
      <section className="mt-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Our Story</p>
        <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">
          About SH Apparels
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          SH Apparels is your premier destination for luxury ladies beauty products in Pakistan.
          We curate the finest collection of bags, jewelry, cosmetics, accessories, and clothing
          to help you express your unique style with elegance.
        </p>
        <SocialLinks className="mt-6 justify-center" />
      </section>

      {/* Values */}
      <section className="mt-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Gem,
              title: "Quality",
              description: "Every product is carefully selected to meet our high standards of quality and craftsmanship.",
            },
            {
              icon: Sparkles,
              title: "Elegance",
              description: "We believe in the power of elegance. Our collections are designed to make you feel confident and beautiful.",
            },
            {
              icon: Heart,
              title: "Affordability",
              description: "Premium quality doesn&apos;t have to come with a premium price tag. We offer the best value for your money.",
            },
          ].map((value) => (
            <Card key={value.title} className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 text-center">
        <h2 className="font-serif text-2xl font-bold">Ready to Explore?</h2>
        <p className="mt-2 text-muted-foreground">
          Browse our latest collection and find your perfect style.
        </p>
        <Button className="mt-6" size="lg" asChild>
          <Link href="/products">Shop Now</Link>
        </Button>
      </section>
    </div>
  );
}
