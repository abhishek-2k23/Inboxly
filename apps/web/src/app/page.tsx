import type { Metadata } from "next";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/nav";
import { MobileApp } from "@/components/landing/mobile-app";
import { Pricing } from "@/components/landing/pricing";
import { ProductPreview } from "@/components/landing/product-preview";
import { Reviews } from "@/components/landing/reviews";

export const metadata: Metadata = {
  title: "Inboxly — Email & calendar, run by a single prompt",
  description:
    "Inboxly helps you draft emails, schedule meetings, summarize conversations, and manage calendars using natural language.",
};

export default function HomePage() {
  return (
    <div className="bg-page min-h-screen">
      <LandingNav />
      <main>
        <Hero />
        <ProductPreview />
        <Features />
        <MobileApp />
        <Reviews />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
