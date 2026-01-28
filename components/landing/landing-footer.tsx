"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Twitter, Linkedin, Facebook, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedLogo } from "@/components/brand/unified-logo";
import { Button } from "@/components/ui/button";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Demo", href: "#demo" },
      { label: "Integrations", href: "#" },
      { label: "Updates", href: "#" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Webinars", href: "#" },
      { label: "Case Studies", href: "#" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#contact" },
      { label: "Partners", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "POPIA Compliance", href: "/popia" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[hsl(var(--border-strong))/0.3]">
      {/* Background gradient */}
      <div className="absolute inset-0 aurora-panel opacity-50" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <UnifiedLogo variant="full" size="md" colorScheme="gradient" className="mb-6" />
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
              Transform your school&apos;s assessment management with policy-smart 
              workflows designed for South African educators.
            </p>

            {/* Contact info */}
            <div className="space-y-3 mb-6">
              <a
                href="mailto:hello@schoolmatica.co.za"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4 text-[hsl(var(--accent-iris))]" />
                hello@schoolmatica.co.za
              </a>
              <a
                href="tel:+27123456789"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4 text-[hsl(var(--accent-violet))]" />
                +27 12 345 6789
              </a>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-[hsl(var(--accent-flamingo))]" />
                <span>
                  Johannesburg, South Africa
                </span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-secondary/60 hover:shadow-sm"
                  )}
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-semibold text-sm text-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter section */}
        <div className="py-8 border-t border-[hsl(var(--border-strong))/0.3]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Subscribe to our newsletter
              </h3>
              <p className="text-sm text-muted-foreground">
                Get the latest updates, tips, and resources for educators.
              </p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className={cn(
                  "flex-1 md:w-64 px-4 py-2 rounded-xl text-sm",
                  "bg-[hsl(var(--surface-soft))] border border-[hsl(var(--border-strong))/0.5]",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/40",
                  "transition-all duration-200"
                )}
              />
              <Button type="submit" size="sm">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-[hsl(var(--border-strong))/0.3]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SchoolMatica. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-muted-foreground">
                🇿🇦 Proudly South African
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[hsl(var(--success))]" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
