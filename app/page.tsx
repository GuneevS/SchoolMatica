import { Metadata } from "next";
import Script from "next/script";
import { landingPageMetadata, generateLandingPageSchema } from "@/lib/seo-config";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { DemoSection } from "@/components/landing/demo-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";
import { InteractiveBackground } from "@/components/landing/interactive-background";

// Export SEO metadata
export const metadata: Metadata = landingPageMetadata;

export default function LandingPage() {
  // Generate JSON-LD structured data
  const jsonLdSchema = generateLandingPageSchema();

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <Script
        id="json-ld-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdSchema),
        }}
      />

      {/* Main Landing Page Content */}
      <div className="relative min-h-screen bg-canvas text-foreground overflow-x-hidden">
        {/* Cursor-Interactive Background Animation */}
        <InteractiveBackground 
          className="fixed inset-0 z-0" 
          intensity="subtle" 
        />
        
        {/* Navigation */}
        <LandingNavbar />

        {/* Main Content Sections */}
        <main id="main-content">
          {/* Hero - Primary value proposition with animated background */}
          <HeroSection />

          {/* Problem - Pain points of current solutions */}
          <ProblemSection />

          {/* Features - Core product capabilities */}
          <FeaturesSection />

          {/* Demo - Interactive preview of the platform */}
          <DemoSection />

          {/* Testimonials - Social proof and customer success */}
          <TestimonialsSection />

          {/* Pricing - Subscription plans with annual toggle */}
          <PricingSection />

          {/* FAQ - Common questions answered */}
          <FAQSection />

          {/* CTA - Final conversion section */}
          <CTASection />
        </main>

        {/* Footer */}
        <LandingFooter />
      </div>
    </>
  );
}
