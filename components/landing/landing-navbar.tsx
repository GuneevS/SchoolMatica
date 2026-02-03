"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UnifiedLogo } from "@/components/brand/unified-logo";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-iris))] focus:ring-offset-2"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
          isScrolled
            ? "py-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl backdrop-saturate-150 shadow-lg shadow-black/5 dark:shadow-black/20 border-b border-white/20 dark:border-slate-700/50"
            : "py-4 bg-transparent"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between" aria-label="Main navigation">
            {/* Logo */}
            <Link href="/" className="relative z-10">
              <UnifiedLogo
                variant="full"
                size={isScrolled ? "sm" : "md"}
                colorScheme={isScrolled ? "gradient" : "light"}
                className="transition-all duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    isScrolled
                      ? "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:text-white dark:hover:bg-white/10"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className={cn(
                  "transition-all duration-200 font-medium",
                  isScrolled
                    ? "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:text-white"
                    : "text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <Link href="/login">Log In</Link>
              </Button>
              <Button 
                size="sm" 
                asChild 
                className={cn(
                  "group transition-all duration-200",
                  isScrolled
                    ? "bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-secondary))] text-white hover:opacity-90"
                    : "bg-white text-slate-900 hover:bg-white/90"
                )}
              >
                <Link href="/register">
                  Start Free Trial
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "md:hidden relative z-10 p-2 rounded-lg transition-colors",
                isScrolled 
                  ? "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  : "hover:bg-white/10 text-white"
              )}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel - Solid background for better legibility */}
        <div
          className={cn(
            "absolute top-0 right-0 bottom-0 w-[280px]",
            "bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800",
            "shadow-2xl",
            "transform transition-transform duration-300 ease-out",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col h-full pt-20 px-6 pb-6">
            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "py-3 px-4 rounded-xl text-base font-medium",
                    "text-foreground/80 hover:text-foreground",
                    "hover:bg-secondary/60 transition-all duration-200",
                    "transform transition-all duration-300",
                    isMobileMenuOpen
                      ? "translate-x-0 opacity-100"
                      : "translate-x-4 opacity-0"
                  )}
                  style={{ transitionDelay: `${index * 50 + 100}ms` }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile CTA Buttons */}
            <div className="mt-auto flex flex-col gap-3">
              <Button variant="outline" className="w-full justify-center" asChild>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  Log In
                </Link>
              </Button>
              <Button className="w-full justify-center" asChild>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  Start Free Trial
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LandingNavbar;
