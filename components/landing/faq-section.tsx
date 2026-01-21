"use client";

import { useState } from "react";
import { HelpCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/hooks/use-in-view";

interface FAQ {
  question: string;
  answer: string;
  category: "general" | "pricing" | "technical" | "support";
}

const faqs: FAQ[] = [
  {
    question: "How does SchoolMatica ensure CAPS compliance?",
    answer:
      "SchoolMatica has a built-in CAPS Policy Engine that automatically validates assessment structures, weightings, and types against the official CAPS requirements for each subject and grade. When you create assessment plans, the system guides you to ensure proper FAT (Formal Assessment Task) distributions and weighting percentages. Any policy violations are flagged before they become problems, keeping your school audit-ready.",
    category: "general",
  },
  {
    question: "Can teachers import their existing Excel markbooks?",
    answer:
      "Yes! We provide a simple import wizard that accepts Excel and CSV files. Our system intelligently maps your existing columns to SchoolMatica fields, preserving your learner data and marks. Most teachers complete their first import in under 10 minutes. We also offer complimentary data migration support for schools on Professional and Enterprise plans.",
    category: "technical",
  },
  {
    question: "Does SchoolMatica integrate with SA-SAMS?",
    answer:
      "SchoolMatica Professional and Enterprise plans include full SA-SAMS integration. You can export marks in the exact format required by the Department of Education, ready for direct upload to SA-SAMS. We regularly update our export templates to match any changes in SA-SAMS requirements.",
    category: "technical",
  },
  {
    question: "What happens to our data if we cancel our subscription?",
    answer:
      "Your data remains yours. When you cancel, you have 30 days to export all your data in standard formats (Excel, CSV, PDF). After that period, data is securely deleted from our systems. We never hold your data hostage or charge export fees. For Enterprise customers, we can provide extended data retention periods.",
    category: "pricing",
  },
  {
    question: "How long does it take to set up SchoolMatica for our school?",
    answer:
      "Most schools are fully operational within 1-2 weeks. This includes: importing your learner database, setting up teacher accounts, configuring subjects and grades, and initial staff training. Our onboarding team guides you through every step. Schools with existing digital records often go live in just a few days.",
    category: "general",
  },
  {
    question: "Is our data secure?",
    answer:
      "Security is our top priority. SchoolMatica uses enterprise-grade encryption for all data in transit and at rest. We're hosted on secure cloud infrastructure with daily backups, and we comply with POPIA (Protection of Personal Information Act) requirements. Only authorized users at your school can access your data—we never share or sell school data.",
    category: "technical",
  },
  {
    question: "Can different teachers see each other's marks?",
    answer:
      "SchoolMatica has a robust role-based permission system. By default, teachers only see their own classes and marks. HODs can view all teachers within their department for moderation purposes. School administrators have full visibility. You can customize these permissions to match your school's specific policies.",
    category: "general",
  },
  {
    question: "What training and support do you provide?",
    answer:
      "All plans include initial training for your staff via video calls. We provide a comprehensive help center with video tutorials, step-by-step guides, and FAQ articles. Starter plans receive email support (48-hour response), Professional plans get priority email and chat support (24-hour response), and Enterprise plans include a dedicated account manager plus phone support.",
    category: "support",
  },
  {
    question: "Can we try SchoolMatica before committing?",
    answer:
      "Absolutely! Every school gets a full 30-day free trial with complete access to all features. No credit card required to start. You can add real data, invite teachers, and experience the full workflow before making a decision. Our team is available to answer questions throughout your trial.",
    category: "pricing",
  },
  {
    question: "How does billing work for schools with changing learner numbers?",
    answer:
      "Our pricing is based on your school's capacity tier, not exact learner counts. This gives you flexibility as numbers fluctuate during the year. If you consistently exceed your tier's limit, we'll work with you to upgrade at a prorated rate. We never charge surprise fees for minor overages.",
    category: "pricing",
  },
];

const categories = [
  { id: "all", label: "All Questions" },
  { id: "general", label: "General" },
  { id: "pricing", label: "Pricing" },
  { id: "technical", label: "Technical" },
  { id: "support", label: "Support" },
];

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { ref: sectionRef, isVisible } = useInView<HTMLElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  const filteredFaqs =
    activeCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === activeCategory);

  return (
    <section
      ref={sectionRef}
      id="faq"
      aria-label="FAQ section"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[hsl(var(--accent-cobalt))] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-[hsl(var(--accent-iris))] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div
          className={cn(
            "text-center max-w-3xl mx-auto mb-12 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--accent-cobalt))]/10 border border-[hsl(var(--accent-cobalt))]/20 text-[hsl(var(--accent-cobalt))] text-sm font-medium mb-6">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            FAQ
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Frequently Asked{" "}
            <span className="gradient-text">Questions</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Everything you need to know about SchoolMatica. Can&apos;t find the
            answer you&apos;re looking for? Reach out to our support team.
          </p>
        </div>

        {/* Category filter */}
        <div
          className={cn(
            "flex flex-wrap justify-center gap-2 mb-10 transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                activeCategory === category.id
                  ? "bg-[hsl(var(--accent-iris))] text-white"
                  : "bg-[hsl(var(--surface-soft))] text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-strong))]"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ accordion */}
        <div
          className={cn(
            "max-w-3xl mx-auto transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <Accordion type="single" collapsible className="space-y-4" role="list">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                role="listitem"
                className={cn(
                  "aurora-panel rounded-xl px-6 border-none",
                  "data-[state=open]:shadow-ambient"
                )}
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still have questions */}
        <div
          className={cn(
            "mt-16 text-center transition-all duration-700 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="aurora-panel rounded-2xl p-8 lg:p-10 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--accent-iris))]/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-[hsl(var(--accent-iris))]" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our team is here to help. Get in touch and we&apos;ll respond as soon
              as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button aria-label="Contact support team">
                Contact Support
              </Button>
              <Button variant="outline" aria-label="Schedule a demo with our team">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
