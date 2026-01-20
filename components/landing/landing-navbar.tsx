"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo, LogoMono } from "./logo";

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
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "py-3 glass-panel border-b border-[hsl(var(--border-strong))/0.3]"
            : "py-5 bg-transparent"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative z-10">
              <Logo
                variant="full"
                iconClassName={cn(
                  "h-9 w-9 transition-all duration-300",
                  isScrolled && "h-8 w-8"
                )}
                textClassName={cn(
                  "transition-all duration-300",
                  isScrolled ? "text-xl" : "text-2xl"
                )}
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    "text-foreground/70 hover:text-foreground",
                    "relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0",
                    "after:bg-gradient-to-r after:from-[hsl(var(--accent-iris))] after:to-[hsl(var(--accent-violet))]",
                    "after:transition-all after:duration-300 hover:after:w-full"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild className="group">
                <Link href="/register">
                  Start Free Trial
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative z-10 p-2 rounded-lg hover:bg-secondary/60 transition-colors"
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

        {/* Menu Panel */}
        <div
          className={cn(
            "absolute top-0 right-0 bottom-0 w-[280px] aurora-panel",
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
