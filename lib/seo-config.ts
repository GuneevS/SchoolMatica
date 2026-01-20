import { Metadata } from "next";

// Base site configuration
export const siteConfig = {
  name: "SchoolMatica",
  description:
    "South Africa's leading assessment management platform for schools. Streamline your CAPS-compliant assessments, save time, and improve accuracy with our modern markbook system.",
  url: "https://schoolmatica.co.za",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/schoolmatica",
    facebook: "https://facebook.com/schoolmatica",
    linkedin: "https://linkedin.com/company/schoolmatica",
  },
  creator: "SchoolMatica",
  keywords: [
    // Primary keywords
    "school assessment management",
    "CAPS compliant assessment",
    "South African school software",
    "markbook software",
    "school marks management",
    // Secondary keywords
    "SA-SAMS integration",
    "teacher assessment tool",
    "school report cards",
    "assessment moderation",
    "formal assessment tasks",
    // Long-tail keywords
    "CAPS assessment management system",
    "digital markbook for South African schools",
    "school assessment software South Africa",
    "teacher mark recording system",
    "school grade management software",
    // Location keywords
    "school software Gauteng",
    "school software Western Cape",
    "school software KwaZulu-Natal",
    "South African education technology",
    // Feature keywords
    "automated report generation",
    "assessment planning tool",
    "school administration software",
    "education management system",
  ],
};

// Landing page metadata
export const landingPageMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Assessment Management for South African Schools`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  publisher: siteConfig.creator,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - Modern Assessment Management for South African Schools`,
    description:
      "Transform your school's assessment workflow with SchoolMatica. CAPS-compliant, SA-SAMS integrated, and designed for South African educators.",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "SchoolMatica - Assessment Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - Assessment Management for SA Schools`,
    description:
      "Streamline your school's assessments with South Africa's leading CAPS-compliant platform.",
    images: [siteConfig.ogImage],
    creator: "@schoolmatica",
  },
  alternates: {
    canonical: siteConfig.url,
  },
  verification: {
    // Add verification codes when available
    // google: "google-site-verification-code",
    // bing: "bing-verification-code",
  },
  category: "Education Technology",
};

// JSON-LD Organization Schema
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/logo.png`,
      width: "512",
      height: "512",
    },
    description: siteConfig.description,
    address: {
      "@type": "PostalAddress",
      addressCountry: "ZA",
    },
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.facebook,
      siteConfig.links.linkedin,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@schoolmatica.co.za",
      availableLanguage: ["English", "Afrikaans"],
    },
  };
}

// JSON-LD Software Application Schema
export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteConfig.url}/#software`,
    name: siteConfig.name,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web browser",
    description:
      "A comprehensive assessment management platform designed specifically for South African schools, featuring CAPS compliance, SA-SAMS integration, and modern markbook functionality.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "ZAR",
      lowPrice: "1499",
      highPrice: "4999",
      offerCount: "3",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "120",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "CAPS Policy Compliance Engine",
      "SA-SAMS Integration",
      "Digital Markbook",
      "Assessment Moderation Workflow",
      "Automated Report Generation",
      "Multi-role Access Control",
    ],
    screenshot: `${siteConfig.url}/screenshot-dashboard.png`,
    softwareVersion: "1.0",
    releaseNotes: "Initial release with full CAPS compliance and SA-SAMS integration.",
  };
}

// JSON-LD WebSite Schema with SearchAction
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      "@id": `${siteConfig.url}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// JSON-LD FAQ Schema
export function generateFAQSchema() {
  const faqs = [
    {
      question: "How does SchoolMatica ensure CAPS compliance?",
      answer:
        "SchoolMatica has a built-in CAPS Policy Engine that automatically validates assessment structures, weightings, and types against the official CAPS requirements for each subject and grade.",
    },
    {
      question: "Can teachers import their existing Excel markbooks?",
      answer:
        "Yes! We provide a simple import wizard that accepts Excel and CSV files. Our system intelligently maps your existing columns to SchoolMatica fields, preserving your learner data and marks.",
    },
    {
      question: "Does SchoolMatica integrate with SA-SAMS?",
      answer:
        "SchoolMatica Professional and Enterprise plans include full SA-SAMS integration. You can export marks in the exact format required by the Department of Education.",
    },
    {
      question: "Is our data secure?",
      answer:
        "Security is our top priority. SchoolMatica uses enterprise-grade encryption for all data in transit and at rest. We comply with POPIA requirements and never share or sell school data.",
    },
    {
      question: "How long does it take to set up SchoolMatica for our school?",
      answer:
        "Most schools are fully operational within 1-2 weeks. This includes importing your learner database, setting up teacher accounts, configuring subjects and grades, and initial staff training.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteConfig.url}/#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// JSON-LD BreadcrumbList Schema
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Combined JSON-LD for landing page
export function generateLandingPageSchema() {
  return [
    generateOrganizationSchema(),
    generateSoftwareApplicationSchema(),
    generateWebsiteSchema(),
    generateFAQSchema(),
  ];
}
