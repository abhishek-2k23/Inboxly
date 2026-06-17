import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { MobileApp } from "@/components/landing/MobileApp";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { Reviews } from "@/components/landing/Reviews";
import { UseCases } from "@/components/landing/UseCases";
import { CursorGlow } from "@/components/ui/CursorGlow";

export default function LandingPage() {
  return (
    <>
      <CursorGlow />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <UseCases />
        <MobileApp />
        <Reviews />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
