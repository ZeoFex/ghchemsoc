export const SITE_FOOTER_ID = "site_footer" as const;

export type FooterNavLink = { label: string; href: string };
export type FooterSocialLink = {
  platform: "linkedin" | "instagram" | "twitter" | "facebook" | "youtube" | "globe";
  href: string;
  label?: string;
};

export const SITE_FOOTER_DEFAULTS = {
  headlineLine1: "GHANA CHEMICAL",
  headlineLine2: "SOCIETY",
  helplineText: "Secretariat: secretariat@ghanachemicalsociety.org",
  description:
    "The Ghana Chemical Society connects professionals across research, industry, and education—advancing chemistry and supporting members through networking, resources, and shared expertise.",
  copyrightText: "© 2026 Ghana Chemical Society. All rights reserved.",
  trademarkLabel: "Trademark & legal",
  trademarkHref: "/contact",
  trademarkNotice: "Ghana Chemical Society® and the GCS logo are trademarks of the society.",
  navLinks: [
    { label: "About", href: "/about" },
    { label: "Resources", href: "/resources" },
    { label: "Events", href: "/events" },
    { label: "Publications", href: "/publications" },
    { label: "Contact", href: "/contact" },
  ] satisfies FooterNavLink[],
  socialLinks: [
    { platform: "linkedin", href: "https://www.linkedin.com", label: "LinkedIn" },
    { platform: "globe", href: "https://www.ghchemsoc.org", label: "Website" },
  ] satisfies FooterSocialLink[],
  leftImageUrl:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop",
  leftImageAlt: "University and research campus",
  rightImageUrl:
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=600&auto=format&fit=crop",
  rightImageAlt: "Modern chemistry laboratory",
} as const;
